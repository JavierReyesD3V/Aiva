import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

if (!process.env.OPENAI_API_KEY) {
  console.warn("OPENAI_API_KEY no está configurado. Las funciones de AI no funcionarán.");
}

export interface TradingAnalysis {
  patterns: {
    timeBasedPatterns: string[];
    symbolPerformance: { symbol: string; performance: string; confidence: number }[];
    riskPatterns: string[];
  };
  recommendations: {
    riskManagement: string[];
    timing: string[];
    strategy: string[];
  };
  strengths: string[];
  weaknesses: string[];
  overallScore: number;
  nextSteps: string[];
}

export async function analyzeTradingPerformance(trades: any[]): Promise<TradingAnalysis> {
  if (trades.length === 0) {
    return {
      patterns: {
        timeBasedPatterns: ["No hay datos suficientes para análisis temporal"],
        symbolPerformance: [],
        riskPatterns: ["Comience registrando sus trades para obtener insights"]
      },
      recommendations: {
        riskManagement: ["Configure stop-loss para todas las operaciones"],
        timing: ["Mantenga un diario de trading"],
        strategy: ["Defina una estrategia clara antes de operar"]
      },
      strengths: ["Preparado para comenzar a hacer trading"],
      weaknesses: ["Necesita datos históricos para análisis"],
      overallScore: 50,
      nextSteps: ["Registre al menos 10 trades para obtener análisis personalizados"]
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY no configurado, devolviendo análisis estático");
    return generateStaticAnalysis(trades);
  }

  try {
    // Prepare comprehensive trading statistics
    const tradingStats = {
      totalTrades: trades.length,
      profitableTrades: trades.filter(t => (t.profit || 0) > 0).length,
      totalProfit: trades.reduce((sum, t) => sum + (t.profit || 0), 0),
      avgHoldTime: calculateAverageHoldTime(trades),
      symbolBreakdown: getSymbolBreakdown(trades),
      timePatterns: getTimePatterns(trades),
      riskMetrics: calculateRiskMetrics(trades)
    };

    const prompt = `Analyze this trading data and provide a comprehensive, detailed analysis in English:

TRADING DATA:
- Total trades: ${tradingStats.totalTrades}
- Profitable trades: ${tradingStats.profitableTrades}
- Win rate: ${((tradingStats.profitableTrades / tradingStats.totalTrades) * 100).toFixed(1)}%
- Total profit: $${tradingStats.totalProfit.toFixed(2)}
- Average hold time: ${tradingStats.avgHoldTime} minutes
- Main symbols: ${Object.keys(tradingStats.symbolBreakdown).slice(0, 5).join(', ')}
- Profit factor: ${tradingStats.riskMetrics.profitFactor.toFixed(2)}

Provide specific and practical analysis in JSON format:
{
  "patterns": {
    "timeBasedPatterns": ["specific time-based pattern with data", "another temporal pattern"],
    "symbolPerformance": [
      {"symbol": "EURUSD", "performance": "detailed performance description", "confidence": 0.8}
    ],
    "riskPatterns": ["specific risk pattern", "another risk management pattern"]
  },
  "recommendations": {
    "riskManagement": ["specific risk management recommendation", "another recommendation"],
    "timing": ["specific timing advice", "another temporal advice"],
    "strategy": ["concrete strategic improvement", "another improvement"]
  },
  "strengths": ["specific trader strength", "another strength", "third strength"],
  "weaknesses": ["specific weakness to improve", "another area for improvement"],
  "overallScore": 75,
  "nextSteps": ["actionable specific step", "another concrete step", "third step"]
}

IMPORTANT: Base all analysis on the real data provided and be specific and practical.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert trading analyst with 15 years of experience in forex and commodities. Provide detailed, specific and practical analysis based only on real data. Always respond in English and in valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 2000
    });

    const analysisResult = JSON.parse(response.choices[0].message.content || '{}');
    
    // Validate and ensure proper structure
    return {
      patterns: {
        timeBasedPatterns: analysisResult.patterns?.timeBasedPatterns || ["Temporal analysis not available"],
        symbolPerformance: analysisResult.patterns?.symbolPerformance || [],
        riskPatterns: analysisResult.patterns?.riskPatterns || ["Risk patterns not identified"]
      },
      recommendations: {
        riskManagement: analysisResult.recommendations?.riskManagement || ["Implement risk management"],
        timing: analysisResult.recommendations?.timing || ["Optimize entry timing"],
        strategy: analysisResult.recommendations?.strategy || ["Review overall strategy"]
      },
      strengths: analysisResult.strengths || ["Analysis in progress"],
      weaknesses: analysisResult.weaknesses || ["Requires more data"],
      overallScore: analysisResult.overallScore || 50,
      nextSteps: analysisResult.nextSteps || ["Continue recording trades"]
    };

  } catch (error) {
    console.error('Error en análisis OpenAI:', error);
    
    // Fallback to basic analysis if OpenAI fails
    const totalTrades = trades.length;
    const profitableTrades = trades.filter(t => (t.profit || 0) > 0).length;
    const winRate = (profitableTrades / totalTrades) * 100;
    
    return {
      patterns: {
        timeBasedPatterns: ["Temporal analysis requires OpenAI connection"],
        symbolPerformance: [],
        riskPatterns: [`Current win rate: ${winRate.toFixed(1)}%`]
      },
      recommendations: {
        riskManagement: ["Maintain stop-loss discipline"],
        timing: ["Analyze better trading hours"],
        strategy: ["Review and optimize current strategy"]
      },
      strengths: ["Discipline in trade recording"],
      weaknesses: ["Requires AI optimization"],
      overallScore: Math.min(85, Math.max(30, winRate)),
      nextSteps: ["Verify OpenAI connection for advanced analysis"]
    };
  }
}

// Helper functions for comprehensive data preparation
function calculateAverageHoldTime(trades: any[]): number {
  const tradesWithTime = trades.filter(t => t.closeTime && t.openTime);
  if (tradesWithTime.length === 0) return 0;
  
  const totalMinutes = tradesWithTime.reduce((sum, trade) => {
    const holdTime = (new Date(trade.closeTime).getTime() - new Date(trade.openTime).getTime()) / (1000 * 60);
    return sum + holdTime;
  }, 0);
  
  return Math.round(totalMinutes / tradesWithTime.length);
}

function getSymbolBreakdown(trades: any[]): Record<string, number> {
  const breakdown: Record<string, number> = {};
  trades.forEach(trade => {
    breakdown[trade.symbol] = (breakdown[trade.symbol] || 0) + 1;
  });
  return breakdown;
}

function getTimePatterns(trades: any[]): Record<string, any> {
  const hourlyStats: Record<number, number> = {};
  trades.forEach(trade => {
    const hour = new Date(trade.openTime).getHours();
    hourlyStats[hour] = (hourlyStats[hour] || 0) + 1;
  });
  return hourlyStats;
}

function calculateRiskMetrics(trades: any[]): Record<string, number> {
  const profits = trades.map(t => t.profit || 0);
  const wins = profits.filter(p => p > 0);
  const losses = profits.filter(p => p < 0);
  
  return {
    winRate: wins.length / trades.length,
    avgWin: wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0,
    avgLoss: losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : 0,
    profitFactor: wins.length > 0 && losses.length > 0 ? 
      (wins.reduce((a, b) => a + b, 0) / Math.abs(losses.reduce((a, b) => a + b, 0))) : 1
  };
}

export async function generateTradingInsights(recentTrades: any[], userStats: any): Promise<string[]> {
  if (recentTrades.length === 0) {
    return [
      "Start by executing small, low-risk trades to build confidence",
      "Focus on one or two currency pairs initially",
      "Set up proper risk management with stop-losses",
      "Keep a trading journal to track your progress"
    ];
  }

  try {
    // Prepare recent trading data for analysis
    const recentStats = {
      totalTrades: recentTrades.length,
      winRate: (recentTrades.filter(t => (t.profit || 0) > 0).length / recentTrades.length * 100).toFixed(1),
      totalProfit: recentTrades.reduce((sum, t) => sum + (t.profit || 0), 0),
      avgProfit: (recentTrades.reduce((sum, t) => sum + (t.profit || 0), 0) / recentTrades.length).toFixed(2),
      symbols: [...new Set(recentTrades.map(t => t.symbol))],
      userLevel: userStats?.currentLevel || 1,
      userPoints: userStats?.currentPoints || 0
    };

    const prompt = `Based on this recent trading data, generate exactly 4 specific and practical insights in English:

RECENT DATA (latest trades):
- Trades executed: ${recentStats.totalTrades}
- Win rate: ${recentStats.winRate}%
- Total profit: $${recentStats.totalProfit.toFixed(2)}
- Average profit per trade: $${recentStats.avgProfit}
- Pairs traded: ${recentStats.symbols.join(', ')}
- Trader level: ${recentStats.userLevel}
- Points accumulated: ${recentStats.userPoints}

Generate exactly 4 practical and specific insights. Each insight must be:
1. Specific to the data shown
2. Actionable (trader can implement immediately)
3. Motivating but realistic
4. Maximum 120 characters per insight

Respond in JSON format:
{
  "insights": ["insight1", "insight2", "insight3", "insight4"]
}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert trading mentor. Provide specific, practical and motivating insights based on real data. Always respond in valid JSON format and in English. Each insight must be concise and actionable."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.8,
      max_tokens: 800
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    if (result.insights && Array.isArray(result.insights) && result.insights.length > 0) {
      return result.insights.slice(0, 4);
    }
    
    // Fallback if response format is unexpected
    throw new Error("Invalid response format");

  } catch (error) {
    console.error('Error generando insights con OpenAI:', error);
    
    // Fallback to rule-based insights
    const recentWinRate = recentTrades.filter(t => (t.profit || 0) > 0).length / recentTrades.length;
    const totalProfit = recentTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
    
    const insights = [];
    
    if (recentWinRate > 0.7) {
      insights.push("Excellent performance! Consider gradually increasing position sizes");
      insights.push("Your recent trades show strong discipline and good entries");
    } else if (recentWinRate < 0.4) {
      insights.push("Consider reviewing your entry criteria and risk management");
      insights.push("Take a break to analyze what's not working in your current strategy");
    } else {
      insights.push("Decent performance. Focus on consistency and risk management");
      insights.push("Look for patterns in your winning trades to replicate success");
    }
    
    if (totalProfit > 0) {
      insights.push("Keep up the profitable streak with continued discipline");
    } else {
      insights.push("Focus on capital preservation and smaller position sizes");
    }
    
    // Add symbol-specific insights
    const symbols = [...new Set(recentTrades.map(t => t.symbol))];
    if (symbols.length > 0) {
      const bestSymbol = symbols.reduce((best, symbol) => {
        const symbolTrades = recentTrades.filter(t => t.symbol === symbol);
        const symbolProfit = symbolTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
        return symbolProfit > (best.profit || 0) ? { symbol, profit: symbolProfit } : best;
      }, { symbol: '', profit: 0 });
      
      if (bestSymbol.symbol) {
        insights.push(`${bestSymbol.symbol} is performing well for you - consider focusing on this pair`);
      }
    }
    
    return insights.slice(0, 4);
  }
}
