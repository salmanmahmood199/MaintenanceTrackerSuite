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
  role: text("role").notNull(), // 'root', 'org_admin', 'maintenance_admin', 'technician'
  organizationId: integer("organization_id"),
  maintenanceVendorId: integer("maintenance_vendor_id"),
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

// Updated tickets table with organization and vendor references
export const tickets = pgTable("tickets", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(),
  status: text("status").notNull().default("open"),
  organizationId: integer("organization_id").notNull(),
  reporterId: integer("reporter_id").notNull(),
  assigneeId: integer("assignee_id"),
  maintenanceVendorId: integer("maintenance_vendor_id"),
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
  role: z.enum(["root", "org_admin", "maintenance_admin", "technician"]),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMaintenanceVendorSchema = createInsertSchema(maintenanceVendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  priority: z.enum(["low", "medium", "high"]),
  status: z.enum(["open", "in-progress", "completed"]).default("open"),
});

export const updateTicketSchema = insertTicketSchema.partial().extend({
  id: z.number(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;
export type Organization = typeof organizations.$inferSelect;
export type InsertMaintenanceVendor = z.infer<typeof insertMaintenanceVendorSchema>;
export type MaintenanceVendor = typeof maintenanceVendors.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type UpdateTicket = z.infer<typeof updateTicketSchema>;
export type Ticket = typeof tickets.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
