import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Newspaper, 
  ExternalLink, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Clock,
  Globe
} from "lucide-react";

interface NewsArticle {
  title: string;
  summary: string;
  url: string;
  time_published: string;
  source: string;
  category?: string;
  overall_sentiment_score?: number;
  overall_sentiment_label?: string;
  timeAgo?: string;
  sentimentColor?: string;
  sentimentIcon?: string;
}

interface NewsResponse {
  success: boolean;
  category: string;
  news: {
    articles: NewsArticle[];
    lastUpdated: string;
    totalArticles: number;
  };
  timestamp: number;
}

interface FinancialNewsProps {
  category?: 'general' | 'forex' | 'crypto' | 'economy';
  limit?: number;
  showSentiment?: boolean;
  compact?: boolean;
}

export default function FinancialNews({ 
  category = 'general', 
  limit = 10, 
  showSentiment = false,
  compact = false 
}: FinancialNewsProps) {
  const [activeCategory, setActiveCategory] = useState(category);

  const { 
    data: newsData, 
    isLoading, 
    refetch,
    error 
  } = useQuery({
    queryKey: ['/api/market/news', activeCategory, limit],
    queryFn: async () => {
      const response = await fetch(`/api/market/news?category=${activeCategory}&limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch financial news');
      }
      return response.json() as Promise<NewsResponse>;
    },
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const getSentimentIcon = (label?: string) => {
    switch (label?.toLowerCase()) {
      case 'bullish':
      case 'neutral-bullish':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'bearish':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getSentimentColor = (score?: number) => {
    if (!score) return 'text-gray-600';
    if (score > 0.2) return 'text-green-600';
    if (score < -0.2) return 'text-red-600';
    return 'text-gray-600';
  };

  const formatTimeAgo = (timePublished: string) => {
    const publishedDate = new Date(timePublished);
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
  };

  const getCategoryLabel = (cat: string) => {
    const labels = {
      general: 'General',
      forex: 'Forex',
      crypto: 'Cripto',
      economy: 'Economía'
    };
    return labels[cat as keyof typeof labels] || cat;
  };

  const articles = newsData?.news?.articles || [];

  if (error) {
    return (
      <Card className="bg-card-gradient border-purple shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center">
            <Newspaper className="w-5 h-5 mr-2" />
            Noticias Financieras
            <Badge variant="outline" className="ml-2 border-red-400 text-red-300 bg-red-900 bg-opacity-20">
              Error
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-purple-light py-4">
            <p>No se pueden cargar las noticias</p>
            <p className="text-sm mt-1">Verifica la configuración de la API</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="bg-card-gradient border-purple shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center">
              <Newspaper className="w-5 h-5 mr-2" />
              Noticias del Mercado
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="h-6 w-6 p-0 text-purple-light hover:text-white hover:bg-purple-light hover:bg-opacity-20"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 border border-purple rounded-lg animate-pulse bg-purple-deep bg-opacity-30">
                  <div className="bg-purple-light bg-opacity-40 h-4 w-3/4 mb-2 rounded"></div>
                  <div className="bg-purple-light bg-opacity-40 h-3 w-full rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {articles.slice(0, 5).map((article, index) => (
                <div key={index} className="p-3 border border-purple rounded-lg hover:bg-purple-deep hover:bg-opacity-30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-white text-sm leading-tight flex-1">
                      {article.title}
                    </h4>
                    {showSentiment && (
                      <div className="ml-2 flex-shrink-0">
                        {getSentimentIcon(article.overall_sentiment_label)}
                      </div>
                    )}
                  </div>
                  <p className="text-purple-light text-xs line-clamp-2 mb-2">
                    {article.summary}
                  </p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-purple-light flex items-center">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatTimeAgo(article.time_published)}
                    </span>
                    <span className="text-pink-400 font-medium">{article.source}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card-gradient border-purple shadow-lg">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center">
            <Newspaper className="w-6 h-6 mr-3" />
            Noticias Financieras
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="border-green-400 text-green-300 bg-green-900 bg-opacity-20">
              En vivo
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="h-8 w-8 p-0 text-purple-light hover:text-white hover:bg-purple-light hover:bg-opacity-20"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as any)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-purple-deep bg-opacity-40 border border-purple">
            <TabsTrigger value="general" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white text-purple-light hover:text-white">
              General
            </TabsTrigger>
            <TabsTrigger value="forex" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white text-purple-light hover:text-white">
              Forex
            </TabsTrigger>
            <TabsTrigger value="crypto" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white text-purple-light hover:text-white">
              Cripto
            </TabsTrigger>
            <TabsTrigger value="economy" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white text-purple-light hover:text-white">
              Economía
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeCategory} className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-4 border border-purple rounded-lg animate-pulse bg-purple-deep bg-opacity-30">
                    <div className="bg-purple-light bg-opacity-40 h-5 w-3/4 mb-3 rounded"></div>
                    <div className="bg-purple-light bg-opacity-40 h-4 w-full mb-2 rounded"></div>
                    <div className="bg-purple-light bg-opacity-40 h-4 w-2/3 rounded"></div>
                  </div>
                ))}
              </div>
            ) : articles.length === 0 ? (
              <div className="text-center text-purple-light py-8">
                <Globe className="w-12 h-12 mx-auto mb-4 text-purple-light opacity-60" />
                <p>No hay noticias disponibles</p>
                <p className="text-sm mt-1">Las noticias se actualizarán automáticamente</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {articles.map((article, index) => (
                  <div key={index} className="p-4 border border-purple rounded-lg hover:bg-purple-deep hover:bg-opacity-30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-white leading-tight flex-1 pr-4">
                        {article.title}
                      </h3>
                      {showSentiment && (
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {getSentimentIcon(article.overall_sentiment_label)}
                          {article.overall_sentiment_score && (
                            <span className={`text-sm font-medium ${getSentimentColor(article.overall_sentiment_score)}`}>
                              {(article.overall_sentiment_score * 100).toFixed(0)}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-purple-light text-sm leading-relaxed mb-3">
                      {article.summary}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 text-sm text-purple-light">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatTimeAgo(article.time_published)}
                        </span>
                        <span className="font-medium text-pink-400">{article.source}</span>
                        {article.category && (
                          <Badge variant="outline" className="text-xs border-purple-light text-purple-light bg-purple-deep bg-opacity-30">
                            {getCategoryLabel(article.category)}
                          </Badge>
                        )}
                      </div>
                      {article.url !== '#' && (
                        <Button variant="ghost" size="sm" className="text-pink-400 p-0 h-auto hover:text-pink-300">
                          <ExternalLink className="w-4 h-4 mr-1" />
                          Leer más
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {newsData && (
          <div className="mt-4 pt-3 border-t border-purple text-center">
            <p className="text-sm text-purple-light">
              Última actualización: {new Date(newsData.news.lastUpdated).toLocaleTimeString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}