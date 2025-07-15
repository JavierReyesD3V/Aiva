interface NewsArticle {
  title: string;
  summary: string;
  url: string;
  time_published: string;
  source: string;
  author?: string;
  banner_image?: string;
  category?: string;
  overall_sentiment_score?: number;
  overall_sentiment_label?: string;
  ticker_sentiment?: Array<{
    ticker: string;
    relevance_score: string;
    ticker_sentiment_score: string;
    ticker_sentiment_label: string;
  }>;
}

interface NewsResponse {
  feed: NewsArticle[];
  items: string;
  sentiment_score_definition: string;
  relevance_score_definition: string;
  'Error Message'?: string;
  'Note'?: string;
}

interface MarketNews {
  articles: NewsArticle[];
  lastUpdated: Date;
  totalArticles: number;
}

class FinancialNewsService {
  private config: {
    alphaVantageApiKey: string;
    baseUrl: string;
  };

  constructor() {
    this.config = {
      alphaVantageApiKey: process.env.ALPHA_VANTAGE_API_KEY || '',
      baseUrl: 'https://www.alphavantage.co/query'
    };
  }

  async getMarketNews(topics: string[] = ['forex', 'financial_markets'], limit: number = 50): Promise<MarketNews> {
    if (!this.config.alphaVantageApiKey) {
      console.warn('Alpha Vantage API key not configured, using simulated data');
      return this.generateSimulatedNews();
    }

    try {
      const topicsParam = topics.join(',');
      const url = `${this.config.baseUrl}?function=NEWS_SENTIMENT&topics=${topicsParam}&limit=${limit}&apikey=${this.config.alphaVantageApiKey}`;
      
      console.log('Fetching news from Alpha Vantage for topics:', topics);
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();
      
      // Check for API error response
      if (data['Error Message'] || data['Note']) {
        console.warn('Alpha Vantage API limit reached or error:', data['Error Message'] || data['Note']);
        return this.generateSimulatedNews();
      }

      if (!data.feed || !Array.isArray(data.feed)) {
        console.warn('No news feed available from Alpha Vantage, using simulated data');
        return this.generateSimulatedNews();
      }

      console.log(`Successfully fetched ${data.feed.length} news articles from Alpha Vantage`);

      // Process and translate news to Spanish
      const processedArticles = data.feed.slice(0, limit).map((article: any) => ({
        ...article,
        title: this.translateTitle(article.title),
        summary: this.translateSummary(article.summary),
        time_published: article.time_published
      }));

      return {
        articles: processedArticles,
        lastUpdated: new Date(),
        totalArticles: data.feed.length
      };

    } catch (error: any) {
      console.error('Error fetching financial news from Alpha Vantage:', error);
      // Return simulated news as fallback
      return this.generateSimulatedNews();
    }
  }

  async getForexNews(symbols: string[] = ['EURUSD', 'GBPUSD', 'USDJPY'], limit: number = 20): Promise<MarketNews> {
    try {
      const news = await this.getMarketNews(['forex'], limit * 2);
      
      // Filter news relevant to specified forex pairs
      const relevantNews = news.articles.filter(article => {
        const content = `${article.title} ${article.summary}`.toLowerCase();
        return symbols.some(symbol => {
          const baseCurrency = symbol.substring(0, 3);
          const quoteCurrency = symbol.substring(3, 6);
          return content.includes(baseCurrency.toLowerCase()) || 
                 content.includes(quoteCurrency.toLowerCase()) ||
                 content.includes('forex') ||
                 content.includes('currency') ||
                 content.includes('trading');
        });
      }).slice(0, limit);

      return {
        articles: relevantNews,
        lastUpdated: news.lastUpdated,
        totalArticles: relevantNews.length
      };

    } catch (error) {
      console.error('Error fetching forex news:', error);
      return this.generateSimulatedNews();
    }
  }

  async getCryptocurrencyNews(limit: number = 20): Promise<MarketNews> {
    return await this.getMarketNews(['cryptocurrency', 'blockchain'], limit);
  }

  async getEconomicCalendarNews(limit: number = 15): Promise<MarketNews> {
    return await this.getMarketNews(['economy_fiscal', 'economy_monetary'], limit);
  }

  private generateSimulatedNews(): MarketNews {
    const simulatedArticles: NewsArticle[] = [
      {
        title: "EUR/USD Se Mantiene Estable Tras Datos de Inflación de la Eurozona",
        summary: "El par EUR/USD se mantiene cerca de los 1.1735 después de que los datos de inflación de la eurozona cumplieran con las expectativas del mercado. Los analistas sugieren cautela antes de las próximas decisiones del BCE.",
        url: "#",
        time_published: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        source: "Trading News",
        category: "forex",
        overall_sentiment_score: 0.1,
        overall_sentiment_label: "Neutral"
      },
      {
        title: "GBP/USD Cae Ante Preocupaciones por el Crecimiento del Reino Unido",
        summary: "La libra británica se debilita frente al dólar estadounidense tras informes que sugieren un crecimiento económico más lento de lo esperado en el Reino Unido para el primer trimestre.",
        url: "#",
        time_published: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        source: "Financial Times",
        category: "forex",
        overall_sentiment_score: -0.3,
        overall_sentiment_label: "Bearish"
      },
      {
        title: "Fed Considera Pausar Alzas de Tasas en Próxima Reunión",
        summary: "Funcionarios de la Reserva Federal sugieren que podrían pausar el ciclo de alzas de tasas de interés, lo que está generando volatilidad en los mercados de divisas y afectando especialmente al USD/JPY.",
        url: "#",
        time_published: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        source: "Reuters",
        category: "central_banks",
        overall_sentiment_score: 0.2,
        overall_sentiment_label: "Neutral-Bullish"
      },
      {
        title: "Oro Alcanza Nuevos Máximos Semanales por Tensiones Geopolíticas",
        summary: "El precio del oro continúa su tendencia alcista alcanzando máximos semanales de $2,180 por onza, impulsado por la demanda de activos refugio ante las crecientes tensiones geopolíticas globales.",
        url: "#",
        time_published: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        source: "MarketWatch",
        category: "commodities",
        overall_sentiment_score: 0.6,
        overall_sentiment_label: "Bullish"
      },
      {
        title: "Petróleo WTI Retrocede por Aumento de Inventarios",
        summary: "El petróleo crudo WTI cae un 2.1% después de que los datos semanales mostraran un aumento inesperado en los inventarios de crudo estadounidense, lo que presiona los precios hacia abajo.",
        url: "#",
        time_published: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        source: "Bloomberg",
        category: "commodities",
        overall_sentiment_score: -0.4,
        overall_sentiment_label: "Bearish"
      },
      {
        title: "Bitcoin Recupera Nivel de $65,000 Tras Adopción Institucional",
        summary: "Bitcoin recupera el nivel psicológico de $65,000 después de que varios fondos institucionales anunciaran nuevas inversiones en criptomonedas como parte de sus estrategias de diversificación.",
        url: "#",
        time_published: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        source: "CoinDesk",
        category: "cryptocurrency",
        overall_sentiment_score: 0.5,
        overall_sentiment_label: "Bullish"
      },
      {
        title: "Índices Bursátiles Europeos Abren con Ganancias Moderadas",
        summary: "Los principales índices europeos abren la sesión con ganancias moderadas, con el DAX alemán liderando las alzas con un +0.8% tras resultados corporativos mejor de lo esperado.",
        url: "#",
        time_published: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        source: "Financial Times",
        category: "equity",
        overall_sentiment_score: 0.3,
        overall_sentiment_label: "Bullish"
      },
      {
        title: "Datos de Empleo de EE.UU. Superan Expectativas",
        summary: "El informe de empleo no agrícola de Estados Unidos supera las expectativas con 275,000 nuevos empleos creados, fortaleciendo el dólar y reduciendo las expectativas de recortes de tasas de la Fed.",
        url: "#",
        time_published: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString(),
        source: "Reuters",
        category: "economy_fiscal",
        overall_sentiment_score: 0.4,
        overall_sentiment_label: "Bullish"
      }
    ];

    return {
      articles: simulatedArticles,
      lastUpdated: new Date(),
      totalArticles: simulatedArticles.length
    };
  }

  formatTimeAgo(publishedTime: string): string {
    const publishedDate = new Date(publishedTime);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - publishedDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `hace ${diffInMinutes} min`;
    } else if (diffInMinutes < 1440) {
      const hours = Math.floor(diffInMinutes / 60);
      return `hace ${hours}h`;
    } else {
      const days = Math.floor(diffInMinutes / 1440);
      return `hace ${days}d`;
    }
  }

  getSentimentColor(score?: number): string {
    if (!score) return 'text-gray-600';
    if (score > 0.2) return 'text-green-600';
    if (score < -0.2) return 'text-red-600';
    return 'text-gray-600';
  }

  getSentimentIcon(label?: string): string {
    switch (label?.toLowerCase()) {
      case 'bullish':
      case 'somewhat-bullish': 
        return '📈';
      case 'bearish':
      case 'somewhat-bearish':
        return '📉';
      case 'neutral': return '➡️';
      default: return '📰';
    }
  }

  // Simple translation helper for common financial terms
  private translateTitle(englishTitle: string): string {
    const translations: { [key: string]: string } = {
      'Stock': 'Acción',
      'Market': 'Mercado',
      'Buy': 'Comprar',
      'Sell': 'Vender',
      'Earnings': 'Ganancias',
      'Economy': 'Economía',
      'Federal Reserve': 'Reserva Federal',
      'Fed': 'Fed',
      'IPO': 'OPV',
      'Dividend': 'Dividendo',
      'Price': 'Precio',
      'Report': 'Informe',
      'News': 'Noticias',
      'Analysis': 'Análisis',
      'Investment': 'Inversión',
      'Trading': 'Trading',
      'Currency': 'Divisa',
      'Dollar': 'Dólar',
      'Euro': 'Euro',
      'Growth': 'Crecimiento',
      'Inflation': 'Inflación'
    };

    let translatedTitle = englishTitle;
    Object.entries(translations).forEach(([english, spanish]) => {
      const regex = new RegExp(`\\b${english}\\b`, 'gi');
      translatedTitle = translatedTitle.replace(regex, spanish);
    });

    return translatedTitle;
  }

  private translateSummary(englishSummary: string): string {
    // For now, keep original summaries but could implement full translation later
    return englishSummary;
  }
}

export const financialNewsService = new FinancialNewsService();
export type { NewsArticle, MarketNews };