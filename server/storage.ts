import {
  type Account,
  type InsertAccount,
  type Trade,
  type InsertTrade,
  type UserStats,
  type Achievement,
  type DailyProgress,
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

export interface IStorage {
  // User operations for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId: string): Promise<User>;
  updateSubscriptionStatus(userId: string, subscriptionType: string, expiry?: Date): Promise<User>;

  // Accounts
  createAccount(userId: string, account: InsertAccount): Promise<Account>;
  getAccounts(userId: string): Promise<Account[]>;
  getAccountById(userId: string, id: number): Promise<Account | undefined>;
  updateAccount(userId: string, id: number, account: Partial<Account>): Promise<Account | undefined>;
  deleteAccount(userId: string, id: number): Promise<boolean>;
  setActiveAccount(userId: string, id: number): Promise<void>;
  getActiveAccount(userId: string): Promise<Account | undefined>;

  // Trades
  createTrade(userId: string, trade: InsertTrade): Promise<Trade>;
  getTrades(userId: string, accountId?: number): Promise<Trade[]>;
  getTradeById(userId: string, id: number): Promise<Trade | undefined>;
  updateTrade(userId: string, id: number, trade: Partial<Trade>): Promise<Trade | undefined>;
  deleteTrade(userId: string, id: number): Promise<boolean>;
  getTradesByDateRange(userId: string, startDate: Date, endDate: Date, accountId?: number): Promise<Trade[]>;
  getTradesBySymbol(userId: string, symbol: string, accountId?: number): Promise<Trade[]>;

  // User Stats
  getUserStats(userId: string): Promise<UserStats | undefined>;
  updateUserStats(userId: string, stats: Partial<UserStats>): Promise<UserStats>;

  // Achievements
  getAchievements(userId: string): Promise<Achievement[]>;
  unlockAchievement(userId: string, id: number): Promise<Achievement | undefined>;

  // Daily Progress
  getDailyProgress(userId: string, date: Date): Promise<DailyProgress | undefined>;
  updateDailyProgress(userId: string, date: Date, progress: Partial<DailyProgress>): Promise<DailyProgress>;
  getDailyProgressHistory(userId: string, days: number): Promise<DailyProgress[]>;

  // Trade Suggestions
  createTradeSuggestion(userId: string, suggestion: InsertTradeSuggestion): Promise<TradeSuggestion>;
  getTradeSuggestions(userId: string): Promise<TradeSuggestion[]>;
  getActiveTradeSuggestions(userId: string): Promise<TradeSuggestion[]>;
  updateTradeSuggestionStatus(userId: string, id: number, status: string): Promise<TradeSuggestion | undefined>;
  deleteTradeSuggestion(userId: string, id: number): Promise<boolean>;

  // Report History
  createReportHistory(userId: string, report: InsertReportHistory): Promise<ReportHistory>;
  getReportHistory(userId: string): Promise<ReportHistory[]>;
  getReportById(userId: string, id: number): Promise<ReportHistory | undefined>;
  deleteReport(userId: string, id: number): Promise<boolean>;

  // Admin Operations
  // User Management
  getAllUsers(page?: number, limit?: number, search?: string): Promise<{ users: User[], total: number }>;
  updateUserRole(adminUserId: string, targetUserId: string, role: string): Promise<User | undefined>;
  suspendUser(adminUserId: string, targetUserId: string, reason: string): Promise<User | undefined>;
  unsuspendUser(adminUserId: string, targetUserId: string): Promise<User | undefined>;
  deleteUserAccount(adminUserId: string, targetUserId: string, reason: string): Promise<boolean>;
  
  // System Analytics
  getSystemStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    totalTrades: number;
    totalAccounts: number;
    premiumUsers: number;
    revenueThisMonth: number;
  }>;
  getUserGrowthData(days: number): Promise<Array<{ date: string; users: number; }>>;
  getTradeVolumeData(days: number): Promise<Array<{ date: string; trades: number; }>>;

  // Admin Logs
  createAdminLog(log: InsertAdminLog): Promise<AdminLog>;
  getAdminLogs(page?: number, limit?: number, adminUserId?: string): Promise<{ logs: AdminLog[], total: number }>;

  // Promo Code Management
  createPromoCode(code: InsertPromoCode): Promise<PromoCode>;
  getAllPromoCodes(): Promise<PromoCode[]>;
  updatePromoCode(id: number, updates: Partial<PromoCode>): Promise<PromoCode | undefined>;
  deletePromoCode(id: number): Promise<boolean>;
  incrementPromoCodeUsage(code: string): Promise<boolean>;
}

// Import the database storage implementation
import { DatabaseStorage } from "./databaseStorage";

export const storage = new DatabaseStorage();