import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface TradingAdvice {
  id: number;
  category: 'risk_management' | 'timing' | 'symbol_selection' | 'position_sizing' | 'psychology';
  title: string;
  advice: string;
  reasoning: string;
  basedOnData: string;
  priority: 'high' | 'medium' | 'low';
  confidenceScore: number;
  potentialImpact: string;
  createdAt: string;
  status: string;
}

interface TradingPatternAnalysis {
  winningTrades: any[];
  losingTrades: any[];
  symbolPerformance: Record<string, { trades: number; profit: number; winRate: number; avgProfit: number }>;
  timePatterns: {
    bestHours: number[];
    worstHours: number[];
    weekdayPerformance: Record<string, { trades: number; profit: number }>;
  };
  riskPatterns: {
    avgWinSize: number;
    avgLossSize: number;
    largestWin: number;
    largestLoss: number;
    consecutiveWins: number;
    consecutiveLosses: number;
  };
  tradingStyle: {
    avgHoldTime: number;
    preferredLotSizes: number[];
    mostProfitableSetups: string[];
  };
}

export function analyzeUserTradingPatterns(trades: any[]): TradingPatternAnalysis {
  const winningTrades = trades.filter(t => (t.profit || 0) > 0);
  const losingTrades = trades.filter(t => (t.profit || 0) < 0);
  
  // Symbol performance analysis
  const symbolPerformance: Record<string, { trades: number; profit: number; winRate: number; avgProfit: number }> = {};
  trades.forEach(trade => {
    if (!symbolPerformance[trade.symbol]) {
      symbolPerformance[trade.symbol] = { trades: 0, profit: 0, winRate: 0, avgProfit: 0 };
    }
    symbolPerformance[trade.symbol].trades++;
    symbolPerformance[trade.symbol].profit += trade.profit || 0;
  });
  
  Object.keys(symbolPerformance).forEach(symbol => {
    const symbolTrades = trades.filter(t => t.symbol === symbol);
    const symbolWins = symbolTrades.filter(t => (t.profit || 0) > 0);
    symbolPerformance[symbol].winRate = symbolWins.length / symbolTrades.length;
    symbolPerformance[symbol].avgProfit = symbolPerformance[symbol].profit / symbolTrades.length;
  });

  // Time pattern analysis
  const hourlyStats: Record<number, { trades: number; profit: number }> = {};
  const weekdayStats: Record<string, { trades: number; profit: number }> = {};
  
  trades.forEach(trade => {
    if (trade.openTime) {
      const date = new Date(trade.openTime);
      const hour = date.getHours();
      const weekday = date.toLocaleDateString('es-ES', { weekday: 'long' });
      
      if (!hourlyStats[hour]) hourlyStats[hour] = { trades: 0, profit: 0 };
      if (!weekdayStats[weekday]) weekdayStats[weekday] = { trades: 0, profit: 0 };
      
      hourlyStats[hour].trades++;
      hourlyStats[hour].profit += trade.profit || 0;
      weekdayStats[weekday].trades++;
      weekdayStats[weekday].profit += trade.profit || 0;
    }
  });

  const bestHours = Object.entries(hourlyStats)
    .filter(([, data]) => data.trades >= 3)
    .sort(([, a], [, b]) => b.profit - a.profit)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  const worstHours = Object.entries(hourlyStats)
    .filter(([, data]) => data.trades >= 3)
    .sort(([, a], [, b]) => a.profit - b.profit)
    .slice(0, 3)
    .map(([hour]) => parseInt(hour));

  // Risk pattern analysis
  const profits = trades.map(t => t.profit || 0);
  const wins = profits.filter(p => p > 0);
  const losses = profits.filter(p => p < 0);
  
  const avgWinSize = wins.length > 0 ? wins.reduce((a, b) => a + b, 0) / wins.length : 0;
  const avgLossSize = losses.length > 0 ? Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length) : 0;

  // Calculate consecutive wins/losses
  let maxConsecutiveWins = 0;
  let maxConsecutiveLosses = 0;
  let currentWins = 0;
  let currentLosses = 0;

  trades.forEach(trade => {
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

  // Trading style analysis
  const tradesWithTime = trades.filter(t => t.openTime && t.closeTime);
  const avgHoldTime = tradesWithTime.length > 0 
    ? tradesWithTime.reduce((sum, trade) => {
        const holdTime = (new Date(trade.closeTime).getTime() - new Date(trade.openTime).getTime()) / (1000 * 60 * 60);
        return sum + holdTime;
      }, 0) / tradesWithTime.length
    : 0;

  const lotSizes = trades.map(t => t.lots || 0).filter(l => l > 0);
  const preferredLotSizes = [...new Set(lotSizes)].sort((a, b) => b - a).slice(0, 3);

  // Find most profitable setups
  const setupStats: Record<string, { count: number; profit: number }> = {};
  trades.forEach(trade => {
    const setup = trade.type || 'unknown';
    if (!setupStats[setup]) setupStats[setup] = { count: 0, profit: 0 };
    setupStats[setup].count++;
    setupStats[setup].profit += trade.profit || 0;
  });

  const mostProfitableSetups = Object.entries(setupStats)
    .sort(([, a], [, b]) => b.profit - a.profit)
    .slice(0, 2)
    .map(([setup]) => setup);

  return {
    winningTrades,
    losingTrades,
    symbolPerformance,
    timePatterns: {
      bestHours,
      worstHours,
      weekdayPerformance: weekdayStats
    },
    riskPatterns: {
      avgWinSize,
      avgLossSize,
      largestWin: Math.max(...profits),
      largestLoss: Math.min(...profits),
      consecutiveWins: maxConsecutiveWins,
      consecutiveLosses: maxConsecutiveLosses
    },
    tradingStyle: {
      avgHoldTime,
      preferredLotSizes,
      mostProfitableSetups
    }
  };
}

export async function generatePersonalizedTradingAdvice(
  userTrades: any[], 
  userStats: any
): Promise<TradingAdvice[]> {
  try {
    if (!userTrades || userTrades.length === 0) {
      return [];
    }

    const analysis = analyzeUserTradingPatterns(userTrades);
    
    if (process.env.OPENAI_API_KEY) {
      return await generateAIAdvice(analysis, userTrades);
    } else {
      return generateFallbackAdvice(analysis);
    }
  } catch (error) {
    console.error('Error generating trading advice:', error);
    return [];
  }
}

async function generateAIAdvice(
  analysis: TradingPatternAnalysis,
  userTrades: any[]
): Promise<TradingAdvice[]> {
  try {
    const bestSymbols = Object.entries(analysis.symbolPerformance)
      .filter(([, data]) => data.trades >= 3 && data.profit > 0)
      .sort(([, a], [, b]) => b.avgProfit - a.avgProfit)
      .slice(0, 3)
      .map(([symbol, data]) => ({ symbol, ...data }));

    const worstSymbols = Object.entries(analysis.symbolPerformance)
      .filter(([, data]) => data.trades >= 3 && data.profit < 0)
      .sort(([, a], [, b]) => a.avgProfit - b.avgProfit)
      .slice(0, 2)
      .map(([symbol, data]) => ({ symbol, ...data }));

    const totalProfit = userTrades.reduce((sum, t) => sum + (t.profit || 0), 0);
    const winRate = (analysis.winningTrades.length / userTrades.length) * 100;

    const prompt = `Eres un mentor de trading experto. Analiza los datos reales de este usuario y genera 4-5 consejos específicos para mejorar sus resultados.

RESUMEN DE PERFORMANCE:
- Total trades: ${userTrades.length}
- Ganancia/Pérdida total: $${totalProfit.toFixed(2)}
- Win rate: ${winRate.toFixed(1)}%
- Ganancia promedio por trade ganador: $${analysis.riskPatterns.avgWinSize.toFixed(2)}
- Pérdida promedio por trade perdedor: $${analysis.riskPatterns.avgLossSize.toFixed(2)}

ANÁLISIS DE TRADES EXITOSOS:
${analysis.winningTrades.slice(0, 5).map(t => 
  `- ${t.symbol} ${t.type}: +$${t.profit}, Hora: ${new Date(t.openTime).getHours()}:00, Duración: ${t.closeTime ? Math.round((new Date(t.closeTime).getTime() - new Date(t.openTime).getTime()) / (1000 * 60 * 60)) : 'N/A'} horas`
).join('\n')}

ANÁLISIS DE TRADES PERDEDORES:
${analysis.losingTrades.slice(0, 5).map(t => 
  `- ${t.symbol} ${t.type}: $${t.profit}, Hora: ${new Date(t.openTime).getHours()}:00`
).join('\n')}

PARES MÁS RENTABLES:
${bestSymbols.map(s => `✓ ${s.symbol}: ${s.trades} trades, $${s.profit.toFixed(2)} ganancia, ${(s.winRate * 100).toFixed(1)}% winrate`).join('\n')}

PARES PROBLEMÁTICOS:
${worstSymbols.map(s => `✗ ${s.symbol}: ${s.trades} trades, $${s.profit.toFixed(2)} pérdida, ${(s.winRate * 100).toFixed(1)}% winrate`).join('\n')}

MEJORES HORAS: ${analysis.timePatterns.bestHours.map(h => `${h}:00`).join(', ')}
PEORES HORAS: ${analysis.timePatterns.worstHours.map(h => `${h}:00`).join(', ')}

INSTRUCCIONES:
Genera consejos específicos y accionables basados ÚNICAMENTE en estos datos reales. Identifica patrones concretos de éxito y fallo. NO uses consejos generales de trading.

Responde en JSON:
{
  "advice": [
    {
      "category": "risk_management",
      "title": "Optimiza tu gestión de riesgo",
      "advice": "Reduce el tamaño de posición en GBPUSD donde has perdido $450 en 8 trades",
      "reasoning": "Tus datos muestran que GBPUSD te genera pérdidas consistentes con un 25% winrate",
      "basedOnData": "8 trades en GBPUSD con pérdida total de $450 y solo 25% de éxito",
      "priority": "high",
      "confidenceScore": 90,
      "potentialImpact": "Reducir pérdidas en $200-300 mensuales"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Eres un mentor de trading experto. Genera consejos específicos basados únicamente en los datos reales del usuario. NO uses consejos generales. Cada consejo debe estar respaldado por patrones específicos encontrados en sus trades."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const response = JSON.parse(completion.choices[0].message.content || "{}");
    
    if (response.advice && Array.isArray(response.advice)) {
      return response.advice.map((advice: any, index: number) => ({
        id: Date.now() + index,
        ...advice,
        createdAt: new Date().toISOString(),
        status: 'active'
      } as TradingAdvice));
    }
  } catch (error) {
    console.error('Error generating AI advice:', error);
  }
  
  return [];
}

function generateFallbackAdvice(analysis: TradingPatternAnalysis): TradingAdvice[] {
  const advice: TradingAdvice[] = [];
  
  const bestSymbols = Object.entries(analysis.symbolPerformance)
    .filter(([, data]) => data.trades >= 2 && data.profit > 0)
    .sort(([, a], [, b]) => b.avgProfit - a.avgProfit)
    .slice(0, 2);

  const worstSymbols = Object.entries(analysis.symbolPerformance)
    .filter(([, data]) => data.trades >= 2 && data.profit < 0)
    .sort(([, a], [, b]) => a.avgProfit - b.avgProfit)
    .slice(0, 2);

  // Best symbols advice
  if (bestSymbols.length > 0) {
    const [symbol, data] = bestSymbols[0];
    advice.push({
      id: Date.now(),
      category: 'symbol_selection',
      title: 'Enfócate en tus pares más rentables',
      advice: `Concentra más operaciones en ${symbol} donde has generado $${data.profit.toFixed(2)} con ${(data.winRate * 100).toFixed(1)}% de éxito`,
      reasoning: `Tu historial muestra que ${symbol} es tu par más rentable con ${data.trades} trades realizados`,
      basedOnData: `${data.trades} trades en ${symbol}, ganancia promedio $${data.avgProfit.toFixed(2)}`,
      priority: 'high',
      confidenceScore: 85,
      potentialImpact: 'Incrementar rentabilidad mensual',
      createdAt: new Date().toISOString(),
      status: 'active'
    });
  }

  // Worst symbols advice
  if (worstSymbols.length > 0) {
    const [symbol, data] = worstSymbols[0];
    advice.push({
      id: Date.now() + 1,
      category: 'risk_management',
      title: 'Evita pares problemáticos',
      advice: `Reduce o elimina operaciones en ${symbol} donde has perdido $${Math.abs(data.profit).toFixed(2)}`,
      reasoning: `${symbol} ha sido consistentemente no rentable con solo ${(data.winRate * 100).toFixed(1)}% de éxito`,
      basedOnData: `${data.trades} trades en ${symbol}, pérdida total $${data.profit.toFixed(2)}`,
      priority: 'high',
      confidenceScore: 80,
      potentialImpact: 'Reducir pérdidas mensuales',
      createdAt: new Date().toISOString(),
      status: 'active'
    });
  }

  // Timing advice
  if (analysis.timePatterns.bestHours.length > 0) {
    advice.push({
      id: Date.now() + 2,
      category: 'timing',
      title: 'Optimiza tus horarios de trading',
      advice: `Opera principalmente entre las ${analysis.timePatterns.bestHours.join(', ')} horas cuando has tenido mejor rendimiento`,
      reasoning: 'Tus datos muestran mayor rentabilidad en estas franjas horarias específicas',
      basedOnData: `Mejores horas identificadas: ${analysis.timePatterns.bestHours.join(', ')}`,
      priority: 'medium',
      confidenceScore: 70,
      potentialImpact: 'Mejorar ratio de trades exitosos',
      createdAt: new Date().toISOString(),
      status: 'active'
    });
  }

  // Risk management advice
  if (analysis.riskPatterns.avgLossSize > analysis.riskPatterns.avgWinSize * 1.5) {
    advice.push({
      id: Date.now() + 3,
      category: 'risk_management',
      title: 'Mejora tu ratio riesgo/beneficio',
      advice: `Tus pérdidas promedio ($${analysis.riskPatterns.avgLossSize.toFixed(2)}) son muy altas comparadas con tus ganancias ($${analysis.riskPatterns.avgWinSize.toFixed(2)})`,
      reasoning: 'Un ratio riesgo/beneficio desfavorable está limitando tu rentabilidad',
      basedOnData: `Pérdida promedio: $${analysis.riskPatterns.avgLossSize.toFixed(2)}, Ganancia promedio: $${analysis.riskPatterns.avgWinSize.toFixed(2)}`,
      priority: 'high',
      confidenceScore: 90,
      potentialImpact: 'Incrementar rentabilidad general',
      createdAt: new Date().toISOString(),
      status: 'active'
    });
  }
  
  return advice;
}