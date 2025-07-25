import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertTicketSchema, 
  updateTicketSchema, 
  loginSchema,
  insertOrganizationSchema,
  insertMaintenanceVendorSchema,
  insertUserSchema,
  insertSubAdminSchema,
  insertWorkOrderSchema,
  insertInvoiceSchema,
  insertLocationSchema,
  insertTicketCommentSchema,
  insertMarketplaceBidSchema,
  type Ticket,
  type User,
  type AuthenticatedRequest,
} from "@shared/schema";
import { getSessionConfig, authenticateUser, requireRole, requireOrganization } from "./auth";
import { processUserQuery } from "./gemini";
import { googleCalendarService } from "./google-calendar";
import multer from "multer";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";
import { db } from "./db";
import { and, eq, desc, inArray } from "drizzle-orm";
import { invoices, tickets } from "@shared/schema";

// Configure multer for image uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) => {
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB to accommodate videos
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize session middleware
  app.use(getSessionConfig());
  
  // Initialize root user
  await storage.initializeRootUser();
  
  // Serve uploaded images
  app.use('/uploads', express.static(uploadDir));

  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.verifyUser(email, password);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      req.session.userId = user.id;
      res.json({ 
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId,
          maintenanceVendorId: user.maintenanceVendorId
        }
      });
    } catch (error: any) {
      res.status(400).json({ message: 'Invalid login data' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out' });
      }
      res.redirect('/');
    });
  });

  app.get('/api/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: 'Could not log out' });
      }
      res.redirect('/');
    });
  });

  app.get('/api/auth/user', authenticateUser, (req, res) => {
    res.json({
      id: req.user!.id,
      email: req.user!.email,
      firstName: req.user!.firstName,
      lastName: req.user!.lastName,
      role: req.user!.role,
      organizationId: req.user!.organizationId,
      maintenanceVendorId: req.user!.maintenanceVendorId,
      permissions: req.user!.permissions,
      vendorTiers: req.user!.vendorTiers
    });
  });

  // AI Assistant route
  app.post('/api/ai/query', authenticateUser, processUserQuery);

  // Root admin routes for managing organizations and vendors
  app.get('/api/organizations', authenticateUser, requireRole(['root', 'org_admin', 'org_subadmin', 'maintenance_admin']), async (req, res) => {
    try {
      // If user is org_admin or org_subadmin, only return their organization
      if (req.user!.role === 'org_admin' || req.user!.role === 'org_subadmin') {
        const organization = await storage.getOrganization(req.user!.organizationId!);
        res.json(organization ? [organization] : []);
      } else if (req.user!.role === 'maintenance_admin') {
        // Maintenance admin gets all organizations (needed for invoice creation)
        const organizations = await storage.getOrganizations();
        res.json(organizations);
      } else {
        // Root user gets all organizations
        const organizations = await storage.getOrganizations();
        res.json(organizations);
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch organizations' });
    }
  });

  app.post('/api/organizations', authenticateUser, requireRole(['root']), async (req, res) => {
    try {
      const orgData = insertOrganizationSchema.parse(req.body);
      const organization = await storage.createOrganization(orgData);
      res.status(201).json(organization);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Invalid organization data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create organization' });
      }
    }
  });

  app.patch('/api/organizations/:id', authenticateUser, requireRole(['root']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const organization = await storage.updateOrganization(id, updates);
      if (!organization) {
        return res.status(404).json({ message: 'Organization not found' });
      }
      res.json(organization);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update organization' });
    }
  });

  app.post('/api/organizations/:id/reset-admin-password', authenticateUser, requireRole(['root']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }
      
      const result = await storage.resetOrganizationAdminPassword(id, newPassword);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Failed to reset organization admin password' });
    }
  });

  app.delete('/api/organizations/:id', authenticateUser, requireRole(['root']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteOrganization(id);
      if (!success) {
        return res.status(404).json({ message: 'Organization not found' });
      }
      res.json({ message: 'Organization deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete organization' });
    }
  });

  app.get('/api/maintenance-vendors', authenticateUser, requireRole(['root', 'maintenance_admin']), async (req, res) => {
    try {
      // If user is maintenance_admin, only return their vendor
      if (req.user!.role === 'maintenance_admin') {
        const vendor = await storage.getMaintenanceVendor(req.user!.maintenanceVendorId!);
        res.json(vendor ? [vendor] : []);
      } else {
        // Root user gets all vendors
        const vendors = await storage.getMaintenanceVendors();
        res.json(vendors);
      }
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch maintenance vendors' });
    }
  });

  app.post('/api/maintenance-vendors', authenticateUser, requireRole(['root']), async (req, res) => {
    try {
      const vendorData = insertMaintenanceVendorSchema.parse(req.body);
      const { assignedOrganizations, ...vendorInfo } = vendorData;
      
      const vendor = await storage.createMaintenanceVendor(vendorInfo);
      
      // Assign vendor to organizations if specified
      if (assignedOrganizations && assignedOrganizations.length > 0) {
        for (const orgId of assignedOrganizations) {
          await storage.assignVendorToOrganization(vendor.id, orgId, "tier_1");
        }
      }
      
      res.status(201).json(vendor);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Invalid vendor data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create maintenance vendor' });
      }
    }
  });

  app.patch('/api/maintenance-vendors/:id', authenticateUser, requireRole(['root']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const { assignedOrganizations, hasMarketplaceAccess, ...vendorUpdates } = updates;
      
      // Filter out undefined/null values and validate data
      const cleanUpdates = Object.fromEntries(
        Object.entries(vendorUpdates).filter(([_, value]) => value !== undefined && value !== null)
      );
      
      const vendor = await storage.updateMaintenanceVendor(id, cleanUpdates);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }
      
      // Handle organization assignments if provided
      if (assignedOrganizations !== undefined) {
        // First, remove all existing assignments for this vendor
        await storage.clearVendorOrganizationAssignments(id);
        
        // Then add the new assignments
        if (assignedOrganizations && assignedOrganizations.length > 0) {
          for (const orgId of assignedOrganizations) {
            await storage.assignVendorToOrganization(id, orgId, "tier_1");
          }
        }
        
        // Handle marketplace access separately - marketplace needs an organization context
        if (hasMarketplaceAccess && assignedOrganizations.length > 0) {
          // Add marketplace tier for each assigned organization
          for (const orgId of assignedOrganizations) {
            await storage.assignVendorToOrganization(id, orgId, "marketplace");
          }
        }
      }
      
      res.json(vendor);
    } catch (error) {
      console.error('Vendor update error:', error);
      res.status(500).json({ message: 'Failed to update vendor' });
    }
  });

  app.post('/api/maintenance-vendors/:id/reset-admin-password', authenticateUser, requireRole(['root']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { newPassword } = req.body;
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: 'Password must be at least 6 characters long' });
      }
      
      const result = await storage.resetVendorAdminPassword(id, newPassword);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Failed to reset vendor admin password' });
    }
  });

  app.get('/api/maintenance-vendors/:id/organizations', authenticateUser, requireRole(['root']), async (req, res) => {
    try {
      const vendorId = parseInt(req.params.id);
      const assignments = await storage.getVendorOrganizationAssignments(vendorId);
      res.json(assignments);
    } catch (error) {
      console.error('Error fetching vendor organization assignments:', error);
      res.status(500).json({ message: 'Failed to fetch vendor organization assignments' });
    }
  });

  app.delete('/api/maintenance-vendors/:id', authenticateUser, requireRole(['root']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMaintenanceVendor(id);
      if (!success) {
        return res.status(404).json({ message: 'Vendor not found' });
      }
      res.json({ message: 'Vendor deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete vendor' });
    }
  });

  app.post('/api/maintenance-vendors/:id/reset-admin-password', authenticateUser, requireRole(['root']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { newPassword } = req.body;
      const result = await storage.resetVendorAdminPassword(id, newPassword);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Failed to reset admin password' });
    }
  });

  // Sub-admin management routes
  app.get('/api/organizations/:organizationId/sub-admins', authenticateUser, requireRole(['root', 'org_admin', 'org_subadmin']), async (req, res) => {
    try {
      const organizationId = parseInt(req.params.organizationId);
      
      // If user is org_admin or org_subadmin, ensure they can only access their own organization
      if ((req.user!.role === 'org_admin' || req.user!.role === 'org_subadmin') && req.user!.organizationId !== organizationId) {
        return res.status(403).json({ message: 'Access denied to this organization' });
      }
      
      const subAdmins = await storage.getSubAdmins(organizationId);
      res.json(subAdmins);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch sub-admins' });
    }
  });

  app.post('/api/organizations/:organizationId/sub-admins', authenticateUser, requireRole(['root', 'org_admin']), async (req, res) => {
    try {
      const organizationId = parseInt(req.params.organizationId);
      
      // If user is org_admin, ensure they can only create sub-admins for their own organization
      if (req.user!.role === 'org_admin' && req.user!.organizationId !== organizationId) {
        return res.status(403).json({ message: 'Access denied to this organization' });
      }
      
      const subAdmin = await storage.createSubAdmin(req.body, organizationId);
      res.status(201).json(subAdmin);
    } catch (error) {
      res.status(500).json({ message: 'Failed to create sub-admin' });
    }
  });

  app.put('/api/sub-admins/:id', authenticateUser, requireRole(['root', 'org_admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      // Validate the input using partial sub-admin schema
      const editSubAdminSchema = insertSubAdminSchema.omit({ password: true }).partial();
      const result = editSubAdminSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }
      
      const subAdmin = await storage.updateSubAdmin(id, result.data);
      if (!subAdmin) {
        return res.status(404).json({ message: 'Sub-admin not found' });
      }
      res.json(subAdmin);
    } catch (error) {
      console.error("Error updating sub-admin:", error);
      res.status(500).json({ message: 'Failed to update sub-admin' });
    }
  });

  app.delete('/api/sub-admins/:id', authenticateUser, requireRole(['root', 'org_admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteSubAdmin(id);
      if (!success) {
        return res.status(404).json({ message: 'Sub-admin not found' });
      }
      res.json({ message: 'Sub-admin deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete sub-admin' });
    }
  });

  app.post('/api/sub-admins/:id/reset-password', authenticateUser, requireRole(['root', 'org_admin']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const newPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const user = await storage.updateSubAdmin(id, { password: hashedPassword });
      if (!user) {
        return res.status(404).json({ message: 'Sub-admin not found' });
      }
      
      res.json({ newPassword });
    } catch (error) {
      res.status(500).json({ message: 'Failed to reset password' });
    }
  });

  // Vendor-Organization tier management routes
  app.post('/api/organizations/:organizationId/vendors/:vendorId/tier', authenticateUser, requireRole(['root', 'org_admin']), async (req, res) => {
    try {
      const organizationId = parseInt(req.params.organizationId);
      const vendorId = parseInt(req.params.vendorId);
      const { tier } = req.body;
      
      await storage.assignVendorToOrganization(vendorId, organizationId, tier);
      res.json({ message: 'Vendor tier assigned successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to assign vendor tier' });
    }
  });

  app.get('/api/organizations/:organizationId/vendor-tiers', authenticateUser, requireRole(['root', 'org_admin', 'org_subadmin']), async (req, res) => {
    try {
      const organizationId = parseInt(req.params.organizationId);
      
      // Only allow org admins and org_subadmins to see their own organization's vendor tiers
      if ((req.user!.role === 'org_admin' || req.user!.role === 'org_subadmin') && req.user!.organizationId !== organizationId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      const vendorTiers = await storage.getVendorOrganizationTiers(organizationId);
      res.json(vendorTiers);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch vendor tiers' });
    }
  });

  app.patch('/api/organizations/:organizationId/vendors/:vendorId/tier', authenticateUser, requireRole(['root', 'org_admin']), async (req, res) => {
    try {
      const organizationId = parseInt(req.params.organizationId);
      const vendorId = parseInt(req.params.vendorId);
      const { tier, isActive } = req.body;
      
      // Only allow org admins to manage their own organization's vendors
      if (req.user!.role === 'org_admin' && req.user!.organizationId !== organizationId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      await storage.updateVendorOrganizationTier(vendorId, organizationId, { tier, isActive });
      res.json({ message: 'Vendor tier updated successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update vendor tier' });
    }
  });

  // Vendor tier filtering route
  app.get('/api/maintenance-vendors/by-tiers', authenticateUser, async (req, res) => {
    try {
      const tiers = req.query.tiers as string;
      const tierArray = tiers ? tiers.split(',') : [];
      const vendors = await storage.getMaintenanceVendorsByTier(tierArray);
      res.json(vendors);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch vendors by tier' });
    }
  });

  // Organization sub-admin routes
  app.get("/api/organizations/:id/sub-admins", authenticateUser, requireRole(["root", "org_admin"]), async (req, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const subAdmins = await storage.getSubAdmins(organizationId);
      res.json(subAdmins);
    } catch (error) {
      console.error("Error fetching sub-admins:", error);
      res.status(500).json({ message: "Failed to fetch sub-admins" });
    }
  });

  app.post("/api/organizations/:id/sub-admins", authenticateUser, requireRole(["root", "org_admin"]), async (req, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const result = insertSubAdminSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }

      const subAdmin = await storage.createSubAdmin(result.data, organizationId);
      res.json(subAdmin);
    } catch (error) {
      console.error("Error creating sub-admin:", error);
      res.status(500).json({ message: "Failed to create sub-admin" });
    }
  });

  app.put("/api/organizations/:orgId/sub-admins/:id", authenticateUser, requireRole(["root", "org_admin"]), async (req, res) => {
    try {
      const subAdminId = parseInt(req.params.id);
      const result = insertSubAdminSchema.partial().safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ message: "Invalid input", errors: result.error.errors });
      }

      const updatedSubAdmin = await storage.updateSubAdmin(subAdminId, result.data);
      if (!updatedSubAdmin) {
        return res.status(404).json({ message: "Sub-admin not found" });
      }
      
      res.json(updatedSubAdmin);
    } catch (error) {
      console.error("Error updating sub-admin:", error);
      res.status(500).json({ message: "Failed to update sub-admin" });
    }
  });

  app.delete("/api/organizations/:orgId/sub-admins/:id", authenticateUser, requireRole(["root", "org_admin"]), async (req, res) => {
    try {
      const subAdminId = parseInt(req.params.id);
      const deleted = await storage.deleteSubAdmin(subAdminId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Sub-admin not found" });
      }
      
      res.json({ message: "Sub-admin deleted successfully" });
    } catch (error) {
      console.error("Error deleting sub-admin:", error);
      res.status(500).json({ message: "Failed to delete sub-admin" });
    }
  });

  // Users management routes
  app.post('/api/users', authenticateUser, requireRole(['root', 'org_admin', 'maintenance_admin']), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Validation based on current user role
      if (req.user!.role === 'org_admin' && userData.role !== 'org_admin' && userData.organizationId !== req.user!.organizationId) {
        return res.status(403).json({ message: 'Cannot create users outside your organization' });
      }
      
      if (req.user!.role === 'maintenance_admin' && userData.role !== 'technician' && userData.maintenanceVendorId !== req.user!.maintenanceVendorId) {
        return res.status(403).json({ message: 'Cannot create users outside your maintenance vendor' });
      }
      
      const user = await storage.createUser(userData);
      res.status(201).json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        organizationId: user.organizationId,
        maintenanceVendorId: user.maintenanceVendorId
      });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        res.status(400).json({ message: 'Invalid user data', errors: error.errors });
      } else {
        res.status(500).json({ message: 'Failed to create user' });
      }
    }
  });

  // Get all tickets
  app.get("/api/tickets", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const organizationId = req.query.organizationId ? parseInt(req.query.organizationId as string) : undefined;
      const maintenanceVendorId = req.query.maintenanceVendorId ? parseInt(req.query.maintenanceVendorId as string) : undefined;
      const status = req.query.status as string;

      let tickets;

      if (user.role === "root") {
        if (organizationId) {
          tickets = await storage.getTickets(organizationId);
        } else if (maintenanceVendorId) {
          tickets = await storage.getTickets();
          tickets = tickets.filter(ticket => ticket.maintenanceVendorId === maintenanceVendorId);
        } else {
          tickets = await storage.getTickets();
        }
      } else if (user.role === "org_admin") {
        tickets = await storage.getTickets(user.organizationId!);
      } else if (user.role === "org_subadmin") {
        // Get user's assigned locations for filtering
        const userLocations = await storage.getUserLocationAssignments(user.id);
        const locationIds = userLocations.map(loc => loc.id);
        tickets = await storage.getTickets(user.organizationId!, locationIds);
      } else if (user.role === "maintenance_admin") {
        tickets = await storage.getTickets();
        tickets = tickets.filter(ticket => ticket.maintenanceVendorId === user.maintenanceVendorId);
        console.log(`Vendor ${user.maintenanceVendorId} filtering tickets. Found ${tickets.length} tickets:`, 
          tickets.map(t => ({ 
            id: t.id, 
            number: t.ticketNumber, 
            status: t.status, 
            vendorId: t.maintenanceVendorId,
            assigneeId: t.assigneeId 
          })));
      } else if (user.role === "technician") {
        tickets = await storage.getTickets();
        tickets = tickets.filter(ticket => ticket.assigneeId === user.id);
      } else {
        return res.status(403).json({ message: "Unauthorized" });
      }

      if (status) {
        tickets = tickets.filter(ticket => ticket.status === status);
      }
      res.json(tickets);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      res.status(500).json({ message: "Failed to fetch tickets" });
    }
  });

  // Get ticket stats
  app.get("/api/tickets/stats", async (req, res) => {
    try {
      const { organizationId, maintenanceVendorId } = req.query;
      const orgId = organizationId ? parseInt(organizationId as string) : undefined;
      const vendorId = maintenanceVendorId ? parseInt(maintenanceVendorId as string) : undefined;
      
      let stats = await storage.getTicketStats(orgId);
      
      // If filtering by vendor, get all tickets and calculate stats for that vendor
      if (vendorId) {
        const allTickets = await storage.getTickets(orgId);
        const vendorTickets = allTickets.filter(ticket => ticket.maintenanceVendorId === vendorId);
        
        stats = {
          pending: vendorTickets.filter(t => t.status === 'pending').length,
          accepted: vendorTickets.filter(t => t.status === 'accepted').length,
          inProgress: vendorTickets.filter(t => t.status === 'in-progress').length,
          completed: vendorTickets.filter(t => t.status === 'completed').length,
          pendingConfirmation: vendorTickets.filter(t => t.status === 'pending_confirmation').length,
          confirmed: vendorTickets.filter(t => t.status === 'confirmed').length,
          highPriority: vendorTickets.filter(t => t.priority === 'high').length,
        };
      }
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ticket stats" });
    }
  });

  // Create new ticket with image upload
  app.post("/api/tickets", upload.array('images', 5), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const imageUrls = files ? files.map(file => `/uploads/${file.filename}`) : [];
      
      const ticketData = {
        title: req.body.title,
        description: req.body.description,
        priority: req.body.priority,
        status: req.body.status || "open",
        organizationId: parseInt(req.body.organizationId) || 1,
        reporterId: parseInt(req.body.reporterId) || 1,
        locationId: req.body.locationId ? parseInt(req.body.locationId) : null,
        images: imageUrls,
      };
      
      console.log("Received ticket data:", ticketData);
      console.log("Request body locationId:", req.body.locationId);
      
      const validatedData = insertTicketSchema.parse(ticketData);
      const ticket = await storage.createTicket(validatedData);
      
      res.status(201).json(ticket);
    } catch (error: any) {
      console.error("Create ticket error:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid ticket data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create ticket" });
      }
    }
  });

  // Update ticket status
  app.patch("/api/tickets/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = updateTicketSchema.omit({ id: true }).parse(req.body);
      
      const ticket = await storage.updateTicket(id, updates);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json(ticket);
    } catch (error: any) {
      console.error("Update ticket error:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid update data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update ticket" });
      }
    }
  });

  // Get ticket milestones
  app.get("/api/tickets/:id/milestones", authenticateUser, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const milestones = await storage.getTicketMilestones(ticketId);
      res.json(milestones);
    } catch (error) {
      console.error("Error fetching milestones:", error);
      res.status(500).json({ message: "Failed to fetch milestones" });
    }
  });

  // Create ticket milestone
  app.post("/api/tickets/:id/milestones", authenticateUser, async (req: any, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { milestoneType, milestoneDescription } = req.body;
      
      // Find the milestone type to get the title
      const milestoneTypes = [
        { value: "submitted", label: "Ticket Submitted" },
        { value: "reviewed", label: "Under Review" },
        { value: "assigned", label: "Assigned to Vendor" },
        { value: "in_progress", label: "Work Started" },
        { value: "technician_assigned", label: "Technician Assigned" },
        { value: "on_site", label: "Technician On-Site" },
        { value: "diagnosis_complete", label: "Diagnosis Complete" },
        { value: "parts_ordered", label: "Parts Ordered" },
        { value: "repair_started", label: "Repair Started" },
        { value: "testing", label: "Testing & Verification" },
        { value: "completed", label: "Work Completed" },
      ];
      
      const milestoneTypeObj = milestoneTypes.find(m => m.value === milestoneType);
      if (!milestoneTypeObj) {
        return res.status(400).json({ message: "Invalid milestone type" });
      }
      
      const milestone = await storage.createTicketMilestone({
        ticketId,
        milestoneType,
        milestoneTitle: milestoneTypeObj.label,
        milestoneDescription,
        achievedById: req.user.id,
        achievedByName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || req.user.email,
      });
      
      res.json(milestone);
    } catch (error) {
      console.error("Error creating milestone:", error);
      res.status(500).json({ message: "Failed to create milestone" });
    }
  });

  // Accept ticket and assign to maintenance vendor
  app.post("/api/tickets/:id/accept", authenticateUser, (req, res, next) => {
    const user = req.user as any;
    // Allow org_admin, maintenance_admin, or org_subadmin with accept_ticket permission
    if (['org_admin', 'maintenance_admin'].includes(user.role) || 
        (user.role === 'org_subadmin' && user.permissions?.includes('accept_ticket'))) {
      return next();
    }
    return res.status(403).json({ message: "Insufficient permissions" });
  }, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { maintenanceVendorId, assigneeId, marketplace } = req.body;
      
      console.log(`=== ACCEPT TICKET MIDDLEWARE ${id} ===`);
      console.log(`Body received:`, { maintenanceVendorId, assigneeId, marketplace });
      
      if (marketplace) {
        // Assign ticket to marketplace for bidding
        console.log(`Assigning ticket ${id} to marketplace`);
        const ticket = await storage.assignTicketToMarketplace(id);
        if (!ticket) {
          return res.status(404).json({ message: "Ticket not found" });
        }
        console.log(`Marketplace assignment result:`, { id: ticket.id, status: ticket.status });
        res.json(ticket);
      } else {
        // Normal vendor assignment
        console.log(`Calling storage.acceptTicket for ticket ${id} with vendor ${maintenanceVendorId}`);
        const ticket = await storage.acceptTicket(id, { maintenanceVendorId, assigneeId });
        console.log(`Storage result:`, { id: ticket?.id, vendor: ticket?.maintenanceVendorId, assignee: ticket?.assigneeId, status: ticket?.status });
        if (!ticket) {
          return res.status(404).json({ message: "Ticket not found" });
        }
        res.json(ticket);
      }
    } catch (error) {
      console.error('Accept ticket error:', error);
      res.status(500).json({ message: "Failed to accept ticket" });
    }
  });

  // Start work on ticket (for technicians)
  app.post("/api/tickets/:id/start", authenticateUser, requireRole(["technician"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user!;
      
      const ticket = await storage.updateTicket(id, {
        status: "in-progress",
        assigneeId: user.id
      });
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to start work on ticket" });
    }
  });

  // Reject ticket with reason
  app.post("/api/tickets/:id/reject", authenticateUser, (req, res, next) => {
    const user = req.user as any;
    // Allow org_admin, maintenance_admin, or org_subadmin with accept_ticket permission
    if (['org_admin', 'maintenance_admin'].includes(user.role) || 
        (user.role === 'org_subadmin' && user.permissions?.includes('accept_ticket'))) {
      return next();
    }
    return res.status(403).json({ message: "Insufficient permissions" });
  }, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { rejectionReason } = req.body;
      
      if (!rejectionReason) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }
      
      const ticket = await storage.rejectTicket(id, rejectionReason);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject ticket" });
    }
  });

  // Complete ticket with work order (technician)
  app.post("/api/tickets/:id/complete", authenticateUser, requireRole(["technician"]), upload.array('images'), async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      let workOrder;
      const user = req.user!;
      
      // Parse workOrder from FormData
      try {
        workOrder = req.body.workOrder ? JSON.parse(req.body.workOrder) : null;
      } catch (error) {
        return res.status(400).json({ message: "Invalid work order data" });
      }
      
      if (!workOrder) {
        return res.status(400).json({ message: "Work order data required" });
      }
      
      // Get uploaded image filenames
      const images = (req.files as Express.Multer.File[] || []).map(file => `/uploads/${file.filename}`);

      // Calculate total cost
      const partsCost = (workOrder.parts || []).reduce((sum: number, part: any) => sum + (part.cost * part.quantity), 0);
      const otherCost = (workOrder.otherCharges || []).reduce((sum: number, charge: any) => sum + charge.cost, 0);
      const totalCost = partsCost + otherCost;

      // Calculate total hours
      const calculateHours = (timeIn: string, timeOut: string) => {
        if (!timeIn || !timeOut) return "0.00";
        
        const [inHour, inMin] = timeIn.split(':').map(Number);
        const [outHour, outMin] = timeOut.split(':').map(Number);
        
        const inMinutes = inHour * 60 + inMin;
        const outMinutes = outHour * 60 + outMin;
        
        let totalMinutes = outMinutes - inMinutes;
        if (totalMinutes < 0) {
          totalMinutes += 24 * 60; // Add 24 hours for next day
        }
        
        const hours = totalMinutes / 60;
        return hours.toFixed(2);
      };

      const totalHours = calculateHours(workOrder.timeIn || "", workOrder.timeOut || "");

      // Create work order record
      await storage.createWorkOrder({
        ticketId: id,
        workDescription: workOrder.workDescription,
        completionStatus: workOrder.completionStatus,
        completionNotes: workOrder.completionNotes,
        parts: JSON.stringify(workOrder.parts || []),
        otherCharges: JSON.stringify(workOrder.otherCharges || []),
        totalCost: totalCost.toString(),
        images: images,
        technicianId: user.id,
        technicianName: `${user.firstName} ${user.lastName}`,
        // Time tracking fields
        workDate: new Date().toISOString().split('T')[0], // Current date in YYYY-MM-DD format
        timeIn: workOrder.timeIn,
        timeOut: workOrder.timeOut,
        totalHours: totalHours,
        // Manager signature fields
        managerName: workOrder.managerName,
        managerSignature: workOrder.managerSignature,
      });

      // Update ticket status based on work order completion status
      let status: "return_needed" | "pending_confirmation" | "completed";
      if (workOrder.completionStatus === "return_needed") {
        status = "return_needed";
      } else if (workOrder.completionStatus === "completed") {
        status = "pending_confirmation";
      } else {
        // Set to pending confirmation for original requester
        status = "pending_confirmation";
      }
      
      const ticket = await storage.updateTicket(id, { 
        status,
        completedAt: workOrder.completionStatus === "completed" ? new Date() : undefined
      });
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json(ticket);
    } catch (error) {
      console.error("Error completing ticket:", error);
      res.status(500).json({ message: "Failed to complete ticket" });
    }
  });

  // Assign ticket to marketplace
  app.post("/api/tickets/:id/assign-marketplace", authenticateUser, requireRole(["org_admin", "org_subadmin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const ticket = await storage.assignTicketToMarketplace(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to assign ticket to marketplace" });
    }
  });

  // Get marketplace tickets (for vendors to view)
  app.get("/api/marketplace/tickets", authenticateUser, requireRole(["maintenance_admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const tickets = await storage.getMarketplaceTickets();
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch marketplace tickets" });
    }
  });

  // Get vendor's bids (including counter offers)
  app.get("/api/marketplace/vendor-bids", authenticateUser, requireRole(["maintenance_admin", "technician"]), async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const vendorId = user.maintenanceVendorId;
      
      if (!vendorId) {
        return res.status(400).json({ message: "User is not associated with a maintenance vendor" });
      }

      const bids = await storage.getVendorBids(vendorId);
      res.json(bids);
    } catch (error) {
      console.error('Get vendor bids error:', error);
      res.status(500).json({ message: "Failed to fetch vendor bids" });
    }
  });

  // Get bid history for a specific bid
  app.get("/api/marketplace/bids/:bidId/history", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const bidId = parseInt(req.params.bidId);
      const history = await storage.getBidHistory(bidId);
      res.json(history);
    } catch (error) {
      console.error('Get bid history error:', error);
      res.status(500).json({ message: "Failed to fetch bid history" });
    }
  });

  // Enhanced counter offer response endpoint
  app.post("/api/marketplace/bids/:bidId/respond", authenticateUser, requireRole(["maintenance_admin", "technician"]), async (req: AuthenticatedRequest, res) => {
    try {
      const bidId = parseInt(req.params.bidId);
      const { action, amount, notes } = req.body;
      const user = req.user!;

      if (!['accept', 'reject', 'recounter'].includes(action)) {
        return res.status(400).json({ message: "Invalid action. Must be 'accept', 'reject', or 'recounter'" });
      }

      if (action === 'recounter' && (!amount || isNaN(parseFloat(amount)))) {
        return res.status(400).json({ message: "Amount is required for recounter action" });
      }

      await storage.respondToCounterOffer(bidId, user.id, action, amount ? parseFloat(amount) : undefined, notes);
      
      res.json({ message: `Bid ${action} successful`, action, bidId });
    } catch (error) {
      console.error('Respond to counter offer error:', error);
      res.status(500).json({ message: error.message || "Failed to respond to counter offer" });
    }
  });

  // Get bids for a ticket
  app.get("/api/tickets/:id/bids", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const bids = await storage.getTicketBids(ticketId);
      res.json(bids);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ticket bids" });
    }
  });

  // Create marketplace bid
  app.post("/api/marketplace/bids", authenticateUser, requireRole(["maintenance_admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const { ticketId, hourlyRate, estimatedHours, responseTime, parts, totalAmount, additionalNotes } = req.body;
      const user = req.user!;
      
      console.log('Creating marketplace bid:', { ticketId, hourlyRate, estimatedHours, responseTime, parts, totalAmount, additionalNotes, vendorId: user.maintenanceVendorId });
      
      if (!user.maintenanceVendorId) {
        return res.status(400).json({ message: "User must be associated with a vendor to place bids" });
      }

      const bid = await storage.createMarketplaceBid({
        ticketId: parseInt(ticketId),
        vendorId: user.maintenanceVendorId,
        hourlyRate: hourlyRate.toString(),
        estimatedHours: estimatedHours.toString(),
        responseTime,
        parts: parts || [],
        totalAmount: totalAmount.toString(),
        additionalNotes
      });
      
      console.log('Marketplace bid created successfully:', bid);
      res.status(201).json(bid);
    } catch (error) {
      console.error('Create marketplace bid error:', error);
      res.status(500).json({ message: "Failed to create marketplace bid", error: error.message });
    }
  });

  // Accept marketplace bid
  app.post("/api/marketplace/bids/:id/accept", authenticateUser, requireRole(["org_admin", "org_subadmin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const bidId = parseInt(req.params.id);
      const result = await storage.acceptMarketplaceBid(bidId);
      res.json(result);
    } catch (error) {
      console.error('Accept marketplace bid error:', error);
      res.status(500).json({ message: "Failed to accept marketplace bid" });
    }
  });

  // Reject marketplace bid
  app.post("/api/marketplace/bids/:id/reject", authenticateUser, requireRole(["org_admin", "org_subadmin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const bidId = parseInt(req.params.id);
      const { rejectionReason } = req.body;
      const bid = await storage.rejectMarketplaceBid(bidId, rejectionReason);
      res.json(bid);
    } catch (error) {
      console.error('Reject marketplace bid error:', error);
      res.status(500).json({ message: "Failed to reject marketplace bid" });
    }
  });

  // Counter marketplace bid
  app.post("/api/marketplace/bids/:id/counter", authenticateUser, requireRole(["org_admin", "org_subadmin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const bidId = parseInt(req.params.id);
      const { counterOffer, counterNotes } = req.body;
      
      const bid = await storage.counterMarketplaceBid(bidId, counterOffer, counterNotes);
      res.json(bid);
    } catch (error) {
      console.error('Counter marketplace bid error:', error);
      res.status(500).json({ message: "Failed to send counter offer" });
    }
  });

  // Approve a marketplace bid
  app.post("/api/marketplace/bids/:bidId/approve", authenticateUser, requireRole(["org_admin", "org_subadmin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const bidId = parseInt(req.params.bidId);
      const result = await storage.approveBid(bidId);
      res.json(result);
    } catch (error) {
      console.error('Approve bid error:', error);
      res.status(500).json({ message: "Failed to approve bid", error: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Accept marketplace bid
  app.post("/api/marketplace/bids/:id/accept", authenticateUser, requireRole(["org_admin", "org_subadmin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const bidId = parseInt(req.params.id);
      const result = await storage.acceptMarketplaceBid(bidId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to accept marketplace bid" });
    }
  });

  // Reject marketplace bid
  app.post("/api/marketplace/bids/:id/reject", authenticateUser, requireRole(["org_admin", "org_subadmin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const bidId = parseInt(req.params.id);
      const bid = await storage.rejectMarketplaceBid(bidId, "");
      res.json(bid);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject marketplace bid" });
    }
  });

  // Confirm ticket completion (original requester)
  app.post("/api/tickets/:id/confirm", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { confirmed, feedback } = req.body;

      // Verify ticket exists and is pending confirmation
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      if (ticket.status !== "pending_confirmation") {
        return res.status(400).json({ message: "Ticket is not pending confirmation" });
      }

      // Verify user is the original reporter or has accept_ticket permission
      const user = req.user!;
      const hasAcceptPermission = user.role === "root" || user.role === "org_admin" || 
        (user.role === "org_subadmin" && user.permissions?.includes("accept_ticket"));

      if (ticket.reporterId !== user.id && !hasAcceptPermission) {
        return res.status(403).json({ message: "Only the original requester or admin can confirm completion" });
      }

      let updatedTicket;
      if (confirmed) {
        // Confirm completion - move to billing stage for vendor
        updatedTicket = await storage.updateTicket(ticketId, { 
          status: "ready_for_billing",
          confirmedAt: new Date(),
          confirmationFeedback: feedback || null
        });
      } else {
        // Reject completion - return to in-progress
        updatedTicket = await storage.updateTicket(ticketId, { 
          status: "in-progress",
          rejectionFeedback: feedback || null
        });
      }

      res.json(updatedTicket);
    } catch (error) {
      console.error("Error confirming ticket:", error);
      res.status(500).json({ message: "Failed to confirm ticket" });
    }
  });

  // Force close ticket - Available for users with accept ticket permissions
  app.post("/api/tickets/:id/force-close", authenticateUser, requireRole(["org_admin", "org_subadmin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const user = req.user!;
      const { reason } = req.body;
      
      if (!reason || !reason.trim()) {
        return res.status(400).json({ message: "Reason is required for force closing a ticket" });
      }
      
      // Get the ticket first
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check if ticket is already closed
      if (ticket.status === "billed" || ticket.status === "rejected" || ticket.status === "force_closed") {
        return res.status(400).json({ message: "Ticket is already closed" });
      }
      
      // Check permissions based on user role - vendor admins cannot force close
      const hasPermission = user.role === "root" || 
                           (user.role === "org_admin" && ticket.organizationId === user.organizationId) ||
                           (user.role === "org_subadmin" && ticket.organizationId === user.organizationId);
      
      if (!hasPermission) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Force close the ticket
      const forcedClosedTicket = await storage.updateTicket(ticketId, { 
        status: "force_closed",
        forceClosedAt: new Date(),
        forceClosedBy: user.id,
        forceCloseReason: reason.trim()
      });
      
      // Add a system comment about the force close
      await storage.createTicketComment({
        ticketId: ticketId,
        content: `Ticket was force closed by ${user.firstName} ${user.lastName}. Reason: ${reason.trim()}`,
        userId: user.id,
        isSystem: true
      });
      
      res.json(forcedClosedTicket);
    } catch (error) {
      console.error("Error force closing ticket:", error);
      res.status(500).json({ message: "Failed to force close ticket" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      let result;
      
      if (user.role === "maintenance_admin" && user.maintenanceVendorId) {
        // Get invoices with ticket information for maintenance vendors
        result = await db
          .select({
            id: invoices.id,
            invoiceNumber: invoices.invoiceNumber,
            ticketId: invoices.ticketId,
            ticketNumber: tickets.ticketNumber,
            maintenanceVendorId: invoices.maintenanceVendorId,
            organizationId: invoices.organizationId,
            subtotal: invoices.subtotal,
            tax: invoices.tax,
            total: invoices.total,
            status: invoices.status,
            workOrderIds: invoices.workOrderIds,
            additionalItems: invoices.additionalItems,
            notes: invoices.notes,
            createdAt: invoices.createdAt,
            sentAt: invoices.sentAt,
            paidAt: invoices.paidAt,
          })
          .from(invoices)
          .leftJoin(tickets, eq(invoices.ticketId, tickets.id))
          .where(eq(invoices.maintenanceVendorId, user.maintenanceVendorId));
      } else if ((user.role === "org_admin" || user.role === "org_subadmin") && user.organizationId && user.permissions?.includes("view_invoices")) {
        // Get invoices for organization users with invoice permissions
        // Filter by user's assigned locations if they have location assignments
        const userLocations = await storage.getUserLocationAssignments(user.id);
        
        if (userLocations.length > 0) {
          // User has specific location assignments - filter invoices by those locations
          const locationIds = userLocations.map(loc => loc.id);
          result = await db
            .select({
              id: invoices.id,
              invoiceNumber: invoices.invoiceNumber,
              ticketId: invoices.ticketId,
              ticketNumber: tickets.ticketNumber,
              maintenanceVendorId: invoices.maintenanceVendorId,
              organizationId: invoices.organizationId,
              locationId: invoices.locationId,
              subtotal: invoices.subtotal,
              tax: invoices.tax,
              total: invoices.total,
              status: invoices.status,
              workOrderIds: invoices.workOrderIds,
              additionalItems: invoices.additionalItems,
              notes: invoices.notes,
              createdAt: invoices.createdAt,
              sentAt: invoices.sentAt,
              paidAt: invoices.paidAt,
            })
            .from(invoices)
            .leftJoin(tickets, eq(invoices.ticketId, tickets.id))
            .where(
              and(
                eq(invoices.organizationId, user.organizationId),
                inArray(invoices.locationId, locationIds)
              )
            );
        } else {
          // User has no location assignments - see all organization invoices (for org_admin)
          result = await db
            .select({
              id: invoices.id,
              invoiceNumber: invoices.invoiceNumber,
              ticketId: invoices.ticketId,
              ticketNumber: tickets.ticketNumber,
              maintenanceVendorId: invoices.maintenanceVendorId,
              organizationId: invoices.organizationId,
              locationId: invoices.locationId,
              subtotal: invoices.subtotal,
              tax: invoices.tax,
              total: invoices.total,
              status: invoices.status,
              workOrderIds: invoices.workOrderIds,
              additionalItems: invoices.additionalItems,
              notes: invoices.notes,
              createdAt: invoices.createdAt,
              sentAt: invoices.sentAt,
              paidAt: invoices.paidAt,
            })
            .from(invoices)
            .leftJoin(tickets, eq(invoices.ticketId, tickets.id))
            .where(eq(invoices.organizationId, user.organizationId));
        }
      } else if (user.role === "root") {
        // Get all invoices with ticket information for root
        result = await db
          .select({
            id: invoices.id,
            invoiceNumber: invoices.invoiceNumber,
            ticketId: invoices.ticketId,
            ticketNumber: tickets.ticketNumber,
            maintenanceVendorId: invoices.maintenanceVendorId,
            organizationId: invoices.organizationId,
            subtotal: invoices.subtotal,
            tax: invoices.tax,
            total: invoices.total,
            status: invoices.status,
            workOrderIds: invoices.workOrderIds,
            additionalItems: invoices.additionalItems,
            notes: invoices.notes,
            createdAt: invoices.createdAt,
            sentAt: invoices.sentAt,
            paidAt: invoices.paidAt,
          })
          .from(invoices)
          .leftJoin(tickets, eq(invoices.ticketId, tickets.id));
      } else {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.post("/api/invoices", authenticateUser, requireRole(["maintenance_admin", "root"]), async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const { ticketId, additionalItems, notes, tax } = req.body;

      // Get ticket and work orders
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }

      if (ticket.status !== "ready_for_billing") {
        return res.status(400).json({ message: "Ticket is not ready for billing" });
      }

      // Verify vendor ownership
      if (user.role === "maintenance_admin" && ticket.maintenanceVendorId !== user.maintenanceVendorId) {
        return res.status(403).json({ message: "Not authorized for this ticket" });
      }

      const workOrders = await storage.getTicketWorkOrders(ticketId);
      const workOrderIds = workOrders.map(wo => wo.id);
      
      // Calculate subtotal from work orders
      const subtotal = workOrders.reduce((sum, wo) => sum + parseFloat(wo.totalCost || "0"), 0);
      const taxAmount = parseFloat(tax || "0");
      const total = subtotal + taxAmount;

      // Generate invoice number
      const invoiceNumber = `INV-${Date.now()}-${ticketId}`;

      const invoice = await storage.createInvoice({
        invoiceNumber,
        ticketId,
        maintenanceVendorId: ticket.maintenanceVendorId!,
        organizationId: ticket.organizationId,
        locationId: ticket.locationId, // Include location from original ticket
        subtotal: subtotal.toString(),
        tax: taxAmount.toString(),
        total: total.toString(),
        workOrderIds,
        additionalItems: additionalItems ? JSON.stringify(additionalItems) : null,
        notes,
      });

      // Update ticket status to billed
      await storage.updateTicket(ticketId, { status: "billed" });

      res.json(invoice);
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.get("/api/invoices/:id", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      const user = req.user!;
      if (user.role === "maintenance_admin" && invoice.maintenanceVendorId !== user.maintenanceVendorId) {
        return res.status(403).json({ message: "Unauthorized" });
      }

      res.json(invoice);
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  // Get detailed ticket information for progress tracker
  app.get("/api/tickets/:id/details", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const user = req.user!;
      
      // Get the ticket first to check permissions
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check if user has access to this ticket
      const hasAccess = user.role === "root" || 
                       ticket.organizationId === user.organizationId ||
                       ticket.maintenanceVendorId === user.maintenanceVendorId ||
                       ticket.reporterId === user.id ||
                       ticket.assigneeId === user.id;
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Get additional details
      const details = {
        ...ticket,
        reporter: ticket.reporterId ? await storage.getUser(ticket.reporterId) : null,
        assignee: ticket.assigneeId ? await storage.getUser(ticket.assigneeId) : null,
        organization: ticket.organizationId ? await storage.getOrganization(ticket.organizationId) : null,
        maintenanceVendor: ticket.maintenanceVendorId ? await storage.getMaintenanceVendor(ticket.maintenanceVendorId) : null,
        workOrders: await storage.getTicketWorkOrders(ticketId),
        comments: await storage.getTicketComments(ticketId),
      };
      
      res.json(details);
    } catch (error) {
      console.error("Error fetching ticket details:", error);
      res.status(500).json({ message: "Failed to fetch ticket details" });
    }
  });

  // Get work orders for a ticket
  app.get("/api/tickets/:id/work-orders", authenticateUser, async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const workOrders = await storage.getTicketWorkOrders(ticketId);
      res.json(workOrders);
    } catch (error) {
      console.error("Error fetching work orders:", error);
      res.status(500).json({ message: "Failed to fetch work orders" });
    }
  });

  // Get technicians for maintenance vendor
  app.get("/api/maintenance-vendors/:vendorId/technicians", authenticateUser, requireRole(["root", "maintenance_admin"]), async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const user = req.user!;
      
      // Ensure user can only access their own vendor's technicians
      if (user.role === "maintenance_admin" && user.maintenanceVendorId !== vendorId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const technicians = await storage.getTechnicians(vendorId);
      res.json(technicians);
    } catch (error) {
      console.error("Error fetching technicians:", error);
      res.status(500).json({ message: "Failed to fetch technicians" });
    }
  });

  // Create technician
  app.post("/api/maintenance-vendors/:vendorId/technicians", authenticateUser, requireRole(["root", "maintenance_admin"]), async (req, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const technicianData = insertUserSchema.parse(req.body);
      
      const technician = await storage.createTechnician(technicianData, vendorId);
      res.status(201).json(technician);
    } catch (error: any) {
      console.error("Create technician error:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid technician data", errors: error.errors });
      } else if (error.message?.includes("duplicate key")) {
        res.status(409).json({ message: "Email or phone number already exists" });
      } else {
        res.status(500).json({ message: "Failed to create technician" });
      }
    }
  });

  // Update technician
  app.patch("/api/maintenance-vendors/:vendorId/technicians/:id", authenticateUser, requireRole(["root", "maintenance_admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vendorId = parseInt(req.params.vendorId);
      const user = req.user!;
      
      // Ensure user can only update their own vendor's technicians
      if (user.role === "maintenance_admin" && user.maintenanceVendorId !== vendorId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updateData = insertUserSchema.partial().parse(req.body);
      const technician = await storage.updateTechnician(id, updateData);
      
      if (!technician) {
        return res.status(404).json({ message: "Technician not found" });
      }
      
      res.json(technician);
    } catch (error: any) {
      console.error("Update technician error:", error);
      if (error.name === 'ZodError') {
        res.status(400).json({ message: "Invalid technician data", errors: error.errors });
      } else if (error.message?.includes("duplicate key")) {
        res.status(409).json({ message: "Email or phone number already exists" });
      } else {
        res.status(500).json({ message: "Failed to update technician" });
      }
    }
  });

  // Reset technician password
  app.post("/api/maintenance-vendors/:vendorId/technicians/:id/reset-password", authenticateUser, requireRole(["root", "maintenance_admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vendorId = parseInt(req.params.vendorId);
      const user = req.user!;
      const { newPassword } = req.body;
      
      // Ensure user can only reset their own vendor's technicians
      if (user.role === "maintenance_admin" && user.maintenanceVendorId !== vendorId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      const technician = await storage.updateTechnician(id, { password: newPassword });
      
      if (!technician) {
        return res.status(404).json({ message: "Technician not found" });
      }
      
      res.json({ message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // Delete technician
  app.delete("/api/maintenance-vendors/:vendorId/technicians/:id", authenticateUser, requireRole(["root", "maintenance_admin"]), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteTechnician(id);
      
      if (!success) {
        return res.status(404).json({ message: "Technician not found" });
      }
      
      res.json({ message: "Technician deleted successfully" });
    } catch (error) {
      console.error("Delete technician error:", error);
      res.status(500).json({ message: "Failed to delete technician" });
    }
  });

  // Location routes
  app.get("/api/organizations/:id/locations", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const user = req.user!;
      
      // Check if user has access to this organization
      if (user.role !== "root" && user.organizationId !== organizationId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const locations = await storage.getLocations(organizationId);
      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ message: "Failed to fetch locations" });
    }
  });

  // Public location lookup endpoint for tickets - accessible by vendors
  app.get("/api/locations/:id", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const locationId = parseInt(req.params.id);
      
      // Get the location from any organization that the system knows about
      const organizations = await storage.getOrganizations();
      let foundLocation = null;
      
      for (const org of organizations) {
        const locations = await storage.getLocations(org.id);
        foundLocation = locations.find(loc => loc.id === locationId);
        if (foundLocation) break;
      }
      
      if (!foundLocation) {
        return res.status(404).json({ message: "Location not found" });
      }
      
      res.json(foundLocation);
    } catch (error) {
      console.error("Error fetching location:", error);
      res.status(500).json({ message: "Failed to fetch location" });
    }
  });

  app.post("/api/organizations/:id/locations", authenticateUser, requireRole(["root", "org_admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const organizationId = parseInt(req.params.id);
      const user = req.user!;
      
      // Check if user has access to this organization
      if (user.role !== "root" && user.organizationId !== organizationId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const locationData = { ...req.body, organizationId };
      const location = await storage.createLocation(locationData);
      res.status(201).json(location);
    } catch (error) {
      console.error("Error creating location:", error);
      res.status(500).json({ message: "Failed to create location" });
    }
  });

  app.delete("/api/locations/:id", authenticateUser, requireRole(["root", "org_admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const locationId = parseInt(req.params.id);
      const success = await storage.deleteLocation(locationId);
      
      if (success) {
        res.json({ message: "Location deleted successfully" });
      } else {
        res.status(404).json({ message: "Location not found" });
      }
    } catch (error) {
      console.error("Error deleting location:", error);
      res.status(500).json({ message: "Failed to delete location" });
    }
  });

  // User location assignment routes
  app.get("/api/users/:id/locations", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const locations = await storage.getUserLocationAssignments(userId);
      res.json(locations);
    } catch (error) {
      console.error("Error fetching user locations:", error);
      res.status(500).json({ message: "Failed to fetch user locations" });
    }
  });

  app.put("/api/users/:id/locations", authenticateUser, requireRole(["root", "org_admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { locationIds } = req.body;
      
      await storage.updateUserLocationAssignments(userId, locationIds);
      res.json({ message: "User location assignments updated successfully" });
    } catch (error) {
      console.error("Error updating user locations:", error);
      res.status(500).json({ message: "Failed to update user locations" });
    }
  });

  // Ticket comment routes
  app.get("/api/tickets/:id/comments", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const user = req.user!;
      
      // Verify user has access to this ticket
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check access based on role
      let hasAccess = false;
      if (user.role === "root") {
        hasAccess = true;
      } else if (user.role === "org_admin" && ticket.organizationId === user.organizationId) {
        hasAccess = true;
      } else if (user.role === "org_subadmin" && ticket.organizationId === user.organizationId) {
        // Sub-admin can only see tickets from their assigned locations
        const userLocations = await storage.getUserLocationAssignments(user.id);
        const locationIds = userLocations.map(loc => loc.id);
        hasAccess = !ticket.locationId || locationIds.includes(ticket.locationId);
      } else if (user.role === "maintenance_admin" && ticket.maintenanceVendorId === user.maintenanceVendorId) {
        hasAccess = true;
      } else if (user.role === "technician" && ticket.assigneeId === user.id) {
        hasAccess = true;
      }
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const comments = await storage.getTicketComments(ticketId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching ticket comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/tickets/:id/comments", upload.array('images', 5), authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const user = req.user!;
      const files = req.files as Express.Multer.File[];
      const imageUrls = files ? files.map(file => `/uploads/${file.filename}`) : [];
      
      // Verify user has access to this ticket
      const ticket = await storage.getTicket(ticketId);
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check access based on role (same logic as GET comments)
      let hasAccess = false;
      if (user.role === "root") {
        hasAccess = true;
      } else if (user.role === "org_admin" && ticket.organizationId === user.organizationId) {
        hasAccess = true;
      } else if (user.role === "org_subadmin" && ticket.organizationId === user.organizationId) {
        const userLocations = await storage.getUserLocationAssignments(user.id);
        const locationIds = userLocations.map(loc => loc.id);
        hasAccess = !ticket.locationId || locationIds.includes(ticket.locationId);
      } else if (user.role === "maintenance_admin" && ticket.maintenanceVendorId === user.maintenanceVendorId) {
        hasAccess = true;
      } else if (user.role === "technician" && ticket.assigneeId === user.id) {
        hasAccess = true;
      }
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const commentData = {
        ticketId,
        userId: user.id,
        content: req.body.content,
        images: imageUrls.length > 0 ? imageUrls : undefined,
        isSystemGenerated: false,
      };
      
      const result = insertTicketCommentSchema.safeParse(commentData);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid comment data", errors: result.error.errors });
      }
      
      const comment = await storage.createTicketComment(result.data);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating ticket comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.put("/api/tickets/:ticketId/comments/:commentId", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const commentId = parseInt(req.params.commentId);
      const user = req.user!;
      
      // Get the comment to verify ownership
      const comments = await storage.getTicketComments(ticketId);
      const comment = comments.find(c => c.id === commentId);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Only the comment author or root can edit comments
      if (comment.userId !== user.id && user.role !== "root") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updates = {
        content: req.body.content,
      };
      
      const updatedComment = await storage.updateTicketComment(commentId, updates);
      if (!updatedComment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      res.json(updatedComment);
    } catch (error) {
      console.error("Error updating ticket comment:", error);
      res.status(500).json({ message: "Failed to update comment" });
    }
  });

  app.delete("/api/tickets/:ticketId/comments/:commentId", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const ticketId = parseInt(req.params.ticketId);
      const commentId = parseInt(req.params.commentId);
      const user = req.user!;
      
      // Get the comment to verify ownership
      const comments = await storage.getTicketComments(ticketId);
      const comment = comments.find(c => c.id === commentId);
      
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      // Only the comment author or root can delete comments
      if (comment.userId !== user.id && user.role !== "root") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const success = await storage.deleteTicketComment(commentId);
      if (!success) {
        return res.status(404).json({ message: "Comment not found" });
      }
      
      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("Error deleting ticket comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Parts management routes for vendors
  app.get("/api/maintenance-vendors/:vendorId/parts", authenticateUser, requireRole(["maintenance_admin", "technician"]), async (req: AuthenticatedRequest, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const user = req.user!;
      
      // Ensure vendor admin or technician can only access their own vendor's parts
      if (user.maintenanceVendorId !== vendorId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const parts = await storage.getPartsByVendorId(vendorId);
      res.json(parts);
    } catch (error) {
      console.error("Error fetching parts:", error);
      res.status(500).json({ message: "Failed to fetch parts" });
    }
  });

  app.post("/api/maintenance-vendors/:vendorId/parts", authenticateUser, requireRole(["maintenance_admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const vendorId = parseInt(req.params.vendorId);
      const user = req.user!;
      
      // Ensure vendor admin can only add parts to their own vendor
      if (user.maintenanceVendorId !== vendorId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const partData = {
        ...req.body,
        vendorId: vendorId,
      };
      
      const part = await storage.createPart(partData);
      res.json(part);
    } catch (error) {
      console.error("Error creating part:", error);
      res.status(500).json({ message: "Failed to create part" });
    }
  });

  app.put("/api/parts/:partId", authenticateUser, requireRole(["maintenance_admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const partId = parseInt(req.params.partId);
      const user = req.user!;
      
      // Get the part to verify ownership
      const parts = await storage.getPartsByVendorId(user.maintenanceVendorId!);
      const existingPart = parts.find(p => p.id === partId);
      
      if (!existingPart) {
        return res.status(404).json({ message: "Part not found" });
      }
      
      const updatedPart = await storage.updatePart(partId, req.body);
      if (!updatedPart) {
        return res.status(404).json({ message: "Part not found" });
      }
      
      res.json(updatedPart);
    } catch (error) {
      console.error("Error updating part:", error);
      res.status(500).json({ message: "Failed to update part" });
    }
  });

  app.get("/api/parts/:partId/price-history", authenticateUser, requireRole(["maintenance_admin"]), async (req: AuthenticatedRequest, res) => {
    try {
      const partId = parseInt(req.params.partId);
      const user = req.user!;
      
      // Get the part to verify ownership
      const parts = await storage.getPartsByVendorId(user.maintenanceVendorId!);
      const existingPart = parts.find(p => p.id === partId);
      
      if (!existingPart) {
        return res.status(404).json({ message: "Part not found" });
      }
      
      const history = await storage.getPartPriceHistory(partId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching price history:", error);
      res.status(500).json({ message: "Failed to fetch price history" });
    }
  });

  // Calendar API routes
  app.get("/api/calendar/events", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const { startDate, endDate } = req.query;
      
      const events = await storage.getCalendarEvents(
        user.id, 
        startDate as string, 
        endDate as string
      );
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });

  app.get("/api/calendar/events/:id", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const user = req.user!;
      
      const event = await storage.getCalendarEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Verify user owns the event or has access
      if (event.userId !== user.id && user.role !== "root") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error fetching calendar event:", error);
      res.status(500).json({ message: "Failed to fetch calendar event" });
    }
  });

  app.post("/api/calendar/events", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const eventData = { ...req.body, userId: user.id };
      
      // Check for conflicts with existing unavailability events (unless this is an unavailability event)
      if (eventData.eventType !== 'unavailability') {
        const conflicts = await storage.checkEventConflicts(
          user.id,
          eventData.startDate,
          eventData.endDate,  
          eventData.startTime,
          eventData.endTime,
          eventData.isAllDay
        );
        
        if (conflicts.length > 0) {
          return res.status(409).json({ 
            message: "Cannot book during blocked time periods",
            conflicts: conflicts.map(c => ({
              title: c.title,
              date: c.startDate,
              time: c.isAllDay ? "All day" : `${c.startTime} - ${c.endTime}`
            }))
          });
        }
      }
      
      // Create the event in TaskScout first
      const event = await storage.createCalendarEvent(eventData);
      
      // If user has Google Calendar connected and sync enabled, sync to Google
      const integration = await storage.getGoogleCalendarIntegration(user.id);
      console.log(`Checking Google Calendar integration for user ${user.id}:`, {
        hasIntegration: !!integration,
        syncEnabled: integration?.syncEnabled,
        eventType: eventData.eventType
      });
      
      if (integration && integration.syncEnabled && eventData.eventType !== 'availability') {
        try {
          console.log(`Syncing new TaskScout event "${event.title}" to Google Calendar`);
          console.log(`Event data:`, {
            title: event.title,
            startDate: event.startDate,
            endDate: event.endDate,
            startTime: event.startTime,
            endTime: event.endTime,
            isAllDay: event.isAllDay,
            eventType: event.eventType
          });
          
          const googleEventId = await googleCalendarService.createEvent(integration, event);
          if (googleEventId) {
            // Update the event with Google ID for bidirectional sync
            await storage.updateCalendarEvent(event.id, {
              googleEventId,
              syncedToGoogle: true
            });
            console.log(`✅ Successfully synced "${event.title}" to Google Calendar (${googleEventId})`);
          } else {
            console.warn(`❌ Failed to get Google Event ID for "${event.title}"`);
          }
        } catch (syncError) {
          console.error('❌ Failed to sync event to Google Calendar:', syncError);
          // Continue without failing the request - event still created in TaskScout
        }
      }
      
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({ message: "Failed to create calendar event" });
    }
  });

  app.put("/api/calendar/events/:id", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const user = req.user!;
      
      // Verify user owns the event
      const existingEvent = await storage.getCalendarEvent(eventId);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      if (existingEvent.userId !== user.id && user.role !== "root") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedEvent = await storage.updateCalendarEvent(eventId, req.body);
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating calendar event:", error);
      res.status(500).json({ message: "Failed to update calendar event" });
    }
  });

  app.delete("/api/calendar/events/:id", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const eventId = parseInt(req.params.id);
      const user = req.user!;
      
      // Verify user owns the event
      const existingEvent = await storage.getCalendarEvent(eventId);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      if (existingEvent.userId !== user.id && user.role !== "root") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const deleted = await storage.deleteCalendarEvent(eventId);
      if (deleted) {
        res.json({ message: "Event deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete event" });
      }
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      res.status(500).json({ message: "Failed to delete calendar event" });
    }
  });

  // Get user availability for a specific date
  app.get("/api/calendar/availability/:date", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const date = req.params.date;
      
      const availability = await storage.getUserAvailability(user.id, date);
      res.json(availability);
    } catch (error) {
      console.error("Error fetching availability:", error);
      res.status(500).json({ message: "Failed to fetch availability" });
    }
  });

  // Create availability block
  app.post("/api/calendar/availability", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const { title, startDate, endDate, startTime, endTime } = req.body;
      
      const availability = await storage.createAvailabilityBlock(
        user.id,
        title,
        startDate,
        endDate,
        startTime,
        endTime
      );
      res.status(201).json(availability);
    } catch (error) {
      console.error("Error creating availability:", error);
      res.status(500).json({ message: "Failed to create availability" });
    }
  });

  // Get work assignments for user
  app.get("/api/calendar/work-assignments", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const { startDate, endDate } = req.query;
      
      const assignments = await storage.getWorkAssignments(
        user.id,
        startDate as string,
        endDate as string
      );
      res.json(assignments);
    } catch (error) {
      console.error("Error fetching work assignments:", error);
      res.status(500).json({ message: "Failed to fetch work assignments" });
    }
  });

  // Create event exception (for deleting specific occurrences of recurring events)
  app.post("/api/calendar/events/:id/exceptions", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const eventId = parseInt(req.params.id);
      const { exceptionDate } = req.body;
      
      // Verify event exists and user has access
      const event = await storage.getCalendarEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      if (event.userId !== user.id && user.role !== "root") {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const exception = await storage.createEventException(eventId, exceptionDate);
      res.status(201).json(exception);
    } catch (error) {
      console.error("Error creating event exception:", error);
      res.status(500).json({ message: "Failed to create event exception" });
    }
  });

  // Availability configuration routes
  app.get("/api/availability/config", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const config = await storage.getAvailabilityConfig(user.id);
      res.json(config);
    } catch (error) {
      console.error("Error fetching availability config:", error);
      res.status(500).json({ message: "Failed to fetch availability configuration" });
    }
  });

  app.post("/api/availability/config", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const { weeklySchedule, timezone } = req.body;
      
      // Check if user already has a config
      const existingConfig = await storage.getAvailabilityConfig(user.id);
      
      if (existingConfig) {
        // Update existing configuration
        const updatedConfig = await storage.updateAvailabilityConfig(user.id, {
          weeklySchedule: JSON.stringify(weeklySchedule),
          timezone: timezone || "America/New_York",
        });
        res.json(updatedConfig);
      } else {
        // Create new configuration
        const newConfig = await storage.createAvailabilityConfig({
          userId: user.id,
          weeklySchedule: JSON.stringify(weeklySchedule),
          timezone: timezone || "America/New_York",
        });
        res.status(201).json(newConfig);
      }
    } catch (error) {
      console.error("Error saving availability config:", error);
      res.status(500).json({ message: "Failed to save availability configuration" });
    }
  });

  // Payment processing route
  app.post("/api/invoices/:id/pay", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const invoiceId = parseInt(req.params.id);
      const { paymentMethod, paymentType, checkNumber } = req.body;
      
      // Get the invoice first to verify access
      const invoice = await storage.getInvoiceById(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // For now, only handle external payments
      if (paymentMethod !== "external") {
        return res.status(400).json({ message: "Only external payments are currently supported" });
      }
      
      // Update invoice with payment information
      const updatedInvoice = await storage.updateInvoicePayment(invoiceId, {
        status: "paid",
        paymentMethod,
        paymentType,
        checkNumber,
        paidAt: new Date()
      });
      
      res.json(updatedInvoice);
    } catch (error) {
      console.error("Error processing payment:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  const httpServer = createServer(app);
  // Google Calendar Integration Routes
  
  // Get Google Calendar integration status
  app.get('/api/google-calendar/status', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const integration = await storage.getGoogleCalendarIntegration(user.id);
      
      res.json({
        connected: !!integration,
        email: integration?.googleAccountEmail || null,
        syncEnabled: integration?.syncEnabled || false,
        lastSyncAt: integration?.lastSyncAt || null
      });
    } catch (error) {
      console.error('Error fetching Google Calendar status:', error);
      res.status(500).json({ message: 'Failed to fetch Google Calendar status' });
    }
  });

  // Initiate Google Calendar authentication
  app.get('/api/google-calendar/auth', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const authUrl = googleCalendarService.generateAuthUrl(user.id);
      
      // Debug: Log the redirect URI being used
      const redirectUri = authUrl.includes('redirect_uri=') ? 
        decodeURIComponent(authUrl.split('redirect_uri=')[1].split('&')[0]) : 'Not found';
      console.log('Google OAuth redirect URI being used:', redirectUri);
      console.log('*** ADD THIS EXACT URI TO YOUR GOOGLE CLOUD CONSOLE OAUTH SETTINGS ***');
      
      res.json({ authUrl });
    } catch (error) {
      console.error('Error generating Google Calendar auth URL:', error);
      res.status(500).json({ message: 'Failed to generate authentication URL' });
    }
  });

  // Handle Google Calendar OAuth callback
  app.get('/api/auth/google/callback', async (req, res) => {
    try {
      const { code, state, error } = req.query;
      
      if (error) {
        console.error('Google OAuth error:', error);
        return res.redirect('/calendar?error=oauth_error');
      }
      
      if (!code || !state) {
        console.error('Missing code or state in OAuth callback');
        return res.redirect('/calendar?error=missing_params');
      }
      
      const userId = parseInt(state as string);
      if (!userId) {
        console.error('Invalid user ID in OAuth state');
        return res.redirect('/calendar?error=invalid_state');
      }
      
      // Exchange code for tokens
      const tokens = await googleCalendarService.exchangeCodeForTokens(code as string);
      
      if (!tokens.access_token || !tokens.refresh_token) {
        console.error('Failed to obtain access tokens');
        return res.redirect('/calendar?error=token_exchange_failed');
      }

      // Create integration record
      const integration = await storage.createGoogleCalendarIntegration({
        userId: userId,
        googleAccountEmail: 'unknown@gmail.com', // We'll update this with actual Google email
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
        calendarId: 'primary',
        syncEnabled: true
      });

      // Get user info from Google to update email
      try {
        const tempIntegration = { ...integration };
        const userInfo = await googleCalendarService.getUserInfo(tempIntegration);
        if (userInfo.email) {
          await storage.updateGoogleCalendarIntegration(userId, {
            googleAccountEmail: userInfo.email
          });
        }
      } catch (userInfoError) {
        console.warn('Could not fetch Google user info:', userInfoError);
      }

      console.log('Google Calendar connected successfully for user:', userId);
      res.redirect('/calendar?success=connected');
    } catch (error) {
      console.error('Error handling Google Calendar callback:', error);
      res.redirect('/calendar?error=connection_failed');
    }
  });

  // Disconnect Google Calendar
  app.delete('/api/google-calendar/disconnect', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const deleted = await storage.deleteGoogleCalendarIntegration(user.id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Google Calendar integration not found' });
      }

      res.json({ message: 'Google Calendar disconnected successfully' });
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      res.status(500).json({ message: 'Failed to disconnect Google Calendar' });
    }
  });

  // Manual sync with Google Calendar
  app.post('/api/google-calendar/sync', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const integration = await storage.getGoogleCalendarIntegration(user.id);
      
      if (!integration) {
        return res.status(404).json({ message: 'Google Calendar not connected' });
      }

      if (!integration.syncEnabled) {
        return res.status(400).json({ message: 'Google Calendar sync is disabled' });
      }

      // Sync events from Google Calendar
      console.log('Starting Google Calendar sync for user:', user.id);
      const googleEvents = await googleCalendarService.syncFromGoogle(integration, integration.lastSyncAt || undefined);
      
      console.log(`Received ${googleEvents.length} events from Google Calendar`);
      googleEvents.forEach(event => {
        console.log(`- ${event.summary} (${event.start?.date || event.start?.dateTime}) - Status: ${event.status}`);
      });
      
      // Process and save Google events to local calendar
      let syncedCount = 0;
      for (const googleEvent of googleEvents) {
        if (googleEvent.status === 'cancelled') {
          // Handle deleted events
          continue;
        }

        // Parse start and end dates properly
        const startDate = googleEvent.start?.date || googleEvent.start?.dateTime;
        const endDate = googleEvent.end?.date || googleEvent.end?.dateTime;
        
        if (!startDate) {
          console.log('Skipping event without start date:', googleEvent.summary);
          continue;
        }
        
        const startDateTime = new Date(startDate);
        const endDateTime = endDate ? new Date(endDate) : startDateTime;
        
        // Fix timezone issue - extract time properly from Google Calendar
        let localStartTime = null;
        let localEndTime = null;
        
        if (googleEvent.start?.dateTime) {
          // Google Calendar already provides correct timezone, just extract time
          const timeMatch = googleEvent.start.dateTime.match(/T(\d{2}:\d{2})/);
          localStartTime = timeMatch ? timeMatch[1] : null;
        }
        
        if (googleEvent.end?.dateTime) {
          const timeMatch = googleEvent.end.dateTime.match(/T(\d{2}:\d{2})/);
          localEndTime = timeMatch ? timeMatch[1] : null;
        }
        
        const localEvent = {
          userId: user.id,
          title: googleEvent.summary || 'Google Calendar Event',
          description: googleEvent.description || '',
          eventType: 'personal',
          startDate: startDateTime.toISOString().split('T')[0],
          startTime: localStartTime,
          endDate: endDateTime.toISOString().split('T')[0],
          endTime: localEndTime,
          isAllDay: !!googleEvent.start?.date,
          location: googleEvent.location || null,
          googleEventId: googleEvent.id,
          syncedToGoogle: true,
          priority: 'medium',
          status: 'confirmed',
          color: '#4285F4', // Google Calendar blue
          isAvailability: false
        };
        
        console.log(`Syncing: "${googleEvent.summary}" on ${localEvent.startDate} ${localEvent.startTime || 'all-day'}`);

        // Check if event already exists
        const existingEvents = await storage.getCalendarEvents(user.id);
        const existingEvent = existingEvents.find(e => e.googleEventId === googleEvent.id);
        
        if (existingEvent) {
          // Update existing event
          await storage.updateCalendarEvent(existingEvent.id, localEvent);
          console.log(`Updated existing event: ${googleEvent.summary}`);
        } else {
          // Create new event
          await storage.createCalendarEvent(localEvent);
          console.log(`Created new event: ${googleEvent.summary} on ${localEvent.startDate}`);
        }
        
        syncedCount++;
      }

      // Update last sync time
      await storage.updateGoogleCalendarIntegration(user.id, {
        lastSyncAt: new Date()
      });

      res.json({ 
        message: 'Google Calendar sync completed',
        syncedEvents: syncedCount
      });
    } catch (error) {
      console.error('Error syncing Google Calendar:', error);
      res.status(500).json({ message: 'Failed to sync Google Calendar' });
    }
  });

  // Toggle Google Calendar sync
  app.patch('/api/google-calendar/sync-settings', authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const user = req.user!;
      const { syncEnabled } = req.body;
      
      const integration = await storage.updateGoogleCalendarIntegration(user.id, {
        syncEnabled: syncEnabled
      });
      
      if (!integration) {
        return res.status(404).json({ message: 'Google Calendar integration not found' });
      }

      res.json({ 
        message: syncEnabled ? 'Google Calendar sync enabled' : 'Google Calendar sync disabled',
        syncEnabled: integration.syncEnabled
      });
    } catch (error) {
      console.error('Error updating Google Calendar sync settings:', error);
      res.status(500).json({ message: 'Failed to update sync settings' });
    }
  });

  return httpServer;
}
