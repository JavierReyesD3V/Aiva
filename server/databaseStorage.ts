import { 
  trades, 
  accounts,
  userStats, 
  achievements, 
  dailyProgress,
  tradeSuggestions,
  reportHistory,
  users,
  adminLogs,
  promoCodes,
  type Account,
  type InsertAccount,
  type Trade, 
  type InsertTrade,
  type UserStats,
  type InsertUserStats,
  type Achievement,
  type InsertAchievement,
  type DailyProgress,
  type InsertDailyProgress,
  type TradeSuggestion,
  type InsertTradeSuggestion,
  type ReportHistory,
  type InsertReportHistory,
  type User,
  type UpsertUser,
  type AdminLog,
  type InsertAdminLog,
  type PromoCode,
  type InsertPromoCode,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or, gte, lte, count, ilike, sql } from "drizzle-orm";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User operations for Replit Auth
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    // First try to find existing user by id
    const existing = await db
      .select()
      .from(users)
      .where(eq(users.id, userData.id))
      .limit(1);

    if (existing.length > 0) {
      // Update existing user (but don't change the ID to avoid foreign key issues)
      const { id, ...updateData } = userData; // Destructure to exclude ID
      
      const [user] = await db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existing[0].id))
        .returning();
      return user;
    } else {
      // Check if email already exists (for different user)
      if (userData.email) {
        const emailExists = await db
          .select()
          .from(users)
          .where(eq(users.email, userData.email))
          .limit(1);
        
        if (emailExists.length > 0) {
          // Email exists with different ID - this is a conflict situation
          // For OAuth users, we need to create a new user with the correct ID
          // Update the existing user to have no email to avoid conflict, then create new user
          await db
            .update(users)
            .set({ email: null })
            .where(eq(users.id, emailExists[0].id));
        }
      }
      
      // Insert new user
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();
      return user;
    }
  }

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        stripeCustomerId,
        stripeSubscriptionId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateSubscriptionStatus(userId: string, subscriptionType: string, expiry?: Date): Promise<User> {
    const [user] = await db
      .update(users)
      .set({
        subscriptionType,
        subscriptionExpiry: expiry,
        maxTrades: subscriptionType === "premium" ? 10000 : 100,
        maxAccounts: subscriptionType === "premium" ? 10 : 1,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Accounts
  async createAccount(userId: string, insertAccount: InsertAccount): Promise<Account> {
    const [account] = await db
      .insert(accounts)
      .values({ ...insertAccount, userId })
      .returning();
    return account;
  }

  async getAccounts(userId: string): Promise<Account[]> {
    return await db.select().from(accounts).where(eq(accounts.userId, userId));
  }

  async getAccountById(userId: string, id: number): Promise<Account | undefined> {
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
    return account;
  }

  async updateAccount(userId: string, id: number, accountUpdate: Partial<Account>): Promise<Account | undefined> {
    const [account] = await db
      .update(accounts)
      .set({ ...accountUpdate, updatedAt: new Date() })
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)))
      .returning();
    return account;
  }

  async deleteAccount(userId: string, id: number): Promise<boolean> {
    const result = await db
      .delete(accounts)
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  async setActiveAccount(userId: string, id: number): Promise<void> {
    // First deactivate all accounts for this user
    await db
      .update(accounts)
      .set({ isActive: false })
      .where(eq(accounts.userId, userId));
    
    // Then activate the specified account
    await db
      .update(accounts)
      .set({ isActive: true })
      .where(and(eq(accounts.id, id), eq(accounts.userId, userId)));
  }

  async getActiveAccount(userId: string): Promise<Account | undefined> {
    const [account] = await db
      .select()
      .from(accounts)
      .where(and(eq(accounts.userId, userId), eq(accounts.isActive, true)));
    return account;
  }

  // Trades
  async createTrade(userId: string, insertTrade: InsertTrade): Promise<Trade> {
    // Verify the account belongs to the user
    const account = await this.getAccountById(userId, insertTrade.accountId);
    if (!account) {
      throw new Error("Account not found or doesn't belong to user");
    }

    const [trade] = await db
      .insert(trades)
      .values(insertTrade)
      .returning();
    return trade;
  }

  async getTrades(userId: string, accountId?: number): Promise<Trade[]> {
    if (accountId) {
      return await db
        .select()
        .from(trades)
        .innerJoin(accounts, eq(trades.accountId, accounts.id))
        .where(and(eq(accounts.userId, userId), eq(trades.accountId, accountId)))
        .orderBy(desc(trades.openTime))
        .then(results => results.map(result => result.trades));
    } else {
      return await db
        .select()
        .from(trades)
        .innerJoin(accounts, eq(trades.accountId, accounts.id))
        .where(eq(accounts.userId, userId))
        .orderBy(desc(trades.openTime))
        .then(results => results.map(result => result.trades));
    }
  }

  async getTradeById(userId: string, id: number): Promise<Trade | undefined> {
    const [result] = await db
      .select()
      .from(trades)
      .innerJoin(accounts, eq(trades.accountId, accounts.id))
      .where(and(eq(trades.id, id), eq(accounts.userId, userId)));
    
    return result?.trades;
  }

  async updateTrade(userId: string, id: number, tradeUpdate: Partial<Trade>): Promise<Trade | undefined> {
    // First verify the trade belongs to the user
    const existingTrade = await this.getTradeById(userId, id);
    if (!existingTrade) {
      return undefined;
    }

    const [trade] = await db
      .update(trades)
      .set(tradeUpdate)
      .where(eq(trades.id, id))
      .returning();
    return trade;
  }

  async deleteTrade(userId: string, id: number): Promise<boolean> {
    // First verify the trade belongs to the user
    const existingTrade = await this.getTradeById(userId, id);
    if (!existingTrade) {
      return false;
    }

    const result = await db.delete(trades).where(eq(trades.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getTradesByDateRange(userId: string, startDate: Date, endDate: Date, accountId?: number): Promise<Trade[]> {
    const conditions = [
      eq(accounts.userId, userId),
      gte(trades.openTime, startDate),
      lte(trades.openTime, endDate)
    ];

    if (accountId) {
      conditions.push(eq(trades.accountId, accountId));
    }

    const results = await db
      .select()
      .from(trades)
      .innerJoin(accounts, eq(trades.accountId, accounts.id))
      .where(and(...conditions))
      .orderBy(desc(trades.openTime));
    
    return results.map(result => result.trades);
  }

  async getTradesBySymbol(userId: string, symbol: string, accountId?: number): Promise<Trade[]> {
    const conditions = [
      eq(accounts.userId, userId),
      eq(trades.symbol, symbol)
    ];

    if (accountId) {
      conditions.push(eq(trades.accountId, accountId));
    }

    const results = await db
      .select()
      .from(trades)
      .innerJoin(accounts, eq(trades.accountId, accounts.id))
      .where(and(...conditions))
      .orderBy(desc(trades.openTime));
    
    return results.map(result => result.trades);
  }

  // User Stats
  async getUserStats(userId: string): Promise<UserStats | undefined> {
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId));
    return stats;
  }

  async updateUserStats(userId: string, statsUpdate: Partial<UserStats>): Promise<UserStats> {
    const existing = await this.getUserStats(userId);
    
    if (existing) {
      const [stats] = await db
        .update(userStats)
        .set({ ...statsUpdate, lastUpdated: new Date() })
        .where(eq(userStats.userId, userId))
        .returning();
      return stats;
    } else {
      const [stats] = await db
        .insert(userStats)
        .values({ userId, ...statsUpdate })
        .returning();
      return stats;
    }
  }

  // Achievements
  async getAchievements(userId: string): Promise<Achievement[]> {
    return await db
      .select()
      .from(achievements)
      .where(eq(achievements.userId, userId));
  }

  async unlockAchievement(userId: string, achievementId: number): Promise<Achievement | undefined> {
    const [achievement] = await db
      .update(achievements)
      .set({ isUnlocked: true, unlockedAt: new Date() })
      .where(and(eq(achievements.id, achievementId), eq(achievements.userId, userId)))
      .returning();
    return achievement;
  }

  // Daily Progress
  async getDailyProgress(userId: string, date: Date): Promise<DailyProgress | undefined> {
    const dateStr = date.toISOString().split('T')[0];
    const [progress] = await db
      .select()
      .from(dailyProgress)
      .where(and(
        eq(dailyProgress.userId, userId),
        eq(dailyProgress.date, new Date(dateStr))
      ));
    return progress;
  }

  async updateDailyProgress(userId: string, date: Date, progressUpdate: Partial<DailyProgress>): Promise<DailyProgress> {
    const existing = await this.getDailyProgress(userId, date);
    const dateStr = date.toISOString().split('T')[0];
    
    if (existing) {
      const [progress] = await db
        .update(dailyProgress)
        .set(progressUpdate)
        .where(and(
          eq(dailyProgress.userId, userId),
          eq(dailyProgress.date, new Date(dateStr))
        ))
        .returning();
      return progress;
    } else {
      const [progress] = await db
        .insert(dailyProgress)
        .values({ userId, date: new Date(dateStr), ...progressUpdate })
        .returning();
      return progress;
    }
  }

  async getDailyProgressHistory(userId: string, days: number): Promise<DailyProgress[]> {
    return await db
      .select()
      .from(dailyProgress)
      .where(eq(dailyProgress.userId, userId))
      .orderBy(desc(dailyProgress.date))
      .limit(days);
  }

  // Trade Suggestions
  async createTradeSuggestion(userId: string, insertSuggestion: InsertTradeSuggestion): Promise<TradeSuggestion> {
    const [suggestion] = await db
      .insert(tradeSuggestions)
      .values({ ...insertSuggestion, userId })
      .returning();
    return suggestion;
  }

  async getTradeSuggestions(userId: string): Promise<TradeSuggestion[]> {
    return await db
      .select()
      .from(tradeSuggestions)
      .where(eq(tradeSuggestions.userId, userId))
      .orderBy(desc(tradeSuggestions.createdAt));
  }

  async getActiveTradeSuggestions(userId: string): Promise<TradeSuggestion[]> {
    return await db
      .select()
      .from(tradeSuggestions)
      .where(and(
        eq(tradeSuggestions.userId, userId),
        eq(tradeSuggestions.status, "active")
      ))
      .orderBy(desc(tradeSuggestions.createdAt));
  }

  async updateTradeSuggestionStatus(userId: string, id: number, status: string): Promise<TradeSuggestion | undefined> {
    const [suggestion] = await db
      .update(tradeSuggestions)
      .set({ status, updatedAt: new Date() })
      .where(and(eq(tradeSuggestions.id, id), eq(tradeSuggestions.userId, userId)))
      .returning();
    return suggestion;
  }

  async deleteTradeSuggestion(userId: string, id: number): Promise<boolean> {
    const result = await db
      .delete(tradeSuggestions)
      .where(and(eq(tradeSuggestions.id, id), eq(tradeSuggestions.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // Report History operations
  async createReportHistory(userId: string, report: InsertReportHistory): Promise<ReportHistory> {
    const [newReport] = await db
      .insert(reportHistory)
      .values({
        ...report,
        userId,
      })
      .returning();
    return newReport;
  }

  async getReportHistory(userId: string): Promise<ReportHistory[]> {
    return await db
      .select()
      .from(reportHistory)
      .where(eq(reportHistory.userId, userId))
      .orderBy(desc(reportHistory.createdAt));
  }

  async getReportById(userId: string, id: number): Promise<ReportHistory | undefined> {
    const [report] = await db
      .select()
      .from(reportHistory)
      .where(and(eq(reportHistory.id, id), eq(reportHistory.userId, userId)));
    return report;
  }

  async deleteReport(userId: string, id: number): Promise<boolean> {
    const result = await db
      .delete(reportHistory)
      .where(and(eq(reportHistory.id, id), eq(reportHistory.userId, userId)));
    return (result.rowCount || 0) > 0;
  }

  // Admin Operations Implementation
  async getAllUsers(page = 1, limit = 50, search?: string): Promise<{ users: User[], total: number }> {
    const offset = (page - 1) * limit;
    
    let whereCondition;
    if (search) {
      whereCondition = or(
        ilike(users.email, `%${search}%`),
        ilike(users.firstName, `%${search}%`),
        ilike(users.lastName, `%${search}%`)
      );
    }

    const [usersList, totalCount] = await Promise.all([
      db.select()
        .from(users)
        .where(whereCondition)
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() })
        .from(users)
        .where(whereCondition)
    ]);

    return {
      users: usersList,
      total: totalCount[0].count
    };
  }

  async updateUserRole(adminUserId: string, targetUserId: string, role: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, targetUserId))
      .returning();

    if (updatedUser) {
      await this.createAdminLog({
        adminUserId,
        action: 'user_role_updated',
        targetUserId,
        targetType: 'user',
        targetId: targetUserId,
        details: { newRole: role }
      });
    }

    return updatedUser;
  }

  async suspendUser(adminUserId: string, targetUserId: string, reason: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(users.id, targetUserId))
      .returning();

    if (updatedUser) {
      await this.createAdminLog({
        adminUserId,
        action: 'user_suspended',
        targetUserId,
        targetType: 'user',
        targetId: targetUserId,
        details: { reason }
      });
    }

    return updatedUser;
  }

  async unsuspendUser(adminUserId: string, targetUserId: string): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(users.id, targetUserId))
      .returning();

    if (updatedUser) {
      await this.createAdminLog({
        adminUserId,
        action: 'user_unsuspended',
        targetUserId,
        targetType: 'user',
        targetId: targetUserId,
        details: {}
      });
    }

    return updatedUser;
  }

  async deleteUserAccount(adminUserId: string, targetUserId: string, reason: string): Promise<boolean> {
    // Log the action first (before deletion begins)
    await this.createAdminLog({
      adminUserId,
      action: 'user_deletion_started',
      targetUserId,
      targetType: 'user',
      targetId: targetUserId,
      details: { reason }
    });

    // Delete related data in proper order
    await db.delete(trades).where(
      eq(trades.accountId, 
        sql`(SELECT id FROM ${accounts} WHERE user_id = ${targetUserId})`
      )
    );
    await db.delete(accounts).where(eq(accounts.userId, targetUserId));
    await db.delete(userStats).where(eq(userStats.userId, targetUserId));
    await db.delete(achievements).where(eq(achievements.userId, targetUserId));
    await db.delete(dailyProgress).where(eq(dailyProgress.userId, targetUserId));
    await db.delete(tradeSuggestions).where(eq(tradeSuggestions.userId, targetUserId));
    await db.delete(reportHistory).where(eq(reportHistory.userId, targetUserId));
    
    // Delete admin logs where this user is referenced (both as admin and target)
    await db.delete(adminLogs).where(eq(adminLogs.adminUserId, targetUserId));
    await db.delete(adminLogs).where(eq(adminLogs.targetUserId, targetUserId));

    // Finally delete the user
    const result = await db.delete(users).where(eq(users.id, targetUserId));
    
    // Log successful deletion
    if ((result.rowCount || 0) > 0) {
      await this.createAdminLog({
        adminUserId,
        action: 'user_deleted_successfully',
        targetUserId: null,
        targetType: 'user',
        targetId: targetUserId,
        details: { reason, deletedUserId: targetUserId }
      });
    }
    
    return (result.rowCount || 0) > 0;
  }

  async getSystemStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalTrades: number;
    totalAccounts: number;
    premiumUsers: number;
    revenueThisMonth: number;
  }> {
    const [
      totalUsersCount,
      activeUsersCount,
      totalTradesCount,
      totalAccountsCount,
      premiumUsersCount
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(users).where(eq(users.isActive, true)),
      db.select({ count: count() }).from(trades),
      db.select({ count: count() }).from(accounts),
      db.select({ count: count() }).from(users).where(eq(users.subscriptionType, 'premium'))
    ]);

    return {
      totalUsers: totalUsersCount[0].count,
      activeUsers: activeUsersCount[0].count,
      totalTrades: totalTradesCount[0].count,
      totalAccounts: totalAccountsCount[0].count,
      premiumUsers: premiumUsersCount[0].count,
      revenueThisMonth: premiumUsersCount[0].count * 29.99 // Simplified calculation
    };
  }

  async getUserGrowthData(days: number): Promise<Array<{ date: string; users: number; }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const result = await db
      .select({
        date: sql<string>`DATE(${users.createdAt})`,
        users: count()
      })
      .from(users)
      .where(gte(users.createdAt, startDate))
      .groupBy(sql`DATE(${users.createdAt})`)
      .orderBy(sql`DATE(${users.createdAt})`);

    return result;
  }

  async getTradeVolumeData(days: number): Promise<Array<{ date: string; trades: number; }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const result = await db
      .select({
        date: sql<string>`DATE(${trades.openTime})`,
        trades: count()
      })
      .from(trades)
      .where(gte(trades.openTime, startDate))
      .groupBy(sql`DATE(${trades.openTime})`)
      .orderBy(sql`DATE(${trades.openTime})`);

    return result;
  }

  async createAdminLog(log: InsertAdminLog): Promise<AdminLog> {
    const [newLog] = await db.insert(adminLogs).values(log).returning();
    return newLog;
  }

  async getAdminLogs(page = 1, limit = 50, adminUserId?: string): Promise<{ logs: AdminLog[], total: number }> {
    const offset = (page - 1) * limit;
    
    const whereCondition = adminUserId ? eq(adminLogs.adminUserId, adminUserId) : undefined;

    const [logsList, totalCount] = await Promise.all([
      db.select()
        .from(adminLogs)
        .where(whereCondition)
        .orderBy(desc(adminLogs.createdAt))
        .limit(limit)
        .offset(offset),
      db.select({ count: count() })
        .from(adminLogs)
        .where(whereCondition)
    ]);

    return {
      logs: logsList,
      total: totalCount[0].count
    };
  }

  async createPromoCode(code: InsertPromoCode): Promise<PromoCode> {
    const [newCode] = await db.insert(promoCodes).values(code).returning();
    return newCode;
  }

  async getAllPromoCodes(): Promise<PromoCode[]> {
    return await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
  }

  async updatePromoCode(id: number, updates: Partial<PromoCode>): Promise<PromoCode | undefined> {
    const [updatedCode] = await db
      .update(promoCodes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(promoCodes.id, id))
      .returning();
    return updatedCode;
  }

  async deletePromoCode(id: number): Promise<boolean> {
    const result = await db.delete(promoCodes).where(eq(promoCodes.id, id));
    return (result.rowCount || 0) > 0;
  }

  async incrementPromoCodeUsage(code: string): Promise<boolean> {
    const result = await db
      .update(promoCodes)
      .set({ 
        currentUses: sql`${promoCodes.currentUses} + 1`,
        updatedAt: new Date()
      })
      .where(eq(promoCodes.code, code));
    return (result.rowCount || 0) > 0;
  }
}