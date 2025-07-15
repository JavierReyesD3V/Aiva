import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw, 
  BarChart3,
  Activity,
  DollarSign
} from "lucide-react";

interface LiveQuote {
  instrument: string;
  bid: number;
  ask: number;
  mid: number;
  timestamp: number;
  spread: number;
}

interface MarketSignal {
  symbol: string;
  signal: 'BUY' | 'SELL' | 'NEUTRAL';
  strength: number;
  currentPrice: number;
  trend: 'up' | 'down' | 'sideways';
  volatility: number;
  support: number;
  resistance: number;
  recommendation: string;
  timestamp: number;
}

interface MarketWidgetProps {
  symbols?: string[];
  showSignals?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export default function MarketWidget({ 
  symbols = ['EURUSD', 'GBPUSD', 'USDJPY'],
  showSignals = true,
  autoRefresh = true,
  refreshInterval = 30000 
}: MarketWidgetProps) {
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Live quotes query
  const { 
    data: quotesData, 
    isLoading: quotesLoading, 
    refetch: refetchQuotes 
  } = useQuery({
    queryKey: ['/api/market/quotes', symbols.join(',')],
    queryFn: async () => {
      const response = await fetch(`/api/market/quotes?symbols=${symbols.join(',')}`);
      if (!response.ok) {
        throw new Error('Failed to fetch market quotes');
      }
      return response.json();
    },
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  // Market signals query
  const { 
    data: signalsData, 
    isLoading: signalsLoading,
    refetch: refetchSignals 
  } = useQuery({
    queryKey: ['/api/market/signals', symbols.join(',')],
    queryFn: async () => {
      const response = await fetch(`/api/market/signals?symbols=${symbols.join(',')}`);
      if (!response.ok) {
        throw new Error('Failed to fetch market signals');
      }
      return response.json();
    },
    enabled: showSignals,
    refetchInterval: autoRefresh ? refreshInterval * 2 : false, // Less frequent updates for signals
  });

  // Update timestamp when data changes
  useEffect(() => {
    if (quotesData || signalsData) {
      setLastUpdate(new Date());
    }
  }, [quotesData, signalsData]);

  const handleRefresh = () => {
    refetchQuotes();
    if (showSignals) {
      refetchSignals();
    }
  };

  const formatPrice = (price: number, digits: number = 5) => {
    return price.toFixed(digits);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'sideways') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSignalColor = (signal: 'BUY' | 'SELL' | 'NEUTRAL') => {
    switch (signal) {
      case 'BUY':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'SELL':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-purple-600/20 text-purple-light border-purple';
    }
  };

  const quotes: LiveQuote[] = quotesData?.data || [];
  const signals: MarketSignal[] = signalsData?.signals || [];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 text-pink-400" />
          <h3 className="text-lg font-semibold text-white">Datos de Mercado en Vivo</h3>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-purple-light">
            Última actualización: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={quotesLoading || signalsLoading}
            className="border-purple bg-purple-deep bg-opacity-40 text-purple-light hover:bg-purple-deep hover:bg-opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${(quotesLoading || signalsLoading) ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Live Quotes */}
      <Card className="bg-card-gradient border-purple shadow-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-pink-400" />
            Cotizaciones en Vivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          {quotesLoading ? (
            <div className="text-center text-purple-light py-4">
              Cargando cotizaciones...
            </div>
          ) : quotes.length === 0 ? (
            <div className="text-center text-purple-light py-4">
              No hay cotizaciones disponibles
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quotes.map((quote) => (
                <div key={quote.instrument} className="p-4 border border-purple rounded-lg bg-purple-deep bg-opacity-40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-white">{quote.instrument}</span>
                    <span className="text-sm text-purple-light">
                      Spread: {formatPrice(quote.spread, 5)}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="text-purple-light block">Bid</span>
                      <span className="font-mono text-red-400">{formatPrice(quote.bid)}</span>
                    </div>
                    <div>
                      <span className="text-purple-light block">Ask</span>
                      <span className="font-mono text-green-400">{formatPrice(quote.ask)}</span>
                    </div>
                    <div>
                      <span className="text-purple-light block">Mid</span>
                      <span className="font-mono text-white">{formatPrice(quote.mid)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Signals */}
      {showSignals && (
        <Card className="bg-card-gradient border-purple shadow-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-pink-400" />
              Señales de Trading
            </CardTitle>
          </CardHeader>
          <CardContent>
            {signalsLoading ? (
              <div className="text-center text-purple-light py-4">
                Analizando señales de mercado...
              </div>
            ) : signals.length === 0 ? (
              <div className="text-center text-purple-light py-4">
                No hay señales disponibles
              </div>
            ) : (
              <div className="space-y-4">
                {signals.map((signal) => (
                  <div key={signal.symbol} className="p-4 border border-purple rounded-lg bg-purple-deep bg-opacity-40">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="font-semibold text-white">{signal.symbol}</span>
                        {getTrendIcon(signal.trend)}
                        <Badge className={getSignalColor(signal.signal)}>
                          {signal.signal}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-white">{formatPrice(signal.currentPrice)}</div>
                        <div className="text-sm text-purple-light">Fuerza: {signal.strength}%</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                      <div>
                        <span className="text-purple-light block">Tendencia</span>
                        <span className="font-medium text-white capitalize">{signal.trend}</span>
                      </div>
                      <div>
                        <span className="text-purple-light block">Volatilidad</span>
                        <span className="font-medium text-white">{signal.volatility.toFixed(2)}%</span>
                      </div>
                      <div>
                        <span className="text-purple-light block">Soporte</span>
                        <span className="font-mono text-green-400">{formatPrice(signal.support)}</span>
                      </div>
                      <div>
                        <span className="text-purple-light block">Resistencia</span>
                        <span className="font-mono text-red-400">{formatPrice(signal.resistance)}</span>
                      </div>
                    </div>
                    
                    <div className="bg-purple-deep bg-opacity-60 border border-purple p-3 rounded-md">
                      <span className="text-sm text-purple-light">{signal.recommendation}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}