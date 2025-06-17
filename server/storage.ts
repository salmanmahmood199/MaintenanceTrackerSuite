import { 
  users, 
  tickets, 
  organizations,
  maintenanceVendors,
  type User, 
  type InsertUser, 
  type Ticket, 
  type InsertTicket, 
  type UpdateTicket,
  type Organization,
  type InsertOrganization,
  type MaintenanceVendor,
  type InsertMaintenanceVendor
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyUser(email: string, password: string): Promise<User | undefined>;
  
  // Organization operations
  getOrganizations(): Promise<Organization[]>;
  getOrganization(id: number): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, updates: Partial<InsertOrganization>): Promise<Organization | undefined>;
  
  // Maintenance vendor operations
  getMaintenanceVendors(): Promise<MaintenanceVendor[]>;
  getMaintenanceVendor(id: number): Promise<MaintenanceVendor | undefined>;
  createMaintenanceVendor(vendor: InsertMaintenanceVendor): Promise<MaintenanceVendor>;
  updateMaintenanceVendor(id: number, updates: Partial<InsertMaintenanceVendor>): Promise<MaintenanceVendor | undefined>;
  
  // Ticket operations
  getTickets(organizationId?: number): Promise<Ticket[]>;
  getTicket(id: number): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, updates: Partial<UpdateTicket>): Promise<Ticket | undefined>;
  deleteTicket(id: number): Promise<boolean>;
  getTicketsByStatus(status: string, organizationId?: number): Promise<Ticket[]>;
  getTicketStats(organizationId?: number): Promise<{
    open: number;
    inProgress: number;
    completed: number;
    highPriority: number;
  }>;
  
  // Initialize root user
  initializeRootUser(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
      })
      .returning();
    return user;
  }

  async verifyUser(email: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByEmail(email);
    if (!user) return undefined;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : undefined;
  }

  // Organization operations
  async getOrganizations(): Promise<Organization[]> {
    return await db.select().from(organizations).where(eq(organizations.isActive, true));
  }

  async getOrganization(id: number): Promise<Organization | undefined> {
    const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
    return org || undefined;
  }

  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const [organization] = await db.insert(organizations).values(org).returning();
    return organization;
  }

  async updateOrganization(id: number, updates: Partial<InsertOrganization>): Promise<Organization | undefined> {
    const [org] = await db
      .update(organizations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(organizations.id, id))
      .returning();
    return org || undefined;
  }

  // Maintenance vendor operations
  async getMaintenanceVendors(): Promise<MaintenanceVendor[]> {
    return await db.select().from(maintenanceVendors).where(eq(maintenanceVendors.isActive, true));
  }

  async getMaintenanceVendor(id: number): Promise<MaintenanceVendor | undefined> {
    const [vendor] = await db.select().from(maintenanceVendors).where(eq(maintenanceVendors.id, id));
    return vendor || undefined;
  }

  async createMaintenanceVendor(vendor: InsertMaintenanceVendor): Promise<MaintenanceVendor> {
    const [maintenanceVendor] = await db.insert(maintenanceVendors).values(vendor).returning();
    return maintenanceVendor;
  }

  async updateMaintenanceVendor(id: number, updates: Partial<InsertMaintenanceVendor>): Promise<MaintenanceVendor | undefined> {
    const [vendor] = await db
      .update(maintenanceVendors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(maintenanceVendors.id, id))
      .returning();
    return vendor || undefined;
  }

  // Ticket operations
  async getTickets(organizationId?: number): Promise<Ticket[]> {
    const query = db.select().from(tickets);
    
    if (organizationId !== undefined) {
      return await query.where(eq(tickets.organizationId, organizationId));
    }
    
    return await query;
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket || undefined;
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    const [ticket] = await db.insert(tickets).values(insertTicket).returning();
    return ticket;
  }

  async updateTicket(id: number, updates: Partial<UpdateTicket>): Promise<Ticket | undefined> {
    const [ticket] = await db
      .update(tickets)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(tickets.id, id))
      .returning();
    return ticket || undefined;
  }

  async deleteTicket(id: number): Promise<boolean> {
    const result = await db.delete(tickets).where(eq(tickets.id, id));
    return result.rowCount > 0;
  }

  async getTicketsByStatus(status: string, organizationId?: number): Promise<Ticket[]> {
    const query = db.select().from(tickets).where(eq(tickets.status, status));
    
    if (organizationId !== undefined) {
      return await query.where(and(eq(tickets.status, status), eq(tickets.organizationId, organizationId)));
    }
    
    return await query;
  }

  async getTicketStats(organizationId?: number): Promise<{
    open: number;
    inProgress: number;
    completed: number;
    highPriority: number;
  }> {
    const allTickets = await this.getTickets(organizationId);
    
    return {
      open: allTickets.filter(t => t.status === "open").length,
      inProgress: allTickets.filter(t => t.status === "in-progress").length,
      completed: allTickets.filter(t => t.status === "completed").length,
      highPriority: allTickets.filter(t => t.priority === "high").length,
    };
  }

  // Initialize root user
  async initializeRootUser(): Promise<void> {
    const existingRoot = await this.getUserByEmail("root@mail.com");
    if (existingRoot) return;

    await this.createUser({
      email: "root@mail.com",
      password: "admin",
      firstName: "Super",
      lastName: "Admin",
      role: "root",
      isActive: true,
    });
  }
}

export const storage = new DatabaseStorage();
