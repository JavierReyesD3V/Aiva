import { Express, Request, Response } from 'express';
import { traderMadeService, type LiveQuote, type HistoricalData, type MarketData } from './services/tradermade';
import { financialNewsService, type NewsArticle, type MarketNews } from './services/financial-news';
import { economicCalendarService, type EconomicEvent, type EconomicCalendarResponse } from './services/economic-calendar';

export function registerMarketRoutes(app: Express) {
  
  // Get live quotes for specific symbols
  app.get('/api/market/quotes', async (req: Request, res: Response) => {
    try {
      const symbols = req.query.symbols as string;
      if (!symbols) {
        return res.status(400).json({ error: 'Symbols parameter is required' });
      }

      const symbolList = symbols.split(',').map(s => s.trim().toUpperCase());
      const quotes = await traderMadeService.getLiveQuotes(symbolList);
      
      res.json({
        success: true,
        data: quotes,
        timestamp: Date.now(),
        isSimulated: !process.env.TRADERMADE_API_KEY
      });

    } catch (error: any) {
      console.error('Error fetching quotes:', error);
      
      // Instead of returning 500, provide simulated data as fallback
      const symbolList = (req.query.symbols as string)?.split(',').map(s => s.trim().toUpperCase()) || [];
      
      // Generate fallback data inline
      const fallbackQuotes = symbolList.map(symbol => {
        const baseRates: Record<string, number> = {
          'EURUSD': 1.0850, 'GBPUSD': 1.2650, 'USDJPY': 150.25,
          'USDCHF': 0.8750, 'AUDUSD': 0.6850, 'USDCAD': 1.3520
        };
        const baseRate = baseRates[symbol] || 1.0000;
        const variation = (Math.random() - 0.5) * 0.01;
        const mid = baseRate + (baseRate * variation);
        const spread = baseRate * 0.0001;
        
        return {
          instrument: symbol,
          bid: mid - spread/2,
          ask: mid + spread/2,
          mid: mid,
          timestamp: Date.now(),
          spread: spread
        };
      });
      
      res.json({
        success: true,
        data: fallbackQuotes,
        timestamp: Date.now(),
        isSimulated: true,
        warning: 'Using simulated data due to API limitations'
      });
    }
  });

  // Get historical data for a symbol
  app.get('/api/market/historical/:symbol', async (req: Request, res: Response) => {
    try {
      const symbol = req.params.symbol.toUpperCase();
      const period = req.query.period as string || '1D';
      const format = req.query.format as string || 'records';

      const historicalData = await traderMadeService.getHistoricalData(symbol, period, format);
      
      res.json({
        success: true,
        symbol,
        data: historicalData,
        period,
        timestamp: Date.now()
      });

    } catch (error: any) {
      console.error('Error fetching historical data:', error);
      res.status(500).json({ 
        error: 'Failed to fetch historical data',
        message: error.message 
      });
    }
  });

  // Get market analysis for a symbol
  app.get('/api/market/analysis/:symbol', async (req: Request, res: Response) => {
    try {
      const symbol = req.params.symbol.toUpperCase();
      
      // Get historical data for analysis
      const historicalData = await traderMadeService.getHistoricalData(symbol);
      const analysis = await traderMadeService.analyzeMarketTrend(symbol, historicalData);
      
      res.json({
        success: true,
        symbol,
        analysis,
        timestamp: Date.now()
      });

    } catch (error: any) {
      console.error('Error analyzing market:', error);
      res.status(500).json({ 
        error: 'Failed to analyze market',
        message: error.message 
      });
    }
  });

  // Get comprehensive market overview
  app.get('/api/market/overview', async (req: Request, res: Response) => {
    try {
      const symbols = req.query.symbols as string;
      const defaultSymbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD'];
      
      const symbolList = symbols 
        ? symbols.split(',').map(s => s.trim().toUpperCase())
        : defaultSymbols;

      const marketData = await traderMadeService.getMarketOverview(symbolList);
      
      res.json({
        success: true,
        data: marketData,
        timestamp: Date.now()
      });

    } catch (error: any) {
      console.error('Error fetching market overview:', error);
      res.status(500).json({ 
        error: 'Failed to fetch market overview',
        message: error.message 
      });
    }
  });

  // Get available currency pairs
  app.get('/api/market/currencies', async (req: Request, res: Response) => {
    try {
      const currencies = await traderMadeService.getCurrencyList();
      
      res.json({
        success: true,
        currencies,
        timestamp: Date.now()
      });

    } catch (error: any) {
      console.error('Error fetching currencies:', error);
      res.status(500).json({ 
        error: 'Failed to fetch currency list',
        message: error.message 
      });
    }
  });

  // Get market sentiment and signals
  app.get('/api/market/signals', async (req: Request, res: Response) => {
    try {
      const symbols = req.query.symbols as string;
      const symbolList = symbols 
        ? symbols.split(',').map(s => s.trim().toUpperCase())
        : ['EURUSD', 'GBPUSD', 'USDJPY'];

      const signals = [];
      
      for (const symbol of symbolList) {
        try {
          const [quotes, historical] = await Promise.all([
            traderMadeService.getLiveQuotes([symbol]),
            traderMadeService.getHistoricalData(symbol)
          ]);

          if (quotes.length > 0 && historical.length > 0) {
            const analysis = await traderMadeService.analyzeMarketTrend(symbol, historical);
            const currentQuote = quotes[0];
            
            // Generate trading signal
            let signal = 'NEUTRAL';
            let strength = 0;
            
            if (analysis.trend === 'up' && currentQuote.mid > analysis.support) {
              signal = 'BUY';
              strength = analysis.volatility < 2 ? 80 : 60;
            } else if (analysis.trend === 'down' && currentQuote.mid < analysis.resistance) {
              signal = 'SELL';
              strength = analysis.volatility < 2 ? 80 : 60;
            } else {
              strength = 40;
            }

            signals.push({
              symbol,
              signal,
              strength,
              currentPrice: currentQuote.mid,
              trend: analysis.trend,
              volatility: analysis.volatility,
              support: analysis.support,
              resistance: analysis.resistance,
              recommendation: analysis.recommendation,
              timestamp: Date.now()
            });
          }
        } catch (symbolError) {
          console.error(`Error processing signal for ${symbol}:`, symbolError);
        }
      }

      res.json({
        success: true,
        signals,
        timestamp: Date.now()
      });

    } catch (error: any) {
      console.error('Error generating signals:', error);
      res.status(500).json({ 
        error: 'Failed to generate market signals',
        message: error.message 
      });
    }
  });

  // Endpoint to test TraderMade connection
  app.get('/api/market/test', async (req: Request, res: Response) => {
    try {
      const testSymbol = 'EURUSD';
      const quotes = await traderMadeService.getLiveQuotes([testSymbol]);
      
      res.json({
        success: true,
        message: 'TraderMade API connection successful',
        testData: quotes,
        timestamp: Date.now()
      });

    } catch (error: any) {
      console.error('TraderMade API test failed:', error);
      res.status(500).json({ 
        success: false,
        error: 'TraderMade API connection failed',
        message: error.message,
        timestamp: Date.now()
      });
    }
  });

  // Get financial market news
  app.get('/api/market/news', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const category = req.query.category as string || 'general';
      
      let news: MarketNews;
      
      switch (category) {
        case 'forex':
          const symbols = req.query.symbols as string;
          const symbolList = symbols ? symbols.split(',').map(s => s.trim().toUpperCase()) : undefined;
          news = await financialNewsService.getForexNews(symbolList, limit);
          break;
        case 'crypto':
          news = await financialNewsService.getCryptocurrencyNews(limit);
          break;
        case 'economy':
          news = await financialNewsService.getEconomicCalendarNews(limit);
          break;
        default:
          news = await financialNewsService.getMarketNews(['financial_markets', 'forex'], limit);
      }
      
      res.json({
        success: true,
        category,
        news,
        timestamp: Date.now()
      });

    } catch (error: any) {
      console.error('Error fetching financial news:', error);
      res.status(500).json({ 
        error: 'Failed to fetch financial news',
        message: error.message 
      });
    }
  });

  // Get news with sentiment analysis
  app.get('/api/market/news-sentiment', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 15;
      const news = await financialNewsService.getMarketNews(['financial_markets', 'forex', 'economy_fiscal'], limit);
      
      // Add formatted time and sentiment analysis
      const articlesWithAnalysis = news.articles.map(article => ({
        ...article,
        timeAgo: financialNewsService.formatTimeAgo(article.time_published),
        sentimentColor: financialNewsService.getSentimentColor(article.overall_sentiment_score),
        sentimentIcon: financialNewsService.getSentimentIcon(article.overall_sentiment_label),
        relevantTickers: article.ticker_sentiment?.slice(0, 3) || [] // Show max 3 relevant tickers
      }));
      
      res.json({
        success: true,
        articles: articlesWithAnalysis,
        totalArticles: news.totalArticles,
        lastUpdated: news.lastUpdated,
        timestamp: Date.now()
      });

    } catch (error: any) {
      console.error('Error fetching news with sentiment:', error);
      res.status(500).json({ 
        error: 'Failed to fetch news with sentiment analysis',
        message: error.message 
      });
    }
  });

  // Get economic calendar events
  app.get('/api/market/economic-calendar', async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const calendar = await economicCalendarService.getEconomicEvents(days);
      
      res.json({
        success: true,
        calendar,
        timestamp: Date.now()
      });

    } catch (error: any) {
      console.error('Error fetching economic calendar:', error);
      res.status(500).json({ 
        error: 'Failed to fetch economic calendar',
        message: error.message 
      });
    }
  });
}