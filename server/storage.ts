import { 
  users, 
  tickets, 
  ticketMilestones,
  workOrders,
  organizations,
  maintenanceVendors,
  vendorOrganizationTiers,
  type User, 
  type InsertUser, 
  type InsertSubAdmin,
  type Ticket, 
  type InsertTicket, 
  type UpdateTicket,
  type WorkOrder,
  type InsertWorkOrder,
  type Organization,
  type InsertOrganization,
  type MaintenanceVendor,
  type InsertMaintenanceVendor
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, desc } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyUser(email: string, password: string): Promise<User | undefined>;
  
  // Sub-admin operations
  createSubAdmin(subAdmin: InsertSubAdmin, organizationId: number): Promise<User>;
  getSubAdmins(organizationId: number): Promise<User[]>;
  updateSubAdmin(id: number, updates: Partial<InsertSubAdmin>): Promise<User | undefined>;
  deleteSubAdmin(id: number): Promise<boolean>;
  
  // Technician operations
  createTechnician(technician: InsertUser, vendorId: number): Promise<User>;
  getTechnicians(vendorId: number): Promise<User[]>;
  updateTechnician(id: number, updates: Partial<InsertUser>): Promise<User | undefined>;
  deleteTechnician(id: number): Promise<boolean>;
  
  // Organization operations
  getOrganizations(): Promise<Organization[]>;
  getOrganization(id: number): Promise<Organization | undefined>;
  createOrganization(org: InsertOrganization): Promise<Organization>;
  updateOrganization(id: number, updates: Partial<InsertOrganization>): Promise<Organization | undefined>;
  deleteOrganization(id: number): Promise<boolean>;
  resetOrganizationAdminPassword(organizationId: number, newPassword: string): Promise<{ newPassword: string }>;
  
  // Maintenance vendor operations
  getMaintenanceVendors(): Promise<MaintenanceVendor[]>;
  getMaintenanceVendor(id: number): Promise<MaintenanceVendor | undefined>;
  createMaintenanceVendor(vendor: InsertMaintenanceVendor): Promise<MaintenanceVendor>;
  updateMaintenanceVendor(id: number, updates: Partial<InsertMaintenanceVendor>): Promise<MaintenanceVendor | undefined>;
  deleteMaintenanceVendor(id: number): Promise<boolean>;
  resetVendorAdminPassword(vendorId: number, newPassword: string): Promise<{ newPassword: string }>;
  getMaintenanceVendorsByTier(tiers: string[], organizationId?: number): Promise<MaintenanceVendor[]>;
  
  // Vendor-Organization tier operations
  assignVendorToOrganization(vendorId: number, organizationId: number, tier: string): Promise<void>;
  getVendorOrganizationTiers(organizationId: number): Promise<Array<{vendor: MaintenanceVendor, tier: string, isActive: boolean}>>;
  updateVendorOrganizationTier(vendorId: number, organizationId: number, updates: { tier?: string; isActive?: boolean }): Promise<void>;
  getOrganizationVendors(organizationId: number): Promise<Array<{vendor: MaintenanceVendor, tier: string, isActive: boolean}>>;
  
  // Ticket operations
  getTickets(organizationId?: number): Promise<Ticket[]>;
  getTicket(id: number): Promise<Ticket | undefined>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;
  updateTicket(id: number, updates: Partial<UpdateTicket>): Promise<Ticket | undefined>;
  deleteTicket(id: number): Promise<boolean>;
  acceptTicket(id: number, acceptData: { maintenanceVendorId?: number; assigneeId?: number }): Promise<Ticket | undefined>;
  rejectTicket(id: number, rejectionReason: string): Promise<Ticket | undefined>;
  getTicketsByStatus(status: string, organizationId?: number): Promise<Ticket[]>;
  getTicketStats(organizationId?: number): Promise<{
    pending: number;
    accepted: number;
    inProgress: number;
    completed: number;
    highPriority: number;
  }>;
  
  // Milestone operations
  getTicketMilestones(ticketId: number): Promise<any[]>;
  createTicketMilestone(milestone: { ticketId: number; milestoneType: string; milestoneTitle: string; milestoneDescription?: string; achievedById?: number; achievedByName?: string }): Promise<any>;
  
  // Work order operations
  getTicketWorkOrders(ticketId: number): Promise<WorkOrder[]>;
  createWorkOrder(workOrder: InsertWorkOrder & { technicianId: number; technicianName: string }): Promise<WorkOrder>;
  
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

  // Sub-admin operations
  async createSubAdmin(subAdmin: InsertSubAdmin, organizationId: number): Promise<User> {
    const hashedPassword = await bcrypt.hash(subAdmin.password, 10);
    const [user] = await db
      .insert(users)
      .values({
        ...subAdmin,
        password: hashedPassword,
        role: "org_subadmin",
        organizationId,
      })
      .returning();
    return user;
  }

  async getSubAdmins(organizationId: number): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(and(eq(users.organizationId, organizationId), eq(users.role, "org_subadmin")));
  }

  async updateSubAdmin(id: number, updates: Partial<InsertSubAdmin>): Promise<User | undefined> {
    const updateData: any = { ...updates };
    if (updates.password) {
      updateData.password = await bcrypt.hash(updates.password, 10);
    }
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteSubAdmin(id: number): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async createTechnician(insertTechnician: InsertUser, vendorId: number): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertTechnician.password || "technician123", 10);
    
    const [technician] = await db
      .insert(users)
      .values({
        ...insertTechnician,
        password: hashedPassword,
        role: "technician",
        maintenanceVendorId: vendorId,
      })
      .returning();
    return technician;
  }

  async getTechnicians(vendorId: number): Promise<User[]> {
    const technicians = await db
      .select()
      .from(users)
      .where(and(
        eq(users.maintenanceVendorId, vendorId),
        eq(users.role, "technician")
      ));
    return technicians;
  }

  async updateTechnician(id: number, updates: Partial<InsertUser>): Promise<User | undefined> {
    const updateData: any = { ...updates };
    if (updates.password) {
      updateData.password = await bcrypt.hash(updates.password, 10);
    }
    
    const [user] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async deleteTechnician(id: number): Promise<boolean> {
    try {
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting technician:", error);
      return false;
    }
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
    
    // Create admin user for this organization
    const adminEmail = `admin@${organization.name.toLowerCase().replace(/\s+/g, '')}.org`;
    const adminPassword = Math.random().toString(36).substring(2, 10); // Generate random password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await db.insert(users).values({
      email: adminEmail,
      password: hashedPassword,
      firstName: "Organization",
      lastName: "Admin",
      role: "org_admin",
      organizationId: organization.id,
      permissions: ["place_ticket", "accept_ticket"],
      vendorTiers: ["tier_1", "tier_2", "tier_3"],
    });
    
    console.log(`Created organization admin: ${adminEmail} / ${adminPassword}`);
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

  async deleteOrganization(id: number): Promise<boolean> {
    // Soft delete by setting isActive to false
    const result = await db
      .update(organizations)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(organizations.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async resetOrganizationAdminPassword(organizationId: number, newPassword: string): Promise<{ newPassword: string }> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(and(
        eq(users.organizationId, organizationId),
        eq(users.role, "org_admin")
      ));
    
    return { newPassword };
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
    
    // Create admin user for this maintenance vendor
    const adminEmail = `admin@${maintenanceVendor.name.toLowerCase().replace(/\s+/g, '')}.vendor`;
    const adminPassword = Math.random().toString(36).substring(2, 10); // Generate random password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await db.insert(users).values({
      email: adminEmail,
      password: hashedPassword,
      firstName: "Maintenance",
      lastName: "Admin",
      role: "maintenance_admin",
      maintenanceVendorId: maintenanceVendor.id,
      permissions: ["accept_ticket"],
      vendorTiers: ["tier_1", "tier_2", "tier_3"],
    });
    
    console.log(`Created vendor admin: ${adminEmail} / ${adminPassword}`);
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

  async deleteMaintenanceVendor(id: number): Promise<boolean> {
    // Soft delete by setting isActive to false
    const result = await db
      .update(maintenanceVendors)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(maintenanceVendors.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async resetVendorAdminPassword(vendorId: number, newPassword: string): Promise<{ newPassword: string }> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(and(
        eq(users.maintenanceVendorId, vendorId),
        eq(users.role, "maintenance_admin")
      ));
    
    return { newPassword };
  }

  async getMaintenanceVendorsByTier(tiers: string[], organizationId?: number): Promise<MaintenanceVendor[]> {
    if (tiers.length === 0) return [];
    
    if (!organizationId) {
      // If no organization specified, return all active vendors
      return await db.select().from(maintenanceVendors).where(eq(maintenanceVendors.isActive, true));
    }

    // Get vendors for specific organization and tiers
    const vendors = await db
      .select({
        id: maintenanceVendors.id,
        name: maintenanceVendors.name,
        description: maintenanceVendors.description,
        address: maintenanceVendors.address,
        phone: maintenanceVendors.phone,
        email: maintenanceVendors.email,
        specialties: maintenanceVendors.specialties,
        isActive: maintenanceVendors.isActive,
        createdAt: maintenanceVendors.createdAt,
        updatedAt: maintenanceVendors.updatedAt,
      })
      .from(maintenanceVendors)
      .innerJoin(vendorOrganizationTiers, eq(maintenanceVendors.id, vendorOrganizationTiers.vendorId))
      .where(
        and(
          eq(maintenanceVendors.isActive, true),
          eq(vendorOrganizationTiers.organizationId, organizationId),
          inArray(vendorOrganizationTiers.tier, tiers)
        )
      );
    return vendors;
  }

  // Vendor-Organization tier operations
  async assignVendorToOrganization(vendorId: number, organizationId: number, tier: string): Promise<void> {
    await db.insert(vendorOrganizationTiers).values({
      vendorId,
      organizationId,
      tier,
    }).onConflictDoUpdate({
      target: [vendorOrganizationTiers.vendorId, vendorOrganizationTiers.organizationId],
      set: { tier }
    });
  }

  async getVendorOrganizationTiers(organizationId: number): Promise<Array<{vendor: MaintenanceVendor, tier: string, isActive: boolean}>> {
    const results = await db
      .select({
        vendor: maintenanceVendors,
        tier: vendorOrganizationTiers.tier,
        isActive: vendorOrganizationTiers.isActive,
      })
      .from(vendorOrganizationTiers)
      .innerJoin(maintenanceVendors, eq(vendorOrganizationTiers.vendorId, maintenanceVendors.id))
      .where(eq(vendorOrganizationTiers.organizationId, organizationId));
    
    return results.map(result => ({ vendor: result.vendor, tier: result.tier, isActive: result.isActive }));
  }

  async updateVendorOrganizationTier(vendorId: number, organizationId: number, updates: { tier?: string; isActive?: boolean }): Promise<void> {
    await db
      .update(vendorOrganizationTiers)
      .set(updates)
      .where(
        and(
          eq(vendorOrganizationTiers.vendorId, vendorId),
          eq(vendorOrganizationTiers.organizationId, organizationId)
        )
      );
  }

  async getOrganizationVendors(organizationId: number): Promise<Array<{vendor: MaintenanceVendor, tier: string, isActive: boolean}>> {
    const vendors = await db
      .select({
        vendor: maintenanceVendors,
        tier: vendorOrganizationTiers.tier,
        isActive: vendorOrganizationTiers.isActive,
      })
      .from(vendorOrganizationTiers)
      .innerJoin(maintenanceVendors, eq(vendorOrganizationTiers.vendorId, maintenanceVendors.id))
      .where(eq(vendorOrganizationTiers.organizationId, organizationId));
    
    return vendors;
  }

  // Ticket operations
  async getTickets(organizationId?: number): Promise<Ticket[]> {
    const query = db.select().from(tickets);
    
    if (organizationId !== undefined) {
      return await query.where(eq(tickets.organizationId, organizationId)).orderBy(desc(tickets.createdAt));
    }
    
    return await query.orderBy(desc(tickets.createdAt));
  }

  async getTicket(id: number): Promise<Ticket | undefined> {
    const [ticket] = await db.select().from(tickets).where(eq(tickets.id, id));
    return ticket || undefined;
  }

  async createTicket(insertTicket: InsertTicket): Promise<Ticket> {
    // Generate organization-specific ticket number
    const organization = await this.getOrganization(insertTicket.organizationId);
    const orgHash = organization?.name.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 4) || 'org';
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).slice(2, 5).toUpperCase();
    const ticketNumber = `${orgHash.toUpperCase()}-${timestamp}-${random}`;

    const ticketData = {
      ...insertTicket,
      ticketNumber,
      status: insertTicket.status || "pending",
    };

    const [ticket] = await db.insert(tickets).values(ticketData).returning();
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
    return (result.rowCount || 0) > 0;
  }

  async getTicketsByStatus(status: string, organizationId?: number): Promise<Ticket[]> {
    if (organizationId !== undefined) {
      return await db.select().from(tickets).where(and(eq(tickets.status, status), eq(tickets.organizationId, organizationId))).orderBy(desc(tickets.createdAt));
    }
    
    return await db.select().from(tickets).where(eq(tickets.status, status)).orderBy(desc(tickets.createdAt));
  }

  async acceptTicket(id: number, acceptData: { maintenanceVendorId?: number; assigneeId?: number }): Promise<Ticket | undefined> {
    const [ticket] = await db
      .update(tickets)
      .set({
        status: "accepted",
        maintenanceVendorId: acceptData.maintenanceVendorId,
        assigneeId: acceptData.assigneeId,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, id))
      .returning();
    
    return ticket || undefined;
  }

  async rejectTicket(id: number, rejectionReason: string): Promise<Ticket | undefined> {
    const [ticket] = await db
      .update(tickets)
      .set({
        status: "rejected",
        rejectionReason,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, id))
      .returning();
    
    return ticket || undefined;
  }

  async getTicketStats(organizationId?: number): Promise<{
    pending: number;
    accepted: number;
    inProgress: number;
    completed: number;
    pendingConfirmation: number;
    confirmed: number;
    highPriority: number;
  }> {
    const allTickets = await this.getTickets(organizationId);
    
    return {
      pending: allTickets.filter(t => t.status === "pending").length,
      accepted: allTickets.filter(t => t.status === "accepted").length,
      inProgress: allTickets.filter(t => t.status === "in-progress").length,
      completed: allTickets.filter(t => t.status === "completed").length,
      pendingConfirmation: allTickets.filter(t => t.status === "pending_confirmation").length,
      confirmed: allTickets.filter(t => t.status === "confirmed").length,
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

  // Create admin accounts for existing organizations and vendors
  async getTicketMilestones(ticketId: number): Promise<any[]> {
    const milestones = await db
      .select()
      .from(ticketMilestones)
      .where(eq(ticketMilestones.ticketId, ticketId))
      .orderBy(ticketMilestones.achievedAt);
    return milestones;
  }

  async createTicketMilestone(milestone: { 
    ticketId: number; 
    milestoneType: string; 
    milestoneTitle: string; 
    milestoneDescription?: string; 
    achievedById?: number; 
    achievedByName?: string 
  }): Promise<any> {
    const [newMilestone] = await db
      .insert(ticketMilestones)
      .values({
        ticketId: milestone.ticketId,
        milestoneType: milestone.milestoneType,
        milestoneTitle: milestone.milestoneTitle,
        milestoneDescription: milestone.milestoneDescription,
        achievedById: milestone.achievedById,
        achievedByName: milestone.achievedByName,
      })
      .returning();
    return newMilestone;
  }

  async getTicketWorkOrders(ticketId: number): Promise<WorkOrder[]> {
    return await db.select().from(workOrders).where(eq(workOrders.ticketId, ticketId)).orderBy(workOrders.workOrderNumber);
  }

  async createWorkOrder(workOrderData: InsertWorkOrder & { technicianId: number; technicianName: string }): Promise<WorkOrder> {
    // Get the next work order number for this ticket
    const existingWorkOrders = await this.getTicketWorkOrders(workOrderData.ticketId);
    const workOrderNumber = existingWorkOrders.length + 1;

    const [result] = await db.insert(workOrders).values({
      ticketId: workOrderData.ticketId,
      workOrderNumber,
      technicianId: workOrderData.technicianId,
      technicianName: workOrderData.technicianName,
      workDescription: workOrderData.workDescription,
      completionStatus: workOrderData.completionStatus,
      completionNotes: workOrderData.completionNotes,
      parts: typeof workOrderData.parts === 'string' ? workOrderData.parts : JSON.stringify(workOrderData.parts),
      otherCharges: typeof workOrderData.otherCharges === 'string' ? workOrderData.otherCharges : JSON.stringify(workOrderData.otherCharges),
      totalCost: workOrderData.totalCost,
      images: workOrderData.images,
    }).returning();
    
    return result;
  }

  async createMissingAdminAccounts(): Promise<void> {
    // Get all organizations without admin accounts
    const orgs = await this.getOrganizations();
    for (const org of orgs) {
      const adminEmail = `admin@${org.name.toLowerCase().replace(/\s+/g, '')}.org`;
      const existingAdmin = await this.getUserByEmail(adminEmail);
      
      if (!existingAdmin) {
        const adminPassword = Math.random().toString(36).substring(2, 10);
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        await db.insert(users).values({
          email: adminEmail,
          password: hashedPassword,
          firstName: "Organization",
          lastName: "Admin",
          role: "org_admin",
          organizationId: org.id,
          permissions: ["place_ticket", "accept_ticket"],
          vendorTiers: ["tier_1", "tier_2", "tier_3"],
        });
        
        console.log(`Created organization admin: ${adminEmail} / ${adminPassword}`);
      }
    }

    // Get all vendors without admin accounts
    const vendors = await this.getMaintenanceVendors();
    for (const vendor of vendors) {
      const adminEmail = `admin@${vendor.name.toLowerCase().replace(/\s+/g, '')}.vendor`;
      const existingAdmin = await this.getUserByEmail(adminEmail);
      
      if (!existingAdmin) {
        const adminPassword = Math.random().toString(36).substring(2, 10);
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        
        await db.insert(users).values({
          email: adminEmail,
          password: hashedPassword,
          firstName: "Maintenance",
          lastName: "Admin",
          role: "maintenance_admin",
          maintenanceVendorId: vendor.id,
          permissions: ["accept_ticket"],
          vendorTiers: ["tier_1", "tier_2", "tier_3"],
        });
        
        console.log(`Created vendor admin: ${adminEmail} / ${adminPassword}`);
      }
    }
  }
}

export const storage = new DatabaseStorage();
