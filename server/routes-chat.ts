import { Express, Request, Response } from "express";
import { storage } from "./storage";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export function registerChatRoutes(app: Express) {
  // Trading Assistant Chat Endpoint
  app.post("/api/chat/trading-assistant", async (req: Request, res: Response) => {
    try {
      const { message, context } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message is required" });
      }

      // Get user data for enhanced context
      const trades = await storage.getTrades();
      const userStats = await storage.getUserStats();
      const recentTrades = trades.slice(-10); // Last 10 trades
      
      // Enhanced context with actual trading data
      const enhancedContext = {
        totalTrades: trades.length,
        recentTrades,
        metrics: {
          winRate: trades.length > 0 ? (trades.filter(t => t.profit > 0).length / trades.length) * 100 : 0,
          totalProfit: trades.reduce((sum, t) => sum + t.profit, 0),
          avgProfit: trades.length > 0 ? trades.reduce((sum, t) => sum + t.profit, 0) / trades.length : 0,
          profitableTrades: trades.filter(t => t.profit > 0).length,
          lossTrades: trades.filter(t => t.profit < 0).length
        },
        symbols: [...new Set(trades.map(t => t.symbol))],
        userLevel: userStats?.currentLevel || 1,
        userPoints: userStats?.currentPoints || 0
      };

      // If no OpenAI key, provide fallback responses
      if (!process.env.OPENAI_API_KEY) {
        const fallbackResponse = generateFallbackResponse(message, enhancedContext);
        return res.json(fallbackResponse);
      }

      // Generate comprehensive context-aware prompt
      const systemPrompt = `Eres un asistente experto en trading financiero que analiza datos reales de CSV para proporcionar consejos personalizados. Tu especialidad es identificar patrones específicos de pérdidas, problemas de disciplina emocional y errores temporales.

DATOS REALES DEL USUARIO:
- Total de operaciones: ${enhancedContext.totalTrades}
- Tasa de éxito: ${enhancedContext.metrics.winRate.toFixed(1)}%
- Beneficio total: $${enhancedContext.metrics.totalProfit.toFixed(2)}
- Operaciones rentables: ${enhancedContext.metrics.profitableTrades}
- Operaciones con pérdidas: ${enhancedContext.metrics.lossTrades}
- Pares operados: ${enhancedContext.symbols.join(', ') || 'Ninguno'}
- Nivel actual: ${enhancedContext.userLevel}

ANÁLISIS ESPECÍFICO QUE DEBES REALIZAR:
1. Patrones de pérdida temporal (¿opera peor en ciertos horarios?)
2. Trading vengativo (¿hace muchas operaciones después de pérdidas?)
3. Gestión del riesgo (¿respeta stop-loss y take-profit?)
4. Disciplina emocional (¿sigue su plan o improvisa?)
5. Consistencia de estrategia

INSTRUCCIONES CRÍTICAS:
- Responde SOLO en español
- Analiza DATOS REALES, no teoría general
- Identifica errores específicos basados en números
- Da consejos accionables y concretos
- Máximo 120 palabras por respuesta
- NO uses formato markdown (**bold**, ##headers, etc.)
- Sé directo y profesional
- Menciona números específicos cuando sea relevante`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Pregunta del usuario: ${message}\n\nOperaciones recientes para análisis: ${JSON.stringify(recentTrades.slice(-5), null, 2)}` }
        ],
        max_tokens: 400,
        temperature: 0.3
      });

      const response = completion.choices[0]?.message?.content || "Lo siento, no pude procesar tu consulta.";
      
      // Aggressive markdown removal and text cleaning
      const cleanResponse = response
        .replace(/\*\*(.*?)\*\*/g, '$1')           // Remove **bold**
        .replace(/\*(.*?)\*/g, '$1')               // Remove *italic*
        .replace(/#{1,6}\s*/g, '')                 // Remove ### headers
        .replace(/`{1,3}(.*?)`{1,3}/g, '$1')       // Remove `code`
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')        // Remove [links](url)
        .replace(/>\s*/g, '')                      // Remove > quotes
        .replace(/^\s*[-*+]\s*/gm, '')             // Remove bullet points
        .replace(/^\s*\d+\.\s*/gm, '')             // Remove numbered lists
        .replace(/_{2,}/g, '')                     // Remove underlines
        .replace(/\n{3,}/g, '\n\n')                // Limit line breaks
        .trim();

      const suggestions = generateSuggestions(message, enhancedContext);

      res.json({
        response: cleanResponse,
        suggestions
      });

    } catch (error) {
      console.error('Chat error:', error);
      
      // Fallback response on error
      const fallbackResponse = generateFallbackResponse(req.body.message, req.body.context);
      res.json(fallbackResponse);
    }
  });
}

function generateFallbackResponse(message: string, context: any) {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('analiz') || lowerMessage.includes('rendimiento')) {
    return {
      response: `Analizando tus ${context?.totalTrades || 0} operaciones: Win rate ${context?.metrics?.winRate?.toFixed(1) || 0}%. ${
        context?.metrics?.totalProfit > 0 
          ? `Ganancia total de $${context?.metrics?.totalProfit?.toFixed(2)}. Tu estrategia muestra resultados positivos.` 
          : `Pérdida de $${Math.abs(context?.metrics?.totalProfit || 0).toFixed(2)}. Requiere ajustes en gestión de riesgo.`
      } Necesito más datos específicos para identificar patrones de pérdida.`,
      suggestions: ['Identifica mis errores específicos', 'Analiza mi disciplina emocional', 'Patrones de trading vengativo']
    };
  }
  
  if (lowerMessage.includes('riesgo') || lowerMessage.includes('gestión')) {
    return {
      response: `🛡️ Para mejorar tu gestión de riesgo: 1) Nunca arriesgues más del 2% por trade, 2) Usa stop loss siempre, 3) Mantén un ratio riesgo/beneficio de al menos 1:2. ${
        context?.totalTrades > 10 ? 'Con tus datos actuales, podrías optimizar estos aspectos.' : 'Necesitas más trades para análisis específico.'
      }`,
      suggestions: ['Analiza mis stop loss', '¿Cuál es mi ratio riesgo/beneficio?', 'Consejos para position sizing']
    };
  }
  
  if (lowerMessage.includes('par') || lowerMessage.includes('símbolo')) {
    return {
      response: `💱 Para identificar tus mejores pares necesito analizar tu historial. ${
        context?.totalTrades > 0 
          ? 'Basándome en tus trades, puedo darte recomendaciones específicas sobre qué pares funcionan mejor para ti.' 
          : 'Primero importa tu historial de trades para análisis personalizado.'
      }`,
      suggestions: ['Muéstrame mi rendimiento por pares', 'Dame consejos de diversificación', '¿Qué pares debo evitar?']
    };
  }
  
  if (lowerMessage.includes('horario') || lowerMessage.includes('tiempo')) {
    return {
      response: `⏰ El timing es crucial en trading. Las mejores horas suelen ser durante las sesiones de Londres (8-17h GMT) y Nueva York (13-22h GMT). ${
        context?.recentTrades?.length > 5 
          ? 'Puedo analizar tus horarios específicos para encontrar tus momentos más rentables.' 
          : 'Con más datos podré darte recomendaciones personalizadas.'
      }`,
      suggestions: ['Analiza mis mejores horarios', '¿Cuándo soy más rentable?', 'Consejos para trading nocturno']
    };
  }
  
  // Default response
  return {
    response: `🤖 ¡Hola! Soy tu asistente de trading. Puedo ayudarte a analizar tu rendimiento, identificar patrones y darte consejos personalizados. ${
      context?.totalTrades > 0 
        ? `Veo que tienes ${context.totalTrades} trades registrados. ¿En qué aspecto específico te gustaría que te ayude?` 
        : 'Para empezar, importa tu historial de trades y podremos hacer análisis detallados.'
    }`,
    suggestions: [
      'Analiza mi rendimiento general',
      'Dame consejos de gestión de riesgo', 
      '¿Cuáles son mis mejores pares?',
      'Identifica patrones en mis trades'
    ]
  };
}

function generateSuggestions(message: string, context: any): string[] {
  const baseSuggestions = [
    'Analiza mi último mes de trading',
    '¿Qué puedo mejorar en mi estrategia?',
    'Dame 3 consejos específicos',
    'Compara mi rendimiento actual vs anterior'
  ];
  
  if (context?.totalTrades > 20) {
    return [
      'Identifica mis patrones de pérdida',
      'Encuentra mis setups más rentables',
      '¿En qué horarios soy más consistente?',
      'Analiza mi gestión emocional'
    ];
  }
  
  if (context?.metrics?.winRate < 50) {
    return [
      'Help me improve my win rate',
      '¿Por qué pierdo más de lo que gano?',
      'Estrategias para reducir pérdidas',
      'Análisis de mis trades perdedores'
    ];
  }
  
  return baseSuggestions;
}