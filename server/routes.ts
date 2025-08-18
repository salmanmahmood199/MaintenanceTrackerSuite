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
  insertResidentialUserSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  type Ticket,
  type User,
  type AuthenticatedRequest,
} from "@shared/schema";
import { generateResetToken, sendPasswordResetEmail, sendPasswordResetConfirmationEmail, sendResidentialWelcomeEmail } from "./email-service";
import {
  getSessionConfig,
  authenticateUser,
  requireRole,
  requireOrganization,
} from "./auth";
import { processUserQuery } from "./gemini";
import { googleCalendarService } from "./google-calendar";
import multer from "multer";
import bcrypt from "bcrypt";
import path from "path";
import fs from "fs";
import nodemailer from "nodemailer";
import { getLocationFromIP, getServiceContent, generateLocationSpecificContent } from './utils/locationService';
import { db } from "./db";
import { and, eq, desc, inArray } from "drizzle-orm";
import { invoices, tickets } from "@shared/schema";
import { z } from "zod";

// Configure multer for image uploads
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void,
  ) => {
    cb(null, uploadDir);
  },
  filename: (
    req: Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void,
  ) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage: storage_multer,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB to accommodate videos
  },
  fileFilter: (
    req: Request,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback,
  ) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image and video files are allowed"));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize session middleware
  app.use(getSessionConfig());

  // Initialize root user
  await storage.initializeRootUser();

  // Serve uploaded images
  app.use("/uploads", express.static(uploadDir));

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.verifyUser(email, password);

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
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
          maintenanceVendorId: user.maintenanceVendorId,
        },
      });
    } catch (error: any) {
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Residential user registration
  app.post("/api/auth/register/residential", async (req, res) => {
    try {
      const validatedData = insertResidentialUserSchema.parse(req.body);

      // Check if email already exists across all tables
      const emailExists = await storage.checkEmailExists(validatedData.email);
      if (emailExists) {
        return res
          .status(400)
          .json({ message: "Email address is already in use" });
      }

      // Check if phone already exists across all tables
      const phoneExists = await storage.checkPhoneExists(validatedData.phone);
      if (phoneExists) {
        return res
          .status(400)
          .json({ message: "Phone number is already in use" });
      }

      const user = await storage.createResidentialUser(validatedData);

      // Send welcome email (don't fail registration if email fails)
      try {
        await sendResidentialWelcomeEmail(
          user.email, 
          user.firstName || '', 
          user.lastName || ''
        );
        console.log(`Welcome email sent to new residential user: ${user.email}`);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
        // Don't fail the registration if email fails
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      res.status(201).json({
        message: "Residential user registered successfully",
        user: userWithoutPassword,
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.get("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.redirect("/");
    });
  });

  app.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.redirect("/");
    });
  });

  app.get("/api/auth/user", authenticateUser, (req, res) => {
    res.json({
      id: req.user!.id,
      email: req.user!.email,
      firstName: req.user!.firstName,
      lastName: req.user!.lastName,
      role: req.user!.role,
      organizationId: req.user!.organizationId,
      maintenanceVendorId: req.user!.maintenanceVendorId,
      permissions: req.user!.permissions,
      vendorTiers: req.user!.vendorTiers,
      // Include residential address fields for residential users
      address: req.user!.address,
      city: req.user!.city,
      state: req.user!.state,
      zipCode: req.user!.zipCode,
    });
  });

  // Password reset routes
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ message: "If the email exists, a password reset link has been sent." });
      }

      // Generate reset token (15 minutes expiry)
      const resetToken = generateResetToken();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Clean up expired tokens first
      await storage.deleteExpiredPasswordResetTokens();

      // Create password reset token
      await storage.createPasswordResetToken(user.id, resetToken, expiresAt);

      // Send password reset email
      await sendPasswordResetEmail(email, resetToken, user.firstName || '');

      res.json({ message: "If the email exists, a password reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);
      
      // Verify reset token
      const resetToken = await storage.getPasswordResetToken(validatedData.token);
      if (!resetToken) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Get user
      const user = await storage.getUser(resetToken.userId);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      // Update user password
      const passwordUpdated = await storage.updateUserPassword(resetToken.userId, validatedData.password);
      if (!passwordUpdated) {
        return res.status(500).json({ message: "Failed to update password" });
      }

      // Mark token as used
      await storage.markPasswordResetTokenAsUsed(validatedData.token);

      // Send confirmation email
      try {
        await sendPasswordResetConfirmationEmail(user.email, user.firstName || '');
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
        // Don't fail the password reset if confirmation email fails
      }

      res.json({ message: "Password reset successful" });
    } catch (error) {
      console.error("Reset password error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation error",
          errors: error.errors,
        });
      }
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // AI Assistant route
  app.post("/api/ai/query", authenticateUser, processUserQuery);

  // Root admin routes for managing organizations and vendors
  app.get(
    "/api/organizations",
    authenticateUser,
    requireRole(["root", "org_admin", "org_subadmin", "maintenance_admin"]),
    async (req, res) => {
      try {
        // If user is org_admin or org_subadmin, only return their organization
        if (
          req.user!.role === "org_admin" ||
          req.user!.role === "org_subadmin"
        ) {
          const organization = await storage.getOrganization(
            req.user!.organizationId!,
          );
          res.json(organization ? [organization] : []);
        } else if (req.user!.role === "maintenance_admin") {
          // Maintenance admin gets all organizations (needed for invoice creation)
          const organizations = await storage.getOrganizations();
          res.json(organizations);
        } else {
          // Root user gets all organizations
          const organizations = await storage.getOrganizations();
          res.json(organizations);
        }
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch organizations" });
      }
    },
  );

  app.post(
    "/api/organizations",
    authenticateUser,
    requireRole(["root"]),
    async (req, res) => {
      try {
        const orgData = insertOrganizationSchema.parse(req.body);

        // Check if email already exists across all tables
        if (orgData.email) {
          const emailExists = await storage.checkEmailExists(orgData.email);
          if (emailExists) {
            return res
              .status(400)
              .json({ message: "Email address is already in use" });
          }
        }

        // Check if phone already exists across all tables
        if (orgData.phone) {
          const phoneExists = await storage.checkPhoneExists(orgData.phone);
          if (phoneExists) {
            return res
              .status(400)
              .json({ message: "Phone number is already in use" });
          }
        }

        const organization = await storage.createOrganization(orgData);
        res.status(201).json(organization);
      } catch (error: any) {
        if (error.name === "ZodError") {
          res.status(400).json({
            message: "Invalid organization data",
            errors: error.errors,
          });
        } else {
          res.status(500).json({ message: "Failed to create organization" });
        }
      }
    },
  );

  app.patch(
    "/api/organizations/:id",
    authenticateUser,
    requireRole(["root"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const updates = req.body;
        const organization = await storage.updateOrganization(id, updates);
        if (!organization) {
          return res.status(404).json({ message: "Organization not found" });
        }
        res.json(organization);
      } catch (error) {
        res.status(500).json({ message: "Failed to update organization" });
      }
    },
  );

  app.post(
    "/api/organizations/:id/reset-admin-password",
    authenticateUser,
    requireRole(["root"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
          return res
            .status(400)
            .json({ message: "Password must be at least 6 characters long" });
        }

        const result = await storage.resetOrganizationAdminPassword(
          id,
          newPassword,
        );
        res.json(result);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to reset organization admin password" });
      }
    },
  );

  app.delete(
    "/api/organizations/:id",
    authenticateUser,
    requireRole(["root"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const success = await storage.deleteOrganization(id);
        if (!success) {
          return res.status(404).json({ message: "Organization not found" });
        }
        res.json({ message: "Organization deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: "Failed to delete organization" });
      }
    },
  );

  app.get(
    "/api/maintenance-vendors",
    authenticateUser,
    requireRole(["root", "maintenance_admin", "org_admin", "org_subadmin"]),
    async (req, res) => {
      try {
        const user = req.user!;
        
        if (user.role === "maintenance_admin") {
          // Return only their own vendor
          const vendor = await storage.getMaintenanceVendor(user.maintenanceVendorId!);
          res.json(vendor ? [vendor] : []);
        } else if (user.role === "org_admin" || user.role === "org_subadmin") {
          // For organization users, return vendors assigned to their organization with tiers
          const vendorsWithTiers = await storage.getOrganizationVendors(user.organizationId!);
          res.json(vendorsWithTiers);
        } else {
          // Root can see all vendors
          const vendors = await storage.getMaintenanceVendors();
          res.json(vendors);
        }
      } catch (error) {
        console.error("Error fetching maintenance vendors:", error);
        res.status(500).json({ message: "Failed to fetch maintenance vendors" });
      }
    },
  );

  app.post(
    "/api/maintenance-vendors",
    authenticateUser,
    requireRole(["root"]),
    async (req, res) => {
      try {
        const vendorData = insertMaintenanceVendorSchema.parse(req.body);
        const { assignedOrganizations, ...vendorInfo } = vendorData;

        // Check if email already exists across all tables
        if (vendorInfo.email) {
          const emailExists = await storage.checkEmailExists(vendorInfo.email);
          if (emailExists) {
            return res
              .status(400)
              .json({ message: "Email address is already in use" });
          }
        }

        // Check if phone already exists across all tables
        if (vendorInfo.phone) {
          const phoneExists = await storage.checkPhoneExists(vendorInfo.phone);
          if (phoneExists) {
            return res
              .status(400)
              .json({ message: "Phone number is already in use" });
          }
        }

        const vendor = await storage.createMaintenanceVendor(vendorInfo);

        // Assign vendor to organizations if specified
        if (assignedOrganizations && assignedOrganizations.length > 0) {
          for (const orgId of assignedOrganizations) {
            await storage.assignVendorToOrganization(
              vendor.id,
              orgId,
              "tier_1",
            );
          }
        }

        res.status(201).json(vendor);
      } catch (error: any) {
        if (error.name === "ZodError") {
          res
            .status(400)
            .json({ message: "Invalid vendor data", errors: error.errors });
        } else {
          res
            .status(500)
            .json({ message: "Failed to create maintenance vendor" });
        }
      }
    },
  );

  app.patch(
    "/api/maintenance-vendors/:id",
    authenticateUser,
    requireRole(["root"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const updates = req.body;
        const {
          assignedOrganizations,
          hasMarketplaceAccess,
          ...vendorUpdates
        } = updates;

        // Filter out undefined/null values and validate data
        const cleanUpdates = Object.fromEntries(
          Object.entries(vendorUpdates).filter(
            ([_, value]) => value !== undefined && value !== null,
          ),
        );

        const vendor = await storage.updateMaintenanceVendor(id, cleanUpdates);
        if (!vendor) {
          return res.status(404).json({ message: "Vendor not found" });
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
              await storage.assignVendorToOrganization(
                id,
                orgId,
                "marketplace",
              );
            }
          }
        }

        res.json(vendor);
      } catch (error) {
        console.error("Vendor update error:", error);
        res.status(500).json({ message: "Failed to update vendor" });
      }
    },
  );

  app.post(
    "/api/maintenance-vendors/:id/reset-admin-password",
    authenticateUser,
    requireRole(["root"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
          return res
            .status(400)
            .json({ message: "Password must be at least 6 characters long" });
        }

        const result = await storage.resetVendorAdminPassword(id, newPassword);
        res.json(result);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to reset vendor admin password" });
      }
    },
  );

  app.get(
    "/api/maintenance-vendors/:id/organizations",
    authenticateUser,
    requireRole(["root"]),
    async (req, res) => {
      try {
        const vendorId = parseInt(req.params.id);
        const assignments =
          await storage.getVendorOrganizationAssignments(vendorId);
        res.json(assignments);
      } catch (error) {
        console.error("Error fetching vendor organization assignments:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch vendor organization assignments" });
      }
    },
  );

  app.delete(
    "/api/maintenance-vendors/:id",
    authenticateUser,
    requireRole(["root"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const success = await storage.deleteMaintenanceVendor(id);
        if (!success) {
          return res.status(404).json({ message: "Vendor not found" });
        }
        res.json({ message: "Vendor deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: "Failed to delete vendor" });
      }
    },
  );

  app.post(
    "/api/maintenance-vendors/:id/reset-admin-password",
    authenticateUser,
    requireRole(["root"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const { newPassword } = req.body;
        const result = await storage.resetVendorAdminPassword(id, newPassword);
        res.json(result);
      } catch (error) {
        res.status(500).json({ message: "Failed to reset admin password" });
      }
    },
  );

  // Sub-admin management routes
  app.get(
    "/api/organizations/:organizationId/sub-admins",
    authenticateUser,
    requireRole(["root", "org_admin", "org_subadmin"]),
    async (req, res) => {
      try {
        const organizationId = parseInt(req.params.organizationId);

        // If user is org_admin or org_subadmin, ensure they can only access their own organization
        if (
          (req.user!.role === "org_admin" ||
            req.user!.role === "org_subadmin") &&
          req.user!.organizationId !== organizationId
        ) {
          return res
            .status(403)
            .json({ message: "Access denied to this organization" });
        }

        const subAdmins = await storage.getSubAdmins(organizationId);
        res.json(subAdmins);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch sub-admins" });
      }
    },
  );

  app.post(
    "/api/organizations/:organizationId/sub-admins",
    authenticateUser,
    requireRole(["root", "org_admin"]),
    async (req, res) => {
      try {
        const organizationId = parseInt(req.params.organizationId);

        // If user is org_admin, ensure they can only create sub-admins for their own organization
        if (
          req.user!.role === "org_admin" &&
          req.user!.organizationId !== organizationId
        ) {
          return res
            .status(403)
            .json({ message: "Access denied to this organization" });
        }

        const validatedData = insertSubAdminSchema.parse(req.body);

        // Check if email already exists across all tables
        const emailExists = await storage.checkEmailExists(validatedData.email);
        if (emailExists) {
          return res
            .status(400)
            .json({ message: "Email address is already in use" });
        }

        // Check if phone already exists across all tables
        if (validatedData.phone) {
          const phoneExists = await storage.checkPhoneExists(
            validatedData.phone,
          );
          if (phoneExists) {
            return res
              .status(400)
              .json({ message: "Phone number is already in use" });
          }
        }

        const subAdmin = await storage.createSubAdmin(
          validatedData,
          organizationId,
        );
        res.status(201).json(subAdmin);
      } catch (error) {
        res.status(500).json({ message: "Failed to create sub-admin" });
      }
    },
  );

  app.put(
    "/api/sub-admins/:id",
    authenticateUser,
    requireRole(["root", "org_admin"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);

        // Validate the input using partial sub-admin schema
        const editSubAdminSchema = insertSubAdminSchema
          .omit({ password: true })
          .partial();
        const result = editSubAdminSchema.safeParse(req.body);

        if (!result.success) {
          return res
            .status(400)
            .json({ message: "Invalid input", errors: result.error.errors });
        }

        const subAdmin = await storage.updateSubAdmin(id, result.data);
        if (!subAdmin) {
          return res.status(404).json({ message: "Sub-admin not found" });
        }
        res.json(subAdmin);
      } catch (error) {
        console.error("Error updating sub-admin:", error);
        res.status(500).json({ message: "Failed to update sub-admin" });
      }
    },
  );

  app.delete(
    "/api/sub-admins/:id",
    authenticateUser,
    requireRole(["root", "org_admin"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const success = await storage.deleteSubAdmin(id);
        if (!success) {
          return res.status(404).json({ message: "Sub-admin not found" });
        }
        res.json({ message: "Sub-admin deleted successfully" });
      } catch (error) {
        res.status(500).json({ message: "Failed to delete sub-admin" });
      }
    },
  );

  app.post(
    "/api/sub-admins/:id/reset-password",
    authenticateUser,
    requireRole(["root", "org_admin"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const newPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await storage.updateSubAdmin(id, {
          password: hashedPassword,
        });
        if (!user) {
          return res.status(404).json({ message: "Sub-admin not found" });
        }

        res.json({ newPassword });
      } catch (error) {
        res.status(500).json({ message: "Failed to reset password" });
      }
    },
  );

  // Vendor-Organization tier management routes
  app.post(
    "/api/organizations/:organizationId/vendors/:vendorId/tier",
    authenticateUser,
    requireRole(["root", "org_admin"]),
    async (req, res) => {
      try {
        const organizationId = parseInt(req.params.organizationId);
        const vendorId = parseInt(req.params.vendorId);
        const { tier } = req.body;

        await storage.assignVendorToOrganization(
          vendorId,
          organizationId,
          tier,
        );
        res.json({ message: "Vendor tier assigned successfully" });
      } catch (error) {
        res.status(500).json({ message: "Failed to assign vendor tier" });
      }
    },
  );

  app.get(
    "/api/organizations/:organizationId/vendor-tiers",
    authenticateUser,
    requireRole(["root", "org_admin", "org_subadmin"]),
    async (req, res) => {
      try {
        const organizationId = parseInt(req.params.organizationId);

        // Only allow org admins and org_subadmins to see their own organization's vendor tiers
        if (
          (req.user!.role === "org_admin" ||
            req.user!.role === "org_subadmin") &&
          req.user!.organizationId !== organizationId
        ) {
          return res.status(403).json({ message: "Access denied" });
        }

        const vendorTiers =
          await storage.getVendorOrganizationTiers(organizationId);
        res.json(vendorTiers);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch vendor tiers" });
      }
    },
  );

  app.patch(
    "/api/organizations/:organizationId/vendors/:vendorId/tier",
    authenticateUser,
    requireRole(["root", "org_admin"]),
    async (req, res) => {
      try {
        const organizationId = parseInt(req.params.organizationId);
        const vendorId = parseInt(req.params.vendorId);
        const { tier, isActive } = req.body;

        // Only allow org admins to manage their own organization's vendors
        if (
          req.user!.role === "org_admin" &&
          req.user!.organizationId !== organizationId
        ) {
          return res.status(403).json({ message: "Access denied" });
        }

        await storage.updateVendorOrganizationTier(vendorId, organizationId, {
          tier,
          isActive,
        });
        res.json({ message: "Vendor tier updated successfully" });
      } catch (error) {
        res.status(500).json({ message: "Failed to update vendor tier" });
      }
    },
  );

  // Vendor tier filtering route
  app.get(
    "/api/maintenance-vendors/by-tiers",
    authenticateUser,
    async (req, res) => {
      try {
        const tiers = req.query.tiers as string;
        const tierArray = tiers ? tiers.split(",") : [];
        const vendors = await storage.getMaintenanceVendorsByTier(tierArray);
        res.json(vendors);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch vendors by tier" });
      }
    },
  );

  // Organization sub-admin routes
  app.get(
    "/api/organizations/:id/sub-admins",
    authenticateUser,
    requireRole(["root", "org_admin"]),
    async (req, res) => {
      try {
        const organizationId = parseInt(req.params.id);
        const subAdmins = await storage.getSubAdmins(organizationId);
        res.json(subAdmins);
      } catch (error) {
        console.error("Error fetching sub-admins:", error);
        res.status(500).json({ message: "Failed to fetch sub-admins" });
      }
    },
  );

  app.post(
    "/api/organizations/:id/sub-admins",
    authenticateUser,
    requireRole(["root", "org_admin"]),
    async (req, res) => {
      try {
        const organizationId = parseInt(req.params.id);
        const result = insertSubAdminSchema.safeParse(req.body);

        if (!result.success) {
          return res
            .status(400)
            .json({ message: "Invalid input", errors: result.error.errors });
        }

        const subAdmin = await storage.createSubAdmin(
          result.data,
          organizationId,
        );
        res.json(subAdmin);
      } catch (error) {
        console.error("Error creating sub-admin:", error);
        res.status(500).json({ message: "Failed to create sub-admin" });
      }
    },
  );

  app.put(
    "/api/organizations/:orgId/sub-admins/:id",
    authenticateUser,
    requireRole(["root", "org_admin"]),
    async (req, res) => {
      try {
        const subAdminId = parseInt(req.params.id);
        const result = insertSubAdminSchema.partial().safeParse(req.body);

        if (!result.success) {
          return res
            .status(400)
            .json({ message: "Invalid input", errors: result.error.errors });
        }

        const updatedSubAdmin = await storage.updateSubAdmin(
          subAdminId,
          result.data,
        );
        if (!updatedSubAdmin) {
          return res.status(404).json({ message: "Sub-admin not found" });
        }

        res.json(updatedSubAdmin);
      } catch (error) {
        console.error("Error updating sub-admin:", error);
        res.status(500).json({ message: "Failed to update sub-admin" });
      }
    },
  );

  app.delete(
    "/api/organizations/:orgId/sub-admins/:id",
    authenticateUser,
    requireRole(["root", "org_admin"]),
    async (req, res) => {
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
    },
  );

  // Users management routes
  app.post(
    "/api/users",
    authenticateUser,
    requireRole(["root", "org_admin", "maintenance_admin"]),
    async (req, res) => {
      try {
        const userData = insertUserSchema.parse(req.body);

        // Validation based on current user role
        if (
          req.user!.role === "org_admin" &&
          userData.role !== "org_admin" &&
          userData.organizationId !== req.user!.organizationId
        ) {
          return res
            .status(403)
            .json({ message: "Cannot create users outside your organization" });
        }

        if (
          req.user!.role === "maintenance_admin" &&
          userData.role !== "technician" &&
          userData.maintenanceVendorId !== req.user!.maintenanceVendorId
        ) {
          return res.status(403).json({
            message: "Cannot create users outside your maintenance vendor",
          });
        }

        // Check if email already exists across all tables
        const emailExists = await storage.checkEmailExists(userData.email);
        if (emailExists) {
          return res
            .status(400)
            .json({ message: "Email address is already in use" });
        }

        // Check if phone already exists across all tables
        if (userData.phone) {
          const phoneExists = await storage.checkPhoneExists(userData.phone);
          if (phoneExists) {
            return res
              .status(400)
              .json({ message: "Phone number is already in use" });
          }
        }

        const user = await storage.createUser(userData);
        res.status(201).json({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          organizationId: user.organizationId,
          maintenanceVendorId: user.maintenanceVendorId,
        });
      } catch (error: any) {
        if (error.name === "ZodError") {
          res
            .status(400)
            .json({ message: "Invalid user data", errors: error.errors });
        } else {
          res.status(500).json({ message: "Failed to create user" });
        }
      }
    },
  );

  // Get all tickets
  app.get(
    "/api/tickets",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;
        const organizationId = req.query.organizationId
          ? parseInt(req.query.organizationId as string)
          : undefined;
        const maintenanceVendorId = req.query.maintenanceVendorId
          ? parseInt(req.query.maintenanceVendorId as string)
          : undefined;
        const status = req.query.status as string;

        let tickets;

        if (user.role === "root") {
          if (organizationId) {
            tickets = await storage.getTickets(organizationId);
          } else if (maintenanceVendorId) {
            tickets = await storage.getTickets();
            tickets = tickets.filter(
              (ticket) => ticket.maintenanceVendorId === maintenanceVendorId,
            );
          } else {
            tickets = await storage.getTickets();
          }
        } else if (user.role === "org_admin") {
          tickets = await storage.getTickets(user.organizationId!);
        } else if (user.role === "org_subadmin") {
          // Get user's assigned locations for filtering
          const userLocations = await storage.getUserLocationAssignments(
            user.id,
          );
          const locationIds = userLocations.map((loc) => loc.id);
          tickets = await storage.getTickets(user.organizationId!, locationIds);
        } else if (user.role === "maintenance_admin") {
          // SECURITY FIX: Vendors should ONLY see tickets specifically assigned to them
          tickets = await storage.getTickets();
          console.log(`Before filtering: Total tickets: ${tickets.length}`);
          console.log(`Filtering for vendor ID: ${user.maintenanceVendorId}`);
          
          tickets = tickets.filter((ticket) => {
            const isAssignedToVendor = ticket.maintenanceVendorId === user.maintenanceVendorId;
            const hasVendorAssigned = ticket.maintenanceVendorId !== null && ticket.maintenanceVendorId !== undefined;
            const shouldInclude = isAssignedToVendor && hasVendorAssigned;
            
            // Debug problematic tickets
            if (!shouldInclude && ticket.ticketNumber === 'NSRP-853238-J0K') {
              console.log(`DEBUG ticket NSRP-853238-J0K: vendorId=${ticket.maintenanceVendorId}, userVendorId=${user.maintenanceVendorId}, isAssigned=${isAssignedToVendor}, hasVendor=${hasVendorAssigned}`);
            }
            
            return shouldInclude;
          });
          
          console.log(
            `Vendor ${user.maintenanceVendorId} filtering complete. Found ${tickets.length} tickets assigned to them.`
          );
          
          // Check if any problematic tickets slipped through
          const problematicTickets = tickets.filter(t => t.maintenanceVendorId === null || t.maintenanceVendorId !== user.maintenanceVendorId);
          if (problematicTickets.length > 0) {
            console.error('SECURITY WARNING: Problematic tickets found in vendor results:', problematicTickets.map(t => ({
              id: t.id,
              number: t.ticketNumber,
              vendorId: t.maintenanceVendorId,
              userVendorId: user.maintenanceVendorId
            })));
          }
        } else if (user.role === "technician") {
          // SECURITY FIX: Technicians should ONLY see tickets specifically assigned to them
          tickets = await storage.getTickets();
          tickets = tickets.filter((ticket) => ticket.assigneeId === user.id && ticket.assigneeId !== null);
        } else if (user.role === "residential") {
          // Residential users can only see their own tickets
          tickets = await storage.getTickets();
          tickets = tickets.filter((ticket) => ticket.reporterId === user.id);
        } else {
          return res.status(403).json({ message: "Unauthorized" });
        }

        if (status) {
          tickets = tickets.filter((ticket) => ticket.status === status);
        }
        
        // Final security check before sending response
        if (user.role === "maintenance_admin") {
          const finalSecurityCheck = tickets.some(t => t.maintenanceVendorId !== user.maintenanceVendorId || t.maintenanceVendorId === null);
          if (finalSecurityCheck) {
            console.error('CRITICAL SECURITY ERROR: Unauthorized tickets in final response for vendor', user.maintenanceVendorId);
            tickets = tickets.filter(t => t.maintenanceVendorId === user.maintenanceVendorId && t.maintenanceVendorId !== null);
          }
        }
        
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.json(tickets);
      } catch (error) {
        console.error("Error fetching tickets:", error);
        res.status(500).json({ message: "Failed to fetch tickets" });
      }
    },
  );

  // Get ticket stats
  app.get("/api/tickets/stats", async (req, res) => {
    try {
      const { organizationId, maintenanceVendorId } = req.query;
      const orgId = organizationId
        ? parseInt(organizationId as string)
        : undefined;
      const vendorId = maintenanceVendorId
        ? parseInt(maintenanceVendorId as string)
        : undefined;

      let stats = await storage.getTicketStats(orgId);

      // If filtering by vendor, get all tickets and calculate stats for that vendor
      if (vendorId) {
        const allTickets = await storage.getTickets(orgId);
        const vendorTickets = allTickets.filter(
          (ticket) => ticket.maintenanceVendorId === vendorId,
        );

        stats = {
          pending: vendorTickets.filter((t) => t.status === "pending").length,
          accepted: vendorTickets.filter((t) => t.status === "accepted").length,
          inProgress: vendorTickets.filter((t) => t.status === "in-progress")
            .length,
          completed: vendorTickets.filter((t) => t.status === "completed")
            .length,
          pendingConfirmation: vendorTickets.filter(
            (t) => t.status === "pending_confirmation",
          ).length,
          confirmed: vendorTickets.filter((t) => t.status === "confirmed")
            .length,
          highPriority: vendorTickets.filter((t) => t.priority === "high")
            .length,
        };
      }

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ticket stats" });
    }
  });

  // Create new ticket with image upload
  app.post(
    "/api/tickets",
    upload.array("images", 5),
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;
        const files = req.files as Express.Multer.File[];
        const imageUrls = files
          ? files.map((file) => `/uploads/${file.filename}`)
          : [];

        // Handle residential users differently
        if (user.role === "residential") {
          let residentialAddress,
            residentialCity,
            residentialState,
            residentialZip;

          // Check if user wants to use home address or provided new address
          if (req.body.useHomeAddress === "true") {
            residentialAddress = user.address;
            residentialCity = user.city;
            residentialState = user.state;
            residentialZip = user.zipCode;
          } else {
            // Use provided service address
            residentialAddress = req.body.address;
            residentialCity = req.body.city;
            residentialState = req.body.state;
            residentialZip = req.body.zipCode;

            // If address2 is provided, combine it with address
            if (req.body.address2) {
              residentialAddress = `${req.body.address}, ${req.body.address2}`;
            }
          }

          const ticketData = {
            title: req.body.title,
            description: req.body.description,
            priority: req.body.priority,
            status: "marketplace", // Automatically assign to marketplace
            organizationId: null, // No organization for residential
            reporterId: user.id,
            locationId: null,
            residentialAddress,
            residentialCity,
            residentialState,
            residentialZip,
            images: imageUrls,
          };

          console.log("Creating residential ticket:", ticketData);

          const validatedData = insertTicketSchema.parse(ticketData);
          const ticket = await storage.createTicket(validatedData);

          res.status(201).json(ticket);
          return;
        }

        // Handle organization users (existing logic)
        const ticketData = {
          title: req.body.title,
          description: req.body.description,
          priority: req.body.priority,
          status: req.body.status || "pending",
          organizationId:
            parseInt(req.body.organizationId) || user.organizationId || 1,
          reporterId: user.id,
          locationId: req.body.locationId
            ? parseInt(req.body.locationId)
            : null,
          images: imageUrls,
        };

        console.log("Received ticket data:", ticketData);
        console.log("Request body locationId:", req.body.locationId);

        const validatedData = insertTicketSchema.parse(ticketData);
        const ticket = await storage.createTicket(validatedData);

        res.status(201).json(ticket);
      } catch (error: any) {
        console.error("Create ticket error:", error);
        if (error.name === "ZodError") {
          res
            .status(400)
            .json({ message: "Invalid ticket data", errors: error.errors });
        } else {
          res.status(500).json({ message: "Failed to create ticket" });
        }
      }
    },
  );

  // Get single ticket with detailed information
  app.get("/api/tickets/:id", authenticateUser, async (req: AuthenticatedRequest, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = req.user!;
      
      // Get the ticket with detailed information
      const tickets = await storage.getTickets();
      const ticket = tickets.find(t => t.id === id);
      
      if (!ticket) {
        return res.status(404).json({ message: "Ticket not found" });
      }
      
      // Check access permissions
      let hasAccess = false;
      if (user.role === "root") {
        hasAccess = true;
      } else if (user.role === "org_admin" && ticket.organizationId === user.organizationId) {
        hasAccess = true;
      } else if (user.role === "org_subadmin" && ticket.organizationId === user.organizationId) {
        // Check if user has access to the ticket's location or if it's a marketplace user
        const userLocations = await storage.getUserLocationAssignments(user.id);
        const locationIds = userLocations.map((loc) => loc.id);
        hasAccess = !ticket.locationId || locationIds.includes(ticket.locationId);
        
        // Special case: marketplace users (org_subadmin) can access tickets from their org for bidding
        if (!hasAccess && user.email && user.email.includes('marketplace')) {
          hasAccess = true;
        }
      } else if (user.role === "maintenance_admin") {
        // SECURITY FIX: Maintenance admins can ONLY view tickets specifically assigned to their vendor
        const isAssignedToVendor = ticket.maintenanceVendorId === user.maintenanceVendorId;
        const hasVendorAssigned = ticket.maintenanceVendorId !== null && ticket.maintenanceVendorId !== undefined;
        
        if (isAssignedToVendor && hasVendorAssigned) {
          hasAccess = true;
        } else {
          // Debug access denied cases
          console.log(`Access denied for vendor ${user.maintenanceVendorId} on ticket ${ticket.ticketNumber}: vendorId=${ticket.maintenanceVendorId}, isAssigned=${isAssignedToVendor}, hasVendor=${hasVendorAssigned}`);
        }
        // No access to unassigned pending/marketplace tickets - they should only see assigned tickets
      } else if (user.role === "technician" && ticket.assigneeId === user.id && ticket.assigneeId !== null) {
        hasAccess = true;
      } else if (user.role === "residential" && ticket.reporterId === user.id) {
        hasAccess = true;
      } else if (ticket.organizationId === user.organizationId) {
        // Allow users from same organization to view tickets
        hasAccess = true;
      }
      
      if (!hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Enrich ticket with location details if locationId exists
      let enrichedTicket = { ...ticket };
      if (ticket.locationId) {
        try {
          const location = await storage.getLocation(ticket.locationId);
          if (location) {
            enrichedTicket.locationName = location.name;
            enrichedTicket.locationAddress = location.streetAddress;
            enrichedTicket.locationCity = location.city;
            enrichedTicket.locationState = location.state;
            enrichedTicket.locationZip = location.zipCode;
          }
        } catch (error) {
          console.error("Error fetching location for ticket:", error);
          // Continue without location data
        }
      }
      
      res.json(enrichedTicket);
    } catch (error) {
      console.error("Error fetching ticket:", error);
      res.status(500).json({ message: "Failed to fetch ticket" });
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
      if (error.name === "ZodError") {
        res
          .status(400)
          .json({ message: "Invalid update data", errors: error.errors });
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
  app.post(
    "/api/tickets/:id/milestones",
    authenticateUser,
    async (req: any, res) => {
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

        const milestoneTypeObj = milestoneTypes.find(
          (m) => m.value === milestoneType,
        );
        if (!milestoneTypeObj) {
          return res.status(400).json({ message: "Invalid milestone type" });
        }

        const milestone = await storage.createTicketMilestone({
          ticketId,
          milestoneType,
          milestoneTitle: milestoneTypeObj.label,
          milestoneDescription,
          achievedById: req.user.id,
          achievedByName:
            `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() ||
            req.user.email,
        });

        res.json(milestone);
      } catch (error) {
        console.error("Error creating milestone:", error);
        res.status(500).json({ message: "Failed to create milestone" });
      }
    },
  );

  // Get vendor assignment history for a ticket
  app.get(
    "/api/tickets/:id/vendor-history",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const ticketId = parseInt(req.params.id);
        const user = req.user!;

        // Check if user has access to this ticket
        const ticket = await storage.getTicketById(ticketId);
        if (!ticket) {
          return res.status(404).json({ message: "Ticket not found" });
        }

        // Role-based access control for vendor assignment history
        if (
          user.role === "root" ||
          (user.role === "org_admin" &&
            ticket.organizationId === user.organizationId) ||
          (user.role === "maintenance_admin" &&
            ticket.maintenanceVendorId === user.maintenanceVendorId) ||
          (user.role === "org_subadmin" &&
            ticket.organizationId === user.organizationId)
        ) {
          const history = await storage.getVendorAssignmentHistory(ticketId);
          res.json(history);
        } else {
          res.status(403).json({
            message:
              "Insufficient permissions to view vendor assignment history",
          });
        }
      } catch (error) {
        console.error("Error fetching vendor assignment history:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch vendor assignment history" });
      }
    },
  );

  // Accept ticket and assign to maintenance vendor
  app.post(
    "/api/tickets/:id/accept",
    authenticateUser,
    (req, res, next) => {
      const user = req.user as any;
      // Allow org_admin, maintenance_admin, or org_subadmin with accept_ticket permission
      if (
        ["org_admin", "maintenance_admin"].includes(user.role) ||
        (user.role === "org_subadmin" &&
          user.permissions?.includes("accept_ticket"))
      ) {
        return next();
      }
      return res.status(403).json({ message: "Insufficient permissions" });
    },
    async (req: AuthenticatedRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const {
          maintenanceVendorId,
          assigneeId,
          marketplace,
          estimatedStartDate,
          estimatedEndDate,
          estimatedDuration,
          scheduledStartTime,
          scheduledEndTime,
          etaNotes,
        } = req.body;
        const user = req.user!;

        console.log(`=== ACCEPT TICKET MIDDLEWARE ${id} ===`);
        console.log(`Body received:`, {
          maintenanceVendorId,
          assigneeId,
          marketplace,
          estimatedStartDate,
          estimatedEndDate,
          etaNotes,
        });

        if (marketplace) {
          // Assign ticket to marketplace for bidding
          console.log(`Assigning ticket ${id} to marketplace`);
          const ticket = await storage.assignTicketToMarketplace(id);
          if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
          }
          console.log(`Marketplace assignment result:`, {
            id: ticket.id,
            status: ticket.status,
          });
          res.json(ticket);
        } else {
          // Check for conflicts if technician is assigned with specific schedule
          if (assigneeId && scheduledStartTime && scheduledEndTime) {
            const isAvailable = await storage.checkTechnicianAvailability(
              assigneeId,
              new Date(scheduledStartTime),
              new Date(scheduledEndTime),
            );

            if (!isAvailable) {
              return res.status(409).json({
                message:
                  "Technician is not available during the scheduled time. Please check their calendar and choose a different time slot.",
              });
            }
          }

          // Normal vendor assignment - pass user info for vendor assignment history
          console.log(
            `Calling storage.acceptTicket for ticket ${id} with vendor ${maintenanceVendorId}`,
          );

          // Update the acceptTicket call to include ETA information
          const ticket = await storage.acceptTicket(id, {
            maintenanceVendorId,
            assigneeId,
            estimatedStartDate,
            estimatedEndDate,
            estimatedDuration,
            scheduledStartTime,
            scheduledEndTime,
            etaNotes,
            etaProvidedBy: user.id,
          });

          // Update vendor assignment history with user info after ticket acceptance
          if (ticket && maintenanceVendorId) {
            try {
              // Update the vendor assignment history with proper user info
              const assignedByName =
                `${user.firstName} ${user.lastName}`.trim() || user.email;
              await storage.createVendorAssignmentHistory({
                ticketId: id,
                vendorId: maintenanceVendorId,
                vendorName: "", // Will be filled by storage method
                assignedById: user.id,
                assignedByName,
                assignmentType: "initial",
                status: "assigned",
                assignedAt: new Date(),
                isActive: true,
              });
            } catch (historyError) {
              console.log(
                "Failed to update vendor assignment history with user info:",
                historyError,
              );
            }
          }

          console.log(`Storage result:`, {
            id: ticket?.id,
            vendor: ticket?.maintenanceVendorId,
            assignee: ticket?.assigneeId,
            status: ticket?.status,
          });
          if (!ticket) {
            return res.status(404).json({ message: "Ticket not found" });
          }
          res.json(ticket);
        }
      } catch (error) {
        console.error("Accept ticket error:", error);
        res.status(500).json({ message: "Failed to accept ticket" });
      }
    },
  );

  // Get technician availability and schedule
  app.get(
    "/api/technicians/:id/availability",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const technicianId = parseInt(req.params.id);
        const { startDate, endDate } = req.query;

        const startDateTime = startDate
          ? new Date(startDate as string)
          : new Date();
        const endDateTime = endDate
          ? new Date(endDate as string)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

        const schedule = await storage.getTechnicianSchedule(
          technicianId,
          startDateTime,
          endDateTime,
        );
        res.json(schedule);
      } catch (error) {
        console.error("Error fetching technician availability:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch technician availability" });
      }
    },
  );

  // Check technician availability for specific time slot
  app.post(
    "/api/technicians/:id/check-availability",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const technicianId = parseInt(req.params.id);
        const { startTime, endTime } = req.body;

        const isAvailable = await storage.checkTechnicianAvailability(
          technicianId,
          new Date(startTime),
          new Date(endTime),
        );

        res.json({ available: isAvailable });
      } catch (error) {
        console.error("Error checking technician availability:", error);
        res
          .status(500)
          .json({ message: "Failed to check technician availability" });
      }
    },
  );

  // Assign technician to ticket
  app.post(
    "/api/tickets/:id/assign-technician",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const { assigneeId } = req.body;
        const user = req.user!;

        // Verify user has permission to assign technicians (maintenance_admin)
        if (user.role !== "maintenance_admin") {
          return res.status(403).json({ message: "Only maintenance vendors can assign technicians" });
        }

        // Get the ticket first to verify vendor ownership
        const tickets = await storage.getTickets();
        const ticket = tickets.find(t => t.id === id);
        
        if (!ticket) {
          return res.status(404).json({ message: "Ticket not found" });
        }

        if (ticket.maintenanceVendorId !== user.maintenanceVendorId) {
          return res.status(403).json({ message: "You can only assign technicians to your own tickets" });
        }

        // Verify the technician belongs to this vendor
        const technicians = await storage.getTechnicians(user.maintenanceVendorId!);
        const technician = technicians.find(t => t.id === assigneeId);
        
        if (!technician) {
          return res.status(400).json({ message: "Technician not found or not part of your vendor organization" });
        }

        // Assign the technician using updateTicket
        const updatedTicket = await storage.updateTicket(id, { assigneeId });
        if (!updatedTicket) {
          return res.status(404).json({ message: "Failed to assign technician" });
        }

        res.json({
          message: "Technician assigned successfully",
          ticket: updatedTicket,
          technician: {
            id: technician.id,
            name: `${technician.firstName} ${technician.lastName}`,
            email: technician.email
          }
        });
      } catch (error) {
        console.error("Error assigning technician:", error);
        res.status(500).json({ message: "Failed to assign technician" });
      }
    }
  );

  // Start work on ticket (for technicians)
  app.post(
    "/api/tickets/:id/start",
    authenticateUser,
    requireRole(["technician"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const user = req.user!;

        const ticket = await storage.updateTicket(id, {
          status: "in-progress",
          assigneeId: user.id,
        });

        if (!ticket) {
          return res.status(404).json({ message: "Ticket not found" });
        }

        res.json(ticket);
      } catch (error) {
        res.status(500).json({ message: "Failed to start work on ticket" });
      }
    },
  );

  // Reject ticket with reason
  app.post(
    "/api/tickets/:id/reject",
    authenticateUser,
    (req, res, next) => {
      const user = req.user as any;
      // Allow org_admin, maintenance_admin, or org_subadmin with accept_ticket permission
      if (
        ["org_admin", "maintenance_admin"].includes(user.role) ||
        (user.role === "org_subadmin" &&
          user.permissions?.includes("accept_ticket"))
      ) {
        return next();
      }
      return res.status(403).json({ message: "Insufficient permissions" });
    },
    async (req: AuthenticatedRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        const { rejectionReason } = req.body;
        const user = req.user!;

        if (!rejectionReason) {
          return res
            .status(400)
            .json({ message: "Rejection reason is required" });
        }

        // Pass user information for vendor assignment history
        const rejectedByUserName =
          `${user.firstName} ${user.lastName}`.trim() || user.email;
        const ticket = await storage.rejectTicket(
          id,
          rejectionReason,
          user.id,
          rejectedByUserName,
        );

        if (!ticket) {
          return res.status(404).json({ message: "Ticket not found" });
        }
        res.json(ticket);
      } catch (error) {
        console.error("Reject ticket error:", error);
        res.status(500).json({ message: "Failed to reject ticket" });
      }
    },
  );

  // Complete ticket with work order (technician)
  app.post(
    "/api/tickets/:id/complete",
    authenticateUser,
    requireRole(["technician"]),
    upload.array("images"),
    async (req: AuthenticatedRequest, res) => {
      try {
        const id = parseInt(req.params.id);
        let workOrder;
        const user = req.user!;

        // Parse workOrder from FormData
        try {
          workOrder = req.body.workOrder
            ? JSON.parse(req.body.workOrder)
            : null;
        } catch (error) {
          return res.status(400).json({ message: "Invalid work order data" });
        }

        if (!workOrder) {
          return res.status(400).json({ message: "Work order data required" });
        }

        console.log("SERVER DEBUGGING - Raw workOrder object:", workOrder);
        console.log("SERVER DEBUGGING - workOrder.completionStatus:", workOrder.completionStatus);
        console.log("SERVER DEBUGGING - typeof completionStatus:", typeof workOrder.completionStatus);

        // Get uploaded image filenames
        const images = ((req.files as Express.Multer.File[]) || []).map(
          (file) => `/uploads/${file.filename}`,
        );

        // Calculate total cost
        const partsCost = (workOrder.parts || []).reduce(
          (sum: number, part: any) => sum + part.cost * part.quantity,
          0,
        );
        const otherCost = (workOrder.otherCharges || []).reduce(
          (sum: number, charge: any) => sum + charge.cost,
          0,
        );
        const totalCost = partsCost + otherCost;

        // Calculate total hours
        const calculateHours = (timeIn: string, timeOut: string) => {
          if (!timeIn || !timeOut) return "0.00";

          const [inHour, inMin] = timeIn.split(":").map(Number);
          const [outHour, outMin] = timeOut.split(":").map(Number);

          const inMinutes = inHour * 60 + inMin;
          const outMinutes = outHour * 60 + outMin;

          let totalMinutes = outMinutes - inMinutes;
          if (totalMinutes < 0) {
            totalMinutes += 24 * 60; // Add 24 hours for next day
          }

          const hours = totalMinutes / 60;
          return hours.toFixed(2);
        };

        const totalHours = calculateHours(
          workOrder.timeIn || "",
          workOrder.timeOut || "",
        );

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
          workDate: new Date().toISOString().split("T")[0], // Current date in YYYY-MM-DD format
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
          completedAt:
            workOrder.completionStatus === "completed" ? new Date() : undefined,
        });

        if (!ticket) {
          return res.status(404).json({ message: "Ticket not found" });
        }

        res.json(ticket);
      } catch (error) {
        console.error("Error completing ticket:", error);
        res.status(500).json({ message: "Failed to complete ticket" });
      }
    },
  );

  // Assign ticket to marketplace
  app.post(
    "/api/tickets/:id/assign-marketplace",
    authenticateUser,
    requireRole(["org_admin", "org_subadmin"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const ticketId = parseInt(req.params.id);
        const ticket = await storage.assignTicketToMarketplace(ticketId);
        if (!ticket) {
          return res.status(404).json({ message: "Ticket not found" });
        }
        res.json(ticket);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to assign ticket to marketplace" });
      }
    },
  );

  // Send ticket to marketplace (alias for mobile app compatibility)
  app.post(
    "/api/tickets/:id/send-to-marketplace",
    authenticateUser,
    requireRole(["org_admin", "org_subadmin"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const ticketId = parseInt(req.params.id);
        const ticket = await storage.assignTicketToMarketplace(ticketId);
        if (!ticket) {
          return res.status(404).json({ message: "Ticket not found" });
        }
        res.json(ticket);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to send ticket to marketplace" });
      }
    },
  );

  // Get marketplace tickets (for vendors to view)
  app.get(
    "/api/marketplace/tickets",
    authenticateUser,
    requireRole(["maintenance_admin"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const tickets = await storage.getMarketplaceTickets();

        // Filter out sensitive address information for privacy
        // Only show city, state, and ZIP code until bid is accepted
        const sanitizedTickets = tickets.map((ticket) => ({
          ...ticket,
          // Hide full residential address, only show city, state, zip
          residentialAddress: undefined, // Hide street address
          // Keep city, state, zip for general location context
          residentialCity: ticket.residentialCity,
          residentialState: ticket.residentialState,
          residentialZip: ticket.residentialZip,
        }));

        res.json(sanitizedTickets);
      } catch (error) {
        res
          .status(500)
          .json({ message: "Failed to fetch marketplace tickets" });
      }
    },
  );

  // Get vendor's bids (including counter offers)
  app.get(
    "/api/marketplace/vendor-bids",
    authenticateUser,
    requireRole(["maintenance_admin", "technician"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;
        const vendorId = user.maintenanceVendorId;

        if (!vendorId) {
          return res.status(400).json({
            message: "User is not associated with a maintenance vendor",
          });
        }

        const bids = await storage.getVendorBids(vendorId);

        // For accepted bids, include full address information
        // For pending/rejected bids, keep only city, state, zip for privacy
        const sanitizedBids = bids.map((bid) => {
          if (bid.status === "accepted") {
            // Show full address for accepted bids
            return bid;
          } else {
            // Hide full address for non-accepted bids
            return {
              ...bid,
              ticket: bid.ticket
                ? {
                    ...bid.ticket,
                    residentialAddress: undefined, // Hide street address
                    // Keep city, state, zip for location context
                    residentialCity: bid.ticket.residentialCity,
                    residentialState: bid.ticket.residentialState,
                    residentialZip: bid.ticket.residentialZip,
                  }
                : bid.ticket,
            };
          }
        });

        res.json(sanitizedBids);
      } catch (error) {
        console.error("Get vendor bids error:", error);
        res.status(500).json({ message: "Failed to fetch vendor bids" });
      }
    },
  );

  // Get bid history for a specific bid
  app.get(
    "/api/marketplace/bids/:bidId/history",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const bidId = parseInt(req.params.bidId);
        const history = await storage.getBidHistory(bidId);
        res.json(history);
      } catch (error) {
        console.error("Get bid history error:", error);
        res.status(500).json({ message: "Failed to fetch bid history" });
      }
    },
  );

  // Enhanced counter offer response endpoint
  app.post(
    "/api/marketplace/bids/:bidId/respond",
    authenticateUser,
    requireRole(["maintenance_admin", "technician"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const bidId = parseInt(req.params.bidId);
        const { action, amount, notes } = req.body;
        const user = req.user!;

        if (!["accept", "reject", "recounter"].includes(action)) {
          return res.status(400).json({
            message:
              "Invalid action. Must be 'accept', 'reject', or 'recounter'",
          });
        }

        if (action === "recounter" && (!amount || isNaN(parseFloat(amount)))) {
          return res
            .status(400)
            .json({ message: "Amount is required for recounter action" });
        }

        await storage.respondToCounterOffer(
          bidId,
          user.id,
          action,
          amount ? parseFloat(amount) : undefined,
          notes,
        );

        res.json({ message: `Bid ${action} successful`, action, bidId });
      } catch (error) {
        console.error("Respond to counter offer error:", error);
        res.status(500).json({
          message: error instanceof Error ? error.message : "Failed to respond to counter offer",
        });
      }
    },
  );

  // Get bids for a ticket
  app.get(
    "/api/tickets/:id/bids",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const ticketId = parseInt(req.params.id);
        const bids = await storage.getTicketBids(ticketId);
        res.json(bids);
      } catch (error) {
        res.status(500).json({ message: "Failed to fetch ticket bids" });
      }
    },
  );

  // Create marketplace bid
  app.post(
    "/api/marketplace/bids",
    authenticateUser,
    requireRole(["maintenance_admin"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const {
          ticketId,
          hourlyRate,
          estimatedHours,
          responseTime,
          parts,
          totalAmount,
          additionalNotes,
        } = req.body;
        const user = req.user!;

        console.log("Creating marketplace bid:", {
          ticketId,
          hourlyRate,
          estimatedHours,
          responseTime,
          parts,
          totalAmount,
          additionalNotes,
          vendorId: user.maintenanceVendorId,
        });

        if (!user.maintenanceVendorId) {
          return res.status(400).json({
            message: "User must be associated with a vendor to place bids",
          });
        }

        const bid = await storage.createMarketplaceBid({
          ticketId: parseInt(ticketId),
          vendorId: user.maintenanceVendorId,
          hourlyRate: hourlyRate.toString(),
          estimatedHours: estimatedHours ? estimatedHours.toString() : "0",
          responseTime,
          parts: parts || [],
          totalAmount: totalAmount ? totalAmount.toString() : "0",
          additionalNotes,
        });

        console.log("Marketplace bid created successfully:", bid);
        res.status(201).json(bid);
      } catch (error) {
        console.error("Create marketplace bid error:", error);
        res.status(500).json({
          message: "Failed to create marketplace bid",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  // Update marketplace bid
  app.put(
    "/api/marketplace/bids/:id",
    authenticateUser,
    requireRole(["maintenance_admin"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const bidId = parseInt(req.params.id);
        const {
          hourlyRate,
          estimatedHours,
          responseTime,
          parts,
          totalAmount,
          additionalNotes,
        } = req.body;
        const user = req.user!;

        console.log("Updating marketplace bid:", {
          bidId,
          hourlyRate,
          estimatedHours,
          responseTime,
          parts,
          totalAmount,
          additionalNotes,
        });

        if (!user.maintenanceVendorId) {
          return res.status(400).json({
            message: "User must be associated with a vendor to update bids",
          });
        }

        // Check if the bid belongs to this vendor
        const existingBid = await storage.getMarketplaceBid(bidId);
        if (!existingBid || existingBid.vendorId !== user.maintenanceVendorId) {
          return res
            .status(403)
            .json({ message: "Not authorized to update this bid" });
        }

        // Only allow updates to pending bids
        if (existingBid.status !== "pending") {
          return res
            .status(400)
            .json({ message: "Can only update pending bids" });
        }

        const bid = await storage.updateMarketplaceBid(bidId, {
          hourlyRate: hourlyRate?.toString() || existingBid.hourlyRate,
          estimatedHours: estimatedHours?.toString() || existingBid.estimatedHours || "0",
          responseTime: responseTime || existingBid.responseTime,
          parts: parts || existingBid.parts || [],
          totalAmount: totalAmount?.toString() || existingBid.totalAmount || "0",
          additionalNotes: additionalNotes || existingBid.additionalNotes,
          updatedAt: new Date(),
        });

        console.log("Marketplace bid updated successfully:", bid);
        res.json(bid);
      } catch (error) {
        console.error("Update marketplace bid error:", error);
        res.status(500).json({
          message: "Failed to update marketplace bid",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  // Accept marketplace bid
  app.post(
    "/api/marketplace/bids/:id/accept",
    authenticateUser,
    requireRole(["org_admin", "org_subadmin", "residential"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const bidId = parseInt(req.params.id);
        const result = await storage.acceptMarketplaceBid(bidId);
        res.json(result);
      } catch (error) {
        console.error("Accept marketplace bid error:", error);
        res.status(500).json({ message: "Failed to accept marketplace bid" });
      }
    },
  );

  // Reject marketplace bid
  app.post(
    "/api/marketplace/bids/:id/reject",
    authenticateUser,
    requireRole(["org_admin", "org_subadmin", "residential"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const bidId = parseInt(req.params.id);
        const { rejectionReason } = req.body;
        const bid = await storage.rejectMarketplaceBid(bidId, rejectionReason);
        res.json(bid);
      } catch (error) {
        console.error("Reject marketplace bid error:", error);
        res.status(500).json({ message: "Failed to reject marketplace bid" });
      }
    },
  );

  // Counter marketplace bid
  app.post(
    "/api/marketplace/bids/:id/counter",
    authenticateUser,
    requireRole(["org_admin", "org_subadmin", "residential"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const bidId = parseInt(req.params.id);
        const { counterOffer, counterNotes } = req.body;

        const bid = await storage.counterMarketplaceBid(
          bidId,
          counterOffer,
          counterNotes,
        );
        res.json(bid);
      } catch (error) {
        console.error("Counter marketplace bid error:", error);
        res.status(500).json({ message: "Failed to send counter offer" });
      }
    },
  );

  // Accept counter offer (vendor accepts organization's counter offer)
  app.post(
    "/api/marketplace/bids/:id/accept-counter",
    authenticateUser,
    requireRole(["maintenance_vendor"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const bidId = parseInt(req.params.id);
        
        const bid = await storage.acceptCounterOffer(bidId);
        res.json(bid);
      } catch (error) {
        console.error("Accept counter offer error:", error);
        res.status(500).json({ message: "Failed to accept counter offer" });
      }
    },
  );

  // Reject counter offer (vendor rejects organization's counter offer)
  app.post(
    "/api/marketplace/bids/:id/reject-counter",
    authenticateUser,
    requireRole(["maintenance_vendor"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const bidId = parseInt(req.params.id);
        
        const bid = await storage.rejectCounterOffer(bidId);
        res.json(bid);
      } catch (error) {
        console.error("Reject counter offer error:", error);
        res.status(500).json({ message: "Failed to reject counter offer" });
      }
    },
  );

  // Approve a marketplace bid
  app.post(
    "/api/marketplace/bids/:bidId/approve",
    authenticateUser,
    requireRole(["org_admin", "org_subadmin"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const bidId = parseInt(req.params.bidId);
        const result = await storage.approveBid(bidId);
        res.json(result);
      } catch (error) {
        console.error("Approve bid error:", error);
        res.status(500).json({
          message: "Failed to approve bid",
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    },
  );

  // Accept marketplace bid
  app.post(
    "/api/marketplace/bids/:id/accept",
    authenticateUser,
    requireRole(["org_admin", "org_subadmin"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const bidId = parseInt(req.params.id);
        const result = await storage.acceptMarketplaceBid(bidId);
        res.json(result);
      } catch (error) {
        res.status(500).json({ message: "Failed to accept marketplace bid" });
      }
    },
  );

  // Reject marketplace bid
  app.post(
    "/api/marketplace/bids/:id/reject",
    authenticateUser,
    requireRole(["org_admin", "org_subadmin"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const bidId = parseInt(req.params.id);
        const bid = await storage.rejectMarketplaceBid(bidId, "");
        res.json(bid);
      } catch (error) {
        res.status(500).json({ message: "Failed to reject marketplace bid" });
      }
    },
  );

  // Confirm ticket completion (original requester)
  app.post(
    "/api/tickets/:id/confirm",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const ticketId = parseInt(req.params.id);
        const { confirmed, feedback } = req.body;

        // Verify ticket exists and is pending confirmation
        const ticket = await storage.getTicket(ticketId);
        if (!ticket) {
          return res.status(404).json({ message: "Ticket not found" });
        }

        if (ticket.status !== "pending_confirmation") {
          return res
            .status(400)
            .json({ message: "Ticket is not pending confirmation" });
        }

        // Verify user is the original reporter or has accept_ticket permission
        const user = req.user!;
        const hasAcceptPermission =
          user.role === "root" ||
          user.role === "org_admin" ||
          (user.role === "org_subadmin" &&
            user.permissions?.includes("accept_ticket"));

        if (ticket.reporterId !== user.id && !hasAcceptPermission) {
          return res.status(403).json({
            message:
              "Only the original requester or admin can confirm completion",
          });
        }

        let updatedTicket;
        if (confirmed) {
          // Confirm completion - move to billing stage for vendor
          updatedTicket = await storage.updateTicket(ticketId, {
            status: "ready_for_billing",
            confirmedAt: new Date(),
            confirmationFeedback: feedback || null,
          });
        } else {
          // Reject completion - return to in-progress
          updatedTicket = await storage.updateTicket(ticketId, {
            status: "in-progress",
            rejectionFeedback: feedback || null,
          });
        }

        res.json(updatedTicket);
      } catch (error) {
        console.error("Error confirming ticket:", error);
        res.status(500).json({ message: "Failed to confirm ticket" });
      }
    },
  );

  // Force close ticket - Available for users with accept ticket permissions
  app.post(
    "/api/tickets/:id/force-close",
    authenticateUser,
    requireRole(["org_admin", "org_subadmin"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const ticketId = parseInt(req.params.id);
        const user = req.user!;
        const { reason } = req.body;

        if (!reason || !reason.trim()) {
          return res
            .status(400)
            .json({ message: "Reason is required for force closing a ticket" });
        }

        // Get the ticket first
        const ticket = await storage.getTicket(ticketId);
        if (!ticket) {
          return res.status(404).json({ message: "Ticket not found" });
        }

        // Check if ticket is already closed
        if (
          ticket.status === "billed" ||
          ticket.status === "rejected" ||
          ticket.status === "force_closed"
        ) {
          return res.status(400).json({ message: "Ticket is already closed" });
        }

        // Check permissions based on user role - vendor admins cannot force close
        const hasPermission =
          user.role === "root" ||
          (user.role === "org_admin" &&
            ticket.organizationId === user.organizationId) ||
          (user.role === "org_subadmin" &&
            ticket.organizationId === user.organizationId);

        if (!hasPermission) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Force close the ticket
        const forcedClosedTicket = await storage.updateTicket(ticketId, {
          status: "force_closed",
          forceClosedAt: new Date(),
          forceClosedBy: user.id,
          forceCloseReason: reason.trim(),
        });

        // Add a system comment about the force close
        await storage.createTicketComment({
          ticketId: ticketId,
          content: `Ticket was force closed by ${user.firstName} ${user.lastName}. Reason: ${reason.trim()}`,
          userId: user.id,
          isSystem: true,
        });

        res.json(forcedClosedTicket);
      } catch (error) {
        console.error("Error force closing ticket:", error);
        res.status(500).json({ message: "Failed to force close ticket" });
      }
    },
  );

  // Invoice routes
  app.get(
    "/api/invoices",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
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
        } else if (
          (user.role === "org_admin" || user.role === "org_subadmin") &&
          user.organizationId &&
          user.permissions?.includes("view_invoices")
        ) {
          // Get invoices for organization users with invoice permissions
          // Filter by user's assigned locations if they have location assignments
          const userLocations = await storage.getUserLocationAssignments(
            user.id,
          );

          if (userLocations.length > 0) {
            // User has specific location assignments - filter invoices by those locations
            const locationIds = userLocations.map((loc) => loc.id);
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
                  inArray(invoices.locationId, locationIds),
                ),
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
    },
  );

  app.post(
    "/api/invoices",
    authenticateUser,
    requireRole(["maintenance_admin", "root"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;
        const { ticketId, additionalItems, notes, tax } = req.body;

        // Get ticket and work orders
        const ticket = await storage.getTicket(ticketId);
        if (!ticket) {
          return res.status(404).json({ message: "Ticket not found" });
        }

        if (ticket.status !== "ready_for_billing") {
          return res
            .status(400)
            .json({ message: "Ticket is not ready for billing" });
        }

        // Verify vendor ownership
        if (
          user.role === "maintenance_admin" &&
          ticket.maintenanceVendorId !== user.maintenanceVendorId
        ) {
          return res
            .status(403)
            .json({ message: "Not authorized for this ticket" });
        }

        const workOrders = await storage.getTicketWorkOrders(ticketId);
        const workOrderIds = workOrders.map((wo) => wo.id);

        // Calculate subtotal from work orders
        const subtotal = workOrders.reduce(
          (sum, wo) => sum + parseFloat(wo.totalCost || "0"),
          0,
        );
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
          additionalItems: additionalItems
            ? JSON.stringify(additionalItems)
            : null,
          notes,
        });

        // Update ticket status to billed
        await storage.updateTicket(ticketId, { status: "billed" });

        res.json(invoice);
      } catch (error) {
        console.error("Error creating invoice:", error);
        res.status(500).json({ message: "Failed to create invoice" });
      }
    },
  );

  app.get(
    "/api/invoices/:id",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const invoiceId = parseInt(req.params.id);
        const invoice = await storage.getInvoice(invoiceId);

        if (!invoice) {
          return res.status(404).json({ message: "Invoice not found" });
        }

        const user = req.user!;
        if (
          user.role === "maintenance_admin" &&
          invoice.maintenanceVendorId !== user.maintenanceVendorId
        ) {
          return res.status(403).json({ message: "Unauthorized" });
        }

        res.json(invoice);
      } catch (error) {
        console.error("Error fetching invoice:", error);
        res.status(500).json({ message: "Failed to fetch invoice" });
      }
    },
  );

  // Get detailed ticket information for progress tracker
  app.get(
    "/api/tickets/:id/details",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const ticketId = parseInt(req.params.id);
        const user = req.user!;

        // Get the ticket first to check permissions
        const ticket = await storage.getTicket(ticketId);
        if (!ticket) {
          return res.status(404).json({ message: "Ticket not found" });
        }

        // Check if user has access to this ticket
        const hasAccess =
          user.role === "root" ||
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
          reporter: ticket.reporterId
            ? await storage.getUser(ticket.reporterId)
            : null,
          assignee: ticket.assigneeId
            ? await storage.getUser(ticket.assigneeId)
            : null,
          organization: ticket.organizationId
            ? await storage.getOrganization(ticket.organizationId)
            : null,
          maintenanceVendor: ticket.maintenanceVendorId
            ? await storage.getMaintenanceVendor(ticket.maintenanceVendorId)
            : null,
          workOrders: await storage.getTicketWorkOrders(ticketId),
          comments: await storage.getTicketComments(ticketId),
        };

        res.json(details);
      } catch (error) {
        console.error("Error fetching ticket details:", error);
        res.status(500).json({ message: "Failed to fetch ticket details" });
      }
    },
  );

  // Get work orders for a ticket
  app.get(
    "/api/tickets/:id/work-orders",
    authenticateUser,
    async (req, res) => {
      try {
        const ticketId = parseInt(req.params.id);
        const workOrders = await storage.getTicketWorkOrders(ticketId);
        res.json(workOrders);
      } catch (error) {
        console.error("Error fetching work orders:", error);
        res.status(500).json({ message: "Failed to fetch work orders" });
      }
    },
  );

  // Create work order for a ticket
  app.post(
    "/api/tickets/:id/work-orders",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const ticketId = parseInt(req.params.id);
        const { workDescription, work_description, startWork, workStatus, startTime, ...workOrderData } = req.body;
        const finalWorkDescription = workDescription || work_description;
        const user = req.user!;

        console.log('Work order creation request:', {
          ticketId,
          requestBody: req.body,
          finalWorkDescription,
          workOrderData,
          userRole: user.role,
          userId: user.id
        });

        // Validate required fields
        if (!finalWorkDescription || finalWorkDescription.trim() === '') {
          return res.status(400).json({ message: "Work description is required" });
        }

        // Verify user has permission to create work orders (technician or maintenance_admin)
        if (!["technician", "maintenance_admin"].includes(user.role)) {
          return res.status(403).json({ message: "Only technicians and vendors can create work orders" });
        }

        // Get the ticket to verify access
        const ticket = await storage.getTicket(ticketId);
        if (!ticket) {
          return res.status(404).json({ message: "Ticket not found" });
        }

        // Verify access based on role
        if (user.role === "technician" && ticket.assigneeId !== user.id) {
          return res.status(403).json({ message: "You can only create work orders for tickets assigned to you" });
        }

        if (user.role === "maintenance_admin" && ticket.maintenanceVendorId !== user.maintenanceVendorId) {
          return res.status(403).json({ message: "You can only create work orders for your vendor's tickets" });
        }

        // Get technician info for work order
        let technicianId = user.id;
        let technicianName = user.name || user.email || 'Unknown Technician';
        
        // If user is maintenance_admin, use the assigned technician
        if (user.role === "maintenance_admin" && ticket.assigneeId) {
          const assignedTechnician = await storage.getUserById(ticket.assigneeId);
          if (assignedTechnician) {
            technicianId = assignedTechnician.id;
            technicianName = assignedTechnician.name || assignedTechnician.email || 'Unknown Technician';
          }
        }
        
        // Create the work order
        const workOrder = await storage.createWorkOrder({
          ticketId,
          technicianId,
          technicianName,
          workDescription: finalWorkDescription,
          completionStatus: workOrderData.completionStatus || null,
          completionNotes: workOrderData.completionNotes || '',
          parts: workOrderData.parts || [],
          otherCharges: workOrderData.otherCharges || [],
          totalCost: workOrderData.totalCost || 0,
          images: workOrderData.images || [],
          workDate: workOrderData.workDate || new Date().toISOString().split('T')[0],
          timeIn: workOrderData.timeIn || null,
          timeOut: workOrderData.timeOut || null,
          totalHours: workOrderData.totalHours || null,
          managerName: workOrderData.managerName || '',
          managerSignature: workOrderData.managerSignature || ''
        });

        // If startWork is true, also update the ticket status to in-progress
        if (startWork) {
          await storage.updateTicket(ticketId, { 
            status: "in-progress",
            assigneeId: user.id
          });
        }

        // Handle completion status for work order workflow
        if (workOrderData.completionStatus) {
          if (workOrderData.completionStatus === 'completed') {
            // Mark ticket as completed and ready for verification
            await storage.updateTicket(ticketId, { 
              status: "pending_confirmation"
            });
          } else if (workOrderData.completionStatus === 'return_needed') {
            // Keep ticket in progress for additional work
            await storage.updateTicket(ticketId, { 
              status: "in-progress"
            });
          }
        }

        res.json({
          message: "Work order created successfully",
          workOrder,
          ticketUpdated: startWork
        });
      } catch (error) {
        console.error("Error creating work order:", error);
        res.status(500).json({ message: "Failed to create work order" });
      }
    }
  );

  // Get technicians for maintenance vendor
  app.get(
    "/api/maintenance-vendors/:vendorId/technicians",
    authenticateUser,
    requireRole(["root", "maintenance_admin"]),
    async (req, res) => {
      try {
        const vendorId = parseInt(req.params.vendorId);
        const user = req.user!;

        // Ensure user can only access their own vendor's technicians
        if (
          user.role === "maintenance_admin" &&
          user.maintenanceVendorId !== vendorId
        ) {
          return res.status(403).json({ message: "Access denied" });
        }

        const technicians = await storage.getTechnicians(vendorId);
        res.json(technicians);
      } catch (error) {
        console.error("Error fetching technicians:", error);
        res.status(500).json({ message: "Failed to fetch technicians" });
      }
    },
  );

  // Create technician
  app.post(
    "/api/maintenance-vendors/:vendorId/technicians",
    authenticateUser,
    requireRole(["root", "maintenance_admin"]),
    async (req, res) => {
      try {
        const vendorId = parseInt(req.params.vendorId);
        const technicianData = insertUserSchema.parse(req.body);

        const technician = await storage.createTechnician(
          technicianData,
          vendorId,
        );
        res.status(201).json(technician);
      } catch (error: any) {
        console.error("Create technician error:", error);
        if (error.name === "ZodError") {
          res
            .status(400)
            .json({ message: "Invalid technician data", errors: error.errors });
        } else if (error.message?.includes("duplicate key")) {
          res
            .status(409)
            .json({ message: "Email or phone number already exists" });
        } else {
          res.status(500).json({ message: "Failed to create technician" });
        }
      }
    },
  );

  // Update technician
  app.patch(
    "/api/maintenance-vendors/:vendorId/technicians/:id",
    authenticateUser,
    requireRole(["root", "maintenance_admin"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const vendorId = parseInt(req.params.vendorId);
        const user = req.user!;

        // Ensure user can only update their own vendor's technicians
        if (
          user.role === "maintenance_admin" &&
          user.maintenanceVendorId !== vendorId
        ) {
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
        if (error.name === "ZodError") {
          res
            .status(400)
            .json({ message: "Invalid technician data", errors: error.errors });
        } else if (error.message?.includes("duplicate key")) {
          res
            .status(409)
            .json({ message: "Email or phone number already exists" });
        } else {
          res.status(500).json({ message: "Failed to update technician" });
        }
      }
    },
  );

  // Reset technician password
  app.post(
    "/api/maintenance-vendors/:vendorId/technicians/:id/reset-password",
    authenticateUser,
    requireRole(["root", "maintenance_admin"]),
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const vendorId = parseInt(req.params.vendorId);
        const user = req.user!;
        const { newPassword } = req.body;

        // Ensure user can only reset their own vendor's technicians
        if (
          user.role === "maintenance_admin" &&
          user.maintenanceVendorId !== vendorId
        ) {
          return res.status(403).json({ message: "Access denied" });
        }

        if (!newPassword || newPassword.length < 6) {
          return res
            .status(400)
            .json({ message: "Password must be at least 6 characters" });
        }

        const technician = await storage.updateTechnician(id, {
          password: newPassword,
        });

        if (!technician) {
          return res.status(404).json({ message: "Technician not found" });
        }

        res.json({ message: "Password reset successfully" });
      } catch (error) {
        console.error("Reset password error:", error);
        res.status(500).json({ message: "Failed to reset password" });
      }
    },
  );

  // Delete technician
  app.delete(
    "/api/maintenance-vendors/:vendorId/technicians/:id",
    authenticateUser,
    requireRole(["root", "maintenance_admin"]),
    async (req, res) => {
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
    },
  );

  // Location routes
  app.get(
    "/api/organizations/:id/locations",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
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
    },
  );

  // Public location lookup endpoint for tickets - accessible by vendors
  app.get(
    "/api/locations/:id",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const locationId = parseInt(req.params.id);

        // Get the location from any organization that the system knows about
        const organizations = await storage.getOrganizations();
        let foundLocation = null;

        for (const org of organizations) {
          const locations = await storage.getLocations(org.id);
          foundLocation = locations.find((loc) => loc.id === locationId);
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
    },
  );

  app.post(
    "/api/organizations/:id/locations",
    authenticateUser,
    requireRole(["root", "org_admin"]),
    async (req: AuthenticatedRequest, res) => {
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
    },
  );

  app.delete(
    "/api/locations/:id",
    authenticateUser,
    requireRole(["root", "org_admin"]),
    async (req: AuthenticatedRequest, res) => {
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
    },
  );

  // User location assignment routes
  app.get(
    "/api/users/:id/locations",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const userIdParam = req.params.id;
        if (userIdParam === 'undefined' || userIdParam === 'null' || !userIdParam) {
          return res.status(400).json({ message: "Invalid user ID" });
        }
        
        const userId = parseInt(userIdParam);
        if (isNaN(userId)) {
          return res.status(400).json({ message: "Invalid user ID format" });
        }
        
        const locations = await storage.getUserLocationAssignments(userId);
        res.json(locations);
      } catch (error) {
        console.error("Error fetching user locations:", error);
        res.status(500).json({ message: "Failed to fetch user locations" });
      }
    },
  );

  app.put(
    "/api/users/:id/locations",
    authenticateUser,
    requireRole(["root", "org_admin"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const userId = parseInt(req.params.id);
        const { locationIds } = req.body;

        await storage.updateUserLocationAssignments(userId, locationIds);
        res.json({ message: "User location assignments updated successfully" });
      } catch (error) {
        console.error("Error updating user locations:", error);
        res.status(500).json({ message: "Failed to update user locations" });
      }
    },
  );

  // Ticket comment routes
  app.get(
    "/api/tickets/:id/comments",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const ticketId = parseInt(req.params.id);
        const user = req.user!;

        // Verify user has access to this ticket
        const ticket = await storage.getTicket(ticketId);
        if (!ticket) {
          return res.status(404).json({ message: "Ticket not found" });
        }

        // Check access based on role - allow all users who can view the ticket
        let hasAccess = false;
        if (user.role === "root") {
          hasAccess = true;
        } else if (
          user.role === "org_admin" &&
          ticket.organizationId === user.organizationId
        ) {
          hasAccess = true;
        } else if (
          user.role === "org_subadmin" &&
          ticket.organizationId === user.organizationId
        ) {
          // Sub-admin can only see tickets from their assigned locations
          const userLocations = await storage.getUserLocationAssignments(
            user.id,
          );
          const locationIds = userLocations.map((loc) => loc.id);
          hasAccess =
            !ticket.locationId || locationIds.includes(ticket.locationId);
          
          // Special case: marketplace users (org_subadmin) can access tickets from their org for bidding
          if (!hasAccess && user.email && user.email.includes('marketplace')) {
            hasAccess = true;
          }
        } else if (
          user.role === "maintenance_admin" &&
          ticket.maintenanceVendorId === user.maintenanceVendorId
        ) {
          hasAccess = true;
        } else if (
          user.role === "technician" &&
          ticket.assigneeId === user.id
        ) {
          hasAccess = true;
        } else if (ticket.organizationId === user.organizationId) {
          // Allow any user from the same organization to comment (e.g., marketplace@nsrpetro.com)
          hasAccess = true;
        } else if (ticket.reporterId === user.id) {
          // Allow original reporter to comment
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
    },
  );

  app.post(
    "/api/tickets/:id/comments",
    upload.array("images", 5),
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const ticketId = parseInt(req.params.id);
        const user = req.user!;
        const files = req.files as Express.Multer.File[];
        const imageUrls = files
          ? files.map((file) => `/uploads/${file.filename}`)
          : [];

        // Verify user has access to this ticket
        const ticket = await storage.getTicket(ticketId);
        if (!ticket) {
          return res.status(404).json({ message: "Ticket not found" });
        }

        // Check access based on role (same logic as GET comments)
        let hasAccess = false;
        if (user.role === "root") {
          hasAccess = true;
        } else if (
          user.role === "org_admin" &&
          ticket.organizationId === user.organizationId
        ) {
          hasAccess = true;
        } else if (
          user.role === "org_subadmin" &&
          ticket.organizationId === user.organizationId
        ) {
          const userLocations = await storage.getUserLocationAssignments(
            user.id,
          );
          const locationIds = userLocations.map((loc) => loc.id);
          hasAccess =
            !ticket.locationId || locationIds.includes(ticket.locationId);
          
          // Special case: marketplace users (org_subadmin) can access tickets from their org for bidding
          if (!hasAccess && user.email && user.email.includes('marketplace')) {
            hasAccess = true;
          }
        } else if (
          user.role === "maintenance_admin" &&
          ticket.maintenanceVendorId === user.maintenanceVendorId
        ) {
          hasAccess = true;
        } else if (
          user.role === "technician" &&
          ticket.assigneeId === user.id
        ) {
          hasAccess = true;
        } else if (ticket.organizationId === user.organizationId) {
          // Allow any user from the same organization to comment (e.g., marketplace@nsrpetro.com)
          hasAccess = true;
        } else if (ticket.reporterId === user.id) {
          // Allow original reporter to comment
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
          return res.status(400).json({
            message: "Invalid comment data",
            errors: result.error.errors,
          });
        }

        const comment = await storage.createTicketComment(result.data);
        res.status(201).json(comment);
      } catch (error) {
        console.error("Error creating ticket comment:", error);
        res.status(500).json({ message: "Failed to create comment" });
      }
    },
  );

  app.put(
    "/api/tickets/:ticketId/comments/:commentId",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const ticketId = parseInt(req.params.ticketId);
        const commentId = parseInt(req.params.commentId);
        const user = req.user!;

        // Get the comment to verify ownership
        const comments = await storage.getTicketComments(ticketId);
        const comment = comments.find((c) => c.id === commentId);

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

        const updatedComment = await storage.updateTicketComment(
          commentId,
          updates,
        );
        if (!updatedComment) {
          return res.status(404).json({ message: "Comment not found" });
        }

        res.json(updatedComment);
      } catch (error) {
        console.error("Error updating ticket comment:", error);
        res.status(500).json({ message: "Failed to update comment" });
      }
    },
  );

  app.delete(
    "/api/tickets/:ticketId/comments/:commentId",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const ticketId = parseInt(req.params.ticketId);
        const commentId = parseInt(req.params.commentId);
        const user = req.user!;

        // Get the comment to verify ownership
        const comments = await storage.getTicketComments(ticketId);
        const comment = comments.find((c) => c.id === commentId);

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
    },
  );

  // Parts management routes for vendors
  app.get(
    "/api/maintenance-vendors/:vendorId/parts",
    authenticateUser,
    requireRole(["maintenance_admin", "technician"]),
    async (req: AuthenticatedRequest, res) => {
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
    },
  );

  app.post(
    "/api/maintenance-vendors/:vendorId/parts",
    authenticateUser,
    requireRole(["maintenance_admin"]),
    async (req: AuthenticatedRequest, res) => {
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
    },
  );

  app.put(
    "/api/parts/:partId",
    authenticateUser,
    requireRole(["maintenance_admin"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const partId = parseInt(req.params.partId);
        const user = req.user!;

        // Get the part to verify ownership
        const parts = await storage.getPartsByVendorId(
          user.maintenanceVendorId!,
        );
        const existingPart = parts.find((p) => p.id === partId);

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
    },
  );

  app.get(
    "/api/parts/:partId/price-history",
    authenticateUser,
    requireRole(["maintenance_admin"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const partId = parseInt(req.params.partId);
        const user = req.user!;

        // Get the part to verify ownership
        const parts = await storage.getPartsByVendorId(
          user.maintenanceVendorId!,
        );
        const existingPart = parts.find((p) => p.id === partId);

        if (!existingPart) {
          return res.status(404).json({ message: "Part not found" });
        }

        const history = await storage.getPartPriceHistory(partId);
        res.json(history);
      } catch (error) {
        console.error("Error fetching price history:", error);
        res.status(500).json({ message: "Failed to fetch price history" });
      }
    },
  );

  // Calendar API routes
  app.get(
    "/api/calendar/events",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;
        const { startDate, endDate } = req.query;

        const events = await storage.getCalendarEvents(
          user.id,
          startDate as string,
          endDate as string,
        );
        res.json(events);
      } catch (error) {
        console.error("Error fetching calendar events:", error);
        res.status(500).json({ message: "Failed to fetch calendar events" });
      }
    },
  );

  app.get(
    "/api/calendar/events/:id",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
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
    },
  );

  app.post(
    "/api/calendar/events",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;
        const eventData = { ...req.body, userId: user.id };

        // Check for conflicts with existing unavailability events (unless this is an unavailability event)
        if (eventData.eventType !== "unavailability") {
          const conflicts = await storage.checkEventConflicts(
            user.id,
            eventData.startDate,
            eventData.endDate,
            eventData.startTime,
            eventData.endTime,
            eventData.isAllDay,
          );

          if (conflicts.length > 0) {
            return res.status(409).json({
              message: "Cannot book during blocked time periods",
              conflicts: conflicts.map((c) => ({
                title: c.title,
                date: c.startDate,
                time: c.isAllDay ? "All day" : `${c.startTime} - ${c.endTime}`,
              })),
            });
          }
        }

        // Create the event in TaskScout first
        const event = await storage.createCalendarEvent(eventData);

        // If user has Google Calendar connected and sync enabled, sync to Google
        const integration = await storage.getGoogleCalendarIntegration(user.id);
        console.log(
          `Checking Google Calendar integration for user ${user.id}:`,
          {
            hasIntegration: !!integration,
            syncEnabled: integration?.syncEnabled,
            eventType: eventData.eventType,
          },
        );

        if (
          integration &&
          integration.syncEnabled &&
          eventData.eventType !== "availability"
        ) {
          try {
            console.log(
              `Syncing new TaskScout event "${event.title}" to Google Calendar`,
            );
            console.log(`Event data:`, {
              title: event.title,
              startDate: event.startDate,
              endDate: event.endDate,
              startTime: event.startTime,
              endTime: event.endTime,
              isAllDay: event.isAllDay,
              eventType: event.eventType,
            });

            const googleEventId = await googleCalendarService.createEvent(
              integration,
              event,
            );
            if (googleEventId) {
              // Update the event with Google ID for bidirectional sync
              await storage.updateCalendarEvent(event.id, {
                googleEventId,
                syncedToGoogle: true,
              });
              console.log(
                `✅ Successfully synced "${event.title}" to Google Calendar (${googleEventId})`,
              );
            } else {
              console.warn(
                `❌ Failed to get Google Event ID for "${event.title}"`,
              );
            }
          } catch (syncError) {
            console.error(
              "❌ Failed to sync event to Google Calendar:",
              syncError,
            );
            // Continue without failing the request - event still created in TaskScout
          }
        }

        res.status(201).json(event);
      } catch (error) {
        console.error("Error creating calendar event:", error);
        res.status(500).json({ message: "Failed to create calendar event" });
      }
    },
  );

  app.put(
    "/api/calendar/events/:id",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
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

        const updatedEvent = await storage.updateCalendarEvent(
          eventId,
          req.body,
        );
        res.json(updatedEvent);
      } catch (error) {
        console.error("Error updating calendar event:", error);
        res.status(500).json({ message: "Failed to update calendar event" });
      }
    },
  );

  app.delete(
    "/api/calendar/events/:id",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
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
    },
  );

  // Get user availability for a specific date
  app.get(
    "/api/calendar/availability/:date",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;
        const date = req.params.date;

        const availability = await storage.getUserAvailability(user.id, date);
        res.json(availability);
      } catch (error) {
        console.error("Error fetching availability:", error);
        res.status(500).json({ message: "Failed to fetch availability" });
      }
    },
  );

  // Create availability block
  app.post(
    "/api/calendar/availability",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;
        const { title, startDate, endDate, startTime, endTime } = req.body;

        const availability = await storage.createAvailabilityBlock(
          user.id,
          title,
          startDate,
          endDate,
          startTime,
          endTime,
        );
        res.status(201).json(availability);
      } catch (error) {
        console.error("Error creating availability:", error);
        res.status(500).json({ message: "Failed to create availability" });
      }
    },
  );

  // Get work assignments for user
  app.get(
    "/api/calendar/work-assignments",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;
        const { startDate, endDate } = req.query;

        const assignments = await storage.getWorkAssignments(
          user.id,
          startDate as string,
          endDate as string,
        );
        res.json(assignments);
      } catch (error) {
        console.error("Error fetching work assignments:", error);
        res.status(500).json({ message: "Failed to fetch work assignments" });
      }
    },
  );

  // Create event exception (for deleting specific occurrences of recurring events)
  app.post(
    "/api/calendar/events/:id/exceptions",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
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

        const exception = await storage.createEventException(
          eventId,
          exceptionDate,
        );
        res.status(201).json(exception);
      } catch (error) {
        console.error("Error creating event exception:", error);
        res.status(500).json({ message: "Failed to create event exception" });
      }
    },
  );

  // Availability configuration routes
  app.get(
    "/api/availability/config",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;
        const config = await storage.getAvailabilityConfig(user.id);
        res.json(config);
      } catch (error) {
        console.error("Error fetching availability config:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch availability configuration" });
      }
    },
  );

  app.post(
    "/api/availability/config",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;
        const { weeklySchedule, timezone } = req.body;

        // Check if user already has a config
        const existingConfig = await storage.getAvailabilityConfig(user.id);
        console.error(existingConfig);
        if (existingConfig) {
          // Update existing configuration
          const updatedConfig = await storage.updateAvailabilityConfig(
            user.id,
            {
              weeklySchedule: JSON.stringify(weeklySchedule),
              timezone: timezone || "America/New_York",
            },
          );
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
        res
          .status(500)
          .json({ message: "Failed to save availability configuration" });
      }
    },
  );

  // Payment processing route
  app.post(
    "/api/invoices/:id/pay",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
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
          return res.status(400).json({
            message: "Only external payments are currently supported",
          });
        }

        // Update invoice with payment information
        const updatedInvoice = await storage.updateInvoicePayment(invoiceId, {
          status: "paid",
          paymentMethod,
          paymentType,
          checkNumber,
          paidAt: new Date(),
        });

        res.json(updatedInvoice);
      } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).json({ message: "Failed to process payment" });
      }
    },
  );

  // Send invoice route
  app.post(
    "/api/invoices/:id/send",
    authenticateUser,
    requireRole(["maintenance_admin", "root"]),
    async (req: AuthenticatedRequest, res) => {
      try {
        const invoiceId = parseInt(req.params.id);
        const user = req.user!;

        // Get the invoice first to verify access and get details
        const invoice = await storage.getInvoiceById(invoiceId);
        if (!invoice) {
          return res.status(404).json({ message: "Invoice not found" });
        }

        // Verify vendor ownership (unless root)
        if (user.role === "maintenance_admin" && invoice.maintenanceVendorId !== user.maintenanceVendorId) {
          return res.status(403).json({ message: "Not authorized for this invoice" });
        }

        // Update invoice status to sent
        const updatedInvoice = await storage.updateInvoice(invoiceId, {
          status: "sent"
        });

        if (!updatedInvoice) {
          return res.status(404).json({ message: "Failed to update invoice" });
        }

        // Get additional data for email notification
        const ticket = await storage.getTicket(invoice.ticketId);
        const organization = ticket ? await storage.getOrganization(ticket.organizationId) : null;
        
        // Get organization admin emails for notification
        if (organization) {
          try {
            // Import email service
            const { sendInvoiceNotificationEmail } = await import("./email-service");
            
            // Get organization admins who should receive invoice notifications
            const orgAdmins = await storage.getUsers();
            const adminEmails = orgAdmins
              .filter(u => 
                u.organizationId === organization.id && 
                ['org_admin', 'org_subadmin'].includes(u.role) &&
                u.permissions?.includes('view_invoices')
              )
              .map(u => ({ email: u.email, name: u.firstName }));

            // Send email to each admin
            const emailPromises = adminEmails.map(admin =>
              sendInvoiceNotificationEmail(admin.email, {
                invoiceNumber: invoice.invoiceNumber,
                ticketNumber: ticket?.ticketNumber || `#${invoice.ticketId}`,
                total: invoice.total,
                organizationName: organization.name,
                recipientName: admin.name
              })
            );

            await Promise.allSettled(emailPromises);
            console.log(`Invoice ${invoice.invoiceNumber} sent with email notifications to ${adminEmails.length} recipients`);
          } catch (emailError) {
            console.error('Failed to send invoice notification emails:', emailError);
            // Don't fail the invoice send if email fails
          }
        }

        res.json(updatedInvoice);
      } catch (error) {
        console.error("Error sending invoice:", error);
        res.status(500).json({ message: "Failed to send invoice" });
      }
    }
  );

  const httpServer = createServer(app);
  // Google Calendar Integration Routes

  // Get Google Calendar integration status
  app.get(
    "/api/google-calendar/status",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;
        const integration = await storage.getGoogleCalendarIntegration(user.id);

        res.json({
          connected: !!integration,
          email: integration?.googleAccountEmail || null,
          syncEnabled: integration?.syncEnabled || false,
          lastSyncAt: integration?.lastSyncAt || null,
        });
      } catch (error) {
        console.error("Error fetching Google Calendar status:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch Google Calendar status" });
      }
    },
  );

  // Initiate Google Calendar authentication
  app.get(
    "/api/google-calendar/auth",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;
        const authUrl = googleCalendarService.generateAuthUrl(user.id);

        // Debug: Log the redirect URI being used
        const redirectUri = authUrl.includes("redirect_uri=")
          ? decodeURIComponent(authUrl.split("redirect_uri=")[1].split("&")[0])
          : "Not found";
        console.log("Google OAuth redirect URI being used:", redirectUri);
        console.log(
          "*** ADD THIS EXACT URI TO YOUR GOOGLE CLOUD CONSOLE OAUTH SETTINGS ***",
        );

        res.json({ authUrl });
      } catch (error) {
        console.error("Error generating Google Calendar auth URL:", error);
        res
          .status(500)
          .json({ message: "Failed to generate authentication URL" });
      }
    },
  );

  // Handle Google Calendar OAuth callback
  app.get("/api/auth/google/callback", async (req, res) => {
    try {
      const { code, state, error } = req.query;

      if (error) {
        console.error("Google OAuth error:", error);
        return res.redirect("/calendar?error=oauth_error");
      }

      if (!code || !state) {
        console.error("Missing code or state in OAuth callback");
        return res.redirect("/calendar?error=missing_params");
      }

      const userId = parseInt(state as string);
      if (!userId) {
        console.error("Invalid user ID in OAuth state");
        return res.redirect("/calendar?error=invalid_state");
      }

      // Exchange code for tokens
      const tokens = await googleCalendarService.exchangeCodeForTokens(
        code as string,
      );

      if (!tokens.access_token || !tokens.refresh_token) {
        console.error("Failed to obtain access tokens");
        return res.redirect("/calendar?error=token_exchange_failed");
      }

      // Create integration record
      const integration = await storage.createGoogleCalendarIntegration({
        userId: userId,
        googleAccountEmail: "unknown@gmail.com", // We'll update this with actual Google email
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: new Date(tokens.expiry_date || Date.now() + 3600000),
        calendarId: "primary",
        syncEnabled: true,
      });

      // Get user info from Google to update email
      try {
        const tempIntegration = { ...integration };
        const userInfo =
          await googleCalendarService.getUserInfo(tempIntegration);
        if (userInfo.email) {
          await storage.updateGoogleCalendarIntegration(userId, {
            googleAccountEmail: userInfo.email,
          });
        }
      } catch (userInfoError) {
        console.warn("Could not fetch Google user info:", userInfoError);
      }

      console.log("Google Calendar connected successfully for user:", userId);
      res.redirect("/calendar?success=connected");
    } catch (error) {
      console.error("Error handling Google Calendar callback:", error);
      res.redirect("/calendar?error=connection_failed");
    }
  });

  // Disconnect Google Calendar
  app.delete(
    "/api/google-calendar/disconnect",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;
        const deleted = await storage.deleteGoogleCalendarIntegration(user.id);

        if (!deleted) {
          return res
            .status(404)
            .json({ message: "Google Calendar integration not found" });
        }

        res.json({ message: "Google Calendar disconnected successfully" });
      } catch (error) {
        console.error("Error disconnecting Google Calendar:", error);
        res
          .status(500)
          .json({ message: "Failed to disconnect Google Calendar" });
      }
    },
  );

  // Manual sync with Google Calendar
  app.post(
    "/api/google-calendar/sync",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;
        const integration = await storage.getGoogleCalendarIntegration(user.id);
        console.log(
          "Google Calendar sync requested for user:",
          user.id,
          "Integration:",
          integration,
        );
        if (!integration) {
          return res
            .status(404)
            .json({ message: "Google Calendar not connected" });
        }

        if (!integration.syncEnabled) {
          return res
            .status(400)
            .json({ message: "Google Calendar sync is disabled" });
        }

        // Sync events from Google Calendar
        console.log("Starting Google Calendar sync for user:", user.id);
        const googleEvents = await googleCalendarService.syncFromGoogle(
          integration,
          integration.lastSyncAt || undefined,
        );

        console.log(
          `Received ${googleEvents.length} events from Google Calendar`,
        );
        googleEvents.forEach((event) => {
          console.log(
            `- ${event.summary} (${event.start?.date || event.start?.dateTime}) - Status: ${event.status}`,
          );
        });

        // Process and save Google events to local calendar
        let syncedCount = 0;
        for (const googleEvent of googleEvents) {
          if (googleEvent.status === "cancelled") {
            // Handle deleted events
            continue;
          }

          // Parse start and end dates properly
          const startDate =
            googleEvent.start?.date || googleEvent.start?.dateTime;
          const endDate = googleEvent.end?.date || googleEvent.end?.dateTime;

          if (!startDate) {
            console.log(
              "Skipping event without start date:",
              googleEvent.summary,
            );
            continue;
          }

          const startDateTime = new Date(startDate);
          const endDateTime = endDate ? new Date(endDate) : startDateTime;

          // Fix timezone issue - extract time properly from Google Calendar
          let localStartTime = null;
          let localEndTime = null;

          if (googleEvent.start?.dateTime) {
            // Google Calendar already provides correct timezone, just extract time
            const timeMatch =
              googleEvent.start.dateTime.match(/T(\d{2}:\d{2})/);
            localStartTime = timeMatch ? timeMatch[1] : null;
          }

          if (googleEvent.end?.dateTime) {
            const timeMatch = googleEvent.end.dateTime.match(/T(\d{2}:\d{2})/);
            localEndTime = timeMatch ? timeMatch[1] : null;
          }

          const localEvent = {
            userId: user.id,
            title: googleEvent.summary || "Google Calendar Event",
            description: googleEvent.description || "",
            eventType: "personal",
            startDate: startDateTime.toISOString().split("T")[0],
            startTime: localStartTime,
            endDate: endDateTime.toISOString().split("T")[0],
            endTime: localEndTime,
            isAllDay: !!googleEvent.start?.date,
            location: googleEvent.location || null,
            googleEventId: googleEvent.id,
            syncedToGoogle: true,
            priority: "medium",
            status: "confirmed",
            color: "#4285F4", // Google Calendar blue
            isAvailability: false,
          };

          console.log(
            `Syncing: "${googleEvent.summary}" on ${localEvent.startDate} ${localEvent.startTime || "all-day"}`,
          );

          // Check if event already exists
          const existingEvents = await storage.getCalendarEvents(user.id);
          const existingEvent = existingEvents.find(
            (e) => e.googleEventId === googleEvent.id,
          );

          if (existingEvent) {
            // Update existing event
            await storage.updateCalendarEvent(existingEvent.id, localEvent);
            console.log(`Updated existing event: ${googleEvent.summary}`);
          } else {
            // Create new event
            await storage.createCalendarEvent(localEvent);
            console.log(
              `Created new event: ${googleEvent.summary} on ${localEvent.startDate}`,
            );
          }

          syncedCount++;
        }

        // Update last sync time
        await storage.updateGoogleCalendarIntegration(user.id, {
          lastSyncAt: new Date(),
        });

        res.json({
          message: "Google Calendar sync completed",
          syncedEvents: syncedCount,
        });
      } catch (error) {
        console.error("Error syncing Google Calendar:", error);
        res.status(500).json({ message: "Failed to sync Google Calendar" });
      }
    },
  );

  // Get recent events for debugging
  app.get(
    "/api/calendar/recent-events",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;
        const events = await storage.getCalendarEvents(user.id);

        // Get events from the last 7 days
        const recentEvents = events
          .filter((e) => {
            const eventDate = new Date(e.startDate);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return eventDate >= weekAgo;
          })
          .slice(0, 10);

        res.json(
          recentEvents.map((e) => ({
            id: e.id,
            title: e.title,
            startDate: e.startDate,
            startTime: e.startTime,
            eventType: e.eventType,
            googleEventId: e.googleEventId,
            syncedToGoogle: e.syncedToGoogle,
          })),
        );
      } catch (error) {
        console.error("Error getting recent events:", error);
        res.status(500).json({ message: "Failed to get recent events" });
      }
    },
  );

  // Manual sync specific event to Google Calendar (for testing/debugging)
  app.post(
    "/api/google-calendar/sync-event/:eventId",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;
        const eventId = parseInt(req.params.eventId);

        // Get the event
        const event = await storage.getCalendarEvent(eventId);
        if (!event) {
          return res.status(404).json({ message: "Event not found" });
        }

        if (event.userId !== user.id && user.role !== "root") {
          return res.status(403).json({ message: "Access denied" });
        }

        // Get Google Calendar integration
        const integration = await storage.getGoogleCalendarIntegration(user.id);
        if (!integration || !integration.syncEnabled) {
          return res.status(400).json({
            message: "Google Calendar not connected or sync disabled",
          });
        }

        console.log(
          `🔄 Manual sync request for event "${event.title}" (ID: ${eventId})`,
        );
        console.log(`Event details:`, {
          title: event.title,
          startDate: event.startDate,
          endDate: event.endDate,
          startTime: event.startTime,
          endTime: event.endTime,
          isAllDay: event.isAllDay,
          eventType: event.eventType,
          googleEventId: event.googleEventId,
          syncedToGoogle: event.syncedToGoogle,
        });

        try {
          const googleEventId = await googleCalendarService.createEvent(
            integration,
            event,
          );
          if (googleEventId) {
            // Update the event with Google ID
            await storage.updateCalendarEvent(event.id, {
              googleEventId,
              syncedToGoogle: true,
            });
            console.log(
              `✅ Successfully synced "${event.title}" to Google Calendar (${googleEventId})`,
            );
            res.json({
              message: "Event synced successfully to Google Calendar",
              googleEventId,
              eventTitle: event.title,
            });
          } else {
            console.warn(
              `❌ Failed to get Google Event ID for "${event.title}"`,
            );
            res
              .status(500)
              .json({ message: "Failed to create event in Google Calendar" });
          }
        } catch (syncError) {
          console.error(
            "❌ Failed to sync event to Google Calendar:",
            syncError,
          );
          res.status(500).json({
            message: "Failed to sync event to Google Calendar",
            error: syncError.message,
          });
        }
      } catch (error) {
        console.error("Error in manual sync:", error);
        res.status(500).json({ message: "Failed to sync event" });
      }
    },
  );

  // Toggle Google Calendar sync
  app.patch(
    "/api/google-calendar/sync-settings",
    authenticateUser,
    async (req: AuthenticatedRequest, res) => {
      try {
        const user = req.user!;
        const { syncEnabled } = req.body;

        const integration = await storage.updateGoogleCalendarIntegration(
          user.id,
          {
            syncEnabled: syncEnabled,
          },
        );

        if (!integration) {
          return res
            .status(404)
            .json({ message: "Google Calendar integration not found" });
        }

        res.json({
          message: syncEnabled
            ? "Google Calendar sync enabled"
            : "Google Calendar sync disabled",
          syncEnabled: integration.syncEnabled,
        });
      } catch (error) {
        console.error("Error updating Google Calendar sync settings:", error);
        res.status(500).json({ message: "Failed to update sync settings" });
      }
    },
  );

  // Contact form submission for free trial requests
  app.post('/api/contact/trial-request', async (req, res) => {
    try {
      const { name, email, phone, company, website, companySize, useCase, userType, details } = req.body;

      // Validate required fields
      if (!name || !email || !phone || !company || !companySize || !useCase || !userType) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Send email notification
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });

      // Create email content
      const emailSubject = `New TaskScout Free Trial Request - ${company}`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3B82F6, #7C3AED); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">New Free Trial Request</h1>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1e293b; margin-top: 0;">Contact Information</h2>
            <table style="width: 100%; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">Name:</td>
                <td style="padding: 8px 0; color: #1e293b;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email:</td>
                <td style="padding: 8px 0; color: #1e293b;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">Phone:</td>
                <td style="padding: 8px 0; color: #1e293b;">${phone}</td>
              </tr>
            </table>

            <h2 style="color: #1e293b;">Company Information</h2>
            <table style="width: 100%; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">Company:</td>
                <td style="padding: 8px 0; color: #1e293b;">${company}</td>
              </tr>
              ${website ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">Website:</td>
                <td style="padding: 8px 0; color: #1e293b;"><a href="${website}" style="color: #3B82F6;">${website}</a></td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">Company Size:</td>
                <td style="padding: 8px 0; color: #1e293b;">${companySize}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">User Type:</td>
                <td style="padding: 8px 0; color: #1e293b;">${userType}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">Use Case:</td>
                <td style="padding: 8px 0; color: #1e293b;">${useCase}</td>
              </tr>
            </table>

            ${details ? `
            <h2 style="color: #1e293b;">Additional Details</h2>
            <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #3B82F6;">
              <p style="margin: 0; color: #1e293b; line-height: 1.6;">${details}</p>
            </div>
            ` : ''}
          </div>
        </div>
      `;

      // Send email to TaskScout team
      await transporter.sendMail({
        from: `"TaskScout Contact Form" <${process.env.GMAIL_USER}>`,
        to: 'hello@taskscout.ai',
        subject: emailSubject,
        html: emailHtml
      });

      // Send confirmation email to user
      const confirmationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #3B82F6, #7C3AED); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">Thank You for Your Interest!</h1>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
            <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">Hi ${name},</p>
            
            <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">
              Thank you for requesting a free trial of TaskScout! We're excited to show you how our platform can transform your maintenance operations with our marketplace system that connects businesses and service providers.
            </p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10B981;">
              <h3 style="color: #1e293b; margin-top: 0;">What happens next?</h3>
              <ul style="color: #475569; line-height: 1.8;">
                <li><strong>Within 24 hours:</strong> Our team will review your request and contact you</li>
                <li><strong>Trial Setup:</strong> We'll create your personalized TaskScout account</li>
                <li><strong>Onboarding:</strong> Schedule a 30-minute demo tailored to your needs</li>
                <li><strong>Full Access:</strong> 14-day trial with all features unlocked</li>
              </ul>
            </div>

            <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">
              Best regards,<br>
              <strong>The TaskScout Team</strong>
            </p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"TaskScout Team" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Your TaskScout Free Trial Request - We\'ll Be In Touch Soon!',
        html: confirmationHtml
      });

      res.status(200).json({ 
        success: true, 
        message: 'Trial request submitted successfully' 
      });

    } catch (error) {
      console.error('Contact form error:', error);
      res.status(500).json({ 
        error: 'Failed to submit trial request. Please try again.' 
      });
    }
  });

  // Support contact form submission
  app.post('/api/support-contact', async (req, res) => {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        company,
        role,
        subject,
        priority,
        description
      } = req.body;

      const priorityLabel = {
        'low': 'Low - General question',
        'medium': 'Medium - Feature issue', 
        'high': 'High - System problem',
        'urgent': 'Urgent - Service outage'
      }[priority] || priority;

      // Create transporter for this specific request
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD
        }
      });

      // Email content for support team
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #14B8A6, #06B6D4); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">TaskScout Support Request</h1>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1e293b; margin-top: 0;">Contact Information</h2>
            <table style="width: 100%; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">Name:</td>
                <td style="padding: 8px 0; color: #1e293b;">${firstName} ${lastName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">Email:</td>
                <td style="padding: 8px 0; color: #1e293b;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">Phone:</td>
                <td style="padding: 8px 0; color: #1e293b;">${phone}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">Company:</td>
                <td style="padding: 8px 0; color: #1e293b;">${company}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">Role:</td>
                <td style="padding: 8px 0; color: #1e293b;">${role}</td>
              </tr>
            </table>

            <h2 style="color: #1e293b;">Request Details</h2>
            <table style="width: 100%; margin-bottom: 20px;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">Subject:</td>
                <td style="padding: 8px 0; color: #1e293b;">${subject}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #475569;">Priority:</td>
                <td style="padding: 8px 0; color: #1e293b;"><span style="background: ${priority === 'urgent' ? '#EF4444' : priority === 'high' ? '#F59E0B' : priority === 'medium' ? '#3B82F6' : '#10B981'}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">${priorityLabel}</span></td>
              </tr>
            </table>

            <h2 style="color: #1e293b;">Description</h2>
            <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #14B8A6;">
              <p style="margin: 0; color: #1e293b; line-height: 1.6;">${description}</p>
            </div>
            
            <div style="margin-top: 20px; padding: 15px; background: #E0F2FE; border-radius: 5px;">
              <p style="margin: 0; color: #0C4A6E; font-size: 14px;">
                <strong>Submitted:</strong> ${new Date().toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      `;

      // Send email to support team
      await transporter.sendMail({
        from: `"TaskScout Support" <${process.env.GMAIL_USER}>`,
        to: 'hello@taskscout.ai',
        subject: `[${priority?.toUpperCase() || 'SUPPORT'}] ${subject}`,
        html: emailHtml,
      });

      // Send confirmation email to user
      const confirmationHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #14B8A6, #06B6D4); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; text-align: center;">Support Request Received</h1>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1e293b; margin-top: 0;">Hello ${firstName},</h2>
            
            <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">
              Thank you for contacting TaskScout support! We've received your support request and our team will respond within 24 hours.
            </p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #14B8A6;">
              <h3 style="color: #1e293b; margin-top: 0;">Your Request Details</h3>
              <ul style="color: #475569; line-height: 1.8;">
                <li><strong>Subject:</strong> ${subject}</li>
                <li><strong>Priority:</strong> ${priorityLabel}</li>
                <li><strong>Reference ID:</strong> #${Date.now().toString().slice(-6)}</li>
              </ul>
            </div>

            <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">
              Our support team will review your request and get back to you at ${email}. For urgent issues, you can also reach us directly at 
              <a href="mailto:hello@taskscout.ai" style="color: #14B8A6;">hello@taskscout.ai</a>.
            </p>

            <p style="color: #1e293b; font-size: 16px; line-height: 1.6;">
              Best regards,<br>
              <strong>TaskScout Support Team</strong>
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #64748b; font-size: 14px;">
            <p>TaskScout - AI-Powered Maintenance Management</p>
            <p>Support: hello@taskscout.ai</p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"TaskScout Support" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'TaskScout Support - Request Received',
        html: confirmationHtml,
      });

      res.status(200).json({ 
        success: true, 
        message: 'Support request submitted successfully' 
      });

    } catch (error) {
      console.error('Support contact form error:', error);
      res.status(500).json({ 
        error: 'Failed to send support request. Please try again.' 
      });
    }
  });

  // Location and content optimization API
  app.get('/api/location-content', (req, res) => {
    try {
      // Get client IP address
      const clientIP = req.headers['x-forwarded-for'] as string || 
                      req.headers['x-real-ip'] as string ||
                      req.connection.remoteAddress || 
                      req.socket.remoteAddress ||
                      (req.connection as any)?.socket?.remoteAddress ||
                      req.ip;

      // Get search term from query parameters
      const searchTerm = req.query.search as string;
      
      // Get location data from IP
      const locationData = getLocationFromIP(clientIP);
      
      // Get service-specific content
      const serviceContent = getServiceContent(searchTerm);
      
      // Generate location-specific content
      const content = locationData ? 
        generateLocationSpecificContent(locationData, serviceContent) : 
        {
          metaTitle: `${serviceContent.title} | TaskScout`,
          metaDescription: serviceContent.description,
          heroTitle: 'Professional Maintenance Services',
          heroSubtitle: 'Connect with certified maintenance professionals',
          locationText: 'Serving businesses nationwide',
          serviceArea: 'Nationwide Service',
          timezone: 'America/New_York'
        };

      res.json({
        location: locationData,
        service: serviceContent,
        content: content,
        ip: clientIP // For debugging
      });
    } catch (error) {
      console.error('Location content error:', error);
      res.status(500).json({ error: 'Failed to get location content' });
    }
  });

  // Google Places API proxy endpoint
  app.get('/api/places/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.trim().length < 2) {
        return res.json({ predictions: [] });
      }
      
      const GOOGLE_PLACES_API_KEY = 'AIzaSyDSH2C4gyfgmxKA8Nyk-RzaxhjmxPCo9eg';
      
      // Fetch from Google Places Autocomplete API
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&key=${GOOGLE_PLACES_API_KEY}&types=address&components=country:us`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error('Google Places API error:', data.status, data.error_message);
        // Return empty results on error
        return res.json({ predictions: [] });
      }
      
      // Return the Google Places response
      res.json(data);
      
    } catch (error) {
      console.error('Error proxying Google Places request:', error);
      res.status(500).json({ 
        error: 'Failed to search locations',
        predictions: [] 
      });
    }
  });

  return httpServer;
}
