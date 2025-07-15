import { createServer } from "http";
import type { Express } from "express";
import express from "express";
import { storage } from "./storage";
import { calculateLevel, checkAchievementConditions } from "./services/gamification";
import { generateTradeSuggestions } from "./services/tradeSuggestions";
import { registerChatRoutes } from "./routes-chat";
import { analyzeTradingPerformance } from "./services/openai";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { seedDefaultUser } from "./seedUser";
import { calculateTradingMetrics } from "./services/tradingAnalytics";
import { generateComprehensivePDFReport } from "./services/pdfGenerator";
import { generateHTMLReport } from "./services/htmlReportGenerator.js";
import { initializeUserAchievements, checkAndUnlockEarnedAchievements } from "./services/achievementInitializer";
// Subscription middleware no longer needed - all features are now free
import Stripe from "stripe";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export async function registerRoutes(app: Express) {
  // Setup authentication
  await setupAuth(app);
  
  // Initialize default user for development
  await seedDefaultUser();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      let userId: string;
      
      if (user.provider === 'google') {
        userId = `google_${user.claims.id}`;
      } else {
        userId = user.claims.sub;
      }
      
      const dbUser = await storage.getUser(userId);
      res.json(dbUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Function to get userId from session or use default for development
  const getUserId = (req: any): string => {
    if (req.isAuthenticated && req.user) {
      if (req.user.provider === 'google') {
        return `google_${req.user.claims.id}`;
      } else if (req.user.claims?.sub) {
        return req.user.claims.sub;
      }
    }
    // Fallback for development - use a fixed user ID
    return "demo-user-1";
  };

  // Function to check if user is authenticated via OAuth
  const isOAuthUser = (req: any): boolean => {
    return req.isAuthenticated && req.user?.claims?.sub;
  };

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Accounts endpoints
  app.get("/api/accounts", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const accounts = await storage.getAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ error: "Failed to fetch accounts" });
    }
  });

  app.patch("/api/accounts/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getUserId(req);
      const account = await storage.updateAccount(userId, id, req.body);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      console.error("Error updating account:", error);
      res.status(500).json({ error: "Failed to update account" });
    }
  });

  app.post("/api/accounts", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Account creation is now unlimited for all users
      
      const account = await storage.createAccount(userId, req.body);
      res.json(account);
    } catch (error) {
      console.error("Error creating account:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  app.put("/api/accounts/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getUserId(req);
      const account = await storage.updateAccount(userId, id, req.body);
      if (!account) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json(account);
    } catch (error) {
      console.error("Error updating account:", error);
      res.status(500).json({ error: "Failed to update account" });
    }
  });

  app.delete("/api/accounts/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getUserId(req);
      const success = await storage.deleteAccount(userId, id);
      if (!success) {
        return res.status(404).json({ error: "Account not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting account:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });

  app.post("/api/accounts/:id/activate", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getUserId(req);
      await storage.setActiveAccount(userId, id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error activating account:", error);
      res.status(500).json({ error: "Failed to activate account" });
    }
  });

  app.get("/api/accounts/active", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const account = await storage.getActiveAccount(userId);
      res.json(account);
    } catch (error) {
      console.error("Error fetching active account:", error);
      res.status(500).json({ error: "Failed to fetch active account" });
    }
  });

  // Trades endpoints
  app.get("/api/trades", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const accountId = req.query.accountId ? parseInt(req.query.accountId as string) : undefined;
      const trades = await storage.getTrades(userId, accountId);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ error: "Failed to fetch trades" });
    }
  });

  app.post("/api/trades", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Trade creation is now unlimited for all users
      
      // Convert string dates to Date objects for database storage
      const tradeData = {
        ...req.body,
        openTime: new Date(req.body.openTime),
        closeTime: req.body.closeTime ? new Date(req.body.closeTime) : null
      };
      
      const trade = await storage.createTrade(userId, tradeData);
      
      // Ensure user stats exist before updating gamification
      let userStats = await storage.getUserStats(userId);
      if (!userStats) {
        userStats = await storage.updateUserStats(userId, {
          currentLevel: 1,
          currentPoints: 0,
          totalProfitabledays: 0,
          totalRiskControlDays: 0,
          consecutiveProfitableDays: 0,
          lastUpdated: new Date(),
          accountSize: null
        });
      }
      
      await updateGamificationStats(userId);
      res.json(trade);
    } catch (error) {
      console.error("Error creating trade:", error);
      res.status(500).json({ error: "Failed to create trade" });
    }
  });

  app.put("/api/trades/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getUserId(req);
      
      // Convert string dates to Date objects for database storage
      const updateData = { ...req.body };
      if (updateData.openTime && typeof updateData.openTime === 'string') {
        updateData.openTime = new Date(updateData.openTime);
      }
      if (updateData.closeTime && typeof updateData.closeTime === 'string') {
        updateData.closeTime = new Date(updateData.closeTime);
      }
      
      const trade = await storage.updateTrade(userId, id, updateData);
      if (!trade) {
        return res.status(404).json({ error: "Trade not found" });
      }
      await updateGamificationStats(userId);
      res.json(trade);
    } catch (error) {
      console.error("Error updating trade:", error);
      res.status(500).json({ error: "Failed to update trade" });
    }
  });

  app.delete("/api/trades/:id", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getUserId(req);
      const success = await storage.deleteTrade(userId, id);
      if (!success) {
        return res.status(404).json({ error: "Trade not found" });
      }
      await updateGamificationStats(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting trade:", error);
      res.status(500).json({ error: "Failed to delete trade" });
    }
  });

  app.get("/api/trades/range", async (req: any, res) => {
    try {
      const { startDate, endDate, accountId } = req.query;
      const userId = getUserId(req);
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      const accId = accountId ? parseInt(accountId as string) : undefined;
      
      const trades = await storage.getTradesByDateRange(userId, start, end, accId);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades by date range:", error);
      res.status(500).json({ error: "Failed to fetch trades by date range" });
    }
  });

  app.get("/api/trades/symbol/:symbol", async (req: any, res) => {
    try {
      const { symbol } = req.params;
      const userId = getUserId(req);
      const accountId = req.query.accountId ? parseInt(req.query.accountId as string) : undefined;
      const trades = await storage.getTradesBySymbol(userId, symbol, accountId);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades by symbol:", error);
      res.status(500).json({ error: "Failed to fetch trades by symbol" });
    }
  });

  // Import trades from CSV
  app.post("/api/trades/import", async (req: any, res) => {
    try {
      // Get the actual user ID from the session
      const userId = isOAuthUser(req) ? req.user.claims.sub : getUserId(req);
      
      console.log(`CSV Import: Starting for userId: ${userId}`);
      
      // Ensure user exists in database before creating accounts
      let user = await storage.getUser(userId);
      console.log(`CSV Import: User lookup result:`, user ? 'found' : 'not found');
      
      if (!user) {
        console.log(`CSV Import: Creating new user for userId: ${userId}`);
        if (isOAuthUser(req)) {
          // Create user from OAuth claims - use the userId we determined, not the claims.sub
          const claims = req.user.claims;
          user = await storage.upsertUser({
            id: userId, // This should be the correct userId we determined above
            email: claims.email,
            firstName: claims.first_name,
            lastName: claims.last_name,
            profileImageUrl: claims.profile_image_url,
          });
        } else {
          // For development/demo user, create basic user record
          user = await storage.upsertUser({
            id: userId,
            email: null,
            firstName: "Demo",
            lastName: "User",
            profileImageUrl: null,
          });
        }
        
        console.log(`CSV Import: User creation attempted with ID ${userId}, got result:`, user ? user.id : 'failed');
      }

      // Always verify user exists with the correct ID
      user = await storage.getUser(userId);
      if (!user) {
        console.error(`CSV Import: User ${userId} does not exist after creation attempt`);
        return res.status(500).json({ error: "Failed to create user record" });
      }

      console.log(`CSV Import: Proceeding with user ID: ${user.id}`);
      
      const { trades: csvTrades, accountSize, accountName = "", accountNumber = "", broker = "", initialBalance } = req.body;
      
      if (!Array.isArray(csvTrades)) {
        return res.status(400).json({ error: "Invalid CSV data format" });
      }

      // Use initialBalance from form as the real account starting balance
      const accountBalance = initialBalance || accountSize || 10000;

      // Create or update account with the provided balance from form
      let account = await storage.getActiveAccount(userId);
      
      if (!account) {
        account = await storage.createAccount(userId, {
          name: accountName || `Trading Account ${new Date().toLocaleDateString()}`,
          accountNumber: accountNumber || null,
          broker: broker || null,
          currency: "USD",
          initialBalance: accountBalance.toString()
        });
        await storage.setActiveAccount(userId, account.id);
      } else {
        // Update existing account with new balance from form
        account = await storage.updateAccount(userId, account.id, {
          initialBalance: accountBalance.toString()
        });
        if (!account) {
          return res.status(500).json({ error: "Failed to update account" });
        }
      }

      const importedTrades = [];
      for (const csvTrade of csvTrades) {
        try {
          const tradeData = {
            accountId: account.id,
            ticketId: csvTrade["Ticket ID"] || String(Date.now() + Math.random()),
            openTime: new Date(csvTrade["Open Time"]),
            openPrice: parseFloat(csvTrade["Open Price"]) || 0,
            closeTime: csvTrade["Close Time"] ? new Date(csvTrade["Close Time"]) : null,
            closePrice: csvTrade["Close Price"] ? parseFloat(csvTrade["Close Price"]) : null,
            profit: parseFloat(csvTrade["Profit"]) || 0,
            lots: parseFloat(csvTrade["Lots"]) || 0,
            commission: parseFloat(csvTrade["Commission"]) || 0,
            swap: parseFloat(csvTrade["Swap"]) || 0,
            symbol: csvTrade["Symbol"] || "UNKNOWN",
            type: csvTrade["Type"] || "Buy",
            stopLoss: csvTrade["SL"] ? parseFloat(csvTrade["SL"]) : null,
            takeProfit: csvTrade["TP"] ? parseFloat(csvTrade["TP"]) : null,
            pips: csvTrade["Pips"] ? parseFloat(csvTrade["Pips"]) : null,
            reason: csvTrade["Reason"] ? parseInt(csvTrade["Reason"]) : null,
            volume: csvTrade["Volume"] ? parseFloat(csvTrade["Volume"]) : null,
            isOpen: !csvTrade["Close Time"],
          };

          const trade = await storage.createTrade(userId, tradeData);
          importedTrades.push(trade);
        } catch (tradeError) {
          console.error('Error importing individual trade:', tradeError);
          // Continue with other trades
        }
      }

      // Update gamification stats after import
      await updateGamificationStats(userId);

      res.json({
        message: `Successfully imported ${importedTrades.length} trades`,
        imported: importedTrades.length,
        total: csvTrades.length,
        account: account
      });

    } catch (error) {
      console.error('CSV import error:', error);
      res.status(500).json({ error: "Failed to import CSV data" });
    }
  });

  // Clear all user data (accounts and trades)
  app.delete("/api/data/clear", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // For OAuth users, ensure user exists in database
      if (isOAuthUser(req)) {
        let user = await storage.getUser(userId);
        if (!user) {
          const claims = req.user.claims;
          user = await storage.upsertUser({
            id: userId,
            email: claims.email,
            firstName: claims.first_name,
            lastName: claims.last_name,
            profileImageUrl: claims.profile_image_url,
          });
        }
      }

      // Get all user accounts
      const accounts = await storage.getAccounts(userId);
      
      // Delete all trades for each account
      for (const account of accounts) {
        const trades = await storage.getTrades(userId, account.id);
        for (const trade of trades) {
          await storage.deleteTrade(userId, trade.id);
        }
        // Delete the account
        await storage.deleteAccount(userId, account.id);
      }

      // Reset user stats if they exist
      const userStats = await storage.getUserStats(userId);
      if (userStats) {
        await storage.updateUserStats(userId, {
          currentLevel: 1,
          currentPoints: 0,
          totalProfitabledays: 0,
          totalRiskControlDays: 0,
          consecutiveProfitableDays: 0
        });
      }

      res.json({ 
        message: "All data cleared successfully",
        success: true 
      });

    } catch (error) {
      console.error('Error clearing user data:', error);
      res.status(500).json({ error: "Failed to clear user data" });
    }
  });

  // User stats endpoints
  app.get("/api/user-stats", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  });

  app.put("/api/user-stats", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const stats = await storage.updateUserStats(userId, req.body);
      res.json(stats);
    } catch (error) {
      console.error("Error updating user stats:", error);
      res.status(500).json({ error: "Failed to update user stats" });
    }
  });

  // Achievements endpoints
  app.get("/api/achievements", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Initialize achievements if user doesn't have any
      await initializeUserAchievements(userId);
      
      // Check for newly earned achievements (this also updates user stats)
      await checkAndUnlockEarnedAchievements(userId);
      
      // Force update user stats with total achievement points to fix XP display
      const achievementsData = await storage.getAchievements(userId);
      const unlockedAchievements = achievementsData.filter(a => a.isUnlocked);
      const totalPoints = unlockedAchievements.reduce((sum, achievement) => sum + achievement.points, 0);
      
      console.log(`User ${userId} has ${unlockedAchievements.length} unlocked achievements with ${totalPoints} total XP`);
      
      // Always update XP to ensure synchronization
      await storage.updateUserStats(userId, {
        currentPoints: totalPoints
      });
      console.log(`Updated user ${userId} XP to ${totalPoints}`);
      
      const achievements = await storage.getAchievements(userId);
      
      // Set headers to prevent caching so the frontend always gets fresh data
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.json(achievements);
    } catch (error) {
      console.error("Error fetching achievements:", error);
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.post("/api/achievements/:id/unlock", async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getUserId(req);
      const achievement = await storage.unlockAchievement(userId, id);
      if (!achievement) {
        return res.status(404).json({ error: "Achievement not found" });
      }
      res.json(achievement);
    } catch (error) {
      console.error("Error unlocking achievement:", error);
      res.status(500).json({ error: "Failed to unlock achievement" });
    }
  });

  // Daily progress endpoints
  app.get("/api/daily-progress", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const date = req.query.date ? new Date(req.query.date as string) : new Date();
      const progress = await storage.getDailyProgress(userId, date);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching daily progress:", error);
      res.status(500).json({ error: "Failed to fetch daily progress" });
    }
  });

  app.put("/api/daily-progress", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const date = req.body.date ? new Date(req.body.date) : new Date();
      const progress = await storage.updateDailyProgress(userId, date, req.body);
      await updateGamificationStats(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error updating daily progress:", error);
      res.status(500).json({ error: "Failed to update daily progress" });
    }
  });

  app.get("/api/daily-progress/history", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const history = await storage.getDailyProgressHistory(userId, days);
      res.json(history);
    } catch (error) {
      console.error("Error fetching daily progress history:", error);
      res.status(500).json({ error: "Failed to fetch daily progress history" });
    }
  });

  // Trade suggestions endpoints
  app.get("/api/trade-suggestions", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const suggestions = await storage.getTradeSuggestions(userId);
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching trade suggestions:", error);
      res.status(500).json({ error: "Failed to fetch trade suggestions" });
    }
  });

  app.get("/api/trade-suggestions/active", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const suggestions = await storage.getActiveTradeSuggestions(userId);
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching active trade suggestions:", error);
      res.status(500).json({ error: "Failed to fetch active trade suggestions" });
    }
  });

  app.post("/api/trade-suggestions/generate", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const trades = await storage.getTrades(userId);
      const userStats = await storage.getUserStats(userId);
      
      const suggestions = await generateTradeSuggestions(trades, userStats);
      
      // Store suggestions in database
      for (const suggestion of suggestions) {
        await storage.createTradeSuggestion(userId, {
          symbol: suggestion.symbol,
          type: suggestion.type,
          entryPrice: suggestion.entryPrice,
          stopLoss: suggestion.stopLoss,
          takeProfit: suggestion.takeProfit,
          lotSize: suggestion.lotSize,
          timeframe: suggestion.timeframe,
          reasoning: suggestion.reasoning,
          marketAnalysis: suggestion.marketAnalysis || 'Análisis automático basado en datos históricos',
          confidenceScore: suggestion.confidenceScore,
          riskScore: suggestion.riskScore,
          validUntil: suggestion.validUntil,
          status: 'active'
        });
      }
      
      res.json(suggestions);
    } catch (error) {
      console.error("Error generating trade suggestions:", error);
      res.status(500).json({ error: "Failed to generate trade suggestions" });
    }
  });

  app.put("/api/trade-suggestions/:id/status", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const { status } = req.body;
      const suggestion = await storage.updateTradeSuggestionStatus(userId, id, status);
      if (!suggestion) {
        return res.status(404).json({ error: "Trade suggestion not found" });
      }
      res.json(suggestion);
    } catch (error) {
      console.error("Error updating trade suggestion status:", error);
      res.status(500).json({ error: "Failed to update trade suggestion status" });
    }
  });

  app.delete("/api/trade-suggestions/:id", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const success = await storage.deleteTradeSuggestion(userId, id);
      if (!success) {
        return res.status(404).json({ error: "Trade suggestion not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting trade suggestion:", error);
      res.status(500).json({ error: "Failed to delete trade suggestion" });
    }
  });

  // Metrics endpoints
  app.get("/api/metrics/summary", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const trades = await storage.getTrades(userId);
      const totalTrades = trades.length;
      const profitableTrades = trades.filter(t => {
        const profit = t.profit || 0;
        const commission = t.commission || 0;
        const swap = t.swap || 0;
        return (profit + commission + swap) > 0;
      }).length;
      const totalProfit = trades.reduce((sum, t) => {
        const profit = t.profit || 0;
        const commission = t.commission || 0;
        const swap = t.swap || 0;
        return sum + profit + commission + swap;
      }, 0);
      const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
      
      const userStats = await storage.getUserStats(userId);
      const levelInfo = userStats ? calculateLevel(userStats.currentPoints || 0) : null;
      
      res.json({
        totalTrades,
        profitableTrades,
        totalProfit,
        winRate,
        currentLevel: levelInfo?.currentLevel || 1,
        currentPoints: levelInfo?.currentPoints || 0,
        progressPercentage: levelInfo?.progressPercentage || 0
      });
    } catch (error) {
      console.error("Error fetching metrics summary:", error);
      res.status(500).json({ error: "Failed to fetch metrics summary" });
    }
  });

  // Legacy endpoints for compatibility
  app.get("/api/metrics", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const trades = await storage.getTrades(userId);
      const totalTrades = trades.length;
      const profitableTrades = trades.filter(t => {
        const profit = t.profit || 0;
        const commission = t.commission || 0;
        const swap = t.swap || 0;
        return (profit + commission + swap) > 0;
      }).length;
      const totalProfit = trades.reduce((sum, t) => {
        const profit = t.profit || 0;
        const commission = t.commission || 0;
        const swap = t.swap || 0;
        return sum + profit + commission + swap;
      }, 0);
      const winRate = totalTrades > 0 ? (profitableTrades / totalTrades) * 100 : 0;
      
      res.json({
        totalTrades,
        profitableTrades,
        totalProfit,
        winRate
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ error: "Failed to fetch metrics" });
    }
  });

  app.get("/api/user/stats", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const stats = await storage.getUserStats(userId);
      
      // Set headers to prevent caching so the frontend always gets fresh data
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ error: "Failed to fetch user stats" });
    }
  });

  app.get("/api/charts/profit-loss", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const trades = await storage.getTrades(userId);
      const account = await storage.getActiveAccount(userId);
      const initialBalance = account?.initialBalance ? parseFloat(account.initialBalance) : 10000;
      

      
      // Sort trades by close time to get correct chronological order
      const sortedTrades = [...trades].sort((a, b) => {
        const dateA = new Date(a.closeTime || a.openTime);
        const dateB = new Date(b.closeTime || b.openTime);
        return dateA.getTime() - dateB.getTime();
      });
      
      const chartData = sortedTrades.map((trade, index) => {
        // Calculate total running profit including commission and swap
        const runningProfit = sortedTrades.slice(0, index + 1).reduce((sum, t) => {
          const tradeProfit = t.profit || 0;
          const commission = t.commission || 0;
          const swap = t.swap || 0;
          return sum + tradeProfit + commission + swap;
        }, 0);
        
        const currentEquity = initialBalance + runningProfit;
        
        // Calculate individual trade total (profit + commission + swap)
        const tradeTotalProfit = (trade.profit || 0) + (trade.commission || 0) + (trade.swap || 0);
        
        return {
          trade: index + 1,
          profit: runningProfit,
          equity: currentEquity,
          date: trade.closeTime || trade.openTime,
          tradeProfit: tradeTotalProfit,
          rawProfit: trade.profit || 0,
          commission: trade.commission || 0,
          swap: trade.swap || 0,
          balance: initialBalance,
          symbol: trade.symbol,
          type: trade.type
        };
      });
      
      res.json(chartData);
    } catch (error) {
      console.error("Error fetching profit-loss chart:", error);
      res.status(500).json({ error: "Failed to fetch chart data" });
    }
  });

  app.get("/api/suggestions", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const suggestions = await storage.getActiveTradeSuggestions(userId);
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });

  app.get("/api/progress/daily", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const today = new Date();
      const progress = await storage.getDailyProgress(userId, today);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching daily progress:", error);
      res.status(500).json({ error: "Failed to fetch daily progress" });
    }
  });

  // Calendar endpoint
  app.get("/api/calendar", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const trades = await storage.getTrades(userId);
      const dailyData: Record<string, { trades: any[]; profit: number; winRate: number; winners: number }> = {};
      
      trades.forEach(trade => {
        const date = new Date(trade.openTime).toISOString().split('T')[0];
        if (!dailyData[date]) {
          dailyData[date] = {
            trades: [],
            profit: 0,
            winRate: 0,
            winners: 0
          };
        }
        
        // Add isProfit property for frontend compatibility
        const enrichedTrade = {
          ...trade,
          isProfit: trade.profit > 0
        };
        
        dailyData[date].trades.push(enrichedTrade);
        dailyData[date].profit += trade.profit;
        if (trade.profit > 0) {
          dailyData[date].winners++;
        }
        dailyData[date].winRate = (dailyData[date].winners / dailyData[date].trades.length) * 100;
      });
      
      // Return object format with trades arrays
      res.json(dailyData);
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      res.status(500).json({ error: "Failed to fetch calendar data" });
    }
  });

  // Register OpenAI-powered chat routes
  registerChatRoutes(app);

  // AI Analysis endpoint
  app.post("/api/ai/analyze", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const trades = await storage.getTrades(userId);
      
      if (trades.length === 0) {
        return res.status(400).json({ 
          error: "No hay datos de trading para analizar. Sube tu archivo CSV primero." 
        });
      }

      const analysis = await analyzeTradingPerformance(trades);
      res.json(analysis);
    } catch (error) {
      console.error("Error in AI analysis:", error);
      res.status(500).json({ 
        error: "Error generando análisis AI. Intenta de nuevo." 
      });
    }
  });

  // Subscription management endpoints
  app.get("/api/subscription/status", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      const subscriptionType = user.subscriptionType || "freemium";
      const isExpired = user.subscriptionExpiry ? new Date() > new Date(user.subscriptionExpiry) : false;
      
      res.json({
        subscriptionType: isExpired ? "freemium" : subscriptionType,
        subscriptionExpiry: user.subscriptionExpiry,
        isExpired,
        limits: subscriptionType === "premium" && !isExpired ? {
          maxTrades: -1,
          maxAccounts: -1,
          hasAIAnalysis: true,
          hasAdvancedReports: true,
          hasTradeSuggestions: true,
          hasEconomicCalendar: true,
        } : {
          maxTrades: 100,
          maxAccounts: 1,
          hasAIAnalysis: false,
          hasAdvancedReports: false,
          hasTradeSuggestions: false,
          hasEconomicCalendar: false,
        }
      });
    } catch (error) {
      console.error("Error fetching subscription status:", error);
      res.status(500).json({ error: "Failed to fetch subscription status" });
    }
  });

  // In-memory tracking for promo code usage (in production, use database)
  const promoCodeUsage = new Map<string, number>();

  // Validate promotional codes
  app.post("/api/validate-promo", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { code } = req.body;
      
      // Define promotional codes (in production, these would be in a database)
      const promoCodes = {
        "LAUNCH50": { discount: 50, description: "Descuento de lanzamiento 50%", maxUses: null, currentUses: 0 },
        "WELCOME25": { discount: 25, description: "Bienvenida 25% off", maxUses: null, currentUses: 0 },
        "SAVE20": { discount: 20, description: "Ahorra 20%", maxUses: null, currentUses: 0 },
        "STUDENT30": { discount: 30, description: "Descuento estudiante 30%", maxUses: null, currentUses: 0 },
        "EARLY40": { discount: 40, description: "Early adopter 40%", maxUses: null, currentUses: 0 },
        "SUIZO": { discount: 100, description: "¡Acceso GRATIS! - Limitado", maxUses: 20, currentUses: 0 }
      };

      const promoCode = promoCodes[code.toUpperCase() as keyof typeof promoCodes];
      
      if (promoCode) {
        // Check usage limits
        const currentUses = promoCodeUsage.get(code.toUpperCase()) || 0;
        
        if (promoCode.maxUses && currentUses >= promoCode.maxUses) {
          res.json({
            valid: false,
            message: `Código agotado. Límite de ${promoCode.maxUses} usos alcanzado.`
          });
          return;
        }

        const discountAmount = Math.round((99 * promoCode.discount) / 100);
        const finalPrice = 99 - discountAmount;
        
        res.json({
          valid: true,
          discount: promoCode.discount,
          discountAmount,
          finalPrice: finalPrice,
          description: promoCode.description,
          remainingUses: promoCode.maxUses ? promoCode.maxUses - currentUses : null
        });
      } else {
        res.json({
          valid: false,
          message: "Código promocional no válido"
        });
      }
    } catch (error: any) {
      console.error("Error validating promo code:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get promo code status
  app.get("/api/promo-status", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const promoCodes = {
        "LAUNCH50": { discount: 50, description: "Descuento de lanzamiento 50%", maxUses: null },
        "WELCOME25": { discount: 25, description: "Bienvenida 25% off", maxUses: null },
        "SAVE20": { discount: 20, description: "Ahorra 20%", maxUses: null },
        "STUDENT30": { discount: 30, description: "Descuento estudiante 30%", maxUses: null },
        "EARLY40": { discount: 40, description: "Early adopter 40%", maxUses: null },
        "SUIZO": { discount: 100, description: "¡Acceso GRATIS! - Limitado", maxUses: 20 }
      };

      const status = Object.entries(promoCodes).map(([code, info]) => ({
        code,
        ...info,
        currentUses: promoCodeUsage.get(code) || 0,
        remainingUses: info.maxUses ? info.maxUses - (promoCodeUsage.get(code) || 0) : null,
        available: info.maxUses ? (promoCodeUsage.get(code) || 0) < info.maxUses : true
      }));

      res.json({ promoCodes: status });
    } catch (error: any) {
      console.error("Error fetching promo status:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe payment route for one-time premium purchase
  app.post("/api/create-payment-intent", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const { amount, promoCode } = req.body;
      
      // Handle free access (amount = 0) with special case
      if (amount === 0) {
        // For free access, directly upgrade user to premium
        const userId = req.user.claims.sub;
        await storage.updateSubscriptionStatus(userId, "premium");
        
        // Track promo code usage for free codes
        if (promoCode) {
          const currentUses = promoCodeUsage.get(promoCode.toUpperCase()) || 0;
          promoCodeUsage.set(promoCode.toUpperCase(), currentUses + 1);
          console.log(`Free promo code ${promoCode} used. Total uses: ${currentUses + 1}`);
        }
        
        res.json({ 
          success: true, 
          message: "Acceso premium activado gratuitamente",
          freeAccess: true 
        });
        return;
      }

      // Regular payment flow for non-zero amounts
      const centAmount = Math.round(amount * 100);
      
      // Stripe minimum is 50 cents ($0.50)
      if (centAmount < 50) {
        return res.status(400).json({ 
          error: "El monto debe ser de al menos $0.50" 
        });
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: centAmount,
        currency: "usd",
        metadata: {
          userId: req.user.claims.sub,
          product: "premium-lifetime",
          promoCode: promoCode || ""
        }
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Error creating payment intent:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Webhook to handle successful payments and upgrade users
  app.post("/api/stripe/webhook", async (req: any, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    // Ensure webhook secret is configured
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('STRIPE_WEBHOOK_SECRET not configured');
      return res.status(500).send('Webhook secret not configured');
    }

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const userId = paymentIntent.metadata.userId;
      const promoCode = paymentIntent.metadata.promoCode;
      
      if (userId && paymentIntent.metadata.product === 'premium-lifetime') {
        // Upgrade user to premium
        await storage.updateSubscriptionStatus(userId, "premium");
        console.log(`User ${userId} upgraded to premium`);
        
        // Increment promo code usage if used
        if (promoCode) {
          const currentUses = promoCodeUsage.get(promoCode) || 0;
          promoCodeUsage.set(promoCode, currentUses + 1);
          console.log(`Promo code ${promoCode} used. Total uses: ${currentUses + 1}`);
        }
      }
    }

    res.json({ received: true });
  });

  // Stripe payment routes for premium subscriptions
  app.post("/api/create-subscription", async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }

    try {
      const userId = req.user.claims.sub;
      let user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if user already has an active subscription
      if (user.stripeSubscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
          expand: ['latest_invoice.payment_intent'],
        });
        
        if (subscription.status === 'active') {
          return res.json({
            subscriptionId: subscription.id,
            clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
            status: 'existing'
          });
        }
      }

      // Create Stripe customer if not exists
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || '',
          name: `${user.firstName} ${user.lastName}`.trim() || user.email || 'Usuario',
        });
        customerId = customer.id;
        user = await storage.updateUserStripeInfo(userId, customerId, '');
      }

      // Create subscription with a default price (you need to create this in your Stripe dashboard)
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price: process.env.STRIPE_PRICE_ID || 'price_1234567890', // Replace with your actual price ID
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
      });

      // Update user with subscription ID
      await storage.updateUserStripeInfo(userId, customerId, subscription.id);

      res.json({
        subscriptionId: subscription.id,
        clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
        status: 'created'
      });
    } catch (error: any) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/subscription/upgrade", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { months = 1 } = req.body;
      
      // Calcular fecha de expiración
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + months);
      
      const user = await storage.updateSubscriptionStatus(userId, "premium", expiry);
      
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.json({
        message: "Suscripción actualizada exitosamente",
        subscriptionType: user.subscriptionType,
        subscriptionExpiry: user.subscriptionExpiry
      });
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      res.status(500).json({ error: "Failed to upgrade subscription" });
    }
  });

  app.post("/api/subscription/cancel", async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.updateSubscriptionStatus(userId, "freemium");
      
      if (!user) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      res.json({
        message: "Suscripción cancelada exitosamente",
        subscriptionType: user.subscriptionType
      });
    } catch (error) {
      console.error("Error canceling subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  // Generate PDF report
  app.post("/api/reports/pdf", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const { startDate, endDate, type } = req.body;
      
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      const trades = await storage.getTradesByDateRange(userId, start, end);
      const metrics = calculateTradingMetrics(trades);
      const userStats = await storage.getUserStats(userId);
      
      if (trades.length === 0) {
        return res.status(400).json({ 
          message: "No hay trades disponibles en el rango de fechas seleccionado" 
        });
      }

      // Generate AI analysis
      let aiAnalysis;
      try {
        aiAnalysis = await analyzeTradingPerformance(trades);
      } catch (aiError) {
        console.error("AI analysis failed:", aiError);
        aiAnalysis = {
          patterns: {
            timeBasedPatterns: ["Análisis IA no disponible temporalmente"],
            symbolPerformance: [],
            riskPatterns: ["Requiere más historial de trades"]
          },
          recommendations: {
            riskManagement: ["Continúa monitoreando tu rendimiento"],
            timing: ["Mantén disciplina en tus horarios de trading"],
            strategy: ["Revisa tu estrategia actual"]
          },
          strengths: ["Datos insuficientes para análisis"],
          weaknesses: ["Requiere más historial de trades"],
          overallScore: 50,
          nextSteps: ["Importa más datos de trading para mejor análisis"]
        };
      }

      // Generate comprehensive PDF using the pdfGenerator service
      const pdfBuffer = await generateComprehensivePDFReport({
        trades,
        metrics,
        aiAnalysis,
        dateRange: { start, end },
        userStats,
      });

      // Set headers for text download (since we're generating text, not PDF)
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="reporte-trading-${new Date().toISOString().split('T')[0]}.txt"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Error generating PDF report:", error);
      res.status(500).json({ 
        success: false,
        message: "Error al generar el reporte PDF", 
        error: error.message 
      });
    }
  });

  // Generate HTML report
  app.get('/api/reports/html', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      
      // Get data for report
      const accounts = await storage.getAccounts(userId);
      const trades = await storage.getTrades(userId);
      const userStats = await storage.getUserStats(userId);
      const metrics = calculateTradingMetrics(trades);
      
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      
      if (trades.length === 0) {
        return res.status(400).json({ 
          message: "No hay trades disponibles para generar el reporte" 
        });
      }
      
      console.log('Generating comprehensive HTML report using OpenAI...');
      
      const htmlContent = await generateHTMLReport({
        trades: trades.filter(trade => {
          const tradeDate = new Date(trade.openTime);
          return tradeDate >= startDate && tradeDate <= endDate;
        }),
        accounts,
        metrics,
        dateRange: { start: startDate, end: endDate },
        userStats,
      });

      // Prepare filename for download based on the date range used
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      const fileName = `reporte-trading-${startDateStr}-to-${endDateStr}.html`;
      
      // Save report to history only if it's not a redownload
      const isRedownload = req.query.redownload === 'true';
      if (!isRedownload) {
        const title = `Reporte Completo - ${startDate.toLocaleDateString()} al ${endDate.toLocaleDateString()}`;
        
        await storage.createReportHistory(userId, {
          reportType: "comprehensive",
          title,
          fileName,
          filePath: null, // We're not storing the actual file, just generating it on demand
          fileSize: Buffer.byteLength(htmlContent, 'utf8'),
          dateRange: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
          reportData: {
            tradesCount: trades.filter(trade => {
              const tradeDate = new Date(trade.openTime);
              return tradeDate >= startDate && tradeDate <= endDate;
            }).length,
            accountsCount: accounts.length,
            totalProfit: metrics.totalProfit,
            winRate: metrics.winRate,
          },
        });
      }

      // Set headers for HTML download
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', Buffer.byteLength(htmlContent, 'utf8'));
      
      res.send(htmlContent);
    } catch (error: any) {
      console.error('Error generating HTML report:', error);
      res.status(500).json({ message: 'Error generating HTML report: ' + error.message });
    }
  });

  // Generate comprehensive analysis report with AI insights  
  app.post("/api/reports/comprehensive-analysis", isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const trades = await storage.getTrades(userId);
      
      if (trades.length === 0) {
        return res.status(400).json({ 
          message: "No hay trades disponibles para generar el reporte" 
        });
      }

      const metrics = calculateTradingMetrics(trades);
      const userStats = await storage.getUserStats(userId);
      
      // Generate AI analysis
      let aiAnalysis;
      try {
        aiAnalysis = await analyzeTradingPerformance(trades);
      } catch (aiError) {
        console.error("AI analysis failed:", aiError);
        aiAnalysis = {
          patterns: {
            timeBasedPatterns: ["Análisis IA no disponible temporalmente"],
            symbolPerformance: [],
            riskPatterns: ["Requiere más historial de trades"]
          },
          recommendations: {
            riskManagement: ["Continúa monitoreando tu rendimiento"],
            timing: ["Mantén disciplina en tus horarios de trading"],
            strategy: ["Revisa tu estrategia actual"]
          },
          strengths: ["Datos insuficientes para análisis"],
          weaknesses: ["Requiere más historial de trades"],
          overallScore: 50,
          nextSteps: ["Importa más datos de trading para mejor análisis"]
        };
      }
      
      // Generate comprehensive PDF using the pdfGenerator service
      const pdfBuffer = await generateComprehensivePDFReport({
        trades,
        metrics,
        aiAnalysis,
        dateRange: { 
          start: new Date(Math.min(...trades.map(t => new Date(t.openTime).getTime()))),
          end: new Date(Math.max(...trades.map(t => new Date(t.openTime).getTime())))
        },
        userStats,
      });

      // Set headers for text download (since we're generating text, not PDF)
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="analisis-trading-completo-${new Date().toISOString().split('T')[0]}.txt"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
      
    } catch (error: any) {
      console.error("Error generating comprehensive analysis:", error);
      res.status(500).json({ 
        success: false,
        message: "Error al generar el análisis comprensivo", 
        error: error.message 
      });
    }
  });

  // Update gamification stats function
  // Report History routes
  app.get('/api/reports/history', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const reports = await storage.getReportHistory(userId);
      res.json(reports);
    } catch (error: any) {
      console.error('Error getting report history:', error);
      res.status(500).json({ message: 'Error retrieving report history: ' + error.message });
    }
  });

  app.get('/api/reports/history/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const report = await storage.getReportById(userId, id);
      
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      res.json(report);
    } catch (error: any) {
      console.error('Error getting report:', error);
      res.status(500).json({ message: 'Error retrieving report: ' + error.message });
    }
  });

  app.delete('/api/reports/history/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = getUserId(req);
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteReport(userId, id);
      
      if (!deleted) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      res.json({ message: 'Report deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting report:', error);
      res.status(500).json({ message: 'Error deleting report: ' + error.message });
    }
  });

  async function updateGamificationStats(userId: string) {
    try {
      const trades = await storage.getTrades(userId);
      const dailyProgressHistory = await storage.getDailyProgressHistory(userId, 30);
      let userStats = await storage.getUserStats(userId);
      
      // Ensure user stats exist
      if (!userStats) {
        userStats = await storage.updateUserStats(userId, {
          currentLevel: 1,
          currentPoints: 0,
          totalProfitabledays: 0,
          totalRiskControlDays: 0,
          consecutiveProfitableDays: 0,
          lastUpdated: new Date(),
          accountSize: null
        });
      }

      const newlyUnlockedConditions = checkAchievementConditions(trades, userStats, dailyProgressHistory);
      const achievements = await storage.getAchievements(userId);
      
      for (const condition of newlyUnlockedConditions) {
        const achievement = achievements.find(a => a.condition === condition && !a.isUnlocked);
        if (achievement) {
          await storage.unlockAchievement(userId, achievement.id);
        }
      }
    } catch (error) {
      console.error('Error updating gamification stats:', error);
      // Don't let gamification errors prevent trade creation
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}