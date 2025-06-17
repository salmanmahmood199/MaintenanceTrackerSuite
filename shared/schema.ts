import { pgTable, text, serial, integer, boolean, timestamp, varchar, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table with role-based hierarchy
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  phone: varchar("phone", { length: 20 }),
  role: text("role").notNull(), // 'root', 'org_admin', 'maintenance_admin', 'technician', 'org_subadmin'
  organizationId: integer("organization_id"),
  maintenanceVendorId: integer("maintenance_vendor_id"),
  permissions: text("permissions").array(), // ["place_ticket", "accept_ticket"]
  vendorTiers: text("vendor_tiers").array(), // ["tier_1", "tier_2", "tier_3"] - what tiers they can assign
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Organizations table
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Maintenance vendors table
export const maintenanceVendors = pgTable("maintenance_vendors", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  address: text("address"),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 255 }),
  specialties: text("specialties").array(), // e.g., ["plumbing", "electrical", "hvac"]
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// New table for vendor-organization tier relationships
export const vendorOrganizationTiers = pgTable("vendor_organization_tiers", {
  id: serial("id").primaryKey(),
  vendorId: integer("vendor_id").references(() => maintenanceVendors.id).notNull(),
  organizationId: integer("organization_id").references(() => organizations.id).notNull(),
  tier: text("tier").notNull().default("tier_1"), // "tier_1", "tier_2", "tier_3"
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Updated tickets table with organization and vendor references
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  ticketNumber: varchar("ticket_number", { length: 50 }).notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, in-progress, completed
  progress: integer("progress").default(0), // Progress percentage 0-100
  progressStage: varchar("progress_stage", { length: 100 }).default("submitted"), // Current stage description
  organizationId: integer("organization_id").notNull(),
  reporterId: integer("reporter_id").notNull(),
  assigneeId: integer("assignee_id"),
  maintenanceVendorId: integer("maintenance_vendor_id"),
  rejectionReason: text("rejection_reason"),
  images: text("images").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Session storage table for authentication
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
  maintenanceVendor: one(maintenanceVendors, {
    fields: [users.maintenanceVendorId],
    references: [maintenanceVendors.id],
  }),
  reportedTickets: many(tickets, { relationName: "reporter" }),
  assignedTickets: many(tickets, { relationName: "assignee" }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  tickets: many(tickets),
}));

export const maintenanceVendorsRelations = relations(maintenanceVendors, ({ many }) => ({
  technicians: many(users),
  tickets: many(tickets),
  vendorOrganizationTiers: many(vendorOrganizationTiers),
}));

export const vendorOrganizationTiersRelations = relations(vendorOrganizationTiers, ({ one }) => ({
  vendor: one(maintenanceVendors, {
    fields: [vendorOrganizationTiers.vendorId],
    references: [maintenanceVendors.id],
  }),
  organization: one(organizations, {
    fields: [vendorOrganizationTiers.organizationId],
    references: [organizations.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  organization: one(organizations, {
    fields: [tickets.organizationId],
    references: [organizations.id],
  }),
  reporter: one(users, {
    fields: [tickets.reporterId],
    references: [users.id],
    relationName: "reporter",
  }),
  assignee: one(users, {
    fields: [tickets.assigneeId],
    references: [users.id],
    relationName: "assignee",
  }),
  maintenanceVendor: one(maintenanceVendors, {
    fields: [tickets.maintenanceVendorId],
    references: [maintenanceVendors.id],
  }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  role: z.enum(["root", "org_admin", "maintenance_admin", "technician", "org_subadmin"]),
});

export const insertSubAdminSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  role: true,
}).extend({
  permissions: z.array(z.enum(["place_ticket", "accept_ticket"])).min(1),
  vendorTiers: z.array(z.enum(["tier_1", "tier_2", "tier_3"])).optional(),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateOrganizationSchema = insertOrganizationSchema.partial();

export const insertMaintenanceVendorSchema = createInsertSchema(maintenanceVendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  assignedOrganizations: z.array(z.number()).optional(),
});

export const updateMaintenanceVendorSchema = insertMaintenanceVendorSchema.partial();

export const resetAdminPasswordSchema = z.object({
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertVendorOrganizationTierSchema = createInsertSchema(vendorOrganizationTiers).omit({
  id: true,
  createdAt: true,
}).extend({
  tier: z.enum(["tier_1", "tier_2", "tier_3"]),
});

export const updateVendorOrganizationTierSchema = z.object({
  tier: z.enum(["tier_1", "tier_2", "tier_3"]).optional(),
  isActive: z.boolean().optional(),
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  ticketNumber: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["pending", "accepted", "rejected", "in-progress", "completed"]).default("pending"),
});

export const updateTicketSchema = insertTicketSchema.partial().extend({
  id: z.number(),
});

export const acceptTicketSchema = z.object({
  maintenanceVendorId: z.number().optional(),
  assigneeId: z.number().optional(),
});

export const rejectTicketSchema = z.object({
  rejectionReason: z.string().min(1, "Rejection reason is required"),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSubAdmin = z.infer<typeof insertSubAdminSchema>;
export type User = typeof users.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type UpdateOrganization = z.infer<typeof updateOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;
export type InsertMaintenanceVendor = z.infer<typeof insertMaintenanceVendorSchema>;
export type UpdateMaintenanceVendor = z.infer<typeof updateMaintenanceVendorSchema>;
export type MaintenanceVendor = typeof maintenanceVendors.$inferSelect;
export type ResetAdminPassword = z.infer<typeof resetAdminPasswordSchema>;
export type InsertVendorOrganizationTier = z.infer<typeof insertVendorOrganizationTierSchema>;
export type UpdateVendorOrganizationTier = z.infer<typeof updateVendorOrganizationTierSchema>;
export type VendorOrganizationTier = typeof vendorOrganizationTiers.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type UpdateTicket = z.infer<typeof updateTicketSchema>;
export type AcceptTicket = z.infer<typeof acceptTicketSchema>;
export type RejectTicket = z.infer<typeof rejectTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
