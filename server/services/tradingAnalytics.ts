import { Trade } from "@shared/schema";

export interface TradingMetrics {
  totalProfit: number;
  totalTrades: number;
  winRate: number;
  avgWin: number;
  avgLoss: number;
  riskRewardRatio: number;
  profitFactor: number;
  maxDrawdown: number;
  consecutiveWins: number;
  consecutiveLosses: number;
  tradingDays: number;
  avgTradesPerDay: number;
  symbolPerformance: { symbol: string; profit: number; trades: number; winRate: number }[];
  monthlyPerformance: { month: string; profit: number; trades: number }[];
  dailyPerformance: { date: string; profit: number; trades: number }[];
}

export function calculateTradingMetrics(trades: Trade[]): TradingMetrics {
  if (trades.length === 0) {
    return {
      totalProfit: 0,
      totalTrades: 0,
      winRate: 0,
      avgWin: 0,
      avgLoss: 0,
      riskRewardRatio: 0,
      profitFactor: 0,
      maxDrawdown: 0,
      consecutiveWins: 0,
      consecutiveLosses: 0,
      tradingDays: 0,
      avgTradesPerDay: 0,
      symbolPerformance: [],
      monthlyPerformance: [],
      dailyPerformance: [],
    };
  }

  const closedTrades = trades.filter(trade => trade.closeTime && trade.profit !== null);
  
  // Basic metrics with net profit (including commission and swap)
  const totalProfit = closedTrades.reduce((sum, trade) => {
    const netProfit = (trade.profit || 0) + (trade.commission || 0) + (trade.swap || 0);
    return sum + netProfit;
  }, 0);
  const totalTrades = closedTrades.length;
  
  const winningTrades = closedTrades.filter(trade => {
    const netProfit = (trade.profit || 0) + (trade.commission || 0) + (trade.swap || 0);
    return netProfit > 0;
  });
  const losingTrades = closedTrades.filter(trade => {
    const netProfit = (trade.profit || 0) + (trade.commission || 0) + (trade.swap || 0);
    return netProfit < 0;
  });
  
  const winRate = totalTrades > 0 ? (winningTrades.length / totalTrades) * 100 : 0;
  
  const avgWin = winningTrades.length > 0 ? 
    winningTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0) / winningTrades.length : 0;
  
  const avgLoss = losingTrades.length > 0 ? 
    Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0) / losingTrades.length) : 0;
  
  const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0;
  
  const grossProfit = winningTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
  const grossLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0));
  const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : 0;

  // Calculate consecutive wins/losses
  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  let currentWins = 0;
  let currentLosses = 0;

  closedTrades.forEach(trade => {
    if ((trade.profit || 0) > 0) {
      currentWins++;
      currentLosses = 0;
      maxConsecutiveWins = Math.max(maxConsecutiveWins, currentWins);
    } else {
      currentLosses++;
      currentWins = 0;
      maxConsecutiveLosses = Math.max(maxConsecutiveLosses, currentLosses);
    }
  });

  // Calculate max drawdown
  let peak = 0;
  let maxDrawdown = 0;
  let runningProfit = 0;

  closedTrades.forEach(trade => {
    runningProfit += (trade.profit || 0);
    peak = Math.max(peak, runningProfit);
    const drawdown = peak - runningProfit;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  });

  // Trading days
  const tradingDates = new Set(
    closedTrades.map(trade => new Date(trade.openTime).toDateString())
  );
  const tradingDays = tradingDates.size;
  const avgTradesPerDay = tradingDays > 0 ? totalTrades / tradingDays : 0;

  // Symbol performance
  const symbolStats = new Map<string, { profit: number; trades: number; wins: number }>();
  
  closedTrades.forEach(trade => {
    const symbol = trade.symbol;
    const existing = symbolStats.get(symbol) || { profit: 0, trades: 0, wins: 0 };
    existing.profit += (trade.profit || 0);
    existing.trades += 1;
    if ((trade.profit || 0) > 0) existing.wins += 1;
    symbolStats.set(symbol, existing);
  });

  const symbolPerformance = Array.from(symbolStats.entries()).map(([symbol, stats]) => ({
    symbol,
    profit: stats.profit,
    trades: stats.trades,
    winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0,
  }));

  // Monthly performance
  const monthlyStats = new Map<string, { profit: number; trades: number }>();
  
  closedTrades.forEach(trade => {
    const month = new Date(trade.openTime).toISOString().slice(0, 7); // YYYY-MM
    const existing = monthlyStats.get(month) || { profit: 0, trades: 0 };
    existing.profit += (trade.profit || 0);
    existing.trades += 1;
    monthlyStats.set(month, existing);
  });

  const monthlyPerformance = Array.from(monthlyStats.entries()).map(([month, stats]) => ({
    month,
    profit: stats.profit,
    trades: stats.trades,
  }));

  // Daily performance
  const dailyStats = new Map<string, { profit: number; trades: number }>();
  
  closedTrades.forEach(trade => {
    const date = new Date(trade.openTime).toISOString().slice(0, 10); // YYYY-MM-DD
    const existing = dailyStats.get(date) || { profit: 0, trades: 0 };
    existing.profit += (trade.profit || 0);
    existing.trades += 1;
    dailyStats.set(date, existing);
  });

  const dailyPerformance = Array.from(dailyStats.entries()).map(([date, stats]) => ({
    date,
    profit: stats.profit,
    trades: stats.trades,
  }));

  return {
    totalProfit,
    totalTrades,
    winRate,
    avgWin,
    avgLoss,
    riskRewardRatio,
    profitFactor,
    maxDrawdown,
    consecutiveWins: maxConsecutiveWins,
    consecutiveLosses: maxConsecutiveLosses,
    tradingDays,
    avgTradesPerDay,
    symbolPerformance,
    monthlyPerformance,
    dailyPerformance,
  };
}

export function calculateDailyProgress(trades: Trade[], date: Date) {
  const dateStr = date.toISOString().slice(0, 10);
  const dayTrades = trades.filter(trade => 
    trade.closeTime && new Date(trade.closeTime).toISOString().slice(0, 10) === dateStr
  );

  const dailyProfit = dayTrades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
  const maxLossPercent = Math.max(...dayTrades.map(trade => 
    trade.profit && trade.profit < 0 ? Math.abs(trade.profit) / (trade.lots * 100000) * 100 : 0
  ));

  return {
    dailyProfitTarget: dailyProfit > 0,
    riskControl: maxLossPercent <= 1.0,
    noOvertrading: dayTrades.length <= 5, // Max 5 trades per day
    pointsEarned: 0, // Will be calculated by gamification service
  };
}
