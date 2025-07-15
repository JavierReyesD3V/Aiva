import { storage } from "../storage";
import { db } from "../db";
import { achievements } from "../../shared/schema";
import { eq } from "drizzle-orm";

// Achievement definitions based on trading best practices
const DEFAULT_ACHIEVEMENTS = [
  // Milestone Achievements
  {
    name: "Primer Trade",
    description: "Completa tu primer trade en la plataforma",
    type: "milestone",
    condition: "first_trade",
    points: 50,
    icon: "target"
  },
  {
    name: "10 Trades Completados",
    description: "Alcanza un total de 10 trades ejecutados",
    type: "milestone", 
    condition: "trades_10",
    points: 100,
    icon: "trophy"
  },
  {
    name: "50 Trades Completados",
    description: "Alcanza un total de 50 trades ejecutados",
    type: "milestone",
    condition: "trades_50", 
    points: 250,
    icon: "medal"
  },
  {
    name: "100 Trades Completados",
    description: "Alcanza un total de 100 trades ejecutados",
    type: "milestone",
    condition: "trades_100",
    points: 500,
    icon: "crown"
  },

  // Performance Achievements
  {
    name: "Primera Ganancia",
    description: "Obtén tu primer trade profitable",
    type: "performance",
    condition: "first_profitable_trade",
    points: 75,
    icon: "trending-up"
  },
  {
    name: "Win Rate 60%",
    description: "Mantén un ratio de ganancia del 60% o más (mínimo 20 trades)",
    type: "performance",
    condition: "win_rate_60",
    points: 300,
    icon: "target"
  },
  {
    name: "Win Rate 70%",
    description: "Mantén un ratio de ganancia del 70% o más (mínimo 30 trades)",
    type: "performance", 
    condition: "win_rate_70",
    points: 500,
    icon: "star"
  },
  {
    name: "Profit Factor 1.5",
    description: "Logra un factor de ganancia de 1.5 o mayor",
    type: "performance",
    condition: "profit_factor_1_5",
    points: 400,
    icon: "trending-up"
  },

  // Streak Achievements
  {
    name: "Racha de 3",
    description: "Consigue 3 trades ganadores consecutivos",
    type: "streak",
    condition: "winning_streak_3",
    points: 150,
    icon: "flame"
  },
  {
    name: "Racha de 5",
    description: "Consigue 5 trades ganadores consecutivos",
    type: "streak", 
    condition: "winning_streak_5",
    points: 300,
    icon: "fire"
  },
  {
    name: "Racha de 10",
    description: "Consigue 10 trades ganadores consecutivos",
    type: "streak",
    condition: "winning_streak_10", 
    points: 750,
    icon: "zap"
  },
  
  // Risk Management Achievements
  {
    name: "Control de Riesgo",
    description: "Usa Stop Loss en 10 trades consecutivos",
    type: "risk_management",
    condition: "stop_loss_discipline",
    points: 200,
    icon: "shield"
  },
  {
    name: "Disciplina en Take Profit",
    description: "Usa Take Profit en 15 trades consecutivos",
    type: "risk_management",
    condition: "take_profit_discipline",
    points: 250,
    icon: "target"
  },
  {
    name: "Gestión de Pérdidas",
    description: "Limita las pérdidas a menos del 2% por trade en 20 trades",
    type: "risk_management",
    condition: "loss_control",
    points: 350,
    icon: "shield-check"
  },

  // Consistency Achievements
  {
    name: "Trader Constante",
    description: "Opera al menos 1 trade por día durante 7 días consecutivos",
    type: "consistency",
    condition: "daily_trading_week",
    points: 300,
    icon: "calendar"
  },
  {
    name: "Trader Mensual",
    description: "Opera al menos 20 días en un mes",
    type: "consistency",
    condition: "monthly_active_trader",
    points: 500,
    icon: "calendar-days"
  },

  // Profit Achievements
  {
    name: "Primer Día Rentable",
    description: "Termina tu primer día con ganancias netas positivas",
    type: "profit",
    condition: "first_profitable_day",
    points: 100,
    icon: "dollar-sign"
  },
  {
    name: "Semana Rentable",
    description: "Completa una semana con ganancias netas positivas",
    type: "profit",
    condition: "profitable_week",
    points: 250,
    icon: "trending-up"
  },
  {
    name: "Mes Rentable",
    description: "Completa un mes con ganancias netas positivas",
    type: "profit",
    condition: "profitable_month",
    points: 500,
    icon: "chart-line"
  },

  // Advanced Achievements
  {
    name: "Diversificación",
    description: "Opera en al menos 5 instrumentos diferentes",
    type: "advanced",
    condition: "diversified_trading",
    points: 300,
    icon: "globe"
  },
  {
    name: "Trader Nocturno",
    description: "Ejecuta trades exitosos en diferentes horarios del día",
    type: "advanced",
    condition: "time_diversification",
    points: 200,
    icon: "clock"
  }
];

async function updateUserStatsWithAchievementPoints(userId: string): Promise<void> {
  try {
    const achievements = await storage.getAchievements(userId);
    const unlockedAchievements = achievements.filter(a => a.isUnlocked);
    const totalPoints = unlockedAchievements.reduce((sum, achievement) => sum + achievement.points, 0);
    
    if (totalPoints > 0) {
      await storage.updateUserStats(userId, {
        currentPoints: totalPoints
      });
      console.log(`Updated user ${userId} total XP to ${totalPoints} from ${unlockedAchievements.length} unlocked achievements`);
    }
  } catch (error) {
    console.error("Error updating user stats with achievement points:", error);
  }
}

export async function initializeUserAchievements(userId: string): Promise<void> {
  try {
    console.log(`Checking achievements for user: ${userId}`);
    
    // Check if user already has achievements
    const existingAchievements = await storage.getAchievements(userId);
    
    console.log(`User ${userId} has ${existingAchievements.length} existing achievements`);
    
    if (existingAchievements.length > 0) {
      console.log(`User ${userId} already has ${existingAchievements.length} achievements`);
      return;
    }

    console.log(`Initializing ${DEFAULT_ACHIEVEMENTS.length} achievements for user ${userId}`);

    // Insert all default achievements for the user
    const achievementsToInsert = DEFAULT_ACHIEVEMENTS.map(achievement => ({
      userId,
      name: achievement.name,
      description: achievement.description,
      type: achievement.type,
      condition: achievement.condition,
      points: achievement.points,
      icon: achievement.icon,
      isUnlocked: false,
      unlockedAt: null
    }));

    const result = await db.insert(achievements).values(achievementsToInsert).returning();
    
    console.log(`Successfully initialized ${result.length} achievements for user ${userId}`);
    
    // Check and unlock any achievements that should already be unlocked
    await checkAndUnlockEarnedAchievements(userId);
    
    // Update user stats with total points from all unlocked achievements
    await updateUserStatsWithAchievementPoints(userId);
    
  } catch (error) {
    console.error("Error initializing user achievements:", error);
    console.error("Error details:", error);
  }
}

export async function checkAndUnlockEarnedAchievements(userId: string): Promise<void> {
  try {
    const trades = await storage.getTrades(userId);
    const userAchievements = await storage.getAchievements(userId);
    const lockedAchievements = userAchievements.filter(a => !a.isUnlocked);
    
    let totalPointsEarned = 0;
    
    for (const achievement of lockedAchievements) {
      const shouldUnlock = await checkAchievementCondition(userId, achievement.condition, trades);
      
      if (shouldUnlock) {
        await storage.unlockAchievement(userId, achievement.id);
        totalPointsEarned += achievement.points;
        console.log(`Unlocked achievement: ${achievement.name} for user ${userId} (+${achievement.points} XP)`);
      }
    }
    
    // Update user stats with new points if any achievements were unlocked
    if (totalPointsEarned > 0) {
      const currentStats = await storage.getUserStats(userId);
      const newPoints = (currentStats?.currentPoints || 0) + totalPointsEarned;
      await storage.updateUserStats(userId, {
        currentPoints: newPoints
      });
      console.log(`Updated user ${userId} stats: +${totalPointsEarned} XP (Total: ${newPoints})`);
    }
  } catch (error) {
    console.error("Error checking earned achievements:", error);
  }
}

async function checkAchievementCondition(userId: string, condition: string, trades: any[]): Promise<boolean> {
  const totalTrades = trades.length;
  const profitableTrades = trades.filter(t => t.profit > 0);
  const winRate = totalTrades > 0 ? (profitableTrades.length / totalTrades) : 0;
  
  switch (condition) {
    case "first_trade":
      return totalTrades >= 1;
      
    case "trades_10":
      return totalTrades >= 10;
      
    case "trades_50":
      return totalTrades >= 50;
      
    case "trades_100":
      return totalTrades >= 100;
      
    case "first_profitable_trade":
      return profitableTrades.length >= 1;
      
    case "win_rate_60":
      return totalTrades >= 20 && winRate >= 0.60;
      
    case "win_rate_70":
      return totalTrades >= 30 && winRate >= 0.70;
      
    case "winning_streak_3":
      return checkWinningStreak(trades, 3);
      
    case "winning_streak_5":
      return checkWinningStreak(trades, 5);
      
    case "winning_streak_10":
      return checkWinningStreak(trades, 10);
      
    case "stop_loss_discipline":
      return checkStopLossDiscipline(trades, 10);
      
    case "take_profit_discipline":
      return checkTakeProfitDiscipline(trades, 15);
      
    case "first_profitable_day":
      return checkProfitableDay(trades);
      
    case "diversified_trading":
      return checkDiversification(trades, 5);
      
    default:
      return false;
  }
}

function checkWinningStreak(trades: any[], requiredStreak: number): boolean {
  let currentStreak = 0;
  let maxStreak = 0;
  
  for (const trade of trades.sort((a, b) => new Date(a.openTime).getTime() - new Date(b.openTime).getTime())) {
    if (trade.profit > 0) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  
  return maxStreak >= requiredStreak;
}

function checkStopLossDiscipline(trades: any[], requiredCount: number): boolean {
  const recentTrades = trades.slice(-requiredCount);
  return recentTrades.length >= requiredCount && 
         recentTrades.every(trade => trade.stopLoss !== null && trade.stopLoss !== undefined);
}

function checkTakeProfitDiscipline(trades: any[], requiredCount: number): boolean {
  const recentTrades = trades.slice(-requiredCount);
  return recentTrades.length >= requiredCount && 
         recentTrades.every(trade => trade.takeProfit !== null && trade.takeProfit !== undefined);
}

function checkProfitableDay(trades: any[]): boolean {
  const tradesByDay = new Map<string, number>();
  
  for (const trade of trades) {
    const day = new Date(trade.openTime).toDateString();
    tradesByDay.set(day, (tradesByDay.get(day) || 0) + trade.profit);
  }
  
  return Array.from(tradesByDay.values()).some(dailyProfit => dailyProfit > 0);
}

function checkDiversification(trades: any[], requiredSymbols: number): boolean {
  const uniqueSymbols = new Set(trades.map(trade => trade.symbol));
  return uniqueSymbols.size >= requiredSymbols;
}