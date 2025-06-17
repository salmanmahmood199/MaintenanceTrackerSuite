import { users, tickets, type User, type InsertUser, type Ticket, type InsertTicket, type UpdateTicket } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getTickets(): Promise<Ticket[]>;
  getTicket(id: number): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, updates: Partial<UpdateTicket>): Promise<Ticket | undefined>;
  deleteTicket(id: number): Promise<boolean>;
  getTicketsByStatus(status: string): Promise<Ticket[]>;
  getTicketStats(): Promise<{
    open: number;
    inProgress: number;
    completed: number;
    highPriority: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tickets: Map<number, Ticket>;
  private currentUserId: number;
  private currentTicketId: number;

  constructor() {
    this.users = new Map();
    this.tickets = new Map();
    this.currentUserId = 1;
    this.currentTicketId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getTickets(): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    return this.tickets.get(id);
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const id = this.currentTicketId++;
    const now = new Date();
    const ticket: Ticket = {
      ...insertTicket,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.tickets.set(id, ticket);
    return ticket;
  }

  async updateTicket(id: number, updates: Partial<UpdateTicket>): Promise<Ticket | undefined> {
    const ticket = this.tickets.get(id);
    if (!ticket) return undefined;

    const updatedTicket: Ticket = {
      ...ticket,
      ...updates,
      updatedAt: new Date(),
    };
    this.tickets.set(id, updatedTicket);
    return updatedTicket;
  }

  async deleteTicket(id: number): Promise<boolean> {
    return this.tickets.delete(id);
  }

  async getTicketsByStatus(status: string): Promise<Ticket[]> {
    return Array.from(this.tickets.values()).filter(ticket => ticket.status === status);
  }

  async getTicketStats(): Promise<{
    open: number;
    inProgress: number;
    completed: number;
    highPriority: number;
  }> {
    const allTickets = Array.from(this.tickets.values());
    return {
      open: allTickets.filter(t => t.status === "open").length,
      inProgress: allTickets.filter(t => t.status === "in-progress").length,
      completed: allTickets.filter(t => t.status === "completed").length,
      highPriority: allTickets.filter(t => t.priority === "high").length,
    };
  }
}

export const storage = new MemStorage();
