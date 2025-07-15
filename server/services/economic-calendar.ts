interface EconomicEvent {
  time: string;
  country: string;
  event: string;
  impact: 'High' | 'Medium' | 'Low';
  forecast?: string;
  previous?: string;
  actual?: string;
  currency: string;
  importance: number; // 1-5 scale
  category: string;
}

interface EconomicCalendarResponse {
  events: EconomicEvent[];
  lastUpdated: Date;
  totalEvents: number;
}

class EconomicCalendarService {
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

  async getEconomicEvents(days: number = 7): Promise<EconomicCalendarResponse> {
    if (!this.config.alphaVantageApiKey) {
      console.warn('Alpha Vantage API key not configured, using simulated calendar');
      return this.generateSimulatedCalendar();
    }

    try {
      // Alpha Vantage doesn't have calendar endpoints, but we can use economic news
      // to identify upcoming events and combine with realistic simulated data
      const url = `${this.config.baseUrl}?function=NEWS_SENTIMENT&topics=economy_fiscal,economy_monetary,earnings&limit=50&apikey=${this.config.alphaVantageApiKey}`;
      
      console.log('Fetching economic news from Alpha Vantage to enhance calendar');
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.status} ${response.statusText}`);
      }

      const data: any = await response.json();
      
      if (data['Error Message'] || data['Note']) {
        console.warn('Alpha Vantage API limit reached, using simulated calendar:', data['Error Message'] || data['Note']);
        return this.generateSimulatedCalendar();
      }

      // Generate realistic calendar and enhance with news-based insights
      const simulatedCalendar = this.generateSimulatedCalendar();
      
      if (data.feed && Array.isArray(data.feed)) {
        // Analyze news to adjust event importance and add relevant context
        const newsBasedAdjustments = this.analyzeNewsForCalendar(data.feed);
        console.log(`Enhanced calendar with insights from ${data.feed.length} news articles`);
        
        // Apply adjustments to simulated events
        simulatedCalendar.events = this.enhanceEventsWithNews(simulatedCalendar.events, newsBasedAdjustments);
      }
      
      return simulatedCalendar;

    } catch (error: any) {
      console.error('Error enhancing economic calendar with Alpha Vantage news:', error);
      return this.generateSimulatedCalendar();
    }
  }

  private convertNewsToEvents(newsArticles: any[]): EconomicEvent[] {
    const events: EconomicEvent[] = [];
    
    newsArticles.forEach((article, index) => {
      // Extract economic indicators from news titles and summaries
      const title = article.title.toLowerCase();
      const summary = article.summary.toLowerCase();
      
      let event: Partial<EconomicEvent> = {
        time: this.formatEventTime(article.time_published),
        event: this.extractEventName(article.title),
        currency: this.extractCurrency(title + ' ' + summary),
        country: this.extractCountry(title + ' ' + summary),
        impact: this.determineImpact(article.overall_sentiment_score),
        importance: this.calculateImportance(article.overall_sentiment_score),
        category: this.determineCategory(title + ' ' + summary)
      };

      events.push(event as EconomicEvent);
    });

    return events;
  }

  private formatEventTime(timePublished: string): string {
    try {
      // Convert YYYYMMDDTHHMMSS format to readable time
      const year = timePublished.substr(0, 4);
      const month = timePublished.substr(4, 2);
      const day = timePublished.substr(6, 2);
      const hour = timePublished.substr(9, 2);
      const minute = timePublished.substr(11, 2);
      
      return `${day}/${month}/${year} ${hour}:${minute}`;
    } catch (error) {
      return new Date().toLocaleString();
    }
  }

  private extractEventName(title: string): string {
    const economicTerms = [
      'GDP', 'Inflation', 'Employment', 'Unemployment', 'CPI', 'PPI',
      'Interest Rate', 'Fed Rate', 'ECB Rate', 'Trade Balance',
      'Retail Sales', 'Manufacturing', 'PMI', 'NFP', 'Payrolls'
    ];

    for (const term of economicTerms) {
      if (title.toLowerCase().includes(term.toLowerCase())) {
        return `${term} Report`;
      }
    }

    return title.length > 50 ? title.substring(0, 50) + '...' : title;
  }

  private extractCurrency(text: string): string {
    if (text.includes('usd') || text.includes('dollar') || text.includes('fed')) return 'USD';
    if (text.includes('eur') || text.includes('euro') || text.includes('ecb')) return 'EUR';
    if (text.includes('gbp') || text.includes('pound') || text.includes('uk')) return 'GBP';
    if (text.includes('jpy') || text.includes('yen') || text.includes('japan')) return 'JPY';
    if (text.includes('aud') || text.includes('australia')) return 'AUD';
    if (text.includes('cad') || text.includes('canada')) return 'CAD';
    return 'USD'; // Default
  }

  private extractCountry(text: string): string {
    if (text.includes('united states') || text.includes('us ') || text.includes('america')) return 'Estados Unidos';
    if (text.includes('eurozone') || text.includes('europe') || text.includes('ecb')) return 'Eurozona';
    if (text.includes('uk') || text.includes('britain') || text.includes('england')) return 'Reino Unido';
    if (text.includes('japan') || text.includes('tokyo')) return 'Japón';
    if (text.includes('australia') || text.includes('sydney')) return 'Australia';
    if (text.includes('canada') || text.includes('ottawa')) return 'Canadá';
    if (text.includes('china') || text.includes('beijing')) return 'China';
    return 'Global';
  }

  private determineImpact(sentimentScore?: number): 'High' | 'Medium' | 'Low' {
    if (!sentimentScore) return 'Medium';
    const absScore = Math.abs(sentimentScore);
    if (absScore > 0.4) return 'High';
    if (absScore > 0.2) return 'Medium';
    return 'Low';
  }

  private calculateImportance(sentimentScore?: number): number {
    if (!sentimentScore) return 3;
    const absScore = Math.abs(sentimentScore);
    if (absScore > 0.5) return 5;
    if (absScore > 0.3) return 4;
    if (absScore > 0.15) return 3;
    if (absScore > 0.05) return 2;
    return 1;
  }

  private determineCategory(text: string): string {
    if (text.includes('employment') || text.includes('unemployment') || text.includes('jobs')) return 'Empleo';
    if (text.includes('inflation') || text.includes('cpi') || text.includes('prices')) return 'Inflación';
    if (text.includes('gdp') || text.includes('growth') || text.includes('economy')) return 'Crecimiento';
    if (text.includes('rate') || text.includes('fed') || text.includes('monetary')) return 'Política Monetaria';
    if (text.includes('trade') || text.includes('export') || text.includes('import')) return 'Comercio';
    if (text.includes('manufacturing') || text.includes('production') || text.includes('pmi')) return 'Manufactura';
    return 'General';
  }

  private generateSimulatedCalendar(): EconomicCalendarResponse {
    const now = new Date();
    const events: EconomicEvent[] = [
      {
        time: this.formatDate(new Date(now.getTime() + 1 * 60 * 60 * 1000)), // 1 hour from now
        country: 'Estados Unidos',
        event: 'Decisión de Tasas de Interés de la Fed',
        impact: 'High',
        forecast: '5.25%',
        previous: '5.00%',
        actual: '',
        currency: 'USD',
        importance: 5,
        category: 'Política Monetaria'
      },
      {
        time: this.formatDate(new Date(now.getTime() + 3 * 60 * 60 * 1000)), // 3 hours from now
        country: 'Eurozona',
        event: 'Índice de Precios al Consumidor (IPC)',
        impact: 'Medium',
        forecast: '2.4%',
        previous: '2.6%',
        actual: '',
        currency: 'EUR',
        importance: 4,
        category: 'Inflación'
      },
      {
        time: this.formatDate(new Date(now.getTime() + 5 * 60 * 60 * 1000)), // 5 hours from now
        country: 'Reino Unido',
        event: 'Datos de Empleo',
        impact: 'Medium',
        forecast: '4.2%',
        previous: '4.4%',
        actual: '',
        currency: 'GBP',
        importance: 3,
        category: 'Empleo'
      },
      {
        time: this.formatDate(new Date(now.getTime() + 24 * 60 * 60 * 1000)), // Tomorrow
        country: 'Estados Unidos',
        event: 'Producto Interno Bruto (PIB)',
        impact: 'High',
        forecast: '2.8%',
        previous: '2.6%',
        actual: '',
        currency: 'USD',
        importance: 5,
        category: 'Crecimiento'
      },
      {
        time: this.formatDate(new Date(now.getTime() + 26 * 60 * 60 * 1000)), // Tomorrow + 2h
        country: 'Japón',
        event: 'Índice de Gestores de Compras (PMI)',
        impact: 'Low',
        forecast: '49.8',
        previous: '50.2',
        actual: '',
        currency: 'JPY',
        importance: 2,
        category: 'Manufactura'
      },
      {
        time: this.formatDate(new Date(now.getTime() + 48 * 60 * 60 * 1000)), // Day after tomorrow
        country: 'Estados Unidos',
        event: 'Nóminas No Agrícolas (NFP)',
        impact: 'High',
        forecast: '185K',
        previous: '175K',
        actual: '',
        currency: 'USD',
        importance: 5,
        category: 'Empleo'
      },
      {
        time: this.formatDate(new Date(now.getTime() + 72 * 60 * 60 * 1000)), // 3 days from now
        country: 'Australia',
        event: 'Decisión de Tasas RBA',
        impact: 'Medium',
        forecast: '4.35%',
        previous: '4.35%',
        actual: '',
        currency: 'AUD',
        importance: 3,
        category: 'Política Monetaria'
      }
    ];

    return {
      events,
      lastUpdated: new Date(),
      totalEvents: events.length
    };
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getImpactColor(impact: string): string {
    switch (impact) {
      case 'High': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-yellow-600 bg-yellow-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }

  getImportanceStars(importance: number): string {
    return '★'.repeat(importance) + '☆'.repeat(5 - importance);
  }

  private analyzeNewsForCalendar(newsArticles: any[]): any {
    const insights = {
      fedSentiment: 0,
      inflationConcern: 0,
      employmentFocus: 0,
      marketVolatility: 0
    };

    newsArticles.forEach(article => {
      const content = (article.title + ' ' + article.summary).toLowerCase();
      
      if (content.includes('fed') || content.includes('federal reserve')) {
        insights.fedSentiment += article.overall_sentiment_score || 0;
      }
      if (content.includes('inflation') || content.includes('cpi')) {
        insights.inflationConcern += Math.abs(article.overall_sentiment_score || 0);
      }
      if (content.includes('employment') || content.includes('jobs')) {
        insights.employmentFocus += Math.abs(article.overall_sentiment_score || 0);
      }
      if (Math.abs(article.overall_sentiment_score || 0) > 0.3) {
        insights.marketVolatility += 1;
      }
    });

    return insights;
  }

  private enhanceEventsWithNews(events: EconomicEvent[], insights: any): EconomicEvent[] {
    return events.map(event => {
      const enhanced = { ...event };
      
      // Adjust importance based on news insights
      if (event.event.includes('Fed') && insights.fedSentiment !== 0) {
        enhanced.importance = Math.min(5, enhanced.importance + 1);
        enhanced.impact = 'High';
      }
      
      if (event.category === 'Inflación' && insights.inflationConcern > 0.2) {
        enhanced.importance = Math.min(5, enhanced.importance + 1);
      }
      
      if (event.category === 'Empleo' && insights.employmentFocus > 0.2) {
        enhanced.importance = Math.min(5, enhanced.importance + 1);
      }
      
      return enhanced;
    });
  }
}

export const economicCalendarService = new EconomicCalendarService();
export type { EconomicEvent, EconomicCalendarResponse };