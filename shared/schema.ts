import { pgTable, text, serial, integer, boolean, timestamp, varchar, uuid, jsonb, decimal, numeric, index, date, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import type { Request } from "express";

// Users table with role-based hierarchy
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: text("password").notNull(),
  firstName: varchar("first_name", { length: 100 }),
  lastName: varchar("last_name", { length: 100 }),
  phone: varchar("phone", { length: 15 }).unique(),
  role: text("role").notNull(), // 'root', 'org_admin', 'maintenance_admin', 'technician', 'org_subadmin', 'residential'
  organizationId: integer("organization_id"),
  maintenanceVendorId: integer("maintenance_vendor_id"),
  // Residential user fields
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 50 }),
  zipCode: varchar("zip_code", { length: 10 }),
  permissions: text("permissions").array(), // ["place_ticket", "accept_ticket", "view_invoices", "pay_invoices"]
  vendorTiers: text("vendor_tiers").array(), // ["tier_1", "tier_2", "tier_3", "marketplace"] - what tiers they can assign
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
  phone: varchar("phone", { length: 15 }).unique(),
  email: varchar("email", { length: 255 }).unique(),
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
  phone: varchar("phone", { length: 15 }).unique(),
  email: varchar("email", { length: 255 }).unique(),
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
  tier: text("tier").notNull().default("tier_1"), // "tier_1", "tier_2", "tier_3", "marketplace"
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
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, in-progress, completed, return_needed, pending_confirmation, confirmed, marketplace, ready_for_billing, force_closed, billed
  organizationId: integer("organization_id"), // Optional for residential users
  reporterId: integer("reporter_id").notNull(),
  assigneeId: integer("assignee_id"),
  assignedAt: timestamp("assigned_at"), // When ticket was assigned to technician
  maintenanceVendorId: integer("maintenance_vendor_id"),
  locationId: integer("location_id"),
  // Residential user address fields (when organizationId is null)
  residentialAddress: text("residential_address"),
  residentialCity: varchar("residential_city", { length: 100 }),
  residentialState: varchar("residential_state", { length: 50 }),
  residentialZip: varchar("residential_zip", { length: 10 }),
  rejectionReason: text("rejection_reason"),
  completedAt: timestamp("completed_at"),
  confirmedAt: timestamp("confirmed_at"),
  confirmationFeedback: text("confirmation_feedback"),
  rejectionFeedback: text("rejection_feedback"),
  forceClosedAt: timestamp("force_closed_at"),
  forceClosedBy: integer("force_closed_by"),
  forceCloseReason: text("force_close_reason"),
  images: text("images").array(),
  // ETA and scheduling fields
  estimatedStartDate: date("estimated_start_date"), // When work is expected to begin
  estimatedEndDate: date("estimated_end_date"), // When work is expected to complete
  estimatedDuration: integer("estimated_duration"), // Duration in minutes
  scheduledStartTime: timestamp("scheduled_start_time"), // Specific scheduled start time
  scheduledEndTime: timestamp("scheduled_end_time"), // Specific scheduled end time
  etaProvidedAt: timestamp("eta_provided_at"), // When ETA was set
  etaProvidedBy: integer("eta_provided_by"), // Who provided the ETA
  etaNotes: text("eta_notes"), // Additional notes about timing
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Ticket milestones table for tracking progress
export const ticketMilestones = pgTable("ticket_milestones", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => tickets.id, { onDelete: "cascade" }).notNull(),
  milestoneType: varchar("milestone_type", { length: 50 }).notNull(),
  milestoneTitle: varchar("milestone_title", { length: 200 }).notNull(),
  milestoneDescription: text("milestone_description"),
  achievedAt: timestamp("achieved_at").defaultNow().notNull(),
  achievedById: integer("achieved_by_id").references(() => users.id),
  achievedByName: varchar("achieved_by_name", { length: 200 }),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Work orders table for technician work tracking
export const workOrders = pgTable("work_orders", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id, { onDelete: "cascade" }),
  workOrderNumber: integer("work_order_number").notNull(), // 1, 2, 3, etc. for this ticket
  technicianId: integer("technician_id").notNull().references(() => users.id),
  technicianName: text("technician_name").notNull(),
  workDescription: text("work_description").notNull(),
  completionStatus: text("completion_status", { enum: ["completed", "return_needed"] }).notNull(),
  completionNotes: text("completion_notes").notNull(),
  parts: jsonb("parts").default('[]'), // Array of {name, quantity, cost}
  otherCharges: jsonb("other_charges").default('[]'), // Array of {description, cost}
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }).default('0.00'),
  images: text("images").array().default([]), // Array of image paths
  // Time tracking fields
  workDate: varchar("work_date", { length: 10 }).notNull(), // Date of work (YYYY-MM-DD)
  timeIn: varchar("time_in", { length: 8 }), // Time started work (HH:MM:SS)
  timeOut: varchar("time_out", { length: 8 }), // Time finished work (HH:MM:SS)
  totalHours: decimal("total_hours", { precision: 4, scale: 2 }), // Calculated hours worked
  // Manager signature fields
  managerName: text("manager_name"), // Manager who verified work
  managerSignature: text("manager_signature"), // Base64 signature or signature path
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  ticketId: integer("ticket_id").notNull().references(() => tickets.id),
  maintenanceVendorId: integer("maintenance_vendor_id").notNull().references(() => maintenanceVendors.id),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  locationId: integer("location_id").references(() => locations.id), // Add location reference from original ticket
  subtotal: text("subtotal").notNull(),
  tax: text("tax").notNull().default("0"),
  total: text("total").notNull(),
  status: text("status").notNull().default("draft"), // draft, sent, paid
  paymentMethod: text("payment_method"), // credit_card, ach, external
  paymentType: text("payment_type"), // For external payments: check, other
  checkNumber: text("check_number"), // For check payments
  stripePaymentIntentId: text("stripe_payment_intent_id"), // For Stripe payments
  workOrderIds: integer("work_order_ids").array().notNull(),
  additionalItems: text("additional_items"), // JSON string for extra items
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  sentAt: timestamp("sent_at"),
  paidAt: timestamp("paid_at"),
});

// Session storage table for authentication
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: text("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// Locations table
export const locations = pgTable("locations", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  streetAddress: text("street_address").notNull().default('Address not specified'),
  streetAddress2: text("street_address_2"), // Optional secondary address line
  city: varchar("city", { length: 100 }).notNull().default('City not specified'),
  state: varchar("state", { length: 50 }).notNull().default('State not specified'),
  zipCode: varchar("zip_code", { length: 20 }).notNull().default('ZIP not specified'),
  address: text("address"), // Keep for backward compatibility, will be auto-generated
  description: text("description"),
  organizationId: integer("organization_id").notNull().references(() => organizations.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User location assignments table
export const userLocationAssignments = pgTable("user_location_assignments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  locationId: integer("location_id").notNull().references(() => locations.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Ticket comments/notes table
export const ticketComments = pgTable("ticket_comments", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => tickets.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  images: text("images").array(),
  isSystemGenerated: boolean("is_system_generated").default(false),
  isSystem: boolean("is_system").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Marketplace bids table
export const marketplaceBids = pgTable("marketplace_bids", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => tickets.id).notNull(),
  vendorId: integer("vendor_id").references(() => maintenanceVendors.id).notNull(),
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }).notNull(),
  estimatedHours: decimal("estimated_hours", { precision: 5, scale: 2 }).notNull(),
  responseTime: varchar("response_time", { length: 100 }),
  parts: jsonb("parts").default([]),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  additionalNotes: text("additional_notes"),
  status: varchar("status", { length: 20 }).default("pending").notNull(),
  rejectionReason: text("rejection_reason"),
  counterOffer: decimal("counter_offer", { precision: 10, scale: 2 }),
  counterNotes: text("counter_notes"),
  approved: boolean("approved").default(false).notNull(),
  // Bid versioning fields
  isSuperseded: boolean("is_superseded").default(false).notNull(),
  supersededByBidId: integer("superseded_by_bid_id").references(() => marketplaceBids.id),
  previousBidId: integer("previous_bid_id").references(() => marketplaceBids.id),
  version: integer("version").default(1).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Vendor assignment history table - tracks all vendor assignments and rejections
export const vendorAssignmentHistory = pgTable("vendor_assignment_history", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").references(() => tickets.id).notNull(),
  vendorId: integer("vendor_id").references(() => maintenanceVendors.id).notNull(),
  vendorName: varchar("vendor_name", { length: 255 }).notNull(),
  assignedById: integer("assigned_by_id").references(() => users.id).notNull(),
  assignedByName: varchar("assigned_by_name", { length: 255 }).notNull(),
  assignmentType: varchar("assignment_type", { length: 50 }).notNull(), // 'initial', 'reassignment', 'marketplace'
  status: varchar("status", { length: 50 }).notNull(), // 'assigned', 'accepted', 'rejected'
  rejectionReason: text("rejection_reason"),
  rejectedAt: timestamp("rejected_at"),
  rejectedById: integer("rejected_by_id").references(() => users.id),
  rejectedByName: varchar("rejected_by_name", { length: 255 }),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(), // true for current assignment, false for historical
  createdAt: timestamp("created_at").defaultNow().notNull(),
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
  locationAssignments: many(userLocationAssignments),
}));

export const locationsRelations = relations(locations, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [locations.organizationId],
    references: [organizations.id],
  }),
  userAssignments: many(userLocationAssignments),
}));

export const userLocationAssignmentsRelations = relations(userLocationAssignments, ({ one }) => ({
  user: one(users, {
    fields: [userLocationAssignments.userId],
    references: [users.id],
  }),
  location: one(locations, {
    fields: [userLocationAssignments.locationId],
    references: [locations.id],
  }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  tickets: many(tickets),
  locations: many(locations),
}));

export const maintenanceVendorsRelations = relations(maintenanceVendors, ({ many }) => ({
  technicians: many(users),
  tickets: many(tickets),
  vendorOrganizationTiers: many(vendorOrganizationTiers),
  marketplaceBids: many(marketplaceBids),
  vendorAssignmentHistory: many(vendorAssignmentHistory),
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

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
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
  location: one(locations, {
    fields: [tickets.locationId],
    references: [locations.id],
  }),
  workOrders: many(workOrders),
  marketplaceBids: many(marketplaceBids),
  vendorAssignmentHistory: many(vendorAssignmentHistory),
}));

export const marketplaceBidsRelations = relations(marketplaceBids, ({ one }) => ({
  ticket: one(tickets, {
    fields: [marketplaceBids.ticketId],
    references: [tickets.id],
  }),
  vendor: one(maintenanceVendors, {
    fields: [marketplaceBids.vendorId],
    references: [maintenanceVendors.id],
  }),
}));

export const vendorAssignmentHistoryRelations = relations(vendorAssignmentHistory, ({ one }) => ({
  ticket: one(tickets, {
    fields: [vendorAssignmentHistory.ticketId],
    references: [tickets.id],
  }),
  vendor: one(maintenanceVendors, {
    fields: [vendorAssignmentHistory.vendorId],
    references: [maintenanceVendors.id],
  }),
  assignedBy: one(users, {
    fields: [vendorAssignmentHistory.assignedById],
    references: [users.id],
    relationName: "assignedBy",
  }),
  rejectedBy: one(users, {
    fields: [vendorAssignmentHistory.rejectedById],
    references: [users.id],
    relationName: "rejectedBy",
  }),
}));

// Bid history for tracking counter offer exchanges
export const bidHistory = pgTable("bid_history", {
  id: serial("id").primaryKey(),
  bidId: integer("bid_id").references(() => marketplaceBids.id).notNull(),
  fromUserId: integer("from_user_id").references(() => users.id).notNull(),
  fromUserType: text("from_user_type").notNull(), // "vendor", "organization"
  action: text("action").notNull(), // "initial_bid", "counter_offer", "accept", "reject", "recounter"
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workOrdersRelations = relations(workOrders, ({ one }) => ({
  ticket: one(tickets, {
    fields: [workOrders.ticketId],
    references: [tickets.id],
  }),
  technician: one(users, {
    fields: [workOrders.technicianId],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  ticket: one(tickets, {
    fields: [invoices.ticketId],
    references: [tickets.id],
  }),
  maintenanceVendor: one(maintenanceVendors, {
    fields: [invoices.maintenanceVendorId],
    references: [maintenanceVendors.id],
  }),
  organization: one(organizations, {
    fields: [invoices.organizationId],
    references: [organizations.id],
  }),
}));

// Parts management for maintenance vendors
export const parts = pgTable("parts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  currentCost: numeric("current_cost", { precision: 10, scale: 2 }).notNull(),
  markupPercentage: numeric("markup_percentage", { precision: 5, scale: 2 }).notNull().default("20.00"),
  roundToNinteyNine: boolean("round_to_nintey_nine").notNull().default(false),
  vendorId: integer("vendor_id").notNull().references(() => maintenanceVendors.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Price history tracking for parts
export const partPriceHistory = pgTable("part_price_history", {
  id: serial("id").primaryKey(),
  partId: integer("part_id").notNull().references(() => parts.id, { onDelete: "cascade" }),
  oldPrice: numeric("old_price", { precision: 10, scale: 2 }).notNull(),
  newPrice: numeric("new_price", { precision: 10, scale: 2 }).notNull(),
  markupPercentage: numeric("markup_percentage", { precision: 5, scale: 2 }).notNull(),
  roundToNinteyNine: boolean("round_to_nintey_nine").notNull().default(false),
  changedAt: timestamp("changed_at").defaultNow(),
  changedBy: integer("changed_by").notNull().references(() => users.id),
});

export const partsRelations = relations(parts, ({ one, many }) => ({
  vendor: one(maintenanceVendors, {
    fields: [parts.vendorId],
    references: [maintenanceVendors.id],
  }),
  priceHistory: many(partPriceHistory),
}));

export const partPriceHistoryRelations = relations(partPriceHistory, ({ one }) => ({
  part: one(parts, {
    fields: [partPriceHistory.partId],
    references: [parts.id],
  }),
  changedByUser: one(users, {
    fields: [partPriceHistory.changedBy],
    references: [users.id],
  }),
}));

// Calendar events table for universal scheduling
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventType: varchar("event_type", { length: 50 }).notNull(), // 'availability', 'work_assignment', 'meeting', 'maintenance', 'personal'
  startDate: date("start_date").notNull(),
  startTime: time("start_time"),
  endDate: date("end_date").notNull(), 
  endTime: time("end_time"),
  isAllDay: boolean("is_all_day").default(false).notNull(),
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurrencePattern: text("recurrence_pattern"), // JSON: {"type": "weekly", "days": ["monday", "tuesday"], "endDate": "2025-12-31"}
  location: varchar("location", { length: 255 }),
  attendees: text("attendees").array(), // Array of user IDs as strings
  priority: varchar("priority", { length: 20 }).default("medium").notNull(), // 'low', 'medium', 'high'
  status: varchar("status", { length: 20 }).default("confirmed").notNull(), // 'confirmed', 'tentative', 'cancelled'
  relatedTicketId: integer("related_ticket_id"), // Link to ticket if it's a work assignment
  color: varchar("color", { length: 7 }).default("#3B82F6"), // Hex color for calendar display
  isAvailability: boolean("is_availability").default(false).notNull(), // Special flag for availability blocks
  timezone: varchar("timezone", { length: 50 }).default("America/New_York"), // Timezone for the event
  availabilityDays: text("availability_days").array(), // Days available for recurring availability ["monday", "tuesday", etc.]
  availabilityStartTime: time("availability_start_time"), // Start time for availability blocks
  availabilityEndTime: time("availability_end_time"), // End time for availability blocks
  googleEventId: text("google_event_id"), // Google Calendar event ID for sync
  syncedToGoogle: boolean("synced_to_google").default(false),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Google Calendar integration table
export const googleCalendarIntegrations = pgTable("google_calendar_integrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull().unique(),
  googleAccountEmail: text("google_account_email").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  tokenExpiresAt: timestamp("token_expires_at").notNull(),
  calendarId: text("calendar_id").notNull(), // Primary calendar ID
  syncEnabled: boolean("sync_enabled").default(true),
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Event exceptions table for handling deleted instances of recurring events
export const eventExceptions = pgTable("event_exceptions", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => calendarEvents.id, { onDelete: "cascade" }),
  exceptionDate: date("exception_date").notNull(), // Date when the recurring event should be skipped
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Availability configuration table - persistent user availability parameters
export const availabilityConfigs = pgTable("availability_configs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  timezone: varchar("timezone", { length: 50 }).notNull().default("America/New_York"),
  // JSON object storing availability for each day: {"monday": [{"start": "08:00", "end": "12:00"}, {"start": "13:00", "end": "17:00"}], "tuesday": [...]}
  weeklySchedule: text("weekly_schedule").notNull(), 
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const calendarEventsRelations = relations(calendarEvents, ({ one, many }) => ({
  user: one(users, {
    fields: [calendarEvents.userId],
    references: [users.id],
  }),
  exceptions: many(eventExceptions),
}));

export const googleCalendarIntegrationsRelations = relations(googleCalendarIntegrations, ({ one }) => ({
  user: one(users, {
    fields: [googleCalendarIntegrations.userId],
    references: [users.id],
  }),
}));

export const eventExceptionsRelations = relations(eventExceptions, ({ one }) => ({
  event: one(calendarEvents, {
    fields: [eventExceptions.eventId],
    references: [calendarEvents.id],
  }),
}));

export const availabilityConfigsRelations = relations(availabilityConfigs, ({ one }) => ({
  user: one(users, {
    fields: [availabilityConfigs.userId],
    references: [users.id],
  }),
}));

// Update maintenance vendors relations to include parts
export const maintenanceVendorsRelationsExtended = relations(maintenanceVendors, ({ many }) => ({
  technicians: many(users),
  tickets: many(tickets),
  vendorOrganizationTiers: many(vendorOrganizationTiers),
  marketplaceBids: many(marketplaceBids),
  parts: many(parts),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  role: z.enum(["root", "org_admin", "maintenance_admin", "technician", "org_subadmin"]),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits").optional(),
});

export const insertSubAdminSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  role: true,
}).extend({
  permissions: z.array(z.enum(["place_ticket", "accept_ticket", "view_invoices", "pay_invoices"])).min(1),
  vendorTiers: z.array(z.enum(["tier_1", "tier_2", "tier_3", "marketplace"])).optional(),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits").optional(),
});

export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().email("Please enter a valid email address").optional(),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits").optional(),
});

export const updateOrganizationSchema = insertOrganizationSchema.partial();

export const insertMaintenanceVendorSchema = createInsertSchema(maintenanceVendors).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  assignedOrganizations: z.array(z.number()).optional(),
  email: z.string().email("Please enter a valid email address").optional(),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits").optional(),
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
  status: z.enum(["pending", "accepted", "rejected", "in-progress", "completed", "return_needed", "pending_confirmation", "confirmed", "marketplace", "ready_for_billing", "force_closed", "billed"]).default("pending"),
});

export const updateTicketSchema = insertTicketSchema.partial().extend({
  id: z.number(),
  status: z.enum(["pending", "accepted", "rejected", "in-progress", "completed", "return_needed", "pending_confirmation", "confirmed", "marketplace", "ready_for_billing", "force_closed", "billed"]).optional(),
  assignedAt: z.date().optional(),
});

export const insertTicketMilestoneSchema = createInsertSchema(ticketMilestones).omit({
  id: true,
  createdAt: true,
});

export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  workOrderNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  sentAt: true,
  paidAt: true,
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  address: true, // Auto-generated from separate fields
}).extend({
  streetAddress: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(1, "ZIP code is required"),
  streetAddress2: z.string().optional(),
});

export const updateLocationSchema = insertLocationSchema.partial();

export const insertUserLocationAssignmentSchema = createInsertSchema(userLocationAssignments).omit({
  id: true,
  createdAt: true,
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

export const insertResidentialUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zipCode: z.string().min(5, "ZIP code is required"),
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
export type InsertTicketMilestone = z.infer<typeof insertTicketMilestoneSchema>;
export type TicketMilestone = typeof ticketMilestones.$inferSelect;
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type UpdateLocation = z.infer<typeof updateLocationSchema>;
export type Location = typeof locations.$inferSelect;
export type InsertUserLocationAssignment = z.infer<typeof insertUserLocationAssignmentSchema>;
export type UserLocationAssignment = typeof userLocationAssignments.$inferSelect;
export type LoginData = z.infer<typeof loginSchema>;
export type InsertResidentialUser = z.infer<typeof insertResidentialUserSchema>;

// Ticket comment types
export type TicketComment = typeof ticketComments.$inferSelect;
export type InsertTicketComment = typeof ticketComments.$inferInsert;

export type MarketplaceBid = typeof marketplaceBids.$inferSelect;
export type InsertMarketplaceBid = typeof marketplaceBids.$inferInsert;

// Bid history types
export type BidHistory = typeof bidHistory.$inferSelect;
export type InsertBidHistory = typeof bidHistory.$inferInsert;

// Vendor assignment history types
export type VendorAssignmentHistory = typeof vendorAssignmentHistory.$inferSelect;
export type InsertVendorAssignmentHistory = typeof vendorAssignmentHistory.$inferInsert;

export type Part = typeof parts.$inferSelect;
export type InsertPart = typeof parts.$inferInsert;
export type PartPriceHistory = typeof partPriceHistory.$inferSelect;
export type InsertPartPriceHistory = typeof partPriceHistory.$inferInsert;

export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = typeof calendarEvents.$inferInsert;

export type GoogleCalendarIntegration = typeof googleCalendarIntegrations.$inferSelect;
export type InsertGoogleCalendarIntegration = z.infer<typeof insertGoogleCalendarIntegrationSchema>;

export type AvailabilityConfig = typeof availabilityConfigs.$inferSelect;
export type InsertAvailabilityConfig = typeof availabilityConfigs.$inferInsert;

export const insertMarketplaceBidSchema = createInsertSchema(marketplaceBids).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBidHistorySchema = createInsertSchema(bidHistory).omit({
  id: true,
  createdAt: true,
});

export const insertVendorAssignmentHistorySchema = createInsertSchema(vendorAssignmentHistory).omit({
  id: true,
  createdAt: true,
});

export const insertTicketCommentSchema = createInsertSchema(ticketComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAvailabilityConfigSchema = createInsertSchema(availabilityConfigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  weeklySchedule: z.string().refine((val) => {
    try {
      const schedule = JSON.parse(val);
      return typeof schedule === 'object' && schedule !== null;
    } catch {
      return false;
    }
  }, "Weekly schedule must be valid JSON"),
  timezone: z.string().default("America/New_York"),
});

export const updateAvailabilityConfigSchema = insertAvailabilityConfigSchema.partial().extend({
  id: z.number(),
});

export const insertGoogleCalendarIntegrationSchema = createInsertSchema(googleCalendarIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  eventType: z.enum(["availability", "work_assignment", "meeting", "maintenance", "personal"]),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  status: z.enum(["confirmed", "tentative", "cancelled"]).default("confirmed"),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  timezone: z.string().default("America/New_York"),
  availabilityDays: z.array(z.string()).optional(),
  availabilityStartTime: z.string().optional(),
  availabilityEndTime: z.string().optional(),
});

export const updateCalendarEventSchema = insertCalendarEventSchema.partial().extend({
  id: z.number(),
});

// Express request with authenticated user
export interface AuthenticatedRequest extends Request {
  user?: User;
}
