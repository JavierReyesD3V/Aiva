import { 
  trades, 
  accounts,
  userStats, 
  achievements, 
  dailyProgress,
  tradeSuggestions,
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
  type InsertTradeSuggestion
} from "@shared/schema";

export interface IStorage {
  // Accounts
  createAccount(account: InsertAccount): Promise<Account>;
  getAccounts(): Promise<Account[]>;
  getAccountById(id: number): Promise<Account | undefined>;
  updateAccount(id: number, account: Partial<Account>): Promise<Account | undefined>;
  deleteAccount(id: number): Promise<boolean>;
  setActiveAccount(id: number): Promise<void>;
  getActiveAccount(): Promise<Account | undefined>;
  
  // Trades
  createTrade(trade: InsertTrade): Promise<Trade>;
  getTrades(accountId?: number): Promise<Trade[]>;
  getTradeById(id: number): Promise<Trade | undefined>;
  updateTrade(id: number, trade: Partial<Trade>): Promise<Trade | undefined>;
  deleteTrade(id: number): Promise<boolean>;
  getTradesByDateRange(startDate: Date, endDate: Date, accountId?: number): Promise<Trade[]>;
  getTradesBySymbol(symbol: string, accountId?: number): Promise<Trade[]>;
  
  // User Stats
  getUserStats(): Promise<UserStats | undefined>;
  updateUserStats(stats: Partial<UserStats>): Promise<UserStats>;
  
  // Achievements
  getAchievements(): Promise<Achievement[]>;
  unlockAchievement(id: number): Promise<Achievement | undefined>;
  
  // Daily Progress
  getDailyProgress(date: Date): Promise<DailyProgress | undefined>;
  updateDailyProgress(date: Date, progress: Partial<DailyProgress>): Promise<DailyProgress>;
  getDailyProgressHistory(days: number): Promise<DailyProgress[]>;
  
  // Trade Suggestions
  createTradeSuggestion(suggestion: InsertTradeSuggestion): Promise<TradeSuggestion>;
  getTradeSuggestions(): Promise<TradeSuggestion[]>;
  getActiveTradeSuggestions(): Promise<TradeSuggestion[]>;
  updateTradeSuggestionStatus(id: number, status: string): Promise<TradeSuggestion | undefined>;
  deleteTradeSuggestion(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private accounts: Map<number, Account>;
  private trades: Map<number, Trade>;
  private userStats: UserStats | undefined;
  private achievements: Map<number, Achievement>;
  private dailyProgress: Map<string, DailyProgress>;
  private tradeSuggestions: Map<number, TradeSuggestion>;
  private currentAccountId: number;
  private currentTradeId: number;
  private currentAchievementId: number;
  private currentProgressId: number;
  private currentSuggestionId: number;
  private activeAccountId: number | undefined;

  constructor() {
    this.accounts = new Map();
    this.trades = new Map();
    this.achievements = new Map();
    this.dailyProgress = new Map();
    this.tradeSuggestions = new Map();
    this.currentAccountId = 1;
    this.currentTradeId = 1;
    this.currentAchievementId = 1;
    this.currentProgressId = 1;
    this.currentSuggestionId = 1;
    this.activeAccountId = undefined;
    
    // Initialize default user stats
    this.userStats = {
      id: 1,
      currentLevel: 1,
      currentPoints: 0,
      totalProfitabledays: 0,
      totalRiskControlDays: 0,
      consecutiveProfitableDays: 0,
      lastUpdated: new Date(),
      accountSize: null,
    };
    
    // Initialize default achievements
    this.initializeAchievements();
  }

  private initializeAchievements() {
    const defaultAchievements: Omit<Achievement, 'id'>[] = [
      {
        name: "First Trade",
        description: "Complete your first trade",
        type: "milestone",
        condition: "trades_count_1",
        points: 50,
        icon: "fas fa-chart-line",
        unlockedAt: null,
        isUnlocked: false,
      },
      {
        name: "Hot Streak",
        description: "5 profitable trades in a row",
        type: "streak",
        condition: "profitable_streak_5",
        points: 100,
        icon: "fas fa-fire",
        unlockedAt: null,
        isUnlocked: false,
      },
      {
        name: "Risk Master",
        description: "No losses >1% for 10 days",
        type: "performance",
        condition: "risk_control_10_days",
        points: 75,
        icon: "fas fa-shield-alt",
        unlockedAt: null,
        isUnlocked: false,
      },
      {
        name: "Profitable Week",
        description: "Profitable for 7 consecutive days",
        type: "streak",
        condition: "profitable_days_7",
        points: 150,
        icon: "fas fa-calendar-check",
        unlockedAt: null,
        isUnlocked: false,
      },
      {
        name: "Discipline Master",
        description: "Perfect daily targets for a week",
        type: "performance",
        condition: "perfect_week",
        points: 200,
        icon: "fas fa-medal",
        unlockedAt: null,
        isUnlocked: false,
      }
    ];

    defaultAchievements.forEach(achievement => {
      const id = this.currentAchievementId++;
      this.achievements.set(id, { ...achievement, id });
    });
  }

  // Account methods
  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const account: Account = {
      id: this.currentAccountId++,
      ...insertAccount,
      accountNumber: insertAccount.accountNumber || null,
      broker: insertAccount.broker || null,
      currency: insertAccount.currency || "USD",
      initialBalance: insertAccount.initialBalance || null,
      isActive: insertAccount.isActive !== undefined ? insertAccount.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.accounts.set(account.id, account);
    
    // Set as active if it's the first account
    if (this.accounts.size === 1) {
      this.activeAccountId = account.id;
    }
    
    return account;
  }

  async getAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values());
  }

  async getAccountById(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async updateAccount(id: number, accountUpdate: Partial<Account>): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;

    const updatedAccount = { ...account, ...accountUpdate, updatedAt: new Date() };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteAccount(id: number): Promise<boolean> {
    const deleted = this.accounts.delete(id);
    if (deleted && this.activeAccountId === id) {
      // Set first available account as active
      const firstAccount = Array.from(this.accounts.values())[0];
      this.activeAccountId = firstAccount?.id;
    }
    return deleted;
  }

  async setActiveAccount(id: number): Promise<void> {
    if (this.accounts.has(id)) {
      this.activeAccountId = id;
    }
  }

  async getActiveAccount(): Promise<Account | undefined> {
    if (this.activeAccountId) {
      return this.accounts.get(this.activeAccountId);
    }
    return undefined;
  }

  async getAccounts(): Promise<Account[]> {
    return Array.from(this.accounts.values());
  }

  async getAccountById(id: number): Promise<Account | undefined> {
    return this.accounts.get(id);
  }

  async updateAccount(id: number, accountUpdate: Partial<Account>): Promise<Account | undefined> {
    const account = this.accounts.get(id);
    if (!account) return undefined;

    const updatedAccount = { ...account, ...accountUpdate, updatedAt: new Date() };
    this.accounts.set(id, updatedAccount);
    return updatedAccount;
  }

  async deleteAccount(id: number): Promise<boolean> {
    const deleted = this.accounts.delete(id);
    if (deleted && this.activeAccountId === id) {
      // Set first available account as active
      const firstAccount = Array.from(this.accounts.values())[0];
      this.activeAccountId = firstAccount?.id;
    }
    return deleted;
  }

  async setActiveAccount(id: number): Promise<void> {
    if (this.accounts.has(id)) {
      this.activeAccountId = id;
    }
  }

  async getActiveAccount(): Promise<Account | undefined> {
    if (this.activeAccountId) {
      return this.accounts.get(this.activeAccountId);
    }
    return undefined;
  }

  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = this.currentTradeId++;
    const trade: Trade = { 
      ...insertTrade, 
      id,
      profit: insertTrade.profit || 0,
      closeTime: insertTrade.closeTime || null,
      closePrice: insertTrade.closePrice || null,
      commission: insertTrade.commission || null,
      swap: insertTrade.swap || null,
      notes: insertTrade.notes || null,
      volume: insertTrade.volume || null,
      isOpen: insertTrade.isOpen || null,
      stopLoss: insertTrade.stopLoss || null,
      takeProfit: insertTrade.takeProfit || null,
      pips: insertTrade.pips || null,
      reason: insertTrade.reason || null
    };
    this.trades.set(id, trade);
    return trade;
  }

  async getTrades(accountId?: number): Promise<Trade[]> {
    const trades = Array.from(this.trades.values());
    const filteredTrades = accountId 
      ? trades.filter(trade => trade.accountId === accountId)
      : trades.filter(trade => !this.activeAccountId || trade.accountId === this.activeAccountId);
    
    return filteredTrades.sort((a, b) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime());
  }

  async getTradeById(id: number): Promise<Trade | undefined> {
    return this.trades.get(id);
  }

  async updateTrade(id: number, tradeUpdate: Partial<Trade>): Promise<Trade | undefined> {
    const existingTrade = this.trades.get(id);
    if (!existingTrade) return undefined;
    
    const updatedTrade = { ...existingTrade, ...tradeUpdate };
    this.trades.set(id, updatedTrade);
    return updatedTrade;
  }

  async deleteTrade(id: number): Promise<boolean> {
    return this.trades.delete(id);
  }

  async getTradesByDateRange(startDate: Date, endDate: Date, accountId?: number): Promise<Trade[]> {
    const trades = Array.from(this.trades.values());
    const filteredTrades = accountId 
      ? trades.filter(trade => trade.accountId === accountId)
      : trades.filter(trade => !this.activeAccountId || trade.accountId === this.activeAccountId);
    
    return filteredTrades
      .filter(trade => {
        const tradeDate = new Date(trade.openTime);
        return tradeDate >= startDate && tradeDate <= endDate;
      })
      .sort((a, b) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime());
  }

  async getTradesBySymbol(symbol: string, accountId?: number): Promise<Trade[]> {
    const trades = Array.from(this.trades.values());
    const filteredTrades = accountId 
      ? trades.filter(trade => trade.accountId === accountId)
      : trades.filter(trade => !this.activeAccountId || trade.accountId === this.activeAccountId);
    
    return filteredTrades
      .filter(trade => trade.symbol === symbol)
      .sort((a, b) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime());
  }

  async getUserStats(): Promise<UserStats | undefined> {
    return this.userStats;
  }

  async updateUserStats(statsUpdate: Partial<UserStats>): Promise<UserStats> {
    this.userStats = { 
      ...this.userStats!, 
      ...statsUpdate, 
      lastUpdated: new Date() 
    };
    return this.userStats;
  }

  async getAchievements(): Promise<Achievement[]> {
    return Array.from(this.achievements.values());
  }

  async unlockAchievement(id: number): Promise<Achievement | undefined> {
    const achievement = this.achievements.get(id);
    if (!achievement) return undefined;
    
    const unlockedAchievement = {
      ...achievement,
      isUnlocked: true,
      unlockedAt: new Date(),
    };
    this.achievements.set(id, unlockedAchievement);
    return unlockedAchievement;
  }

  async getDailyProgress(date: Date): Promise<DailyProgress | undefined> {
    const dateKey = date.toISOString().split('T')[0];
    return this.dailyProgress.get(dateKey);
  }

  async updateDailyProgress(date: Date, progressUpdate: Partial<DailyProgress>): Promise<DailyProgress> {
    const dateKey = date.toISOString().split('T')[0];
    const existing = this.dailyProgress.get(dateKey);
    
    const progress: DailyProgress = existing ? 
      { ...existing, ...progressUpdate } : 
      { 
        id: this.currentProgressId++, 
        date, 
        dailyProfitTarget: false,
        riskControl: false,
        noOvertrading: false,
        pointsEarned: 0,
        ...progressUpdate 
      };
      
    this.dailyProgress.set(dateKey, progress);
    return progress;
  }

  async getDailyProgressHistory(days: number): Promise<DailyProgress[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return Array.from(this.dailyProgress.values())
      .filter(progress => new Date(progress.date) >= cutoffDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Trade Suggestions methods
  async createTradeSuggestion(insertSuggestion: InsertTradeSuggestion): Promise<TradeSuggestion> {
    const suggestion: TradeSuggestion = {
      id: this.currentSuggestionId++,
      ...insertSuggestion,
      stopLoss: insertSuggestion.stopLoss || null,
      takeProfit: insertSuggestion.takeProfit || null,
      status: insertSuggestion.status || 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.tradeSuggestions.set(suggestion.id, suggestion);
    return suggestion;
  }

  async getTradeSuggestions(): Promise<TradeSuggestion[]> {
    return Array.from(this.tradeSuggestions.values());
  }

  async getActiveTradeSuggestions(): Promise<TradeSuggestion[]> {
    const now = new Date();
    return Array.from(this.tradeSuggestions.values())
      .filter(suggestion => 
        suggestion.status === 'active' && 
        new Date(suggestion.validUntil) > now
      )
      .sort((a, b) => b.confidenceScore - a.confidenceScore);
  }

  async updateTradeSuggestionStatus(id: number, status: string): Promise<TradeSuggestion | undefined> {
    const suggestion = this.tradeSuggestions.get(id);
    if (!suggestion) return undefined;

    const updatedSuggestion = {
      ...suggestion,
      status,
      updatedAt: new Date(),
    };

    this.tradeSuggestions.set(id, updatedSuggestion);
    return updatedSuggestion;
  }

  async deleteTradeSuggestion(id: number): Promise<boolean> {
    return this.tradeSuggestions.delete(id);
  }
}

export const storage = new MemStorage();
