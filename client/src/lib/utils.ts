import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function formatNumberWithCommas(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  const dateObj = new Date(date);
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }
  
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

export function formatNumber(value: number | string | undefined | null, decimals: number = 2): string {
  const numValue = Number(value);
  if (isNaN(numValue) || value === null || value === undefined) {
    return '0';
  }
  return numValue.toFixed(decimals);
}

export function calculateLevel(points: number) {
  let level = 1;
  let pointsRequired = 100;
  let totalPointsForLevel = 0;

  while (points >= totalPointsForLevel + pointsRequired) {
    totalPointsForLevel += pointsRequired;
    level++;
    pointsRequired = Math.floor(pointsRequired * 1.1);
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

export function parseCSV(csvContent: string): any[] {
  const lines = csvContent.trim().split('\n');
  const headers = lines[0].split(',').map(header => header.trim());
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(value => value.trim());
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    return row;
  });
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

export function classifyTradeType(type: string): 'buy' | 'sell' {
  return type.toLowerCase().includes('buy') ? 'buy' : 'sell';
}

export function getTradeColor(profit: number): string {
  return profit >= 0 ? 'text-profit' : 'text-loss';
}

export function getTradeBgColor(profit: number): string {
  return profit >= 0 ? 'bg-profit' : 'bg-loss';
}

export function getRiskLevel(drawdown: number): { level: string; color: string } {
  if (drawdown < 2) return { level: 'Low', color: 'text-profit' };
  if (drawdown < 5) return { level: 'Medium', color: 'text-yellow-400' };
  return { level: 'High', color: 'text-loss' };
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString();
}

export function isToday(date: Date): boolean {
  return isSameDay(date, new Date());
}

export function calculatePnLPercentage(trade: any, accountSize?: number): number {
  if (!trade || !trade.profit) {
    return 0;
  }

  // Calculate net profit including commission and swap
  const netProfit = (trade.profit || 0) + (trade.commission || 0) + (trade.swap || 0);

  // If account size is available, use it for more accurate percentage
  if (accountSize && accountSize > 0) {
    return (netProfit / accountSize) * 100;
  }

  // Fallback to previous calculation methods
  if (!trade.lots || !trade.openPrice) {
    return 0;
  }

  // For forex pairs (6 characters like EURUSD, GBPUSD)
  if (trade.symbol && trade.symbol.length === 6) {
    // Standard forex lot size is 100,000 units of base currency
    const standardLotSize = 100000;
    const positionValue = trade.lots * standardLotSize;
    
    // For forex, calculate based on the notional value
    const percentageReturn = (netProfit / positionValue) * 100;
    return percentageReturn;
  }
  
  // For commodities like XAUUSD (Gold)
  if (trade.symbol === 'XAUUSD' || trade.symbol.includes('XAU')) {
    // For gold, 1 lot = 100 ounces
    const goldLotSize = 100;
    const positionValue = trade.lots * goldLotSize * trade.openPrice;
    const percentageReturn = (netProfit / positionValue) * 100;
    return percentageReturn;
  }
  
  // For other symbols, use pip-based calculation
  if (trade.pips && trade.pips !== 0) {
    // Rough estimation: for most forex pairs, 100 pips ≈ 1%
    const estimatedPercentage = (trade.pips / 100);
    return estimatedPercentage;
  }
  
  // Fallback: very rough estimate based on profit relative to typical position size
  const estimatedPositionValue = trade.lots * 100000 * (trade.openPrice || 1);
  return (netProfit / estimatedPositionValue) * 100;
}

export function calculateNetProfit(trade: any): number {
  if (!trade) return 0;
  return (trade.profit || 0) + (trade.commission || 0) + (trade.swap || 0);
}
