import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Globe, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Link } from "wouter";

interface LiveQuote {
  instrument: string;
  bid: number;
  ask: number;
  mid: number;
  timestamp: number;
  spread: number;
}

export default function MarketOverview() {
  const majorPairs = ['EURUSD', 'GBPUSD', 'USDJPY'];

  const { 
    data: quotesData, 
    isLoading, 
    refetch,
    error 
  } = useQuery({
    queryKey: ['/api/market/quotes', majorPairs.join(',')],
    queryFn: async () => {
      const response = await fetch(`/api/market/quotes?symbols=${majorPairs.join(',')}`);
      if (!response.ok) {
        throw new Error('Failed to fetch market quotes');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  const quotes: LiveQuote[] = quotesData?.data || [];

  const formatPrice = (price: number, digits: number = 5) => {
    return price.toFixed(digits);
  };

  const getPriceChangeColor = (spread: number) => {
    // Since we don't have previous price, use spread as indicator
    if (spread < 0.0001) return 'text-green-600';
    if (spread > 0.0005) return 'text-red-600';
    return 'text-gray-600';
  };

  if (error) {
    return (
      <Card className="bg-card-gradient border-purple shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center">
              <Globe className="w-5 h-5 mr-2 text-pink-400" />
              Mercados en Vivo
            </div>
            <Badge variant="outline" className="border-red-400/50 text-red-400 bg-red-500/10">
              Sin conexión
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-purple-light py-4">
            <p>No se pueden cargar los datos de mercado</p>
            <p className="text-sm mt-1">Verifica la configuración de la API</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card-gradient border-purple shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center">
            <Globe className="w-5 h-5 mr-2 text-pink-400" />
            Mercados en Vivo
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="border-green-400/50 text-green-400 bg-green-500/10">
              En vivo
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="h-6 w-6 p-0 text-purple-light hover:text-white hover:bg-purple-600/20"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex justify-between items-center p-2">
                <div className="bg-purple-600/30 h-4 w-16 rounded animate-pulse"></div>
                <div className="bg-purple-600/30 h-4 w-20 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-center text-purple-light py-4">
            <p>No hay datos disponibles</p>
          </div>
        ) : (
          <div className="space-y-3">
            {quotes.map((quote) => (
              <div key={quote.instrument} className="flex justify-between items-center p-2 hover:bg-purple-600/10 rounded transition-colors duration-200">
                <div>
                  <div className="font-semibold text-white">{quote.instrument}</div>
                  <div className="text-xs text-purple-light">
                    Spread: {formatPrice(quote.spread, 5)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm text-pink-400">
                    {formatPrice(quote.mid)}
                  </div>
                  <div className="text-xs text-purple-light">
                    {formatPrice(quote.bid)} / {formatPrice(quote.ask)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-4 pt-3 border-t border-purple-600">
          <Link href="/market-analysis">
            <Button variant="outline" className="w-full text-sm border-purple-400/50 text-purple-300 hover:bg-purple-600/20 hover:text-white transition-all duration-200">
              Ver Análisis Completo
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}