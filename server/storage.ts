import { 
  users, 
  tickets, 
  ticketMilestones,
  workOrders,
  organizations,
  maintenanceVendors,
  vendorOrganizationTiers,
  locations,
  userLocationAssignments,
  invoices,
  ticketComments,
  marketplaceBids,
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
  type InsertMaintenanceVendor,
  type Location,
  type InsertLocation,
  type UpdateLocation,
  type Invoice,
  type InsertInvoice,
  type TicketComment,
  type InsertTicketComment,
  type MarketplaceBid,
  type InsertMarketplaceBid,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray, desc, or, isNull } from "drizzle-orm";
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
  getTickets(organizationId?: number, userLocationIds?: number[]): Promise<Ticket[]>;
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
  
  // Invoice operations
  getInvoices(vendorId?: number): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: number, updates: Partial<InsertInvoice>): Promise<Invoice | undefined>;
  deleteInvoice(id: number): Promise<boolean>;
  
  // Location operations
  getLocations(organizationId: number): Promise<Location[]>;
  getLocation(id: number): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: number, updates: Partial<UpdateLocation>): Promise<Location | undefined>;
  deleteLocation(id: number): Promise<boolean>;
  
  // User location assignment operations
  getUserLocationAssignments(userId: number): Promise<Location[]>;
  assignUserToLocation(userId: number, locationId: number): Promise<void>;
  unassignUserFromLocation(userId: number, locationId: number): Promise<void>;
  updateUserLocationAssignments(userId: number, locationIds: number[]): Promise<void>;
  
  // Ticket comment operations
  getTicketComments(ticketId: number): Promise<(TicketComment & { user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'> })[]>;
  createTicketComment(comment: InsertTicketComment): Promise<TicketComment>;
  updateTicketComment(id: number, updates: Partial<InsertTicketComment>): Promise<TicketComment | undefined>;
  deleteTicketComment(id: number): Promise<boolean>;
  
  // Marketplace bid operations
  getMarketplaceTickets(): Promise<Ticket[]>;
  getTicketBids(ticketId: number): Promise<(MarketplaceBid & { vendor: Pick<MaintenanceVendor, 'id' | 'name' | 'email'> })[]>;
  createMarketplaceBid(bid: InsertMarketplaceBid): Promise<MarketplaceBid>;
  acceptMarketplaceBid(bidId: number): Promise<{ bid: MarketplaceBid; ticket: Ticket }>;
  rejectMarketplaceBid(bidId: number, rejectionReason: string): Promise<MarketplaceBid>;
  counterMarketplaceBid(bidId: number, counterOffer: number, counterNotes: string): Promise<MarketplaceBid>;
  assignTicketToMarketplace(ticketId: number): Promise<Ticket | undefined>;
  approveBid(bidId: number): Promise<{ bid: MarketplaceBid; ticket: Ticket }>;
  
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
  async getTickets(organizationId?: number, userLocationIds?: number[]): Promise<Ticket[]> {
    let query = db.select().from(tickets);
    
    if (organizationId && userLocationIds && userLocationIds.length > 0) {
      // Filter by organization and user's assigned locations
      query = query.where(
        and(
          eq(tickets.organizationId, organizationId),
          or(
            isNull(tickets.locationId), // Include tickets without location
            inArray(tickets.locationId, userLocationIds)
          )
        )
      );
    } else if (organizationId) {
      query = query.where(eq(tickets.organizationId, organizationId));
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
    console.log(`AcceptTicket storage method called for ticket ${id} with data:`, acceptData);
    
    const updateData: any = {
      status: "accepted",
      updatedAt: new Date(),
    };
    
    if (acceptData.maintenanceVendorId !== undefined) {
      updateData.maintenanceVendorId = acceptData.maintenanceVendorId;
    }
    
    if (acceptData.assigneeId !== undefined) {
      updateData.assigneeId = acceptData.assigneeId;
    }
    
    console.log(`Updating ticket ${id} with:`, updateData);
    
    const [ticket] = await db
      .update(tickets)
      .set(updateData)
      .where(eq(tickets.id, id))
      .returning();
    
    console.log(`Ticket ${id} updated result:`, { 
      id: ticket?.id, 
      status: ticket?.status, 
      vendorId: ticket?.maintenanceVendorId, 
      assigneeId: ticket?.assigneeId 
    });
    
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

  async getInvoices(vendorId?: number): Promise<Invoice[]> {
    if (vendorId) {
      return await db.select().from(invoices).where(eq(invoices.maintenanceVendorId, vendorId));
    }
    return await db.select().from(invoices);
  }

  async getInvoice(id: number): Promise<Invoice | undefined> {
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, id));
    return invoice;
  }

  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const [newInvoice] = await db.insert(invoices).values(invoice).returning();
    return newInvoice;
  }

  async updateInvoice(id: number, updates: Partial<InsertInvoice>): Promise<Invoice | undefined> {
    const [updatedInvoice] = await db
      .update(invoices)
      .set(updates)
      .where(eq(invoices.id, id))
      .returning();
    return updatedInvoice;
  }

  async deleteInvoice(id: number): Promise<boolean> {
    const result = await db.delete(invoices).where(eq(invoices.id, id));
    return result.rowCount > 0;
  }

  // Location operations
  async getLocations(organizationId: number): Promise<Location[]> {
    return await db.select().from(locations).where(eq(locations.organizationId, organizationId));
  }

  async getLocation(id: number): Promise<Location | undefined> {
    const [location] = await db.select().from(locations).where(eq(locations.id, id));
    return location;
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const [location] = await db.insert(locations).values(insertLocation).returning();
    return location;
  }

  async updateLocation(id: number, updates: Partial<UpdateLocation>): Promise<Location | undefined> {
    const [location] = await db
      .update(locations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(locations.id, id))
      .returning();
    return location;
  }

  async deleteLocation(id: number): Promise<boolean> {
    // First remove all user assignments
    await db.delete(userLocationAssignments).where(eq(userLocationAssignments.locationId, id));
    // Then delete the location
    const result = await db.delete(locations).where(eq(locations.id, id));
    return result.rowCount > 0;
  }

  // User location assignment operations
  async getUserLocationAssignments(userId: number): Promise<Location[]> {
    const assignments = await db
      .select({
        id: locations.id,
        name: locations.name,
        address: locations.address,
        description: locations.description,
        organizationId: locations.organizationId,
        isActive: locations.isActive,
        createdAt: locations.createdAt,
        updatedAt: locations.updatedAt,
      })
      .from(userLocationAssignments)
      .innerJoin(locations, eq(userLocationAssignments.locationId, locations.id))
      .where(eq(userLocationAssignments.userId, userId));
    
    return assignments;
  }

  async assignUserToLocation(userId: number, locationId: number): Promise<void> {
    await db.insert(userLocationAssignments).values({
      userId,
      locationId,
    }).onConflictDoNothing();
  }

  async unassignUserFromLocation(userId: number, locationId: number): Promise<void> {
    await db
      .delete(userLocationAssignments)
      .where(
        and(
          eq(userLocationAssignments.userId, userId),
          eq(userLocationAssignments.locationId, locationId)
        )
      );
  }

  async updateUserLocationAssignments(userId: number, locationIds: number[]): Promise<void> {
    // Remove all existing assignments
    await db.delete(userLocationAssignments).where(eq(userLocationAssignments.userId, userId));
    
    // Add new assignments
    if (locationIds.length > 0) {
      const assignments = locationIds.map(locationId => ({
        userId,
        locationId,
      }));
      await db.insert(userLocationAssignments).values(assignments);
    }
  }

  // Ticket comment operations
  async getTicketComments(ticketId: number): Promise<(TicketComment & { user: Pick<User, 'id' | 'firstName' | 'lastName' | 'email'> })[]> {
    const comments = await db
      .select({
        id: ticketComments.id,
        ticketId: ticketComments.ticketId,
        userId: ticketComments.userId,
        content: ticketComments.content,
        images: ticketComments.images,
        isSystemGenerated: ticketComments.isSystemGenerated,
        createdAt: ticketComments.createdAt,
        updatedAt: ticketComments.updatedAt,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        }
      })
      .from(ticketComments)
      .leftJoin(users, eq(ticketComments.userId, users.id))
      .where(eq(ticketComments.ticketId, ticketId))
      .orderBy(ticketComments.createdAt);

    return comments;
  }

  async createTicketComment(comment: InsertTicketComment): Promise<TicketComment> {
    const [newComment] = await db
      .insert(ticketComments)
      .values(comment)
      .returning();
    return newComment;
  }

  async updateTicketComment(id: number, updates: Partial<InsertTicketComment>): Promise<TicketComment | undefined> {
    const [updatedComment] = await db
      .update(ticketComments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ticketComments.id, id))
      .returning();
    return updatedComment;
  }

  async deleteTicketComment(id: number): Promise<boolean> {
    const result = await db
      .delete(ticketComments)
      .where(eq(ticketComments.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Marketplace bid operations
  async getMarketplaceTickets(): Promise<Ticket[]> {
    return await db.select().from(tickets)
      .where(eq(tickets.status, "marketplace"))
      .orderBy(desc(tickets.createdAt));
  }

  async getTicketBids(ticketId: number): Promise<(MarketplaceBid & { vendor: Pick<MaintenanceVendor, 'id' | 'name' | 'email'> })[]> {
    const bids = await db.select({
      id: marketplaceBids.id,
      ticketId: marketplaceBids.ticketId,
      vendorId: marketplaceBids.vendorId,
      hourlyRate: marketplaceBids.hourlyRate,
      estimatedHours: marketplaceBids.estimatedHours,
      responseTime: marketplaceBids.responseTime,
      parts: marketplaceBids.parts,
      totalAmount: marketplaceBids.totalAmount,
      additionalNotes: marketplaceBids.additionalNotes,
      status: marketplaceBids.status,
      rejectionReason: marketplaceBids.rejectionReason,
      counterOffer: marketplaceBids.counterOffer,
      counterNotes: marketplaceBids.counterNotes,
      approved: marketplaceBids.approved,
      createdAt: marketplaceBids.createdAt,
      updatedAt: marketplaceBids.updatedAt,
      vendor: {
        id: maintenanceVendors.id,
        name: maintenanceVendors.name,
        email: maintenanceVendors.email,
      }
    })
    .from(marketplaceBids)
    .leftJoin(maintenanceVendors, eq(marketplaceBids.vendorId, maintenanceVendors.id))
    .where(eq(marketplaceBids.ticketId, ticketId))
    .orderBy(desc(marketplaceBids.createdAt));

    return bids as (MarketplaceBid & { vendor: Pick<MaintenanceVendor, 'id' | 'name' | 'email'> })[];
  }

  async createMarketplaceBid(bid: InsertMarketplaceBid): Promise<MarketplaceBid> {
    const [newBid] = await db.insert(marketplaceBids).values(bid).returning();
    return newBid;
  }

  async acceptMarketplaceBid(bidId: number): Promise<{ bid: MarketplaceBid; ticket: Ticket }> {
    // Get the bid details
    const [bid] = await db.select().from(marketplaceBids).where(eq(marketplaceBids.id, bidId));
    if (!bid) {
      throw new Error("Bid not found");
    }

    // Update bid status to accepted
    const [updatedBid] = await db.update(marketplaceBids)
      .set({ status: "accepted", updatedAt: new Date() })
      .where(eq(marketplaceBids.id, bidId))
      .returning();

    // Update ticket to assign vendor and change status
    const [updatedTicket] = await db.update(tickets)
      .set({ 
        maintenanceVendorId: bid.vendorId,
        status: "accepted",
        updatedAt: new Date() 
      })
      .where(eq(tickets.id, bid.ticketId))
      .returning();

    // Reject all other bids for this ticket
    await db.update(marketplaceBids)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(and(
        eq(marketplaceBids.ticketId, bid.ticketId),
        eq(marketplaceBids.status, "pending")
      ));

    return { bid: updatedBid, ticket: updatedTicket };
  }

  async rejectMarketplaceBid(bidId: number, rejectionReason: string): Promise<MarketplaceBid> {
    const [updatedBid] = await db.update(marketplaceBids)
      .set({ 
        status: "rejected", 
        rejectionReason,
        updatedAt: new Date() 
      })
      .where(eq(marketplaceBids.id, bidId))
      .returning();
    return updatedBid;
  }

  async counterMarketplaceBid(bidId: number, counterOffer: number, counterNotes: string): Promise<MarketplaceBid> {
    const [updatedBid] = await db.update(marketplaceBids)
      .set({ 
        status: "counter",
        counterOffer: counterOffer.toString(),
        counterNotes,
        updatedAt: new Date() 
      })
      .where(eq(marketplaceBids.id, bidId))
      .returning();
    return updatedBid;
  }

  async assignTicketToMarketplace(ticketId: number): Promise<Ticket | undefined> {
    const [updatedTicket] = await db.update(tickets)
      .set({ status: "marketplace", updatedAt: new Date() })
      .where(eq(tickets.id, ticketId))
      .returning();
    return updatedTicket;
  }

  async approveBid(bidId: number): Promise<{ bid: MarketplaceBid; ticket: Ticket }> {
    // Get the bid details first
    const [bid] = await db.select().from(marketplaceBids).where(eq(marketplaceBids.id, bidId));
    if (!bid) {
      throw new Error("Bid not found");
    }

    // Mark this bid as approved
    const [approvedBid] = await db
      .update(marketplaceBids)
      .set({ 
        approved: true,
        status: "accepted",
        updatedAt: new Date() 
      })
      .where(eq(marketplaceBids.id, bidId))
      .returning();

    // Assign ticket to the vendor from this bid
    const [assignedTicket] = await db
      .update(tickets)
      .set({ 
        maintenanceVendorId: bid.vendorId,
        status: "accepted",
        updatedAt: new Date() 
      })
      .where(eq(tickets.id, bid.ticketId))
      .returning();

    // Mark all other bids for this ticket as rejected
    await db
      .update(marketplaceBids)
      .set({ 
        status: "rejected",
        updatedAt: new Date() 
      })
      .where(and(
        eq(marketplaceBids.ticketId, bid.ticketId),
        not(eq(marketplaceBids.id, bidId)),
        eq(marketplaceBids.status, "pending")
      ));

    return { bid: approvedBid, ticket: assignedTicket };
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
