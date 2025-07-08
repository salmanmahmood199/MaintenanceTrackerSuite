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
    const storage = getStorage();
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
                data: { type: "object" }
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
  
  return `You are an AI assistant for a maintenance ticketing system. You help users perform tasks within their role permissions.

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

INSTRUCTIONS:
1. Only suggest actions the user has permission to perform
2. Be helpful and conversational
3. When users ask to perform actions, provide specific details about what you'll do
4. Always respond in JSON format with "response" and optional "action" fields
5. For ticket creation, ask for required details: title, description, priority
6. For ticket queries, search through the user's accessible tickets
7. For status updates, only suggest actions within user's role

AVAILABLE ACTIONS:
- create_ticket: Create a new ticket (requires title, description, priority)
- get_ticket_status: Get status of a specific ticket
- list_tickets: List tickets with filters
- approve_ticket: Approve a ticket (if user has permission)
- assign_ticket: Assign ticket to vendor/technician (if user has permission)

Example responses:
- "I'll help you create a new ticket. What's the issue you need to report?"
- "I found 3 tickets matching your criteria. Here are the details..."
- "I can help you approve that ticket. Let me process that for you."

Remember: Only perform actions within the user's role boundaries.`;
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
      "Accept/reject tickets for assigned locations", 
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