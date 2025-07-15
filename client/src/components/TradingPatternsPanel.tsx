import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Target, 
  AlertTriangle,
  Brain,
  BarChart3,
  DollarSign,
  Activity
} from "lucide-react";

interface TradingPattern {
  category: string;
  insight: string;
  impact: 'positive' | 'negative' | 'neutral';
  confidence: number;
  actionable: string;
  data: string;
}

export default function TradingPatternsPanel() {
  const { data: trades = [] } = useQuery({
    queryKey: ["/api/trades"],
  });

  const analyzePatterns = (trades: any[]): TradingPattern[] => {
    if (!trades || trades.length === 0) return [];

    const patterns: TradingPattern[] = [];
    
    // Análisis de pares más rentables
    const symbolStats: Record<string, { trades: number; profit: number; wins: number }> = {};
    trades.forEach(trade => {
      if (!symbolStats[trade.symbol]) {
        symbolStats[trade.symbol] = { trades: 0, profit: 0, wins: 0 };
      }
      symbolStats[trade.symbol].trades++;
      symbolStats[trade.symbol].profit += trade.profit || 0;
      if ((trade.profit || 0) > 0) symbolStats[trade.symbol].wins++;
    });

    const sortedSymbols = Object.entries(symbolStats)
      .filter(([, data]) => data.trades >= 3)
      .sort(([, a], [, b]) => b.profit - a.profit);

    if (sortedSymbols.length > 0) {
      const [bestSymbol, bestData] = sortedSymbols[0];
      const winRate = (bestData.wins / bestData.trades) * 100;
      
      if (bestData.profit > 0) {
        patterns.push({
          category: 'Par Rentable',
          insight: `${bestSymbol} es tu par más rentable con $${bestData.profit.toFixed(2)} de ganancia`,
          impact: 'positive',
          confidence: Math.min(95, 60 + (bestData.trades * 5)),
          actionable: `Incrementa el volumen de trades en ${bestSymbol} - has tenido ${winRate.toFixed(1)}% de éxito`,
          data: `${bestData.trades} trades, ${winRate.toFixed(1)}% winrate`
        });
      }
    }

    // Análisis de pares problemáticos
    if (sortedSymbols.length > 1) {
      const [worstSymbol, worstData] = sortedSymbols[sortedSymbols.length - 1];
      const winRate = (worstData.wins / worstData.trades) * 100;
      
      if (worstData.profit < 0) {
        patterns.push({
          category: 'Par Problemático',
          insight: `${worstSymbol} te ha generado pérdidas de $${Math.abs(worstData.profit).toFixed(2)}`,
          impact: 'negative',
          confidence: Math.min(90, 50 + (worstData.trades * 7)),
          actionable: `Evita o reduce significativamente trades en ${worstSymbol} - solo ${winRate.toFixed(1)}% de éxito`,
          data: `${worstData.trades} trades, ${winRate.toFixed(1)}% winrate`
        });
      }
    }

    // Análisis de horarios
    const hourlyStats: Record<number, { trades: number; profit: number }> = {};
    trades.forEach(trade => {
      if (trade.openTime) {
        const hour = new Date(trade.openTime).getHours();
        if (!hourlyStats[hour]) hourlyStats[hour] = { trades: 0, profit: 0 };
        hourlyStats[hour].trades++;
        hourlyStats[hour].profit += trade.profit || 0;
      }
    });

    const hourlyEntries = Object.entries(hourlyStats)
      .filter(([, data]) => data.trades >= 2)
      .sort(([, a], [, b]) => b.profit - a.profit);

    if (hourlyEntries.length > 0) {
      const [bestHour, bestHourData] = hourlyEntries[0];
      if (bestHourData.profit > 0) {
        patterns.push({
          category: 'Mejor Horario',
          insight: `Las ${bestHour}:00h es tu hora más rentable con $${bestHourData.profit.toFixed(2)}`,
          impact: 'positive',
          confidence: Math.min(85, 40 + (bestHourData.trades * 8)),
          actionable: `Concentra más operaciones alrededor de las ${bestHour}:00h`,
          data: `${bestHourData.trades} trades en esta hora`
        });
      }
    }

    // Análisis de gestión de riesgo
    const profits = trades.map(t => t.profit || 0).filter(p => p !== 0);
    const wins = profits.filter(p => p > 0);
    const losses = profits.filter(p => p < 0);
    
    if (wins.length > 0 && losses.length > 0) {
      const avgWin = wins.reduce((a, b) => a + b, 0) / wins.length;
      const avgLoss = Math.abs(losses.reduce((a, b) => a + b, 0) / losses.length);
      const riskRewardRatio = avgWin / avgLoss;
      
      if (riskRewardRatio < 1) {
        patterns.push({
          category: 'Gestión de Riesgo',
          insight: `Tu ratio riesgo/beneficio es ${riskRewardRatio.toFixed(2)}:1 - desfavorable`,
          impact: 'negative',
          confidence: 88,
          actionable: `Mejora tu ratio: reduce stop loss o aumenta take profit targets`,
          data: `Ganancia promedio: $${avgWin.toFixed(2)}, Pérdida promedio: $${avgLoss.toFixed(2)}`
        });
      } else if (riskRewardRatio > 1.5) {
        patterns.push({
          category: 'Gestión de Riesgo',
          insight: `Excelente ratio riesgo/beneficio de ${riskRewardRatio.toFixed(2)}:1`,
          impact: 'positive',
          confidence: 92,
          actionable: `Mantén esta disciplina en gestión de riesgo`,
          data: `Ganancia promedio: $${avgWin.toFixed(2)}, Pérdida promedio: $${avgLoss.toFixed(2)}`
        });
      }
    }

    // Análisis de rachas
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    trades.forEach(trade => {
      if ((trade.profit || 0) > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
      } else if ((trade.profit || 0) < 0) {
        currentLossStreak++;
        currentWinStreak = 0;
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
      }
    });

    if (maxLossStreak >= 5) {
      patterns.push({
        category: 'Control Emocional',
        insight: `Has tenido rachas de hasta ${maxLossStreak} pérdidas consecutivas`,
        impact: 'negative',
        confidence: 80,
        actionable: `Establece límites de pérdidas diarias para evitar revenge trading`,
        data: `Racha máxima de pérdidas: ${maxLossStreak} trades`
      });
    }

    return patterns.slice(0, 5); // Limitar a 5 patrones más importantes
  };

  const patterns = analyzePatterns(trades);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive': return 'bg-green-600/20 text-green-400 border-green-600/30';
      case 'negative': return 'bg-red-600/20 text-red-400 border-red-600/30';
      default: return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <TrendingUp className="w-4 h-4" />;
      case 'negative': return <TrendingDown className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Par Rentable':
      case 'Par Problemático':
        return <Target className="w-4 h-4" />;
      case 'Mejor Horario':
        return <Clock className="w-4 h-4" />;
      case 'Gestión de Riesgo':
        return <AlertTriangle className="w-4 h-4" />;
      case 'Control Emocional':
        return <Brain className="w-4 h-4" />;
      default:
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  if (patterns.length === 0) {
    return (
      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
        <CardContent className="p-6 text-center">
          <Brain className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            Importa tu historial de trades para ver patrones de rendimiento
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
        <CardHeader>
          <CardTitle className="flex items-center text-white">
            <Activity className="w-5 h-5 mr-2 text-primary" />
            Patrones de Trading Detectados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300 text-sm">
            Análisis automático de tu historial de trading para identificar 
            fortalezas y áreas de mejora.
          </p>
        </CardContent>
      </Card>

      {patterns.map((pattern, index) => (
        <Card 
          key={index}
          className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:border-primary/50 transition-colors"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getImpactColor(pattern.impact)}`}>
                  {getCategoryIcon(pattern.category)}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm leading-tight">
                    {pattern.category}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge className={getImpactColor(pattern.impact)}>
                      {getImpactIcon(pattern.impact)}
                      <span className="ml-1">
                        {pattern.impact === 'positive' ? 'FORTALEZA' : 
                         pattern.impact === 'negative' ? 'MEJORAR' : 'NEUTRAL'}
                      </span>
                    </Badge>
                    <Badge className="bg-gray-600/20 text-gray-400 border-gray-600/30">
                      {pattern.confidence}% CONFIANZA
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            <div className="bg-primary/10 border-l-4 border-primary p-3 rounded-r-lg">
              <p className="text-gray-200 text-sm font-medium">
                {pattern.insight}
              </p>
            </div>

            <div className="space-y-2">
              <div>
                <p className="text-xs text-gray-400 mb-1">Recomendación:</p>
                <p className="text-sm text-gray-300">
                  {pattern.actionable}
                </p>
              </div>

              <div className="bg-gray-900/50 border border-gray-600/30 p-2 rounded">
                <p className="text-xs text-gray-400">
                  <strong>Basado en:</strong> {pattern.data}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-400">Confianza:</span>
                <Progress value={pattern.confidence} className="h-1 flex-1" />
                <span className="text-xs text-gray-400">{pattern.confidence}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}