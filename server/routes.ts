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
  insertSubAdminSchema
} from "@shared/schema";
import { getSessionConfig, authenticateUser, requireRole, requireOrganization } from "./auth";
import multer from "multer";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";

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
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
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
      maintenanceVendorId: req.user!.maintenanceVendorId
    });
  });

  // Root admin routes for managing organizations and vendors
  app.get('/api/organizations', authenticateUser, requireRole(['root', 'org_admin']), async (req, res) => {
    try {
      // If user is org_admin, only return their organization
      if (req.user!.role === 'org_admin') {
        const organization = await storage.getOrganization(req.user!.organizationId!);
        res.json(organization ? [organization] : []);
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

  app.post('/api/organizations/:id/reset-admin-password', authenticateUser, requireRole(['root']), async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { newPassword } = req.body;
      const result = await storage.resetOrganizationAdminPassword(id, newPassword);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Failed to reset admin password' });
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
      const { assignedOrganizations, ...vendorUpdates } = updates;
      
      const vendor = await storage.updateMaintenanceVendor(id, vendorUpdates);
      if (!vendor) {
        return res.status(404).json({ message: 'Vendor not found' });
      }
      
      // Update organization assignments if specified
      if (assignedOrganizations !== undefined) {
        // Remove existing assignments and add new ones
        // Note: This is a simplified approach - in production you might want more granular control
        for (const orgId of assignedOrganizations) {
          await storage.assignVendorToOrganization(id, orgId, "tier_1");
        }
      }
      
      res.json(vendor);
    } catch (error) {
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
  app.get('/api/organizations/:organizationId/sub-admins', authenticateUser, requireRole(['root', 'org_admin']), async (req, res) => {
    try {
      const organizationId = parseInt(req.params.organizationId);
      
      // If user is org_admin, ensure they can only access their own organization
      if (req.user!.role === 'org_admin' && req.user!.organizationId !== organizationId) {
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
      const subAdmin = await storage.updateSubAdmin(id, req.body);
      if (!subAdmin) {
        return res.status(404).json({ message: 'Sub-admin not found' });
      }
      res.json(subAdmin);
    } catch (error) {
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

  app.get('/api/organizations/:organizationId/vendor-tiers', authenticateUser, requireRole(['root', 'org_admin']), async (req, res) => {
    try {
      const organizationId = parseInt(req.params.organizationId);
      
      // Only allow org admins to see their own organization's vendor tiers
      if (req.user!.role === 'org_admin' && req.user!.organizationId !== organizationId) {
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
  app.get("/api/tickets", async (req, res) => {
    try {
      const { status, organizationId, maintenanceVendorId } = req.query;
      let tickets;
      
      // Parse query parameters
      const orgId = organizationId ? parseInt(organizationId as string) : undefined;
      const vendorId = maintenanceVendorId ? parseInt(maintenanceVendorId as string) : undefined;
      
      if (status && typeof status === 'string') {
        tickets = await storage.getTicketsByStatus(status, orgId);
      } else {
        tickets = await storage.getTickets(orgId);
      }
      
      // Filter by maintenance vendor if specified
      if (vendorId) {
        tickets = tickets.filter(ticket => ticket.maintenanceVendorId === vendorId);
      }
      
      res.json(tickets);
    } catch (error) {
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
          open: vendorTickets.filter(t => t.status === 'open').length,
          inProgress: vendorTickets.filter(t => t.status === 'in-progress').length,
          completed: vendorTickets.filter(t => t.status === 'completed').length,
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
        images: imageUrls,
      };
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

  // Accept ticket (assign to current user)
  app.post("/api/tickets/:id/accept", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const ticket = await storage.updateTicket(id, {
        status: "in-progress",
        assigneeId: req.user?.id || 1
      });
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to accept ticket" });
    }
  });

  // Complete ticket
  app.post("/api/tickets/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const ticket = await storage.updateTicket(id, {
        status: "completed"
      });
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ message: "Failed to complete ticket" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
