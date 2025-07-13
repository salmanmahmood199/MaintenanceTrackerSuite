import { GoogleGenAI } from "@google/genai";
import { Request, Response } from "express";
import { storage } from "./storage";
import { User } from "../shared/schema";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface AIRequest extends Request {
  user?: User;
}

interface AIResponse {
  response: string;
  action?: {
    type: string;
    data?: any;
  };
}

export async function processUserQuery(req: AIRequest, res: Response) {
  try {
    const { query, hasImages, conversationHistory } = req.body;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Get user's accessible data for context
    const userContext = await getUserContext(user);
    
    // Create system prompt based on user role and permissions
    const systemPrompt = createSystemPrompt(user, userContext, hasImages || false);
    
    // Include conversation history for context
    let conversationContext = "";
    if (conversationHistory && conversationHistory.length > 0) {
      conversationContext = "CONVERSATION HISTORY:\n" + 
        conversationHistory.map((msg: any) => `${msg.type.toUpperCase()}: ${msg.content}`).join("\n") + 
        "\n\nCURRENT USER MESSAGE: " + query;
    } else {
      conversationContext = query;
    }
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            response: { type: "string" },
            action: {
              type: "object",
              properties: {
                type: { type: "string" },
                data: { 
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    priority: { type: "string" },
                    ticketNumber: { type: "string" },
                    ticketId: { type: "number" },
                    organizationId: { type: "number" },
                    locationId: { type: "number" },
                    status: { type: "string" }
                  }
                }
              }
            }
          },
          required: ["response"]
        }
      },
      contents: conversationContext
    });

    const aiResponse: AIResponse = JSON.parse(response.text || "{}");
    
    // Execute the action if one is suggested
    if (aiResponse.action) {
      const actionResult = await executeAction(aiResponse.action, user);
      if (actionResult.success) {
        aiResponse.response += `\n\n${actionResult.message}`;
      } else {
        aiResponse.response += `\n\nError: ${actionResult.message}`;
      }
    }

    res.json(aiResponse);
  } catch (error) {
    console.error("AI processing error:", error);
    res.status(500).json({ message: "Failed to process query" });
  }
}

async function getUserContext(user: User) {
  // Get user's tickets based on their role
  let tickets = [];
  if (user.role === "root") {
    tickets = await storage.getTickets();
  } else if (user.organizationId) {
    tickets = await storage.getTickets(user.organizationId);
  } else if (user.maintenanceVendorId) {
    tickets = await storage.getTicketsByVendor(user.maintenanceVendorId);
  }

  // Get organizations and vendors if user has access
  const organizations = user.role === "root" ? await storage.getOrganizations() : [];
  const vendors = user.role === "root" ? await storage.getMaintenanceVendors() : [];

  // Get user's assigned locations (for org_subadmin)
  let assignedLocations = [];
  if (user.role === "org_subadmin" && user.organizationId) {
    try {
      assignedLocations = await storage.getUserLocations(user.id);
    } catch (error) {
      console.log("Error fetching user locations:", error);
    }
  }

  // Get organization details if user belongs to one
  let organizationDetails = null;
  if (user.organizationId) {
    try {
      organizationDetails = await storage.getOrganizationById(user.organizationId);
    } catch (error) {
      console.log("Error fetching organization details:", error);
    }
  }

  // Get available vendor tiers for organization
  let vendorTiers = [];
  if (user.organizationId) {
    try {
      vendorTiers = await storage.getVendorTiers(user.organizationId);
    } catch (error) {
      console.log("Error fetching vendor tiers:", error);
    }
  }

  return {
    tickets: tickets.slice(0, 20), // Limit context to recent tickets
    organizations,
    vendors,
    assignedLocations,
    organizationDetails,
    vendorTiers,
    userRole: user.role,
    organizationId: user.organizationId,
    maintenanceVendorId: user.maintenanceVendorId,
    totalTickets: tickets.length,
    pendingTickets: tickets.filter(t => t.status === 'pending').length,
    inProgressTickets: tickets.filter(t => t.status === 'in_progress').length,
    completedTickets: tickets.filter(t => t.status === 'completed').length
  };
}

function createSystemPrompt(user: User, context: any, hasImages: boolean = false): string {
  const rolePermissions = getRolePermissions(user.role);
  
  return `You are an AUTONOMOUS AI assistant for a maintenance ticketing system. You are SMART, REMEMBER CONVERSATION CONTEXT, and think independently to help users efficiently.

USER CONTEXT:
- Role: ${user.role}
- Name: ${user.firstName} ${user.lastName}
- Email: ${user.email}
- Organization ID: ${user.organizationId || "None"}
- Organization Name: ${context.organizationDetails?.name || "None"}
- Vendor ID: ${user.maintenanceVendorId || "None"}

PERMISSIONS:
${rolePermissions.map(p => `- ${p}`).join('\n')}

ASSIGNED LOCATIONS (for org_subadmin):
${context.assignedLocations?.length ? context.assignedLocations.map(loc => `- ID: ${loc.id}, Name: ${loc.name}, Address: ${loc.address}`).join('\n') : '- No locations assigned'}
TOTAL ACCESSIBLE LOCATIONS: ${context.assignedLocations?.length || 0}

AVAILABLE VENDOR TIERS:
${context.vendorTiers?.length ? context.vendorTiers.map(tier => `- ${tier.vendor.name} (ID: ${tier.vendor.id})`).join('\n') : '- No vendor tiers available'}

TICKET STATISTICS:
- Total tickets: ${context.totalTickets}
- Pending tickets: ${context.pendingTickets}
- In progress tickets: ${context.inProgressTickets}
- Completed tickets: ${context.completedTickets}

RECENT TICKETS:
${context.tickets.slice(0, 5).map(t => `- ${t.ticketNumber}: ${t.title} (${t.status})`).join('\n')}

CONVERSATION MEMORY RULES:
- REMEMBER what the user has already told you in the conversation
- DO NOT ask users to repeat information they've already provided
- If user says they uploaded files, TRUST THEM - hasImages parameter confirms this
- If user mentioned a maintenance issue in previous messages, REMEMBER IT
- NEVER act like you're starting fresh - maintain context

LOCATION SELECTION RULES:
- ALWAYS tell users how many locations they have access to
- List ALL available locations clearly with ID and name
- If user has only 1 location, mention it specifically and use it automatically
- For first interaction, say: "You have access to ${context.assignedLocations?.length || 0} location(s): ${context.assignedLocations?.map(loc => `${loc.name} (ID: ${loc.id})`).join(', ') || 'None'}"

AUTONOMOUS TICKET CREATION RULES:
When users mention ANY maintenance issue (leaking roof, broken equipment, electrical problems, etc.), you should:
1. REMEMBER the issue from conversation history - don't ask them to repeat it
2. AUTOMATICALLY generate a professional title (e.g. "Roof Leak Repair - Urgent Water Damage")
3. AUTOMATICALLY create a detailed description based on the issue mentioned
4. AUTOMATICALLY determine priority (high for urgent/safety issues, medium for standard, low for minor)
5. AUTOMATICALLY use the first assigned location (if only one available)
6. ${hasImages ? 'IMMEDIATELY CREATE THE TICKET since images/videos have been uploaded' : 'REQUIRE image/video upload for all tickets - this is MANDATORY for documentation'}
7. ${hasImages ? 'PROCEED WITH TICKET CREATION NOW' : 'Wait for image upload before creating ticket'}

CURRENT STATUS: ${hasImages ? 'IMAGES UPLOADED - CREATE TICKET IMMEDIATELY' : 'NO IMAGES UPLOADED - REQUEST IMAGES'}

${hasImages ? 'CRITICAL: Images are uploaded. If user mentioned an issue earlier, CREATE THE TICKET NOW. DO NOT ask for more information.' : 'IMPORTANT: Images or videos are REQUIRED for all ticket creation.'}

EXAMPLE RESPONSES FOR ORG_SUBADMIN:

FIRST INTERACTION:
- User: "hello"
- You: "Hello! I'm your maintenance ticketing assistant. You have access to ${context.assignedLocations?.length || 0} location(s): ${context.assignedLocations?.map(loc => `${loc.name} (ID: ${loc.id})`).join(', ') || 'None'}. I can help you create tickets, check status, or answer questions. What can I help you with?"

WHEN NO IMAGES:
- User: "there's a leaking roof in the lobby" 
- You: "I'll create an urgent ticket for the roof leak at ${context.assignedLocations?.[0]?.name || 'your location'}. Title: 'Lobby Roof Leak - Urgent Water Damage', Description: 'Roof leak reported in lobby area requiring immediate attention to prevent water damage and safety hazards', Priority: High. Please upload images/videos of the leak so I can create the ticket."

WHEN IMAGES UPLOADED:
${hasImages ? 
`- User: "i uploaded the file" (after mentioning roof leak)
- You: "Perfect! Creating urgent ticket for the roof leak at ${context.assignedLocations?.[0]?.name || 'your location'}. Title: 'Lobby Roof Leak - Urgent Water Damage', Priority: High. Creating ticket now..." (THEN CREATE THE TICKET)` :
`- User: "i uploaded the file"
- You: "Great! What maintenance issue should I create a ticket for?"`}

For org_subadmin users:
- ALWAYS use the first assigned location ID automatically for ticket creation
- CLEARLY show which location will be used
- ${hasImages ? 'IMMEDIATELY CREATE THE TICKET since images are uploaded' : 'REQUIRE image/video upload before proceeding'}
- Be specific about the location in the ticket title/description

INSTRUCTIONS:
1. BE AUTONOMOUS - minimize user interaction
2. THINK INTELLIGENTLY - use context clues to make smart decisions  
3. REMEMBER CONVERSATION CONTEXT - never ask users to repeat what they've said
4. ${hasImages ? 'IMMEDIATELY CREATE TICKETS when images are uploaded and user mentioned an issue' : 'Request image upload before creating tickets'}
5. Always respond in JSON format with "response" and optional "action" fields
6. For ticket queries, provide helpful information about accessible tickets
7. Only suggest actions within user's role boundaries
8. Be specific about location details - tell users exactly which location will be used

AVAILABLE ACTIONS:
- create_ticket: Create a new ticket (requires: title, description, priority, locationId for org_subadmin)
- get_ticket_status: Get status of a specific ticket by ID or ticket number
- list_tickets: List tickets with filters (status, priority, location)
- force_close_ticket: Force close a ticket (if user has permission)
- get_location_info: Get information about a specific location

API ENDPOINTS AVAILABLE:
- POST /api/tickets - Create a new ticket (requires title, description, priority, locationId)
- GET /api/tickets - Get user's accessible tickets
- GET /api/tickets/:id - Get specific ticket details
- POST /api/tickets/:id/force-close - Force close a ticket
- GET /api/organizations/:id/locations - Get organization locations
- GET /api/users/:id/locations - Get user's assigned locations

TICKET CREATION REQUIREMENTS:
- Title (auto-generated by AI)
- Description (auto-generated by AI)
- Priority (auto-generated by AI: high, medium, low)
- Location ID (REQUIRED for org_subadmin - use assigned location IDs)
- Images/Videos (MANDATORY - at least one file required)

Remember: Be autonomous, intelligent, and efficient. Always include complete context about user's locations and permissions.`;
}

function getRolePermissions(role: string): string[] {
  const permissions = {
    root: [
      "Create and manage organizations",
      "Create and manage maintenance vendors", 
      "View all tickets across the system",
      "Manage all users and permissions",
      "Force close any ticket"
    ],
    org_admin: [
      "Create tickets for their organization",
      "Accept/reject tickets for their organization",
      "Assign tickets to maintenance vendors",
      "View organization's tickets and users",
      "Manage sub-admins and locations",
      "Force close organization tickets"
    ],
    org_subadmin: [
      "Create tickets for assigned locations",
      "View tickets for assigned locations",
      "Force close location tickets"
    ],
    maintenance_admin: [
      "View and accept marketplace tickets",
      "Assign tickets to technicians",
      "Manage technician accounts",
      "Create invoices for completed work",
      "Force close assigned tickets"
    ],
    technician: [
      "View assigned tickets",
      "Update ticket status",
      "Create work orders",
      "Upload completion photos and notes"
    ]
  };
  
  return permissions[role as keyof typeof permissions] || [];
}

async function executeAction(action: any, user: User) {
  try {
    switch (action.type) {
      case "create_ticket":
        // Validate user can create tickets
        if (!["root", "org_admin", "org_subadmin"].includes(user.role)) {
          return { success: false, message: "You don't have permission to create tickets" };
        }
        
        // For org_subadmin, ensure locationId is provided and valid
        let locationId = action.data.locationId || null;
        if (user.role === "org_subadmin" && user.organizationId) {
          try {
            const userLocations = await storage.getUserLocations(user.id);
            
            if (!userLocations || userLocations.length === 0) {
              return { success: false, message: "No locations assigned to user" };
            }
            
            // If no locationId provided, use the first assigned location
            if (!locationId) {
              locationId = userLocations[0].id;
            } else {
              // Verify user has access to this location
              const hasAccess = userLocations.some(loc => loc.id === locationId);
              if (!hasAccess) {
                return { success: false, message: "You don't have access to this location" };
              }
            }
          } catch (error) {
            return { success: false, message: "Error validating location access" };
          }
        }

        const ticketData = {
          title: action.data.title,
          description: action.data.description,
          priority: action.data.priority || "medium",
          status: "pending",
          organizationId: user.organizationId || action.data.organizationId,
          reporterId: user.id,
          locationId: locationId,
          images: []
        };
        
        const ticket = await storage.createTicket(ticketData);
        return { success: true, message: `Ticket created successfully: ${ticket.ticketNumber}` };
        
      case "get_ticket_status":
        const tickets = await getUserAccessibleTickets(user);
        const foundTicket = tickets.find(t => 
          t.ticketNumber === action.data.ticketNumber || 
          t.id === action.data.ticketId
        );
        
        if (!foundTicket) {
          return { success: false, message: "Ticket not found or you don't have access" };
        }
        
        return { 
          success: true, 
          message: `Ticket ${foundTicket.ticketNumber}: ${foundTicket.title} - Status: ${foundTicket.status}` 
        };
        
      case "list_tickets":
        const userTickets = await getUserAccessibleTickets(user);
        const filteredTickets = userTickets.filter(ticket => {
          if (action.data.status) return ticket.status === action.data.status;
          if (action.data.priority) return ticket.priority === action.data.priority;
          return true;
        });
        
        return { 
          success: true, 
          message: `Found ${filteredTickets.length} tickets matching your criteria` 
        };

      case "get_location_info":
        if (user.role === "org_subadmin" && user.organizationId) {
          const userLocations = await storage.getUserLocations(user.id);
          const requestedLocation = userLocations.find(loc => loc.id === action.data.locationId);
          
          if (!requestedLocation) {
            return { success: false, message: "Location not found or you don't have access" };
          }
          
          return {
            success: true,
            message: `Location Info - ID: ${requestedLocation.id}, Name: ${requestedLocation.name}, Address: ${requestedLocation.address}`
          };
        }
        return { success: false, message: "Location info only available for org_subadmin users" };

      case "force_close_ticket":
        if (!["root", "org_admin", "org_subadmin"].includes(user.role)) {
          return { success: false, message: "You don't have permission to force close tickets" };
        }
        
        // This would require additional implementation in storage
        return { success: false, message: "Force close functionality not yet implemented" };
        
      default:
        return { success: false, message: "Unknown action type" };
    }
  } catch (error) {
    console.error("Action execution error:", error);
    return { success: false, message: "Failed to execute action" };
  }
}

async function getUserAccessibleTickets(user: User) {
  if (user.role === "root") {
    return await storage.getTickets();
  } else if (user.organizationId) {
    return await storage.getTickets(user.organizationId);
  } else if (user.maintenanceVendorId) {
    return await storage.getTicketsByVendor(user.maintenanceVendorId);
  }
  
  return [];
}