import { pgTable, text, serial, integer, real, timestamp, boolean, varchar, decimal, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  subscriptionType: varchar("subscription_type").default("freemium"), // "freemium" or "premium"
  subscriptionExpiry: timestamp("subscription_expiry"),
  maxTrades: integer("max_trades").default(100), // Límite de trades para freemium
  maxAccounts: integer("max_accounts").default(1), // Límite de cuentas para freemium
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  role: varchar("role").default("user"), // "user" or "admin"
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  accountNumber: varchar("account_number", { length: 100 }),
  broker: varchar("broker", { length: 100 }),
  currency: varchar("currency", { length: 10 }).default("USD"),
  initialBalance: decimal("initial_balance", { precision: 15, scale: 2 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accounts.id).notNull(),
  ticketId: text("ticket_id").notNull(),
  openTime: timestamp("open_time").notNull(),
  openPrice: real("open_price").notNull(),
  closeTime: timestamp("close_time"),
  closePrice: real("close_price"),
  profit: real("profit").notNull().default(0),
  lots: real("lots").notNull(),
  commission: real("commission").default(0),
  swap: real("swap").default(0),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(), // "Buy" or "Sell"
  stopLoss: real("stop_loss"),
  takeProfit: real("take_profit"),
  pips: real("pips"),
  reason: integer("reason"),
  volume: real("volume"),
  notes: text("notes"),
  isOpen: boolean("is_open").default(false),
});

export const userStats = pgTable("user_stats", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  currentLevel: integer("current_level").default(1),
  currentPoints: integer("current_points").default(0),
  totalProfitabledays: integer("total_profitable_days").default(0),
  totalRiskControlDays: integer("total_risk_control_days").default(0),
  consecutiveProfitableDays: integer("consecutive_profitable_days").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  accountSize: real("account_size"),
});

export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(), // "streak", "milestone", "performance"
  condition: text("condition").notNull(),
  points: integer("points").notNull(),
  icon: text("icon").notNull(),
  unlockedAt: timestamp("unlocked_at"),
  isUnlocked: boolean("is_unlocked").default(false),
});

export const dailyProgress = pgTable("daily_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  dailyProfitTarget: boolean("daily_profit_target").default(false),
  riskControl: boolean("risk_control").default(false),
  noOvertrading: boolean("no_overtrading").default(false),
  pointsEarned: integer("points_earned").default(0),
});

export const tradeSuggestions = pgTable("trade_suggestions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  symbol: text("symbol").notNull(),
  type: text("type").notNull(), // 'buy' or 'sell'
  entryPrice: real("entry_price").notNull(),
  stopLoss: real("stop_loss"),
  takeProfit: real("take_profit"),
  lotSize: real("lot_size").notNull(),
  riskScore: integer("risk_score").notNull(), // 1-100
  confidenceScore: integer("confidence_score").notNull(), // 1-100
  reasoning: text("reasoning").notNull(),
  marketAnalysis: text("market_analysis").notNull(),
  timeframe: text("timeframe").notNull(), // '1h', '4h', '1d'
  validUntil: timestamp("valid_until").notNull(),
  status: text("status").default("active"), // 'active', 'executed', 'expired'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  lastUpdated: true,
}).partial();

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true,
  unlockedAt: true,
  isUnlocked: true,
});

export const insertDailyProgressSchema = createInsertSchema(dailyProgress).omit({
  id: true,
});

export const insertTradeSuggestionSchema = createInsertSchema(tradeSuggestions).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});



// Relations for better ORM queries
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  stats: many(userStats),
  achievements: many(achievements),
  dailyProgress: many(dailyProgress),
  tradeSuggestions: many(tradeSuggestions),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  trades: many(trades),
}));

export const tradesRelations = relations(trades, ({ one }) => ({
  account: one(accounts, {
    fields: [trades.accountId],
    references: [accounts.id],
  }),
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
  user: one(users, {
    fields: [userStats.userId],
    references: [users.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  user: one(users, {
    fields: [achievements.userId],
    references: [users.id],
  }),
}));

export const dailyProgressRelations = relations(dailyProgress, ({ one }) => ({
  user: one(users, {
    fields: [dailyProgress.userId],
    references: [users.id],
  }),
}));

export const tradeSuggestionsRelations = relations(tradeSuggestions, ({ one }) => ({
  user: one(users, {
    fields: [tradeSuggestions.userId],
    references: [users.id],
  }),
}));

// Report history table for tracking generated reports
export const reportHistory = pgTable("report_history", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  reportType: varchar("report_type", { length: 50 }).notNull(), // "comprehensive", "performance", "tax", "risk"
  title: varchar("title", { length: 255 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  filePath: text("file_path"), // Path to stored report file
  fileSize: integer("file_size"), // Size in bytes
  dateRange: jsonb("date_range"), // { startDate, endDate }
  reportData: jsonb("report_data"), // Additional metadata about the report
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Report history relations
export const reportHistoryRelations = relations(reportHistory, ({ one }) => ({
  user: one(users, {
    fields: [reportHistory.userId],
    references: [users.id],
  }),
}));

// Report History schema
export const insertReportHistorySchema = createInsertSchema(reportHistory).omit({
  id: true,
  userId: true,
  createdAt: true,
});

// User types for Replit Auth
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Trading types
export type Trade = typeof trades.$inferSelect;
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type UserStats = typeof userStats.$inferSelect;
export type InsertUserStats = z.infer<typeof insertUserStatsSchema>;
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type DailyProgress = typeof dailyProgress.$inferSelect;
export type InsertDailyProgress = z.infer<typeof insertDailyProgressSchema>;
export type TradeSuggestion = typeof tradeSuggestions.$inferSelect;
export type InsertTradeSuggestion = z.infer<typeof insertTradeSuggestionSchema>;
export type ReportHistory = typeof reportHistory.$inferSelect;
export type InsertReportHistory = z.infer<typeof insertReportHistorySchema>;

// Admin logs table
export const adminLogs = pgTable("admin_logs", {
  id: serial("id").primaryKey(),
  adminUserId: varchar("admin_user_id").references(() => users.id).notNull(),
  action: varchar("action").notNull(), // "user_created", "user_suspended", "subscription_changed", etc.
  targetUserId: varchar("target_user_id").references(() => users.id),
  targetType: varchar("target_type"), // "user", "account", "trade", "system"
  targetId: varchar("target_id"),
  details: jsonb("details"), // Additional data about the action
  ipAddress: varchar("ip_address"),
  userAgent: varchar("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Promotional codes table for admin management
export const promoCodes = pgTable("promo_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code").unique().notNull(),
  discount: integer("discount").notNull(), // Percentage discount
  description: varchar("description"),
  maxUses: integer("max_uses"), // null = unlimited
  currentUses: integer("current_uses").default(0),
  isActive: boolean("is_active").default(true),
  expiresAt: timestamp("expires_at"),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas for admin tables
export const insertAdminLogSchema = createInsertSchema(adminLogs).omit({
  id: true,
  createdAt: true,
});

export const insertPromoCodeSchema = createInsertSchema(promoCodes).omit({
  id: true,
  currentUses: true,
  createdAt: true,
  updatedAt: true,
});

// Admin types
export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = z.infer<typeof insertAdminLogSchema>;
export type PromoCode = typeof promoCodes.$inferSelect;
export type InsertPromoCode = z.infer<typeof insertPromoCodeSchema>;
