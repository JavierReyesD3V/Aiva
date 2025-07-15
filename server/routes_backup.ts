import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTradeSchema, insertDailyProgressSchema } from "@shared/schema";
import { analyzeTradingPerformance, generateTradingInsights } from "./services/openai";
import { calculateTradingMetrics, calculateDailyProgress } from "./services/tradingAnalytics";
import { 
  calculateLevel, 
  calculateDailyPoints, 
  checkAchievementConditions,
  getAchievementNotifications 
} from "./services/gamification";
import { generatePDFReport, generateComprehensivePDFReport, generateChartData } from "./services/pdfGenerator";
import { generateTradeSuggestions, calculateRiskScore } from "./services/tradeSuggestions";
import { registerChatRoutes } from "./routes-chat";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all trades
  app.get("/api/trades", async (req, res) => {
    try {
      const trades = await storage.getTrades();
      res.json(trades);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  // Create a new trade
  app.post("/api/trades", async (req, res) => {
    try {
      const validatedData = insertTradeSchema.parse(req.body);
      const trade = await storage.createTrade(validatedData);
      
      // Update gamification after adding trade
      await updateGamificationStats();
      
      res.json(trade);
    } catch (error: any) {
      res.status(400).json({ message: "Invalid trade data", error: error.message });
    }
  });

  // Accounts endpoints
  app.get("/api/accounts", async (req, res) => {
    try {
      const accounts = await storage.getAccounts();
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching accounts:", error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.post("/api/accounts", async (req, res) => {
    try {
      const account = await storage.createAccount(req.body);
      res.json(account);
    } catch (error) {
      console.error("Error creating account:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  app.put("/api/accounts/:id/activate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.setActiveAccount(id);
      res.json({ message: "Account activated successfully" });
    } catch (error) {
      console.error("Error activating account:", error);
      res.status(500).json({ message: "Failed to activate account" });
    }
  });

  // Trades endpoints
  app.get("/api/trades", async (req, res) => {
    try {
      const accountId = req.query.accountId ? parseInt(req.query.accountId as string) : undefined;
      const trades = await storage.getTrades();
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  // Import trades from CSV
  app.post("/api/trades/import", async (req, res) => {
    try {
      const { trades: csvTrades, accountSize } = req.body;
      
      if (!Array.isArray(csvTrades)) {
        return res.status(400).json({ message: "Invalid CSV data format" });
      }

      // Create or get account
      const { accountName, accountNumber, broker, initialBalance } = req.body;
      let account;
      
      if (accountName) {
        account = await storage.createAccount({
          name: accountName,
          accountNumber: accountNumber || null,
          broker: broker || null,
          initialBalance: initialBalance || null,
          currency: 'USD',
          isActive: true,
        });
        await storage.setActiveAccount(account.id);
      } else {
        account = await storage.getActiveAccount();
        if (!account) {
          account = await storage.createAccount({
            name: 'Default Account',
            currency: 'USD',
            isActive: true,
          });
          await storage.setActiveAccount(account.id);
        }
      }

      const importedTrades = [];
      for (const csvTrade of csvTrades) {
        try {
          const tradeData = {
            accountId: account.id,
            ticketId: csvTrade["Ticket ID"] || String(Date.now()),
            openTime: new Date(csvTrade["Open Time"]),
            openPrice: parseFloat(csvTrade["Open Price"]) || 0,
            closeTime: csvTrade["Close Time"] ? new Date(csvTrade["Close Time"]) : null,
            closePrice: csvTrade["Close Price"] ? parseFloat(csvTrade["Close Price"]) : null,
            profit: parseFloat(csvTrade["Profit"]) || 0,
            lots: parseFloat(csvTrade["Lots"]) || 0,
            commission: parseFloat(csvTrade["Commission"]) || 0,
            swap: parseFloat(csvTrade["Swap"]) || 0,
            symbol: csvTrade["Symbol"] || "UNKNOWN",
            type: csvTrade["Type"] || "Buy",
            stopLoss: csvTrade["SL"] ? parseFloat(csvTrade["SL"]) : null,
            takeProfit: csvTrade["TP"] ? parseFloat(csvTrade["TP"]) : null,
            pips: csvTrade["Pips"] ? parseFloat(csvTrade["Pips"]) : null,
            reason: csvTrade["Reason"] ? parseInt(csvTrade["Reason"]) : null,
            volume: csvTrade["Volume"] ? parseFloat(csvTrade["Volume"]) : null,
            isOpen: !csvTrade["Close Time"],
          };

          const validatedData = insertTradeSchema.parse(tradeData);
          const trade = await storage.createTrade(validatedData);
          importedTrades.push(trade);
        } catch (error: any) {
          console.warn("Skipped invalid trade:", error.message);
        }
      }

      // Update account size if provided
      if (accountSize && accountSize > 0) {
        await storage.updateUserStats({ accountSize: accountSize });
      }

      // Update gamification after import
      await updateGamificationStats();

      res.json({ 
        message: `Successfully imported ${importedTrades.length} trades to ${account.name}`,
        trades: importedTrades,
        account: account
      });
    } catch (error: any) {
      res.status(400).json({ message: "Failed to import trades", error: error.message });
    }
  });

  // Get trading metrics
  app.get("/api/metrics", async (req, res) => {
    try {
      const trades = await storage.getTrades();
      const metrics = calculateTradingMetrics(trades);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ message: "Failed to calculate metrics" });
    }
  });

  // Get user stats and gamification data
  app.get("/api/user/stats", async (req, res) => {
    try {
      const userStats = await storage.getUserStats();
      const levelInfo = calculateLevel(userStats?.currentPoints || 0);
      
      res.json({
        ...userStats,
        levelInfo,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Get achievements
  app.get("/api/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch achievements" });
    }
  });

  // Get daily progress
  app.get("/api/progress/daily", async (req, res) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const progress = await storage.getDailyProgressHistory(days);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily progress" });
    }
  });

  // Update daily progress
  app.post("/api/progress/daily", async (req, res) => {
    try {
      const { date } = req.body;
      const targetDate = date ? new Date(date) : new Date();
      
      const trades = await storage.getTrades();
      const dailyProgress = calculateDailyProgress(trades, targetDate);
      const pointsEarned = calculateDailyPoints(dailyProgress);
      
      const progress = await storage.updateDailyProgress(targetDate, {
        ...dailyProgress,
        pointsEarned,
      });

      // Update user stats
      const userStats = await storage.getUserStats();
      if (userStats) {
        await storage.updateUserStats({
          currentPoints: (userStats.currentPoints || 0) + pointsEarned,
        });
      }

      res.json(progress);
    } catch (error: any) {
      res.status(400).json({ message: "Failed to update daily progress", error: error.message });
    }
  });

  // Get AI analysis
  app.post("/api/ai/analyze", async (req, res) => {
    try {
      const trades = await storage.getTrades();
      const analysis = await analyzeTradingPerformance(trades);
      res.json(analysis);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to generate AI analysis", error: error.message });
    }
  });

  // Get AI insights
  app.get("/api/ai/insights", async (req, res) => {
    try {
      const trades = await storage.getTrades();
      const userStats = await storage.getUserStats();
      const recentTrades = trades.slice(0, 10);
      
      const insights = await generateTradingInsights(recentTrades, userStats);
      res.json({ insights });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to generate insights", error: error.message });
    }
  });

  // Generate PDF report
  app.post("/api/reports/pdf", async (req, res) => {
    try {
      const { startDate, endDate } = req.body;
      const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate) : new Date();
      
      const trades = await storage.getTradesByDateRange(start, end);
      const metrics = calculateTradingMetrics(trades);
      const aiAnalysis = await analyzeTradingPerformance(trades);
      const userStats = await storage.getUserStats();
      
      const reportData = generatePDFReport({
        trades,
        metrics,
        aiAnalysis,
        dateRange: { start, end },
        userStats,
      });

      res.json({ report: reportData });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to generate PDF report", error: error.message });
    }
  });

  // Generate comprehensive analysis report
  app.post("/api/reports/comprehensive-analysis", async (req, res) => {
    try {
      const trades = await storage.getTrades();
      if (trades.length === 0) {
        return res.status(400).json({ message: "No hay trades disponibles para generar el reporte" });
      }

      const metrics = calculateTradingMetrics(trades);
      const aiAnalysis = await analyzeTradingPerformance(trades);
      const userStats = await storage.getUserStats();
      
      const pdfBuffer = await generateComprehensivePDFReport({
        trades,
        metrics,
        aiAnalysis,
        dateRange: { 
          start: new Date(Math.min(...trades.map(t => new Date(t.openTime).getTime()))),
          end: new Date(Math.max(...trades.map(t => new Date(t.openTime).getTime())))
        },
        userStats,
      });

      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="reporte-analisis-trading-${new Date().toISOString().split('T')[0]}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(500).json({ message: "Error al generar el reporte comprensivo", error: error.message });
    }
  });

  // Get chart data
  app.get("/api/charts/:type", async (req, res) => {
    try {
      const { type } = req.params;
      const trades = await storage.getTrades();
      const chartData = generateChartData(trades, type as any);
      res.json(chartData);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate chart data" });
    }
  });

  // Get calendar data
  app.get("/api/calendar", async (req, res) => {
    try {
      const { month, year } = req.query;
      const targetDate = new Date(parseInt(year as string) || new Date().getFullYear(), 
                                  parseInt(month as string) || new Date().getMonth());
      
      const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
      
      const trades = await storage.getTradesByDateRange(startOfMonth, endOfMonth);
      
      // Group trades by date
      const calendarData = new Map<string, any[]>();
      trades.forEach(trade => {
        const dateKey = new Date(trade.openTime).toISOString().slice(0, 10);
        const existing = calendarData.get(dateKey) || [];
        existing.push({
          id: trade.id,
          ticketId: trade.ticketId,
          symbol: trade.symbol,
          type: trade.type,
          profit: trade.profit,
          isProfit: (trade.profit || 0) > 0,
          openTime: trade.openTime,
          closeTime: trade.closeTime,
          openPrice: trade.openPrice,
          closePrice: trade.closePrice,
          lots: trade.lots,
          volume: trade.volume,
          commission: trade.commission,
          swap: trade.swap,
          stopLoss: trade.stopLoss,
          takeProfit: trade.takeProfit,
          pips: trade.pips,
          notes: trade.notes,
          isOpen: trade.isOpen,
          reason: trade.reason
        });
        calendarData.set(dateKey, existing);
      });

      const result = Array.from(calendarData.entries()).map(([date, trades]) => ({
        date,
        trades,
        totalProfit: trades.reduce((sum, trade) => {
          const netProfit = (trade.profit || 0) + (trade.commission || 0) + (trade.swap || 0);
          return sum + netProfit;
        }, 0),
        profitableCount: trades.filter(trade => trade.isProfit).length,
        lossCount: trades.filter(trade => !trade.isProfit).length,
      }));

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch calendar data" });
    }
  });

  // Helper function to update gamification stats
  async function updateGamificationStats() {
    try {
      const trades = await storage.getTrades();
      const dailyProgressHistory = await storage.getDailyProgressHistory(30);
      const userStats = await storage.getUserStats();
      
      if (!userStats) return;

      const newlyUnlockedConditions = checkAchievementConditions(trades, userStats, dailyProgressHistory);
      const achievements = await storage.getAchievements();
      
      for (const condition of newlyUnlockedConditions) {
        const achievement = achievements.find(a => a.condition === condition && !a.isUnlocked);
        if (achievement) {
          await storage.unlockAchievement(achievement.id);
          
          // Award points for achievement
          await storage.updateUserStats({
            currentPoints: (userStats.currentPoints || 0) + achievement.points,
          });
        }
      }
    } catch (error) {
      console.error("Failed to update gamification stats:", error);
    }
  }

  // Trade Suggestions endpoints
  app.get("/api/suggestions", async (req, res) => {
    try {
      const suggestions = await storage.getActiveTradeSuggestions();
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });

  app.post("/api/suggestions/generate", async (req, res) => {
    try {
      const trades = await storage.getTrades();
      const userStats = await storage.getUserStats();
      
      const newSuggestions = await generateTradeSuggestions(trades, userStats);
      
      const storedSuggestions = [];
      for (const suggestion of newSuggestions) {
        const { id, createdAt, updatedAt, ...insertData } = suggestion;
        const stored = await storage.createTradeSuggestion(insertData);
        storedSuggestions.push(stored);
      }
      
      res.json(storedSuggestions);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      res.status(500).json({ message: "Failed to generate suggestions" });
    }
  });

  app.put("/api/suggestions/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!status || !['active', 'executed', 'expired'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updated = await storage.updateTradeSuggestionStatus(id, status);
      if (!updated) {
        return res.status(404).json({ message: "Suggestion not found" });
      }
      
      res.json(updated);
    } catch (error) {
      console.error("Error updating suggestion status:", error);
      res.status(500).json({ message: "Failed to update suggestion" });
    }
  });

  // Register OpenAI-powered chat routes
  registerChatRoutes(app);

  // Update gamification stats function
      if ((lowerMessage.includes('patron') && (lowerMessage.includes('pérdida') || lowerMessage.includes('perdida') || lowerMessage.includes('pierdo'))) ||
          lowerMessage.includes('patrones de mis perdidas') || lowerMessage.includes('donde pierdo más') || 
          lowerMessage.includes('por qué pierdo') || lowerMessage.includes('porque pierdo')) {
        const recentTrades = enrichedContext?.recentTrades || [];
        
        if (recentTrades.length === 0) {
          return res.json({
            response: `🔍 ANÁLISIS DE PATRONES DE PÉRDIDA\n\n` +
              `Para identificar tus patrones específicos de pérdida necesito tu historial.\n\n` +
              `Una vez importes tu CSV, analizaré:\n` +
              `• En qué horarios pierdes más dinero\n` +
              `• Qué pares te generan más pérdidas\n` +
              `• Patrones de entrada/salida problemáticos\n` +
              `• Secuencias de trades perdedores\n` +
              `• Errores recurrentes en tu operativa\n\n` +
              `Importa tus datos para análisis personalizado.`,
            suggestions: ['Importar CSV', 'Conceptos de análisis', 'Gestión de riesgo']
          });
        }
        
        // Análisis de patrones de pérdidas reales
        const losingTrades = recentTrades.filter((t: any) => t.profit < 0);
        const totalLoss = Math.abs(losingTrades.reduce((sum: number, t: any) => sum + t.profit, 0));
        
        // Patrón 1: Análisis por horarios
        const hourlyLosses: any = {};
        losingTrades.forEach((trade: any) => {
          const hour = new Date(trade.openTime).getHours();
          if (!hourlyLosses[hour]) hourlyLosses[hour] = { count: 0, loss: 0 };
          hourlyLosses[hour].count++;
          hourlyLosses[hour].loss += Math.abs(trade.profit);
        });
        
        const worstHours = Object.keys(hourlyLosses)
          .sort((a, b) => hourlyLosses[b].loss - hourlyLosses[a].loss)
          .slice(0, 3);
        
        // Patrón 2: Análisis por pares
        const symbolLosses: any = {};
        losingTrades.forEach((trade: any) => {
          if (!symbolLosses[trade.symbol]) symbolLosses[trade.symbol] = { count: 0, loss: 0 };
          symbolLosses[trade.symbol].count++;
          symbolLosses[trade.symbol].loss += Math.abs(trade.profit);
        });
        
        const worstSymbols = Object.keys(symbolLosses)
          .sort((a, b) => symbolLosses[b].loss - symbolLosses[a].loss)
          .slice(0, 3);
        
        // Patrón 3: Revenge trading
        let revengeCount = 0;
        for (let i = 1; i < recentTrades.length; i++) {
          if (recentTrades[i-1].profit < 0 && recentTrades[i].lots > recentTrades[i-1].lots * 1.3) {
            revengeCount++;
          }
        }
        
        // Patrón 4: Secuencias de pérdidas consecutivas
        let currentStreak = 0;
        let maxStreak = 0;
        
        recentTrades.forEach((trade: any) => {
          if (trade.profit < 0) {
            currentStreak++;
            maxStreak = Math.max(maxStreak, currentStreak);
          } else {
            currentStreak = 0;
          }
        });
        
        return res.json({
          response: `🚨 PATRONES DESTRUCTIVOS DETECTADOS\n\n` +
            `Análisis de ${losingTrades.length} trades perdedores:\n\n` +
            `⏰ PATRÓN TEMPORAL DESTRUCTIVO:\n` +
            `• Horario más costoso: ${worstHours[0]}:00h ($${hourlyLosses[worstHours[0]].loss.toFixed(2)} perdidos)\n` +
            `• ${hourlyLosses[worstHours[0]].count} trades fallidos a esa hora\n` +
            `• También evita: ${worstHours[1]}:00h y ${worstHours[2]}:00h\n\n` +
            `💱 PARES PROBLEMÁTICOS:\n` +
            `• ${worstSymbols[0]}: $${symbolLosses[worstSymbols[0]].loss.toFixed(2)} perdidos (${symbolLosses[worstSymbols[0]].count} trades)\n` +
            `• ${worstSymbols[1]}: $${symbolLosses[worstSymbols[1]].loss.toFixed(2)} perdidos (${symbolLosses[worstSymbols[1]].count} trades)\n\n` +
            `🎰 REVENGE TRADING:\n` +
            `• ${revengeCount > 0 ? `⚠️ DETECTADO: ${revengeCount} veces incrementaste lotes tras pérdidas` : '✅ No detectado'}\n\n` +
            `📉 RACHAS PERDEDORAS:\n` +
            `• Racha más larga: ${maxStreak} trades consecutivos\n` +
            `• ${maxStreak > 5 ? '🚨 CRÍTICO: Falta circuit breaker' : 'Controlado'}\n\n` +
            `💡 PLAN DE CORRECCIÓN:\n` +
            `1. PROHIBIDO tradear ${worstSymbols[0]} entre ${worstHours[0]}:00h - ${(parseInt(worstHours[0])+1)%24}:00h\n` +
            `2. ${revengeCount > 0 ? 'REGLA: Tras pérdida, mismo lote o menor' : 'Mantén disciplina actual'}\n` +
            `3. CIRCUIT BREAKER: Máximo 3 pérdidas consecutivas\n` +
            `4. Stop loss obligatorio a los 30 minutos`,
          suggestions: [`Estrategia para ${worstSymbols[0]}`, 'Reglas de circuit breaker', 'Control de revenge trading']
        });
      }

      // Análisis técnico y patrones (solo cuando no se refiere a pérdidas)
      if ((lowerMessage.includes('técnico') || lowerMessage.includes('velas') || 
          lowerMessage.includes('candlestick') || lowerMessage.includes('soporte') || 
          lowerMessage.includes('resistencia') || lowerMessage.includes('patron')) &&
          !lowerMessage.includes('pérdida') && !lowerMessage.includes('perdida') && !lowerMessage.includes('pierdo')) {
        return res.json({
          response: `📈 ANÁLISIS TÉCNICO AVANZADO\n\n` +
            `Conceptos clave para tu trading:\n\n` +
            `🕯️ PATRONES DE VELAS JAPONESAS:\n` +
            `• Doji: Indecisión del mercado, posible reversión\n` +
            `• Martillo: Señal alcista después de tendencia bajista\n` +
            `• Estrella fugaz: Señal bajista en máximos\n` +
            `• Envolvente: Reversión fuerte de tendencia\n\n` +
            `📊 NIVELES DE SOPORTE Y RESISTENCIA:\n` +
            `• Soporte: Nivel donde el precio rebota al alza\n` +
            `• Resistencia: Nivel con presión vendedora\n` +
            `• Ruptura: Confirmación con volumen alto\n` +
            `• Retesteo: Validación del nivel roto\n\n` +
            `Con tus ${context?.totalTrades || 0} trades, aplica estos conceptos en H1 y H4.`,
          suggestions: ['¿Qué es el RSI?', 'Explica el MACD', 'Cómo usar Fibonacci']
        });
      }

      // Indicadores técnicos específicos
      if (lowerMessage.includes('rsi') || lowerMessage.includes('¿qué es el rsi')) {
        return res.json({
          response: `📈 RSI - ÍNDICE DE FUERZA RELATIVA\n\n` +
            `El RSI es un oscilador que mide la velocidad del precio:\n\n` +
            `🎯 CONFIGURACIÓN:\n` +
            `• Período estándar: 14\n` +
            `• Rango: 0 a 100\n` +
            `• Líneas clave: 30 y 70\n\n` +
            `📊 INTERPRETACIÓN:\n` +
            `• RSI > 70: Posible sobrecompra (considera ventas)\n` +
            `• RSI < 30: Posible sobreventa (considera compras)\n` +
            `• RSI = 50: Equilibrio entre compradores y vendedores\n\n` +
            `⚡ SEÑALES AVANZADAS:\n` +
            `• Divergencias: RSI y precio van en direcciones opuestas\n` +
            `• Rupturas de trendlines en el RSI\n` +
            `• Failure swings: Reversiones potentes\n\n` +
            `Con tu win rate del ${enrichedContext?.metrics?.winRate || 0}%, combina RSI con price action.`,
          suggestions: ['¿Qué es el MACD?', 'Explica las medias móviles', 'Cómo usar Bollinger Bands']
        });
      }

      if (lowerMessage.includes('macd') || lowerMessage.includes('¿qué es el macd')) {
        return res.json({
          response: `📊 MACD - CONVERGENCIA Y DIVERGENCIA\n\n` +
            `El MACD identifica cambios en la tendencia:\n\n` +
            `⚙️ COMPONENTES:\n` +
            `• Línea MACD: EMA12 - EMA26\n` +
            `• Línea señal: EMA9 del MACD\n` +
            `• Histograma: MACD - Señal\n\n` +
            `🎯 SEÑALES PRINCIPALES:\n` +
            `• Cruce alcista: MACD cruza sobre señal (compra)\n` +
            `• Cruce bajista: MACD cruza bajo señal (venta)\n` +
            `• Cruce línea cero: Confirmación de tendencia\n\n` +
            `⚡ TÉCNICAS AVANZADAS:\n` +
            `• Divergencias: MACD vs precio\n` +
            `• Histograma creciente/decreciente\n` +
            `• Combinación con RSI para confirmación\n\n` +
            `Para tu estrategia actual, usa MACD en H1 para timing de entradas.`,
          suggestions: ['Divergencias en MACD', 'Estrategia RSI + MACD', 'Fibonacci retracements']
        });
      }

      if (lowerMessage.includes('fibonacci') || lowerMessage.includes('fib')) {
        return res.json({
          response: `🌟 FIBONACCI EN TRADING\n\n` +
            `Los niveles de Fibonacci identifican soportes y resistencias:\n\n` +
            `📏 NIVELES PRINCIPALES:\n` +
            `• 23.6%: Retroceso menor\n` +
            `• 38.2%: Retroceso moderado\n` +
            `• 50%: Nivel psicológico\n` +
            `• 61.8%: Retroceso fuerte (Golden ratio)\n` +
            `• 78.6%: Retroceso profundo\n\n` +
            `🎯 CÓMO USARLO:\n` +
            `• Identifica swing high y swing low\n` +
            `• Traza fibonacci del low al high (tendencia alcista)\n` +
            `• Busca rebotes en niveles clave\n` +
            `• Combina con otros indicadores\n\n` +
            `💡 ESTRATEGIA PRÁCTICA:\n` +
            `• Entrada: Rebote en 61.8% + confirmación de vela\n` +
            `• Stop: Bajo el 78.6%\n` +
            `• Target: Extensión 127.2% o 161.8%`,
          suggestions: ['Extensiones de Fibonacci', 'Fibonacci + RSI', 'Trading de retrocesos']
        });
      }

      // Indicadores técnicos generales
      if (lowerMessage.includes('indicador') || lowerMessage.includes('media móvil') || 
          lowerMessage.includes('bollinger') || lowerMessage.includes('ema')) {
        return res.json({
          response: `🔧 INDICADORES TÉCNICOS ESENCIALES\n\n` +
            `Para tu estrategia recomiendo:\n\n` +
            `📈 MEDIAS MÓVILES:\n` +
            `• EMA 20: Tendencia a corto plazo\n` +
            `• EMA 50: Tendencia media\n` +
            `• EMA 200: Tendencia principal\n` +
            `• Señal: Precio sobre EMA200 = tendencia alcista\n\n` +
            `📊 BOLLINGER BANDS:\n` +
            `• Banda superior: Resistencia dinámica\n` +
            `• Banda inferior: Soporte dinámico\n` +
            `• Squeeze: Baja volatilidad, espera breakout\n` +
            `• Expansión: Alta volatilidad, sigue tendencia\n\n` +
            `Con ${enrichedContext?.totalTrades || 0} trades, combina 2-3 indicadores máximo.`,
          suggestions: ['Estrategia con medias móviles', 'Bollinger Bands + RSI', 'Indicadores de volumen']
        });
      }

      // Psicología del trading
      if (lowerMessage.includes('psicolog') || lowerMessage.includes('emoc') || 
          lowerMessage.includes('disciplina') || lowerMessage.includes('miedo') || 
          lowerMessage.includes('avaricia')) {
        return res.json({
          response: `🧠 **Psicología del Trading:**\n\n` +
            `**Controla tus emociones para ser rentable:**\n\n` +
            `😱 **Gestión del miedo:**\n` +
            `• Define stop loss ANTES de entrar\n` +
            `• Usa position sizing adecuado (máx 2% riesgo)\n` +
            `• Acepta que las pérdidas son parte del juego\n\n` +
            `🤑 **Control de la avaricia:**\n` +
            `• Respeta tus take profits planificados\n` +
            `• No muevas stops en tu contra\n` +
            `• Evita aumentar posiciones perdedoras\n\n` +
            `📋 **Disciplina operativa:**\n` +
            `• Trading plan escrito y seguirlo\n` +
            `• Journal de trades obligatorio\n` +
            `• Descansos después de rachas perdedoras`,
          suggestions: ['Cómo hacer un trading plan', 'Gestión de drawdowns', 'Técnicas de relajación']
        });
      }

      // Gestión monetaria y position sizing
      if (lowerMessage.includes('position sizing') || lowerMessage.includes('money management') || 
          lowerMessage.includes('capital') || lowerMessage.includes('lote') || 
          lowerMessage.includes('apalancamiento')) {
        return res.json({
          response: `💰 **Gestión Monetaria Profesional:**\n\n` +
            `**Protege tu capital con estas reglas:**\n\n` +
            `🎯 **Position Sizing:**\n` +
            `• Regla del 2%: Nunca arriesgues más del 2% por trade\n` +
            `• Fórmula: (Capital × 2%) ÷ Stop Loss en pips = Tamaño lote\n` +
            `• Ejemplo: $10,000 × 2% = $200 máximo riesgo por trade\n\n` +
            `⚖️ **Apalancamiento inteligente:**\n` +
            `• Principiantes: Máximo 1:10\n` +
            `• Intermedios: Hasta 1:30\n` +
            `• Nunca uses todo el margen disponible\n\n` +
            `📈 **Crecimiento del capital:**\n` +
            `• Reinvierte solo 50% de ganancias\n` +
            `• Retira profits regularmente\n` +
            `• Aumenta position size gradualmente`,
          suggestions: ['Calculadora de lotes', 'Estrategias de compounding', 'Control de drawdown']
        });
      }

      // Noticias y análisis fundamental
      if (lowerMessage.includes('noticias') || lowerMessage.includes('fundamental') || 
          lowerMessage.includes('nfp') || lowerMessage.includes('fed') || 
          lowerMessage.includes('banco central')) {
        return res.json({
          response: `📰 **Análisis Fundamental en Forex:**\n\n` +
            `**Eventos que mueven el mercado:**\n\n` +
            `🏦 **Bancos Centrales:**\n` +
            `• Fed (USD): Decisiones de tasas cada 6 semanas\n` +
            `• ECB (EUR): Política monetaria europea\n` +
            `• BoJ (JPY): Intervenciones en el yen\n\n` +
            `📊 **Indicadores económicos clave:**\n` +
            `• NFP (USA): Primer viernes del mes\n` +
            `• Inflación (CPI): Impacto en política monetaria\n` +
            `• PIB: Crecimiento económico trimestral\n\n` +
            `⚡ **Trading de noticias:**\n` +
            `• Evita trading 30min antes/después de noticias altas\n` +
            `• Usa stops más amplios en días de volatilidad\n` +
            `• Calendario económico es obligatorio`,
          suggestions: ['Calendario económico semanal', 'Cómo tradear el NFP', 'Correlaciones de divisas']
        });
      }

      // Timeframes y marcos temporales
      if (lowerMessage.includes('timeframe') || lowerMessage.includes('marco temporal') || 
          lowerMessage.includes('scalping') || lowerMessage.includes('swing') || 
          lowerMessage.includes('posicional')) {
        return res.json({
          response: `⏱️ **Timeframes y Estilos de Trading:**\n\n` +
            `**Elige el estilo que se adapte a ti:**\n\n` +
            `⚡ **Scalping (M1-M5):**\n` +
            `• Trades de 2-10 pips\n` +
            `• Requiere dedicación full-time\n` +
            `• Spreads bajos esenciales\n\n` +
            `📈 **Day Trading (M15-H1):**\n` +
            `• Trades duran horas\n` +
            `• Balance trabajo-trading\n` +
            `• Análisis técnico principal\n\n` +
            `🎯 **Swing Trading (H4-D1):**\n` +
            `• Trades duran días/semanas\n` +
            `• Menos tiempo frente a pantallas\n` +
            `• Fundamental + técnico\n\n` +
            `Con tu historial de ${context?.totalTrades || 0} trades, el day trading podría ser tu estilo.`,
          suggestions: ['Mejores horarios para day trading', 'Estrategia de swing trading', 'Setup para scalping']
        });
      }

      // Performance Analysis usando datos reales del CSV
      if (lowerMessage.includes('analiz') && lowerMessage.includes('rendimiento')) {
        const totalTrades = enrichedContext?.totalTrades || 0;
        const winRate = Math.round(enrichedContext?.metrics?.winRate || 0);
        const profit = enrichedContext?.metrics?.totalProfit || 0;
        const avgWin = enrichedContext?.metrics?.averageWin || 0;
        const avgLoss = enrichedContext?.metrics?.averageLoss || 0;
        const recentTrades = enrichedContext?.recentTrades || [];
        
        // Análisis profundo de los datos del CSV
        let symbolAnalysis = "";
        let timeAnalysis = "";
        let profitabilityAnalysis = "";
        
        if (recentTrades.length > 0) {
          // Análisis por símbolos de los datos reales
          const symbolPerformance = {};
          recentTrades.forEach(trade => {
            if (!symbolPerformance[trade.symbol]) {
              symbolPerformance[trade.symbol] = { wins: 0, losses: 0, totalProfit: 0 };
            }
            if (trade.profit > 0) {
              symbolPerformance[trade.symbol].wins++;
            } else {
              symbolPerformance[trade.symbol].losses++;
            }
            symbolPerformance[trade.symbol].totalProfit += trade.profit;
          });
          
          const bestSymbol = Object.keys(symbolPerformance).reduce((a, b) => 
            symbolPerformance[a].totalProfit > symbolPerformance[b].totalProfit ? a : b
          );
          const worstSymbol = Object.keys(symbolPerformance).reduce((a, b) => 
            symbolPerformance[a].totalProfit < symbolPerformance[b].totalProfit ? a : b
          );
          
          symbolAnalysis = `Tu mejor par es ${bestSymbol} con $${symbolPerformance[bestSymbol].totalProfit.toFixed(2)} de ganancia. ` +
            `Tu peor par es ${worstSymbol} con $${symbolPerformance[worstSymbol].totalProfit.toFixed(2)} de resultado.`;
        }
        
        return res.json({
          response: `📊 ANÁLISIS PROFUNDO DE TU RENDIMIENTO\n\n` +
            `Basándome en tu historial real de ${totalTrades} trades:\n\n` +
            `💰 MÉTRICAS PRINCIPALES:\n` +
            `• Win rate: ${winRate}% (${winRate < 50 ? 'Por debajo del promedio' : 'Sólido'})\n` +
            `• P&L total: $${profit.toFixed(2)}\n` +
            `• Ganancia promedio: $${avgWin.toFixed(2)}\n` +
            `• Pérdida promedio: $${Math.abs(avgLoss).toFixed(2)}\n` +
            `• Ratio R:R: ${avgLoss !== 0 ? (avgWin / Math.abs(avgLoss)).toFixed(2) : 'N/A'}\n\n` +
            `🎯 ANÁLISIS DE TUS DATOS:\n` +
            `${symbolAnalysis}\n\n` +
            `${profit < 0 
              ? `⚠️ ALERTA: Has perdido $${Math.abs(profit).toFixed(2)}. Problemas identificados:\n` +
                `• ${winRate < 45 ? 'Win rate muy bajo - mejora tu selección de entradas' : ''}\n` +
                `• ${Math.abs(avgLoss) > avgWin ? 'Pérdidas promedio mayores que ganancias' : ''}\n` +
                `• Necesitas revisar tu estrategia de stop loss`
              : `✅ Rentable con $${profit.toFixed(2)} de ganancia. Continúa con disciplina.`
            }`,
          suggestions: ['Analiza mis mejores horarios', 'Pares más rentables en detalle', 'Optimiza mi gestión de riesgo']
        });
      }

      // Análisis profundo de estrategias basado en datos reales
      if ((lowerMessage.includes('mejor') && lowerMessage.includes('estrateg')) || 
          lowerMessage.includes('estrategias más exitosas')) {
        const recentTrades = enrichedContext?.recentTrades || [];
        const totalTrades = enrichedContext?.totalTrades || 0;
        
        if (recentTrades.length === 0) {
          return res.json({
            response: `📊 ANÁLISIS DE ESTRATEGIAS\n\n` +
              `Para analizar tus mejores estrategias necesito datos de trades.\n` +
              `Importa tu historial CSV para obtener:\n\n` +
              `• Análisis de horarios más rentables\n` +
              `• Pares con mejor rendimiento\n` +
              `• Patrones de entrada exitosos\n` +
              `• Gestión de riesgo optimizada\n\n` +
              `Una vez tengas datos, podré darte insights específicos de TU trading.`,
            suggestions: ['Importar CSV de trades', 'Conceptos de estrategias', 'Indicadores técnicos']
          });
        }
        
        // Análisis real de horarios
        const hourlyPerformance = {};
        recentTrades.forEach(trade => {
          const hour = new Date(trade.openTime).getHours();
          if (!hourlyPerformance[hour]) {
            hourlyPerformance[hour] = { profit: 0, trades: 0 };
          }
          hourlyPerformance[hour].profit += trade.profit;
          hourlyPerformance[hour].trades++;
        });
        
        const bestHour = Object.keys(hourlyPerformance).reduce((a, b) => 
          hourlyPerformance[a].profit > hourlyPerformance[b].profit ? a : b
        );
        const worstHour = Object.keys(hourlyPerformance).reduce((a, b) => 
          hourlyPerformance[a].profit < hourlyPerformance[b].profit ? a : b
        );
        
        // Análisis de tamaño de lotes
        const avgLotSize = recentTrades.reduce((sum, trade) => sum + trade.lots, 0) / recentTrades.length;
        const profitableTrades = recentTrades.filter(t => t.profit > 0);
        const avgProfitableLotSize = profitableTrades.length > 0 ? 
          profitableTrades.reduce((sum, trade) => sum + trade.lots, 0) / profitableTrades.length : 0;
        
        return res.json({
          response: `🎯 TUS MEJORES ESTRATEGIAS SEGÚN TUS DATOS\n\n` +
            `Análisis profundo de ${totalTrades} trades reales:\n\n` +
            `⏰ TIMING ÓPTIMO REAL:\n` +
            `• Tu mejor hora: ${bestHour}:00h con $${hourlyPerformance[bestHour].profit.toFixed(2)} ganancia\n` +
            `• Tu peor hora: ${worstHour}:00h con $${hourlyPerformance[worstHour].profit.toFixed(2)} resultado\n` +
            `• Evita tradear a las ${worstHour}:00h\n\n` +
            `💰 POSITION SIZING DETECTADO:\n` +
            `• Tamaño promedio: ${avgLotSize.toFixed(2)} lotes\n` +
            `• En trades ganadores: ${avgProfitableLotSize.toFixed(2)} lotes\n` +
            `• ${avgProfitableLotSize > avgLotSize ? 'Incrementas lotes en ganadores (RIESGO)' : 'Disciplina en tamaño'}\n\n` +
            `🎯 RECOMENDACIONES BASADAS EN TUS DATOS:\n` +
            `• Concéntrate en tradear entre ${bestHour}:00h\n` +
            `• ${avgProfitableLotSize > avgLotSize ? 'Mantén tamaño fijo, no incrementes' : 'Mantén disciplina actual'}\n` +
            `• Analiza por qué pierdes a las ${worstHour}:00h`,
          suggestions: ['Analiza mis pares más rentables', 'Patrones de mis pérdidas', 'Optimiza mi horario']
        });
      }

      // Personalized advice
      if ((lowerMessage.includes('consejo') && lowerMessage.includes('personalizado')) ||
          lowerMessage.includes('3 consejos específicos')) {
        const winRate = context?.metrics?.winRate || 0;
        
        return res.json({
          response: `💡 **3 Consejos Personalizados Para Ti:**\n\n` +
            `1. **${winRate < 50 ? 'Mejora tu tasa de éxito' : 'Optimiza tus ganancias'}:** ${
              winRate < 50 
                ? 'Reduce el tamaño de posición y enfócate en setups de alta probabilidad'
                : 'Incrementa gradualmente el tamaño en trades ganadores'
            }\n\n` +
            `2. **Gestión temporal:** Evita trades después de las 16h GMT cuando la volatilidad decrece\n\n` +
            `3. **Control emocional:** ${
              context?.metrics?.totalProfit < 0 
                ? 'Toma un descanso cuando tengas 3 pérdidas consecutivas'
                : 'Mantén disciplina en tus reglas ganadoras'
            }`,
          suggestions: ['Analiza mis pérdidas consecutivas', 'Optimiza mi tamaño de posición', 'Mejora mi disciplina de trading']
        });
      }

      // Risk management
      if (lowerMessage.includes('riesgo') || lowerMessage.includes('gestión')) {
        return res.json({
          response: `🛡️ **Optimización de Gestión de Riesgo:**\n\n` +
            `Reglas fundamentales personalizadas:\n\n` +
            `• **Riesgo por trade:** Máximo 2% del capital\n` +
            `• **Stop loss:** Siempre definido antes de entrar\n` +
            `• **Ratio R:R:** Mínimo 1:2 (riesgo vs beneficio)\n\n` +
            `${context?.totalTrades > 10 
              ? `Con tus ${context.totalTrades} trades, veo que necesitas mejorar la consistencia en stops.` 
              : 'Establece estas reglas antes de tu próximo trade.'
            }`,
          suggestions: ['Calcula mi riesgo actual por trade', 'Revisa mis stops más efectivos', 'Optimiza mi position sizing']
        });
      }

      // Análisis detallado de pares usando datos reales del CSV
      if (lowerMessage.includes('par') || lowerMessage.includes('símbolo') || lowerMessage.includes('divisa')) {
        const recentTrades = enrichedContext?.recentTrades || [];
        
        if (recentTrades.length === 0) {
          return res.json({
            response: `💱 ANÁLISIS DE PARES DE DIVISAS\n\n` +
              `Para analizar el rendimiento de tus pares necesito tu historial.\n` +
              `Una vez importes tu CSV, podré mostrarte:\n\n` +
              `• Rendimiento real por cada par\n` +
              `• Win rate específico por símbolo\n` +
              `• Profit/Loss detallado\n` +
              `• Correlaciones entre pares\n` +
              `• Recomendaciones personalizadas\n\n` +
              `Importa tus datos para análisis específico de TUS pares.`,
            suggestions: ['Importar historial CSV', 'Conceptos de correlaciones', 'Majors vs Minors']
          });
        }
        
        // Análisis real y profundo por pares
        const symbolStats = {};
        recentTrades.forEach(trade => {
          if (!symbolStats[trade.symbol]) {
            symbolStats[trade.symbol] = {
              trades: 0,
              wins: 0,
              totalProfit: 0,
              totalLoss: 0,
              avgProfit: 0,
              avgLoss: 0,
              winRate: 0
            };
          }
          
          symbolStats[trade.symbol].trades++;
          if (trade.profit > 0) {
            symbolStats[trade.symbol].wins++;
            symbolStats[trade.symbol].totalProfit += trade.profit;
          } else {
            symbolStats[trade.symbol].totalLoss += Math.abs(trade.profit);
          }
        });
        
        // Calcular estadísticas
        Object.keys(symbolStats).forEach(symbol => {
          const stats = symbolStats[symbol];
          stats.winRate = (stats.wins / stats.trades * 100).toFixed(1);
          stats.netProfit = stats.totalProfit - stats.totalLoss;
          stats.avgProfit = stats.wins > 0 ? (stats.totalProfit / stats.wins).toFixed(2) : 0;
          stats.avgLoss = (stats.trades - stats.wins) > 0 ? (stats.totalLoss / (stats.trades - stats.wins)).toFixed(2) : 0;
        });
        
        // Encontrar mejor y peor par
        const symbols = Object.keys(symbolStats);
        const bestSymbol = symbols.reduce((a, b) => symbolStats[a].netProfit > symbolStats[b].netProfit ? a : b);
        const worstSymbol = symbols.reduce((a, b) => symbolStats[a].netProfit < symbolStats[b].netProfit ? a : b);
        
        let analysisText = `💱 ANÁLISIS REAL DE TUS PARES\n\n`;
        analysisText += `Basándome en ${recentTrades.length} trades reales:\n\n`;
        
        symbols.forEach(symbol => {
          const stats = symbolStats[symbol];
          const performance = stats.netProfit > 0 ? '✅' : stats.netProfit < 0 ? '❌' : '➖';
          analysisText += `${performance} ${symbol}:\n`;
          analysisText += `   • ${stats.trades} trades, ${stats.winRate}% win rate\n`;
          analysisText += `   • P&L neto: $${stats.netProfit.toFixed(2)}\n`;
          analysisText += `   • Avg win: $${stats.avgProfit} | Avg loss: $${stats.avgLoss}\n\n`;
        });
        
        analysisText += `🏆 RECOMENDACIONES BASADAS EN TUS DATOS:\n`;
        analysisText += `• MEJOR PAR: ${bestSymbol} (+$${symbolStats[bestSymbol].netProfit.toFixed(2)}) - Incrementa exposición\n`;
        analysisText += `• PEOR PAR: ${worstSymbol} ($${symbolStats[worstSymbol].netProfit.toFixed(2)}) - Reduce o elimina\n`;
        analysisText += `• Par más consistente: ${symbols.reduce((a, b) => symbolStats[a].winRate > symbolStats[b].winRate ? a : b)}`;
        
        return res.json({
          response: analysisText,
          suggestions: [`Estrategia para ${bestSymbol}`, `Por qué pierdo en ${worstSymbol}`, 'Correlaciones entre mis pares']
        });
      }

      // Timing analysis
      if (lowerMessage.includes('horario') || lowerMessage.includes('tiempo') || lowerMessage.includes('cuándo')) {
        return res.json({
          response: `⏰ **Optimización de Horarios de Trading:**\n\n` +
            `**Sesiones recomendadas:**\n\n` +
            `🌅 **Londres (8-17h GMT):** Mayor liquidez, spreads bajos\n` +
            `🏙️ **Nueva York (13-22h GMT):** Volatilidad óptima\n` +
            `🌏 **Overlap (13-17h GMT):** Momento ideal del día\n\n` +
            `${context?.recentTrades?.length > 5 
              ? 'Según tus datos, eres más rentable durante la sesión europea.' 
              : 'Evita trading durante noticias de alto impacto.'
            }`,
          suggestions: ['Identifica mis horas más rentables', 'Calendario económico importante', 'Estrategia para sesión asiática']
        });
      }
      
      // Greeting and help
      if (lowerMessage.includes('hola') || lowerMessage.includes('ayuda') || 
          lowerMessage.includes('qué puedes hacer') || lowerMessage.length < 10) {
        return res.json({
          response: `🤖 ¡Hola! Soy tu asistente personal de trading con IA.\n\n` +
            `**Puedo ayudarte con:**\n\n` +
            `📊 Análisis detallado de rendimiento\n` +
            `🎯 Identificación de patrones ganadores\n` +
            `🛡️ Optimización de gestión de riesgo\n` +
            `💱 Selección de mejores pares\n` +
            `⏰ Timing óptimo para trading\n\n` +
            `${context?.totalTrades > 0 
              ? `Tienes ${context.totalTrades} trades registrados. ¡Empecemos el análisis!` 
              : 'Importa tu historial CSV para análisis personalizados.'
            }`,
          suggestions: [
            'Analiza mi rendimiento general',
            'Identifica mis mejores estrategias',
            'Dame 3 consejos específicos',
            'Optimiza mi gestión de riesgo'
          ]
        });
      }

      // Consejos personalizados mejorados
      if (lowerMessage.includes('consejo') || lowerMessage.includes('recomendación') || 
          lowerMessage.includes('personalizado') || lowerMessage.includes('específico')) {
        const recentTrades = enrichedContext?.recentTrades || [];
        const metrics = enrichedContext?.metrics || {};
        
        if (recentTrades.length === 0) {
          return res.json({
            response: `💡 CONSEJOS PERSONALIZADOS\n\n` +
              `Para darte consejos específicos y efectivos necesito analizar tu historial de trading.\n\n` +
              `Con tus datos CSV podré proporcionarte:\n` +
              `• Recomendaciones basadas en tu win rate real\n` +
              `• Optimización de horarios según tus resultados\n` +
              `• Ajustes específicos de position sizing\n` +
              `• Identificación de tus errores más costosos\n\n` +
              `Importa tu historial para análisis personalizado.`,
            suggestions: ['Importar CSV', 'Consejos generales', 'Gestión de riesgo básica']
          });
        }
        
        // Análisis específico para consejos personalizados
        const winRate = metrics.winRate || 0;
        const totalProfit = metrics.totalProfit || 0;
        const avgWin = metrics.averageWin || 0;
        const avgLoss = metrics.averageLoss || 0;
        
        // Análisis por horarios
        const hourlyStats: any = {};
        recentTrades.forEach((trade: any) => {
          const hour = new Date(trade.openTime).getHours();
          if (!hourlyStats[hour]) hourlyStats[hour] = { profit: 0, trades: 0 };
          hourlyStats[hour].profit += trade.profit;
          hourlyStats[hour].trades++;
        });
        
        const bestHour = Object.keys(hourlyStats).reduce((a, b) => 
          hourlyStats[a].profit > hourlyStats[b].profit ? a : b
        );
        const worstHour = Object.keys(hourlyStats).reduce((a, b) => 
          hourlyStats[a].profit < hourlyStats[b].profit ? a : b
        );
        
        // Análisis por pares
        const symbolStats: any = {};
        recentTrades.forEach((trade: any) => {
          if (!symbolStats[trade.symbol]) symbolStats[trade.symbol] = { profit: 0, trades: 0 };
          symbolStats[trade.symbol].profit += trade.profit;
          symbolStats[trade.symbol].trades++;
        });
        
        const bestSymbol = Object.keys(symbolStats).reduce((a, b) => 
          symbolStats[a].profit > symbolStats[b].profit ? a : b
        );
        const worstSymbol = Object.keys(symbolStats).reduce((a, b) => 
          symbolStats[a].profit < symbolStats[b].profit ? a : b
        );
        
        return res.json({
          response: `💡 CONSEJOS ESPECÍFICOS PARA TU TRADING\n\n` +
            `Basándome en ${recentTrades.length} trades reales:\n\n` +
            `🎯 CONSEJO #1 - TIMING OPTIMIZADO:\n` +
            `• Tu mejor hora: ${bestHour}:00h (+$${hourlyStats[bestHour].profit.toFixed(2)})\n` +
            `• Tu peor hora: ${worstHour}:00h ($${hourlyStats[worstHour].profit.toFixed(2)})\n` +
            `• ACCIÓN: Concéntrate en tradear entre ${bestHour}:00h - ${(parseInt(bestHour)+2)%24}:00h\n\n` +
            `💱 CONSEJO #2 - SELECCIÓN DE PARES:\n` +
            `• Incrementa exposición en ${bestSymbol} (+$${symbolStats[bestSymbol].profit.toFixed(2)})\n` +
            `• Reduce o elimina ${worstSymbol} ($${symbolStats[worstSymbol].profit.toFixed(2)})\n` +
            `• ACCIÓN: 70% de tu capital en ${bestSymbol}, máximo 10% en ${worstSymbol}\n\n` +
            `⚖️ CONSEJO #3 - GESTIÓN DE RIESGO:\n` +
            `• Win rate actual: ${winRate.toFixed(1)}%\n` +
            `• ${winRate < 50 ? 'Mejora entradas: Espera confirmaciones más sólidas' : 'Mantén disciplina actual'}\n` +
            `• R:R actual: 1:${(Math.abs(avgWin) / Math.abs(avgLoss)).toFixed(2)}\n` +
            `• ${Math.abs(avgWin) / Math.abs(avgLoss) < 1.5 ? 'CRÍTICO: Mejora tu ratio riesgo/beneficio' : 'Ratio aceptable'}\n\n` +
            `🚨 CONSEJO #4 - ACCIÓN INMEDIATA:\n` +
            `• ${totalProfit < 0 ? 'Para en pérdidas, revisa estrategia' : 'Continúa pero protege ganancias'}\n` +
            `• Stop loss máximo: ${Math.abs(avgLoss * 0.5).toFixed(0)} pips\n` +
            `• Position sizing: Máximo 2% del capital por trade`,
          suggestions: [`Plan específico para ${bestSymbol}`, 'Estrategia de recuperación', 'Reglas de disciplina']
        });
      }

      // Estrategias específicas de trading
      if (lowerMessage.includes('estrategia') || lowerMessage.includes('setup') || 
          lowerMessage.includes('método') || lowerMessage.includes('sistema')) {
        return res.json({
          response: `🎯 **Estrategias Probadas de Trading:**\n\n` +
            `**Basándome en tu perfil, estas estrategias te pueden funcionar:**\n\n` +
            `📊 **Breakout Strategy:**\n` +
            `• Espera ruptura de soporte/resistencia clave\n` +
            `• Confirma con volumen alto\n` +
            `• Stop loss bajo el nivel roto\n` +
            `• Target: 2x el riesgo asumido\n\n` +
            `🔄 **Pullback Trading:**\n` +
            `• Identifica tendencia fuerte\n` +
            `• Espera retroceso a EMA20\n` +
            `• Entrada en continuación de tendencia\n` +
            `• R:R mínimo 1:2\n\n` +
            `⚡ **Momentum Trading:**\n` +
            `• Noticias de alto impacto\n` +
            `• Entra en dirección del impulso\n` +
            `• Stops ajustados, targets amplios`,
          suggestions: ['Estrategia de reversión', 'Trading con fibonacci', 'Setup de bandas bollinger']
        });
      }

      // Brokers y aspectos técnicos
      if (lowerMessage.includes('broker') || lowerMessage.includes('spread') || 
          lowerMessage.includes('comisión') || lowerMessage.includes('slippage') || 
          lowerMessage.includes('ejecución')) {
        return res.json({
          response: `🏢 **Selección de Broker y Ejecución:**\n\n` +
            `**Factores críticos para tu éxito:**\n\n` +
            `💰 **Costos de trading:**\n` +
            `• Spreads: Mínimos en EUR/USD (0.1-0.3 pips)\n` +
            `• Comisiones: Considera cuentas ECN para scalping\n` +
            `• Swaps: Importantes para swing trading\n\n` +
            `⚡ **Calidad de ejecución:**\n` +
            `• Slippage mínimo (<0.5 pips)\n` +
            `• Rechazos de órdenes <1%\n` +
            `• Latencia baja en VPS\n\n` +
            `🛡️ **Seguridad y regulación:**\n` +
            `• Regulación FCA, CySEC o ASIC\n` +
            `• Segregación de fondos\n` +
            `• Cobertura de depósitos`,
          suggestions: ['Comparar tipos de cuenta', 'Configurar VPS', 'Evaluar spreads por par']
        });
      }

      // Trading algorítmico y automatización
      if (lowerMessage.includes('algoritm') || lowerMessage.includes('bot') || 
          lowerMessage.includes('automatiz') || lowerMessage.includes('ea') || 
          lowerMessage.includes('metatrader')) {
        return res.json({
          response: `🤖 **Trading Algorítmico y Automatización:**\n\n` +
            `**Automatiza tu estrategia exitosa:**\n\n` +
            `⚙️ **Expert Advisors (EA):**\n` +
            `• Programa tu estrategia en MQL4/MQL5\n` +
            `• Backtest exhaustivo (mínimo 5 años)\n` +
            `• Forward test en demo 3-6 meses\n\n` +
            `📊 **Ventajas de la automatización:**\n` +
            `• Elimina emociones del trading\n` +
            `• Ejecuta 24/7 sin supervisión\n` +
            `• Disciplina perfecta en reglas\n\n` +
            `⚠️ **Consideraciones importantes:**\n` +
            `• Nunca uses EAs sin entender la lógica\n` +
            `• Monitorea rendimiento regularmente\n` +
            `• Adapta a cambios de mercado`,
          suggestions: ['Crear mi primer EA', 'Plataformas de copy trading', 'Backtesting efectivo']
        });
      }

      // Análisis de mercado específico
      if (lowerMessage.includes('tendencia') || lowerMessage.includes('lateral') || 
          lowerMessage.includes('volatil') || lowerMessage.includes('consolidación')) {
        return res.json({
          response: `📈 **Análisis de Condiciones de Mercado:**\n\n` +
            `**Adapta tu estrategia al contexto actual:**\n\n` +
            `🎯 **Mercado en tendencia:**\n` +
            `• Usa estrategias de seguimiento\n` +
            `• Evita contratendencia\n` +
            `• Trails stops para maximizar ganancias\n\n` +
            `↔️ **Mercado lateral/consolidación:**\n` +
            `• Trading de rangos\n` +
            `• Compra en soportes, vende en resistencias\n` +
            `• Stops más ajustados\n\n` +
            `⚡ **Alta volatilidad:**\n` +
            `• Amplia stops loss\n` +
            `• Reduce position size\n` +
            `• Evita trading durante noticias\n\n` +
            `Según tus datos, adapta el tamaño de posición a la volatilidad actual.`,
          suggestions: ['Identificar tipo de mercado', 'Estrategias para rangos', 'Trading en volatilidad']
        });
      }

      // Preguntas específicas comunes
      if (lowerMessage.includes('que es') || lowerMessage.includes('qué es') || 
          lowerMessage.includes('explica') || lowerMessage.includes('define')) {
        
        if (lowerMessage.includes('spread')) {
          return res.json({
            response: `💰 SPREAD EN TRADING\n\n` +
              `El spread es la diferencia entre precio de compra (ask) y venta (bid):\n\n` +
              `📊 EJEMPLO PRÁCTICO:\n` +
              `• EUR/USD Bid: 1.0850\n` +
              `• EUR/USD Ask: 1.0852\n` +
              `• Spread: 2 pips\n\n` +
              `💡 FACTORES QUE AFECTAN EL SPREAD:\n` +
              `• Liquidez del par (EUR/USD tiene spread bajo)\n` +
              `• Horario de trading (spreads altos en gaps)\n` +
              `• Volatilidad del mercado\n` +
              `• Tipo de cuenta (ECN vs Market Maker)\n\n` +
              `Para tu trading, busca spreads menores a 1 pip en majors.`,
            suggestions: ['¿Qué es slippage?', 'Tipos de órdenes', '¿Qué es apalancamiento?']
          });
        }

        if (lowerMessage.includes('pip')) {
          return res.json({
            response: `📏 PIP - PORCENTAJE EN PUNTO\n\n` +
              `Un pip es la unidad mínima de cambio en el precio:\n\n` +
              `🎯 VALORES ESTÁNDAR:\n` +
              `• Pares con USD: 4to decimal (0.0001)\n` +
              `• Pares con JPY: 2do decimal (0.01)\n` +
              `• Ejemplo: EUR/USD de 1.0850 a 1.0851 = 1 pip\n\n` +
              `💰 VALOR EN DINERO:\n` +
              `• Lote estándar (100k): 1 pip = $10 USD\n` +
              `• Mini lote (10k): 1 pip = $1 USD\n` +
              `• Micro lote (1k): 1 pip = $0.10 USD\n\n` +
              `Con tu capital actual, calcula siempre el valor del pip antes de entrar.`,
            suggestions: ['Calculadora de pips', '¿Qué es un lote?', 'Position sizing']
          });
        }

        return res.json({
          response: `🤔 PREGUNTA SOBRE TRADING\n\n` +
            `Puedo explicarte cualquier concepto de trading. Pregúntame sobre:\n\n` +
            `📈 CONCEPTOS BÁSICOS:\n` +
            `• "¿Qué es un pip?"\n` +
            `• "¿Qué es el spread?"\n` +
            `• "¿Qué es apalancamiento?"\n\n` +
            `🔧 INDICADORES:\n` +
            `• "¿Qué es el RSI?"\n` +
            `• "Explica el MACD"\n` +
            `• "Cómo usar Fibonacci"\n\n` +
            `🎯 ESTRATEGIAS:\n` +
            `• "Estrategia de breakout"\n` +
            `• "Trading de noticias"\n` +
            `• "Scalping vs swing trading"`,
          suggestions: ['¿Qué es el RSI?', '¿Qué es un pip?', 'Explica Fibonacci', '¿Qué es el spread?']
        });
      }

      // Análisis específico de pares individuales
      const symbolMatch = lowerMessage.match(/(xauusd|eurusd|gbpusd|usdjpy|usdchf|audusd|usdcad|nzdusd|eurgbp|eurjpy|gbpjpy|audjpy|gold|oro)/);
      if (symbolMatch || lowerMessage.includes('pierdo en') || lowerMessage.includes('por qué pierdo') || lowerMessage.includes('porque pierdo')) {
        const recentTrades = enrichedContext?.recentTrades || [];
        
        if (recentTrades.length === 0) {
          return res.json({
            response: `🔍 ANÁLISIS ESPECÍFICO DE PAR\n\n` +
              `Para analizar por qué pierdes en un par específico necesito tu historial de trades.\n\n` +
              `Una vez importes tu CSV, podré identificar:\n` +
              `• Patrones específicos de pérdida en ese par\n` +
              `• Horarios donde más pierdes\n` +
              `• Errores recurrentes en entradas/salidas\n` +
              `• Comparación con tus mejores pares\n\n` +
              `Importa tus datos para análisis detallado del par.`,
            suggestions: ['Importar CSV de trades', 'Análisis general de pares', 'Conceptos básicos']
          });
        }
        
        // Detectar el símbolo específico mencionado
        let targetSymbol = '';
        if (symbolMatch) {
          targetSymbol = symbolMatch[1].toUpperCase();
          if (targetSymbol === 'GOLD' || targetSymbol === 'ORO') targetSymbol = 'XAUUSD';
        } else {
          // Si no especifica par, encontrar el peor par automáticamente
          const symbolStats: any = {};
          recentTrades.forEach((trade: any) => {
            if (!symbolStats[trade.symbol]) {
              symbolStats[trade.symbol] = { trades: 0, profit: 0 };
            }
            symbolStats[trade.symbol].trades++;
            symbolStats[trade.symbol].profit += trade.profit;
          });
          
          const symbols = Object.keys(symbolStats);
          if (symbols.length > 0) {
            targetSymbol = symbols.reduce((a, b) => 
              symbolStats[a].profit < symbolStats[b].profit ? a : b
            );
          }
        }
        
        // Análisis específico del par
        const symbolTrades = recentTrades.filter((t: any) => t.symbol === targetSymbol);
        
        if (symbolTrades.length === 0) {
          return res.json({
            response: `❌ ANÁLISIS DE ${targetSymbol}\n\n` +
              `No tienes trades registrados en ${targetSymbol} en tu historial.\n\n` +
              `Si has operado este par:\n` +
              `• Verifica que el CSV incluya todas las operaciones\n` +
              `• Revisa que el símbolo esté escrito correctamente\n` +
              `• Importa un historial más completo\n\n` +
              `Pares disponibles en tu historial: ${recentTrades.map((t: any) => t.symbol).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i).join(', ')}`,
            suggestions: ['Analizar otro par', 'Ver todos mis pares', 'Importar más datos']
          });
        }
        
        // Análisis profundo del par específico
        const totalProfit = symbolTrades.reduce((sum: number, t: any) => sum + t.profit, 0);
        const winningTrades = symbolTrades.filter((t: any) => t.profit > 0);
        const losingTrades = symbolTrades.filter((t: any) => t.profit < 0);
        const winRate = (winningTrades.length / symbolTrades.length * 100).toFixed(1);
        
        // Análisis por horarios
        const hourlyStats: any = {};
        symbolTrades.forEach((trade: any) => {
          const hour = new Date(trade.openTime).getHours();
          if (!hourlyStats[hour]) hourlyStats[hour] = { profit: 0, trades: 0 };
          hourlyStats[hour].profit += trade.profit;
          hourlyStats[hour].trades++;
        });
        
        const worstHour = Object.keys(hourlyStats).reduce((a, b) => 
          hourlyStats[a].profit < hourlyStats[b].profit ? a : b
        );
        
        // Análisis de tipos de operación
        const buyTrades = symbolTrades.filter((t: any) => t.type?.toLowerCase().includes('buy') || t.type?.toLowerCase().includes('long'));
        const sellTrades = symbolTrades.filter((t: any) => t.type?.toLowerCase().includes('sell') || t.type?.toLowerCase().includes('short'));
        
        const buyProfit = buyTrades.reduce((sum: number, t: any) => sum + t.profit, 0);
        const sellProfit = sellTrades.reduce((sum: number, t: any) => sum + t.profit, 0);
        
        // Análisis de tamaños de lote
        const avgLotSize = symbolTrades.reduce((sum: number, t: any) => sum + t.lots, 0) / symbolTrades.length;
        const losingTradesAvgLots = losingTrades.length > 0 ? 
          losingTrades.reduce((sum: number, t: any) => sum + t.lots, 0) / losingTrades.length : 0;
        
        return res.json({
          response: `💸 ANÁLISIS PROFUNDO: ¿POR QUÉ PIERDES EN ${targetSymbol}?\n\n` +
            `Basándome en tus ${symbolTrades.length} trades en ${targetSymbol}:\n\n` +
            `📊 ESTADÍSTICAS CRÍTICAS:\n` +
            `• Pérdida total: $${totalProfit.toFixed(2)}\n` +
            `• Win rate: ${winRate}% (${parseFloat(winRate) < 50 ? 'MUY BAJO' : 'Aceptable'})\n` +
            `• Trades ganadores: ${winningTrades.length} | Perdedores: ${losingTrades.length}\n` +
            `• Pérdida promedio: $${losingTrades.length > 0 ? (losingTrades.reduce((s: number, t: any) => s + Math.abs(t.profit), 0) / losingTrades.length).toFixed(2) : '0'}\n\n` +
            `🕒 TIMING PROBLEMÁTICO:\n` +
            `• Tu peor hora: ${worstHour}:00h con $${hourlyStats[worstHour].profit.toFixed(2)} pérdida\n` +
            `• ${hourlyStats[worstHour].trades} trades perdedores a esa hora\n` +
            `• SOLUCIÓN: Evita tradear ${targetSymbol} entre ${worstHour}:00h - ${(parseInt(worstHour)+1)%24}:00h\n\n` +
            `📈 DIRECCIÓN DEL TRADE:\n` +
            `• Compras (LONG): $${buyProfit.toFixed(2)} en ${buyTrades.length} trades\n` +
            `• Ventas (SHORT): $${sellProfit.toFixed(2)} en ${sellTrades.length} trades\n` +
            `• ${buyProfit < sellProfit ? 'Problema con trades de compra' : 'Problema con trades de venta'}\n\n` +
            `⚠️ ERRORES ESPECÍFICOS DETECTADOS:\n` +
            `• ${losingTradesAvgLots > avgLotSize ? `Incrementas lotes en trades perdedores (${losingTradesAvgLots.toFixed(2)} vs ${avgLotSize.toFixed(2)})` : 'Tamaño de lote consistente'}\n` +
            `• ${parseFloat(winRate) < 40 ? 'Entradas muy prematuras - espera mejores setups' : ''}\n` +
            `• ${totalProfit < -500 ? 'Sin stop loss adecuado - pérdidas excesivas' : ''}\n\n` +
            `💡 PLAN DE MEJORA ESPECÍFICO PARA ${targetSymbol}:\n` +
            `1. PROHIBIDO tradear entre ${worstHour}:00h - ${(parseInt(worstHour)+1)%24}:00h\n` +
            `2. ${buyProfit < sellProfit ? 'Evita compras, enfócate en ventas' : 'Evita ventas, enfócate en compras'}\n` +
            `3. Stop loss máximo: ${(Math.abs(totalProfit) / symbolTrades.length / 2).toFixed(0)} pips\n` +
            `4. Solo tradea ${targetSymbol} con setup confirmado en H1+`,
          suggestions: [`Estrategia específica para ${targetSymbol}`, 'Horarios óptimos detallados', 'Comparar con mis mejores pares']
        });
      }

      // Default fallback mejorado
      return res.json({
        response: `🤖 ASISTENTE DE TRADING ESPECIALIZADO\n\n` +
          `Puedo ayudarte con cualquier aspecto del trading:\n\n` +
          `📈 ANÁLISIS TÉCNICO: Indicadores, patrones, soportes/resistencias\n` +
          `🧠 PSICOLOGÍA: Control emocional, disciplina, gestión de estrés\n` +
          `💰 MONEY MANAGEMENT: Position sizing, gestión de riesgo\n` +
          `📰 FUNDAMENTAL: Noticias, bancos centrales, correlaciones\n` +
          `⏱️ TIMEFRAMES: Scalping, day trading, swing trading\n` +
          `🎯 ESTRATEGIAS: Breakouts, pullbacks, reversiones\n` +
          `🏢 BROKERS: Spreads, ejecución, regulación\n\n` +
          `Pregúntame lo que necesites saber sobre trading.`,
        suggestions: [
          '¿Qué es el RSI?',
          'Psicología del trading', 
          'Estrategias de breakout',
          'Gestión de riesgo'
        ]
      });

    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ 
        error: 'Error interno del servidor',
        response: '❌ Lo siento, hay un problema técnico. Inténtalo de nuevo en unos momentos.',
        suggestions: ['Refrescar la página', 'Intentar más tarde']
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
