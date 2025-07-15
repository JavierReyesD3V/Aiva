import { Trade } from "@shared/schema";
import { TradingMetrics } from "./tradingAnalytics";
import { TradingAnalysis } from "./openai";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface PDFReportData {
  trades: Trade[];
  metrics: TradingMetrics;
  aiAnalysis: TradingAnalysis;
  dateRange: { start: Date; end: Date };
  userStats: any;
}

export async function generateComprehensivePDFReport(data: PDFReportData): Promise<Buffer> {
  console.log('Generating comprehensive PDF report using OpenAI...');
  
  if (!process.env.OPENAI_API_KEY) {
    console.warn("OPENAI_API_KEY no configurado, usando reporte simple");
    return generateSimpleReport(data);
  }

  try {
    // Prepare data for OpenAI analysis
    const topTrades = data.trades
      .sort((a, b) => (b.profit || 0) - (a.profit || 0))
      .slice(0, 10);
    
    const worstTrades = data.trades
      .sort((a, b) => (a.profit || 0) - (b.profit || 0))
      .slice(0, 5);

    const symbolStats = data.metrics.symbolPerformance || [];
    const monthlyStats = data.metrics.monthlyPerformance || [];

    const prompt = `Genera un reporte de trading profesional y detallado en formato texto para un trader. Usa estos datos REALES:

MÉTRICAS DE RENDIMIENTO:
- Total de Trades: ${data.metrics.totalTrades}
- Ganancia Total: $${data.metrics.totalProfit.toFixed(2)}
- Tasa de Éxito: ${data.metrics.winRate.toFixed(1)}%
- Factor de Ganancia: ${data.metrics.profitFactor.toFixed(2)}
- Máximo Drawdown: ${data.metrics.maxDrawdown.toFixed(2)}%
- Promedio por Trade Ganador: $${data.metrics.avgWin?.toFixed(2) || 'N/A'}
- Promedio por Trade Perdedor: $${data.metrics.avgLoss?.toFixed(2) || 'N/A'}

MEJORES TRADES:
${topTrades.map(t => `${t.symbol} ${t.type}: $${t.profit.toFixed(2)} (${new Date(t.openTime).toLocaleDateString()})`).join('\n')}

PEORES TRADES:
${worstTrades.map(t => `${t.symbol} ${t.type}: $${t.profit.toFixed(2)} (${new Date(t.openTime).toLocaleDateString()})`).join('\n')}

ANÁLISIS IA PREVIO:
Puntuación General: ${data.aiAnalysis.overallScore}/100
Fortalezas: ${data.aiAnalysis.strengths.join(', ')}
Debilidades: ${data.aiAnalysis.weaknesses.join(', ')}

Genera un reporte PDF COMPLETO y PROFESIONAL con:
1. Título y fecha
2. Resumen ejecutivo detallado
3. Análisis profundo de rendimiento
4. Identificación de patrones y tendencias
5. Recomendaciones específicas y accionables
6. Plan de mejora paso a paso
7. Conclusiones

Hazlo en español, formato profesional, y máximo 2000 palabras.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Eres un analista de trading experto que genera reportes profesionales detallados. Siempre respondes en español con formato limpio y profesional."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 3000
    });

    const pdfContent = response.choices[0].message.content || generateSimpleReportText(data);
    
    // Add additional metadata
    const finalReport = `
===============================================
REPORTE PROFESIONAL DE TRADING CON IA
===============================================
Generado el: ${new Date().toLocaleString('es-ES')}
Período analizado: ${data.dateRange.start.toLocaleDateString('es-ES')} - ${data.dateRange.end.toLocaleDateString('es-ES')}
===============================================

${pdfContent}

===============================================
DATOS TÉCNICOS ADICIONALES
===============================================
Total de Trades Analizados: ${data.trades.length}
Período de Datos: ${data.dateRange.start.toLocaleDateString('es-ES')} - ${data.dateRange.end.toLocaleDateString('es-ES')}
Reporte Generado: ${new Date().toLocaleString('es-ES')}
Plataforma: TradingJournal Pro
===============================================
`;

    return Buffer.from(finalReport, 'utf-8');

  } catch (error) {
    console.error('Error generating OpenAI PDF report:', error);
    return generateSimpleReport(data);
  }
}

function generateSimpleReport(data: PDFReportData): Buffer {
  const content = generateSimpleReportText(data);
  return Buffer.from(content, 'utf-8');
}

function generateSimpleReportText(data: PDFReportData): string {
  return `
REPORTE DE TRADING COMPRENSIVO
===============================================
Generado: ${new Date().toLocaleString('es-ES')}
Período: ${data.dateRange.start.toLocaleDateString('es-ES')} - ${data.dateRange.end.toLocaleDateString('es-ES')}

RESUMEN EJECUTIVO
---------------
Total de Trades: ${data.metrics.totalTrades}
Ganancia Total: $${data.metrics.totalProfit.toFixed(2)}
Tasa de Éxito: ${data.metrics.winRate.toFixed(1)}%
Factor de Ganancia: ${data.metrics.profitFactor.toFixed(2)}
Máximo Drawdown: ${data.metrics.maxDrawdown.toFixed(2)}%

ANÁLISIS DE IA
--------------
Puntuación General: ${data.aiAnalysis.overallScore}/100

Fortalezas Identificadas:
${data.aiAnalysis.strengths.map(s => `• ${s}`).join('\n')}

Áreas de Mejora:
${data.aiAnalysis.weaknesses.map(w => `• ${w}`).join('\n')}

Recomendaciones:
${data.aiAnalysis.nextSteps.map(n => `• ${n}`).join('\n')}

TRADES DESTACADOS
-----------------
${data.trades.slice(0, 20).map(trade => 
  `${trade.symbol} ${trade.type} | ${new Date(trade.openTime).toLocaleDateString('es-ES')} | $${trade.profit.toFixed(2)}`
).join('\n')}

===============================================
Fin del Reporte
===============================================
`;
}

export function generatePDFReport(data: PDFReportData): string {
  return JSON.stringify({
    title: "Trading Report",
    generated: new Date().toISOString(),
    summary: data.metrics,
    trades: data.trades
  }, null, 2);
}