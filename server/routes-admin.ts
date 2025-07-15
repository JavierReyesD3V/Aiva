import { Express, Request, Response } from "express";
import { storage } from "./storage";
import { isAuthenticated } from "./replitAuth";
import { z } from "zod";
import { insertPromoCodeSchema, insertAdminLogSchema } from "@shared/schema";

// Middleware para verificar si el usuario es administrador
export const isAdmin = async (req: Request, res: Response, next: Function) => {
  try {
    // Get user from current session (set by isAuthenticatedAdmin)
    const user = (req as any).currentUser;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Access denied. Admin privileges required." });
    }

    next();
  } catch (error) {
    console.error('Admin authorization error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Middleware de autenticación simplificado para admin
export const isAuthenticatedAdmin = async (req: Request, res: Response, next: Function) => {
  try {
    // Get user ID from authenticated session (Replit OAuth system)
    const userId = (req as any).user?.claims?.sub;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Add user to request for convenience
    (req as any).currentUser = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export function registerAdminRoutes(app: Express) {
  
  // ===== USER MANAGEMENT =====
  
  // Get all users with pagination and search
  app.get("/api/admin/users", isAuthenticatedAdmin, isAdmin, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = req.query.search as string;

      const result = await storage.getAllUsers(page, limit, search);
      res.json(result);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: "Error fetching users" });
    }
  });

  // Update user role
  app.patch("/api/admin/users/:userId/role", isAuthenticatedAdmin, isAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      const adminUserId = (req as any).currentUser?.id;

      if (!adminUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updatedUser = await storage.updateUserRole(adminUserId, userId, role);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: "Error updating user role" });
    }
  });

  // Suspend user
  app.patch("/api/admin/users/:userId/suspend", isAuthenticatedAdmin, isAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const adminUserId = (req as any).currentUser?.id;

      if (!adminUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!reason) {
        return res.status(400).json({ message: "Reason is required" });
      }

      const updatedUser = await storage.suspendUser(adminUserId, userId, reason);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error('Error suspending user:', error);
      res.status(500).json({ message: "Error suspending user" });
    }
  });

  // Unsuspend user
  app.patch("/api/admin/users/:userId/unsuspend", isAuthenticatedAdmin, isAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const adminUserId = (req as any).currentUser?.id;

      if (!adminUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const updatedUser = await storage.unsuspendUser(adminUserId, userId);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json(updatedUser);
    } catch (error) {
      console.error('Error unsuspending user:', error);
      res.status(500).json({ message: "Error unsuspending user" });
    }
  });

  // Delete user account
  app.delete("/api/admin/users/:userId", isAuthenticatedAdmin, isAdmin, async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      const adminUserId = (req as any).currentUser?.id;

      if (!adminUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      if (!reason) {
        return res.status(400).json({ message: "Reason is required" });
      }

      const success = await storage.deleteUserAccount(adminUserId, userId, reason);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User account deleted successfully" });
    } catch (error) {
      console.error('Error deleting user account:', error);
      res.status(500).json({ message: "Error deleting user account" });
    }
  });

  // ===== SYSTEM ANALYTICS =====

  // Get system statistics
  app.get("/api/admin/stats", isAuthenticatedAdmin, isAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching system stats:', error);
      res.status(500).json({ message: "Error fetching system statistics" });
    }
  });

  // Get user growth data
  app.get("/api/admin/analytics/user-growth", isAuthenticatedAdmin, isAdmin, async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const data = await storage.getUserGrowthData(days);
      res.json(data);
    } catch (error) {
      console.error('Error fetching user growth data:', error);
      res.status(500).json({ message: "Error fetching user growth data" });
    }
  });

  // Get trade volume data
  app.get("/api/admin/analytics/trade-volume", isAuthenticatedAdmin, isAdmin, async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const data = await storage.getTradeVolumeData(days);
      res.json(data);
    } catch (error) {
      console.error('Error fetching trade volume data:', error);
      res.status(500).json({ message: "Error fetching trade volume data" });
    }
  });

  // ===== ADMIN LOGS =====

  // Get admin activity logs
  app.get("/api/admin/logs", isAuthenticatedAdmin, isAdmin, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const adminUserId = req.query.adminUserId as string;

      const result = await storage.getAdminLogs(page, limit, adminUserId);
      res.json(result);
    } catch (error) {
      console.error('Error fetching admin logs:', error);
      res.status(500).json({ message: "Error fetching admin logs" });
    }
  });

  // ===== PROMO CODE MANAGEMENT =====

  // Get all promo codes
  app.get("/api/admin/promo-codes", isAuthenticatedAdmin, isAdmin, async (req: Request, res: Response) => {
    try {
      const promoCodes = await storage.getAllPromoCodes();
      res.json(promoCodes);
    } catch (error) {
      console.error('Error fetching promo codes:', error);
      res.status(500).json({ message: "Error fetching promo codes" });
    }
  });

  // Create new promo code
  app.post("/api/admin/promo-codes", isAuthenticatedAdmin, isAdmin, async (req: Request, res: Response) => {
    try {
      const adminUserId = (req as any).currentUser?.id;
      if (!adminUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { expiresAt, ...bodyData } = req.body;
      const validatedData = insertPromoCodeSchema.parse({
        ...bodyData,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdBy: adminUserId
      });

      const newPromoCode = await storage.createPromoCode(validatedData);
      
      // Log the action
      await storage.createAdminLog({
        adminUserId,
        action: 'promo_code_created',
        targetType: 'promo_code',
        targetId: newPromoCode.id.toString(),
        details: { code: newPromoCode.code, discount: newPromoCode.discount }
      });

      res.status(201).json(newPromoCode);
    } catch (error) {
      console.error('Error creating promo code:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating promo code" });
    }
  });

  // Update promo code
  app.patch("/api/admin/promo-codes/:id", isAuthenticatedAdmin, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const adminUserId = (req as any).currentUser?.id;

      if (!adminUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const updatedPromoCode = await storage.updatePromoCode(id, req.body);
      if (!updatedPromoCode) {
        return res.status(404).json({ message: "Promo code not found" });
      }

      // Log the action
      await storage.createAdminLog({
        adminUserId,
        action: 'promo_code_updated',
        targetType: 'promo_code',
        targetId: id.toString(),
        details: { updates: req.body }
      });

      res.json(updatedPromoCode);
    } catch (error) {
      console.error('Error updating promo code:', error);
      res.status(500).json({ message: "Error updating promo code" });
    }
  });

  // Delete promo code
  app.delete("/api/admin/promo-codes/:id", isAuthenticatedAdmin, isAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const adminUserId = (req as any).currentUser?.id;

      if (!adminUserId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const success = await storage.deletePromoCode(id);
      if (!success) {
        return res.status(404).json({ message: "Promo code not found" });
      }

      // Log the action
      await storage.createAdminLog({
        adminUserId,
        action: 'promo_code_deleted',
        targetType: 'promo_code',
        targetId: id.toString(),
        details: {}
      });

      res.json({ message: "Promo code deleted successfully" });
    } catch (error) {
      console.error('Error deleting promo code:', error);
      res.status(500).json({ message: "Error deleting promo code" });
    }
  });

  // ===== ADMIN STATUS CHECK =====

  // Check if current user is admin
  app.get("/api/admin/status", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user.claims.sub;
      const user = await storage.getUser(userId);
      const isAdmin = user?.role === 'admin';

      res.json({ isAdmin, user: isAdmin ? user : null });
    } catch (error) {
      console.error('Error checking admin status:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
}