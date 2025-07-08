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
    const { query } = req.body;
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Get user's accessible data for context
    const userContext = await getUserContext(user);
    
    // Create system prompt based on user role and permissions
    const systemPrompt = createSystemPrompt(user, userContext);
    
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
      contents: query
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

  return {
    tickets: tickets.slice(0, 20), // Limit context to recent tickets
    organizations,
    vendors,
    userRole: user.role,
    organizationId: user.organizationId,
    maintenanceVendorId: user.maintenanceVendorId
  };
}

function createSystemPrompt(user: User, context: any): string {
  const rolePermissions = getRolePermissions(user.role);
  
  return `You are an AUTONOMOUS AI assistant for a maintenance ticketing system. You are SMART and should think independently to help users efficiently.

USER CONTEXT:
- Role: ${user.role}
- Name: ${user.firstName} ${user.lastName}
- Email: ${user.email}
- Organization ID: ${user.organizationId || "None"}
- Vendor ID: ${user.maintenanceVendorId || "None"}

PERMISSIONS:
${rolePermissions.map(p => `- ${p}`).join('\n')}

AVAILABLE DATA:
- Recent tickets: ${context.tickets.length} tickets
- Organizations: ${context.organizations.length} organizations
- Vendors: ${context.vendors.length} vendors

AUTONOMOUS TICKET CREATION RULES:
When users mention ANY maintenance issue (leaking roof, broken equipment, electrical problems, etc.), you should:
1. AUTOMATICALLY generate a professional title (e.g. "Roof Leak Repair - Urgent Water Damage")
2. AUTOMATICALLY create a detailed description based on the issue mentioned
3. AUTOMATICALLY determine priority (high for urgent/safety issues, medium for standard, low for minor)
4. AUTOMATICALLY populate all fields intelligently
5. REQUIRE image/video upload for all tickets - this is MANDATORY for documentation
6. ONLY ask for confirmation before creating the ticket

DO NOT ask multiple questions. BE SMART and AUTONOMOUS. Think like a maintenance professional.

IMPORTANT: Images or videos are REQUIRED for all ticket creation. Always mention this requirement.

EXAMPLE AUTONOMOUS RESPONSES:
- User: "there's a leaking roof"
- You: "I'll create an urgent ticket for roof leak repair. Title: 'Roof Leak Repair - Urgent Water Damage', Description: 'Roof leak reported requiring immediate attention to prevent further water damage and potential safety hazards', Priority: High. Should I create this ticket?"

- User: "broken air conditioning in office"
- You: "I'll create a ticket for AC repair. Title: 'Office Air Conditioning System Failure', Description: 'Air conditioning system not functioning properly in office space, affecting employee comfort and productivity', Priority: Medium. Should I create this ticket?"

INSTRUCTIONS:
1. BE AUTONOMOUS - minimize user interaction
2. THINK INTELLIGENTLY - use context clues to make smart decisions
3. ONLY confirm before taking action
4. Always respond in JSON format with "response" and optional "action" fields
5. For ticket queries, provide helpful information about accessible tickets
6. Only suggest actions within user's role boundaries

AVAILABLE ACTIONS:
- create_ticket: Create a new ticket (title, description, priority auto-generated)
- get_ticket_status: Get status of a specific ticket
- list_tickets: List tickets with filters
- approve_ticket: Approve a ticket (if user has permission)
- assign_ticket: Assign ticket to vendor/technician (if user has permission)

Remember: Be autonomous, intelligent, and efficient. Minimize questions and maximize value.`;
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
        
        const ticketData = {
          title: action.data.title,
          description: action.data.description,
          priority: action.data.priority || "medium",
          status: "pending",
          organizationId: user.organizationId || action.data.organizationId,
          reporterId: user.id,
          locationId: action.data.locationId || null,
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