import { UserStats, Achievement, DailyProgress, Trade } from "@shared/schema";

export interface LevelInfo {
  currentLevel: number;
  currentPoints: number;
  pointsForCurrentLevel: number;
  pointsForNextLevel: number;
  progressPercentage: number;
}

export function calculateLevel(points: number): LevelInfo {
  let level = 1;
  let pointsRequired = 100; // Base points for level 1
  let totalPointsForLevel = 0;

  while (points >= totalPointsForLevel + pointsRequired) {
    totalPointsForLevel += pointsRequired;
    level++;
    pointsRequired = Math.floor(pointsRequired * 1.1); // 10% increase per level
  }

  const pointsForCurrentLevel = totalPointsForLevel;
  const pointsForNextLevel = totalPointsForLevel + pointsRequired;
  const progressPercentage = pointsRequired > 0 ? 
    ((points - pointsForCurrentLevel) / pointsRequired) * 100 : 0;

  return {
    currentLevel: level,
    currentPoints: points,
    pointsForCurrentLevel,
    pointsForNextLevel,
    progressPercentage,
  };
}

export function calculateDailyPoints(progress: Partial<DailyProgress>): number {
  let points = 0;
  
  if (progress.dailyProfitTarget) points += 50;
  if (progress.riskControl) points += 30;
  if (progress.noOvertrading) points += 20;
  
  return points;
}

export function checkAchievementConditions(
  trades: Trade[],
  userStats: UserStats,
  dailyProgressHistory: DailyProgress[]
): string[] {
  const unlockedAchievements: string[] = [];

  // Check trade count milestones
  if (trades.length >= 1) {
    unlockedAchievements.push("trades_count_1");
  }

  // Check profitable streak
  const recentTrades = trades
    .filter(trade => trade.closeTime)
    .sort((a, b) => new Date(b.closeTime!).getTime() - new Date(a.closeTime!).getTime())
    .slice(0, 10);

  let consecutiveProfitable = 0;
  for (const trade of recentTrades) {
    if ((trade.profit || 0) > 0) {
      consecutiveProfitable++;
    } else {
      break;
    }
  }

  if (consecutiveProfitable >= 5) {
    unlockedAchievements.push("profitable_streak_5");
  }

  // Check risk control streak
  const recentProgress = dailyProgressHistory.slice(0, 10);
  let riskControlDays = 0;
  for (const day of recentProgress) {
    if (day.riskControl) {
      riskControlDays++;
    } else {
      break;
    }
  }

  if (riskControlDays >= 10) {
    unlockedAchievements.push("risk_control_10_days");
  }

  // Check consecutive profitable days
  let profitableDays = 0;
  for (const day of recentProgress) {
    if (day.dailyProfitTarget) {
      profitableDays++;
    } else {
      break;
    }
  }

  if (profitableDays >= 7) {
    unlockedAchievements.push("profitable_days_7");
  }

  // Check perfect week
  const lastWeek = dailyProgressHistory.slice(0, 7);
  const perfectWeek = lastWeek.length >= 7 && lastWeek.every(day => 
    day.dailyProfitTarget && day.riskControl && day.noOvertrading
  );

  if (perfectWeek) {
    unlockedAchievements.push("perfect_week");
  }

  return unlockedAchievements;
}

export function getAchievementNotifications(newlyUnlocked: Achievement[]): any[] {
  return newlyUnlocked.map(achievement => ({
    id: achievement.id,
    title: achievement.name,
    description: achievement.description,
    points: achievement.points,
    icon: achievement.icon,
    timestamp: new Date(),
  }));
}
