import session from 'express-session';
import { storage } from './storage';
import type { Request, Response, NextFunction } from 'express';
import type { User } from '@shared/schema';

// Session configuration
export function getSessionConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  const isReplit = process.env.REPL_ID !== undefined;
  
  return session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction || isReplit, // Use secure cookies for production and Replit (HTTPS)
      httpOnly: false, // Allow mobile app access to cookies
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: isProduction || isReplit ? 'none' : 'lax', // More permissive for cross-origin (mobile app)
    },
  });
}

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Authentication middleware
export async function authenticateUser(req: Request, res: Response, next: NextFunction) {
  let userId: number | null = null;

  // Check session-based auth first (for web clients)
  if (req.session && req.session.userId) {
    userId = req.session.userId;
  } else {
    // Check JWT token in Authorization header (for mobile clients)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = require('jsonwebtoken');
        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        const decoded = jwt.verify(token, process.env.SESSION_SECRET || 'your-secret-key');
        userId = decoded.userId;
      } catch (jwtError) {
        // JWT verification failed, continue to return 401
      }
    }
  }

  if (!userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  try {
    const user = await storage.getUser(userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User not found or inactive' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(500).json({ message: 'Authentication error' });
  }
}

// Role-based authorization middleware
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
}

// Organization access middleware
export function requireOrganization(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  if (req.user.role === 'root') {
    return next(); // Root can access everything
  }

  if (req.user.role === 'org_admin' && req.user.organizationId) {
    return next();
  }

  return res.status(403).json({ message: 'Organization access required' });
}

// Declare session interface
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}