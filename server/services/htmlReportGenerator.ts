import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ReportData {
  trades: any[];
  accounts: any[];
  metrics: any;
  dateRange: { start: Date; end: Date };
  userStats: any;
}

export async function generateHTMLReport(data: ReportData): Promise<string> {
  try {
    // Generate AI analysis content
    const analysisContent = await generateAIAnalysis(data);
    
    // Create HTML report with the application's design
    const htmlReport = createHTMLReport(analysisContent, data);
    
    return htmlReport;
  } catch (error: any) {
    console.error('Error generating HTML report:', error);
    // Fallback to simple report if OpenAI fails
    return createSimpleHTMLReport(data);
  }
}

async function generateAIAnalysis(data: ReportData): Promise<string> {
  const { trades, metrics, userStats } = data;
  
  const prompt = `
Como experto analista financiero, genera un reporte completo de trading en español profesional basado en los siguientes datos reales:

DATOS DE TRADING:
- Total de trades: ${metrics.totalTrades}
- Trades rentables: ${metrics.profitableTrades}
- Trades perdedores: ${metrics.losingTrades}
- Tasa de éxito: ${metrics.winRate}%
- Profit total: $${metrics.totalProfit}
- Drawdown máximo: $${metrics.maxDrawdown}
- Nivel del usuario: ${userStats?.level || 1}
- Puntos de experiencia: ${userStats?.points || 0}

TRADES RECIENTES:
${trades.slice(0, 10).map(trade => 
  `- ${trade.symbol}: ${trade.type} | P&L: $${trade.profitLoss} | ${new Date(trade.entryDate).toLocaleDateString()}`
).join('\n')}

Genera un análisis estructurado que incluya:

1. **RESUMEN EJECUTIVO** (2-3 párrafos)
2. **ANÁLISIS DE RENDIMIENTO**
   - Evaluación de métricas clave
   - Comparación con benchmarks estándar
3. **PATRONES IDENTIFICADOS**
   - Fortalezas en el trading
   - Áreas de mejora detectadas
4. **ANÁLISIS DE RIESGO**
   - Gestión de capital
   - Control de drawdown
5. **RECOMENDACIONES ESPECÍFICAS**
   - 5 acciones concretas para mejorar
6. **PLAN DE DESARROLLO**
   - Objetivos a corto plazo (1-3 meses)
   - Estrategias de implementación

Usa un tono profesional pero accesible. Basa todas las recomendaciones en los datos reales proporcionados.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 2000,
    temperature: 0.7,
  });

  return completion.choices[0]?.message?.content || 'Error generando análisis';
}

// Function to convert markdown-like formatting to HTML
function formatAnalysisContent(content: string): string {
  // First, identify and convert section headers (all caps text between **)
  let formattedContent = content
    // Convert section headers like **RESUMEN EJECUTIVO** to styled headers
    .replace(/\*\*([A-ZÁÉÍÓÚÑ\s]{5,})\*\*/g, '<h3 class="section-header">$1</h3>')
    // Convert remaining **bold** to <strong>
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Convert numbered lists (1. 2. 3.)
    .replace(/^(\d+\.\s)/gm, '<strong>$1</strong>')
    // Convert bullet points (-)
    .replace(/^-\s/gm, '• ');

  // Split into paragraphs and process
  const paragraphs = formattedContent.split(/\n\s*\n/);
  
  return paragraphs
    .map(paragraph => {
      // Don't wrap headers in paragraphs
      if (paragraph.includes('<h3 class="section-header">')) {
        return paragraph;
      }
      // Replace single line breaks with <br> within paragraphs
      const processedParagraph = paragraph.replace(/\n/g, '<br>');
      return `<p>${processedParagraph}</p>`;
    })
    .join('\n');
}

function createHTMLReport(analysisContent: string, data: ReportData): string {
  const { metrics, userStats, dateRange } = data;
  const currentDate = new Date().toLocaleDateString('es-ES');
  
  // Format numbers for better display
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-ES', { 
      minimumFractionDigits: 0, 
      maximumFractionDigits: 2 
    }).format(num);
  };
  
  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('es-ES', { 
      style: 'currency', 
      currency: 'USD' 
    }).format(num);
  };
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Trading - ${currentDate}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: white;
            line-height: 1.6;
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            text-align: center;
            margin-bottom: 3rem;
            padding: 2rem;
            background: linear-gradient(135deg, rgba(168, 85, 247, 0.2) 0%, rgba(236, 72, 153, 0.2) 100%);
            border-radius: 12px;
            border: 1px solid rgba(168, 85, 247, 0.3);
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
            background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.8;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
        }
        
        .metric-card {
            background: linear-gradient(135deg, rgba(168, 85, 247, 0.15) 0%, rgba(236, 72, 153, 0.15) 100%);
            border: 1px solid rgba(168, 85, 247, 0.3);
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
            transition: transform 0.2s ease;
        }
        
        .metric-card:hover {
            transform: translateY(-2px);
            border-color: rgba(168, 85, 247, 0.5);
        }
        
        .metric-card h3 {
            font-size: 0.85rem;
            opacity: 0.8;
            margin-bottom: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 500;
        }
        
        .metric-card .value {
            font-size: 1.75rem;
            font-weight: bold;
            color: #a855f7;
            line-height: 1.2;
            word-break: break-all;
        }
        
        .content-section {
            background: linear-gradient(135deg, rgba(168, 85, 247, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%);
            border: 1px solid rgba(168, 85, 247, 0.2);
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
        }
        
        .content-section h2 {
            color: #a855f7;
            margin-bottom: 1rem;
            font-size: 1.5rem;
        }
        
        .analysis-content {
            line-height: 1.8;
        }
        
        .analysis-content p {
            margin-bottom: 1rem;
        }
        
        .analysis-content strong {
            color: #ec4899;
            font-weight: 600;
        }
        
        .section-header {
            color: #a855f7;
            font-size: 1.25rem;
            font-weight: 700;
            margin: 2rem 0 1rem 0;
            padding: 0.75rem 0;
            border-bottom: 2px solid rgba(168, 85, 247, 0.3);
        }
        
        .analysis-content h3:first-child {
            margin-top: 0;
        }
        
        .analysis-content ul {
            margin: 1rem 0;
            padding-left: 1.5rem;
        }
        
        .analysis-content li {
            margin-bottom: 0.5rem;
        }
        
        .footer {
            text-align: center;
            margin-top: 3rem;
            padding: 2rem;
            opacity: 0.6;
            border-top: 1px solid rgba(168, 85, 247, 0.2);
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .metrics-grid {
                grid-template-columns: 1fr;
            }
        }
        
        @media print {
            body {
                background: white;
                color: black;
            }
            
            .header, .metric-card, .content-section {
                background: white;
                border: 1px solid #ccc;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📈 Reporte de Trading Profesional</h1>
            <p>Análisis detallado generado por AIVA • ${currentDate}</p>
            <p>Período: ${dateRange.start.toLocaleDateString('es-ES')} - ${dateRange.end.toLocaleDateString('es-ES')}</p>
        </div>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <h3>Total de Trades</h3>
                <div class="value">${formatNumber(metrics.totalTrades)}</div>
            </div>
            <div class="metric-card">
                <h3>Tasa de Éxito</h3>
                <div class="value">${formatNumber(metrics.winRate)}%</div>
            </div>
            <div class="metric-card">
                <h3>Profit Total</h3>
                <div class="value">${formatCurrency(metrics.totalProfit)}</div>
            </div>
            <div class="metric-card">
                <h3>Drawdown Máximo</h3>
                <div class="value">${formatCurrency(metrics.maxDrawdown)}</div>
            </div>
            <div class="metric-card">
                <h3>Nivel Actual</h3>
                <div class="value">${formatNumber(userStats?.level || 1)}</div>
            </div>
            <div class="metric-card">
                <h3>Puntos XP</h3>
                <div class="value">${formatNumber(userStats?.points || 0)}</div>
            </div>
        </div>
        
        <div class="content-section">
            <h2>🤖 Análisis Generado por AIVA</h2>
            <div class="analysis-content">${formatAnalysisContent(analysisContent)}</div>
        </div>
        
        <div class="footer">
            <p>Reporte generado por TradingJournal Pro con tecnología AIVA</p>
            <p>© ${new Date().getFullYear()} - Todos los derechos reservados</p>
        </div>
    </div>
</body>
</html>
`;
}

function createSimpleHTMLReport(data: ReportData): string {
  const { metrics, userStats } = data;
  const currentDate = new Date().toLocaleDateString('es-ES');
  
  return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Trading - ${currentDate}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            color: white;
            padding: 2rem;
            line-height: 1.6;
        }
        .container { max-width: 800px; margin: 0 auto; }
        .header { text-align: center; margin-bottom: 2rem; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; }
        .metric { background: rgba(168, 85, 247, 0.1); padding: 1rem; border-radius: 8px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📈 Reporte de Trading</h1>
            <p>${currentDate}</p>
        </div>
        <div class="metrics">
            <div class="metric">
                <h3>Total Trades</h3>
                <p>${metrics.totalTrades}</p>
            </div>
            <div class="metric">
                <h3>Tasa de Éxito</h3>
                <p>${metrics.winRate}%</p>
            </div>
            <div class="metric">
                <h3>Profit Total</h3>
                <p>$${metrics.totalProfit}</p>
            </div>
        </div>
        <div style="margin-top: 2rem; background: rgba(168, 85, 247, 0.1); padding: 2rem; border-radius: 8px;">
            <h2>Resumen</h2>
            <p>Este es un reporte básico de tu rendimiento de trading. Para análisis más detallados, asegúrate de que la integración con OpenAI esté configurada correctamente.</p>
        </div>
    </div>
</body>
</html>
`;
}