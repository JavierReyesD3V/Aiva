import OpenAI from "openai";
import { TradeSuggestion, InsertTradeSuggestion } from "@shared/schema";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

export interface MarketData {
  symbol: string;
  currentPrice: number;
  high24h: number;
  low24h: number;
  volume: number;
  priceChange24h: number;
  trend: 'bullish' | 'bearish' | 'sideways';
}

export interface TraderProfile {
  totalTrades: number;
  winRate: number;
  averageProfit: number;
  riskTolerance: 'low' | 'medium' | 'high';
  preferredSymbols: string[];
  tradingStyle: 'scalping' | 'day_trading' | 'swing_trading';
  avgHoldTime: number; // in hours
}

export interface RiskAssessment {
  score: number; // 1-100 (1 = very low risk, 100 = very high risk)
  factors: string[];
  recommendation: 'avoid' | 'caution' | 'moderate' | 'favorable';
}

export async function generateTradeSuggestions(
  userTrades: any[], 
  userStats: any
): Promise<TradeSuggestion[]> {
  try {
    // Analyze user trading profile
    const traderProfile = analyzeTraderProfile(userTrades, userStats);
    
    // Get simulated market data (in production, this would fetch real market data)
    const marketData = await getMarketData();
    
    // Generate AI-powered suggestions
    if (process.env.OPENAI_API_KEY) {
      return await generateAISuggestions(traderProfile, marketData);
    } else {
      return generateFallbackSuggestions(traderProfile, marketData);
    }
  } catch (error) {
    console.error('Error generating trade suggestions:', error);
    return [];
  }
}

function analyzeTraderProfile(trades: any[], userStats: any): TraderProfile {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winRate: 0,
      averageProfit: 0,
      riskTolerance: 'medium',
      preferredSymbols: ['EURUSD', 'GBPUSD'],
      tradingStyle: 'day_trading',
      avgHoldTime: 4
    };
  }

  const totalTrades = trades.length;
  const winningTrades = trades.filter(t => (t.profit || 0) > 0);
  const winRate = (winningTrades.length / totalTrades) * 100;
  const averageProfit = trades.reduce((sum, t) => sum + (t.profit || 0), 0) / totalTrades;
  
  // Analyze symbol preferences
  const symbolCounts: Record<string, number> = {};
  trades.forEach(trade => {
    symbolCounts[trade.symbol] = (symbolCounts[trade.symbol] || 0) + 1;
  });
  
  const preferredSymbols = Object.entries(symbolCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([symbol]) => symbol);

  // Calculate average hold time
  const tradesWithTime = trades.filter(t => t.openTime && t.closeTime);
  const avgHoldTime = tradesWithTime.length > 0 
    ? tradesWithTime.reduce((sum, trade) => {
        const holdTime = (new Date(trade.closeTime).getTime() - new Date(trade.openTime).getTime()) / (1000 * 60 * 60);
        return sum + holdTime;
      }, 0) / tradesWithTime.length
    : 4;

  // Determine risk tolerance based on trading patterns
  const maxLoss = Math.min(...trades.map(t => t.profit || 0));
  const maxWin = Math.max(...trades.map(t => t.profit || 0));
  const riskTolerance = Math.abs(maxLoss) > maxWin * 0.5 ? 'high' : winRate > 60 ? 'low' : 'medium';

  // Determine trading style based on hold time
  const tradingStyle = avgHoldTime < 1 ? 'scalping' : avgHoldTime < 24 ? 'day_trading' : 'swing_trading';

  return {
    totalTrades,
    winRate,
    averageProfit,
    riskTolerance,
    preferredSymbols,
    tradingStyle,
    avgHoldTime
  };
}

async function getMarketData(): Promise<MarketData[]> {
  // Simulate market data - in production, integrate with real market data API
  const symbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'NZDUSD', 'XAUUSD', 'BTCUSD'];
  
  return symbols.map(symbol => ({
    symbol,
    currentPrice: 1.0500 + Math.random() * 0.1,
    high24h: 1.0600 + Math.random() * 0.05,
    low24h: 1.0400 + Math.random() * 0.05,
    volume: 1000000 + Math.random() * 5000000,
    priceChange24h: (Math.random() - 0.5) * 0.02,
    trend: Math.random() > 0.5 ? 'bullish' : Math.random() > 0.5 ? 'bearish' : 'sideways'
  }));
}

async function generateAISuggestions(
  profile: TraderProfile, 
  marketData: MarketData[]
): Promise<TradeSuggestion[]> {
  const prompt = `Based on this trader profile and market data, generate 3-5 specific trade suggestions with risk analysis:

TRADER PROFILE:
- Total Trades: ${profile.totalTrades}
- Win Rate: ${profile.winRate.toFixed(1)}%
- Average Profit: $${profile.averageProfit.toFixed(2)}
- Risk Tolerance: ${profile.riskTolerance}
- Preferred Symbols: ${profile.preferredSymbols.join(', ')}
- Trading Style: ${profile.tradingStyle}
- Average Hold Time: ${profile.avgHoldTime.toFixed(1)} hours

MARKET DATA:
${marketData.map(m => `${m.symbol}: Price ${m.currentPrice.toFixed(4)}, Change ${(m.priceChange24h * 100).toFixed(2)}%, Trend ${m.trend}`).join('\n')}

Generate trade suggestions in JSON format:
{
  "suggestions": [
    {
      "symbol": "EURUSD",
      "type": "buy",
      "entryPrice": 1.0550,
      "stopLoss": 1.0520,
      "takeProfit": 1.0580,
      "lotSize": 0.1,
      "riskScore": 35,
      "confidenceScore": 75,
      "reasoning": "Strong bullish momentum with RSI oversold condition",
      "marketAnalysis": "EUR showing strength against USD with positive economic indicators",
      "timeframe": "4h",
      "validUntil": "2024-12-22T18:00:00Z"
    }
  ]
}

Requirements:
- Risk Score: 1-100 (lower = safer)
- Confidence Score: 1-100 (higher = more confident)
- Match trader's risk tolerance and preferred symbols
- Provide specific entry, stop loss, and take profit levels
- Include detailed reasoning and market analysis
- Set appropriate position sizes based on risk tolerance`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional trading advisor with 20 years of experience in forex and commodity markets. Generate specific, actionable trade suggestions with detailed risk analysis. Always respond in valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
      max_tokens: 2000
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    if (!result.suggestions || !Array.isArray(result.suggestions)) {
      throw new Error("Invalid suggestions format");
    }

    // Convert to TradeSuggestion format and add timestamps
    return result.suggestions.map((suggestion: any) => ({
      id: 0, // Will be set by database
      symbol: suggestion.symbol,
      type: suggestion.type,
      entryPrice: suggestion.entryPrice,
      stopLoss: suggestion.stopLoss,
      takeProfit: suggestion.takeProfit,
      lotSize: suggestion.lotSize,
      riskScore: Math.max(1, Math.min(100, suggestion.riskScore)),
      confidenceScore: Math.max(1, Math.min(100, suggestion.confidenceScore)),
      reasoning: suggestion.reasoning,
      marketAnalysis: suggestion.marketAnalysis,
      timeframe: suggestion.timeframe,
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }));

  } catch (error) {
    console.error('Error generating AI suggestions:', error);
    
    // Fallback suggestions based on user profile
    return generateFallbackSuggestions(profile, marketData);
  }
}

function generateFallbackSuggestions(profile: TraderProfile, marketData: MarketData[]): TradeSuggestion[] {
  const suggestions: TradeSuggestion[] = [];
  
  // Generate basic suggestions for preferred symbols
  const topSymbols = profile.preferredSymbols.slice(0, 3);
  
  topSymbols.forEach((symbol, index) => {
    const market = marketData.find(m => m.symbol === symbol);
    if (!market) return;

    const isLong = market.trend === 'bullish' || Math.random() > 0.5;
    const basePrice = market.currentPrice;
    const riskScore = profile.riskTolerance === 'low' ? 25 : profile.riskTolerance === 'medium' ? 50 : 75;
    
    suggestions.push({
      id: 0,
      symbol,
      type: isLong ? 'buy' : 'sell',
      entryPrice: basePrice,
      stopLoss: isLong ? basePrice * 0.995 : basePrice * 1.005,
      takeProfit: isLong ? basePrice * 1.01 : basePrice * 0.99,
      lotSize: profile.riskTolerance === 'low' ? 0.05 : profile.riskTolerance === 'medium' ? 0.1 : 0.2,
      riskScore,
      confidenceScore: 60 + Math.floor(Math.random() * 30),
      reasoning: `${isLong ? 'Bullish' : 'Bearish'} momentum detected on ${symbol} with favorable risk-reward ratio`,
      marketAnalysis: `Technical analysis suggests ${market.trend} trend continuation with strong ${isLong ? 'support' : 'resistance'} levels`,
      timeframe: profile.tradingStyle === 'scalping' ? '1h' : profile.tradingStyle === 'day_trading' ? '4h' : '1d',
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  return suggestions;
}

export function calculateRiskScore(suggestion: TradeSuggestion, traderProfile: TraderProfile): RiskAssessment {
  const factors: string[] = [];
  let score = 50; // Base score

  // Adjust based on volatility (simulated)
  if (['XAUUSD', 'BTCUSD'].includes(suggestion.symbol)) {
    score += 20;
    factors.push('High volatility instrument');
  }

  // Adjust based on position size relative to trader experience
  if (suggestion.lotSize > 0.2 && traderProfile.totalTrades < 50) {
    score += 15;
    factors.push('Large position size for experience level');
  }

  // Adjust based on risk-reward ratio
  const riskReward = Math.abs(suggestion.takeProfit - suggestion.entryPrice) / 
                    Math.abs(suggestion.entryPrice - suggestion.stopLoss);
  
  if (riskReward < 1.5) {
    score += 10;
    factors.push('Unfavorable risk-reward ratio');
  } else if (riskReward > 2.5) {
    score -= 10;
    factors.push('Excellent risk-reward ratio');
  }

  // Adjust based on trader's risk tolerance
  if (traderProfile.riskTolerance === 'low' && score > 60) {
    score += 10;
    factors.push('High risk for conservative trader');
  } else if (traderProfile.riskTolerance === 'high' && score < 40) {
    score -= 5;
    factors.push('Suitable for aggressive trader');
  }

  // Ensure score is within bounds
  score = Math.max(1, Math.min(100, score));

  const recommendation = score < 30 ? 'favorable' : 
                        score < 50 ? 'moderate' : 
                        score < 70 ? 'caution' : 'avoid';

  return {
    score,
    factors,
    recommendation
  };
}