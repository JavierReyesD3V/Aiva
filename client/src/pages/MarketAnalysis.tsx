import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUserActions } from "@/contexts/UserActionsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import MarketWidget from "@/components/MarketWidget";
import FinancialNews from "@/components/FinancialNews";
import EconomicCalendar from "@/components/EconomicCalendar";
import TradeForm from "@/components/TradeForm";
import ImportModal from "@/components/ImportModal";
import MobileHeader from "@/components/MobileHeader";
import { useToast } from "@/hooks/use-toast";
import { 
  BarChart3, 
  LineChart, 
  Globe, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Activity,
  Target,
  Search
} from "lucide-react";

interface MarketOverview {
  symbol: string;
  quotes: any[];
  historical: any[];
  trend: 'up' | 'down' | 'sideways';
  volatility: number;
  support: number;
  resistance: number;
}

export default function MarketAnalysis() {
  const [customSymbols, setCustomSymbols] = useState("");
  const [watchlistSymbols, setWatchlistSymbols] = useState(['EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD']);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importModalMode, setImportModalMode] = useState<'new' | 'change' | 'clear'>('new');
  
  const { toast } = useToast();
  const { setUserActions } = useUserActions();

  // Configure context functions for Sidebar buttons
  useEffect(() => {
    setUserActions({
      onShowTradeForm: () => setShowTradeForm(true),
      onShowImportModal: (mode: 'new' | 'change' | 'clear') => {
        setImportModalMode(mode);
        setShowImportModal(true);
      }
    });
  }, [setUserActions]);

  // Market overview query
  const { data: overviewData, isLoading: overviewLoading } = useQuery({
    queryKey: ['/api/market/overview', watchlistSymbols.join(',')],
    queryFn: async () => {
      const response = await fetch(`/api/market/overview?symbols=${watchlistSymbols.join(',')}`);
      if (!response.ok) {
        throw new Error('Failed to fetch market overview');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
  });

  // Currency list query
  const { data: currenciesData } = useQuery({
    queryKey: ['/api/market/currencies'],
    queryFn: async () => {
      const response = await fetch('/api/market/currencies');
      if (!response.ok) {
        throw new Error('Failed to fetch currencies');
      }
      return response.json();
    },
  });

  // API connection test
  const { data: testData, isLoading: testLoading, error: testError } = useQuery({
    queryKey: ['/api/market/test'],
    queryFn: async () => {
      const response = await fetch('/api/market/test');
      const data = await response.json();
      return data;
    },
  });

  const handleAddSymbol = () => {
    if (!customSymbols.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa al menos un símbolo válido.",
        variant: "destructive",
      });
      return;
    }

    // Validate and clean symbols - only allow alphanumeric characters
    const allSymbols = customSymbols.split(',').map(s => s.trim().toUpperCase());
    const validSymbols = allSymbols.filter(s => /^[A-Z0-9]{1,10}$/.test(s));
    const invalidSymbols = allSymbols.filter(s => !/^[A-Z0-9]{1,10}$/.test(s));
    
    if (invalidSymbols.length > 0) {
      toast({
        title: "Símbolos inválidos detectados",
        description: `Los siguientes símbolos no son válidos: ${invalidSymbols.join(', ')}. Solo se permiten letras y números (máximo 10 caracteres).`,
        variant: "destructive",
      });
    }
    
    if (validSymbols.length === 0) {
      return;
    }
    
    const newSymbols = validSymbols.filter(s => !watchlistSymbols.includes(s));
    const duplicateSymbols = validSymbols.filter(s => watchlistSymbols.includes(s));
    
    if (duplicateSymbols.length > 0) {
      toast({
        title: "Símbolos duplicados",
        description: `Los siguientes símbolos ya están en la lista: ${duplicateSymbols.join(', ')}`,
        variant: "destructive",
      });
    }
    
    if (newSymbols.length > 0) {
      setWatchlistSymbols(prev => [...prev, ...newSymbols]);
      toast({
        title: "Símbolos agregados",
        description: `Se agregaron ${newSymbols.length} símbolo(s): ${newSymbols.join(', ')}`,
      });
    }
    
    setCustomSymbols("");
  };

  const handleRemoveSymbol = (symbol: string) => {
    setWatchlistSymbols(prev => prev.filter(s => s !== symbol));
  };

  // Handle input change with validation and character limit
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Limit to 100 characters total
    if (value.length > 100) {
      toast({
        title: "Límite de caracteres excedido",
        description: "El campo no puede contener más de 100 caracteres.",
        variant: "destructive",
      });
      return;
    }
    
    setCustomSymbols(value);
  };

  const marketData: MarketOverview[] = overviewData?.data || [];
  const currencies: string[] = currenciesData?.currencies || [];

  const getTrendColor = (trend: 'up' | 'down' | 'sideways') => {
    switch (trend) {
      case 'up': return 'text-green-300 bg-green-500 bg-opacity-20 border-green-400 font-semibold';
      case 'down': return 'text-red-300 bg-red-500 bg-opacity-20 border-red-400 font-semibold';
      default: return 'text-purple-light bg-purple-deep bg-opacity-30 border-purple font-semibold';
    }
  };

  const getVolatilityLevel = (volatility: number) => {
    if (volatility < 1) return { level: 'Baja', color: 'text-green-300' };
    if (volatility < 3) return { level: 'Media', color: 'text-yellow-300' };
    return { level: 'Alta', color: 'text-red-300' };
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Mobile Header */}
      <MobileHeader 
        title="Análisis Mercado" 
        subtitle="Market Analysis"

      />
      
      {/* Desktop Header */}
      <header className="bg-card-gradient border-b border-purple p-6 shadow-sm hidden md:block">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Globe className="w-8 h-8 mr-3 text-pink-400" />
              Análisis de Mercado
            </h2>
            <p className="text-purple-light">
              Datos en tiempo real y análisis avanzado de mercados financieros
            </p>
          </div>
          
          {/* API Status */}
          <div className="flex items-center space-x-2">
            {testLoading ? (
              <Badge variant="outline" className="border-yellow-400 text-yellow-400 bg-yellow-500 bg-opacity-20">
                <Activity className="w-4 h-4 mr-1 animate-pulse" />
                Conectando...
              </Badge>
            ) : testError || !testData?.success ? (
              <Badge variant="outline" className="border-red-400 text-red-400 bg-red-500 bg-opacity-20">
                <AlertTriangle className="w-4 h-4 mr-1" />
                Sin conexión API
              </Badge>
            ) : (
              <Badge variant="outline" className="border-green-400 text-green-400 bg-green-500 bg-opacity-20">
                <CheckCircle className="w-4 h-4 mr-1" />
                API Conectada
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <Tabs defaultValue="live" className="space-y-6">
          <TabsList className="flex w-full md:grid md:grid-cols-5 bg-card-gradient border border-purple overflow-x-auto">
            <TabsTrigger value="live" className="data-[state=active]:bg-gradient-to-r from-pink-500 to-purple-600 data-[state=active]:text-white text-purple-light flex-shrink-0">
              Datos en Vivo
            </TabsTrigger>
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r from-pink-500 to-purple-600 data-[state=active]:text-white text-purple-light flex-shrink-0">
              Resumen de Mercado
            </TabsTrigger>
            <TabsTrigger value="calendar" className="data-[state=active]:bg-gradient-to-r from-pink-500 to-purple-600 data-[state=active]:text-white text-purple-light flex-shrink-0">
              Calendario
            </TabsTrigger>
            <TabsTrigger value="news" className="data-[state=active]:bg-gradient-to-r from-pink-500 to-purple-600 data-[state=active]:text-white text-purple-light flex-shrink-0">
              Noticias
            </TabsTrigger>
            <TabsTrigger value="watchlist" className="data-[state=active]:bg-gradient-to-r from-pink-500 to-purple-600 data-[state=active]:text-white text-purple-light flex-shrink-0">
              Lista de Seguimiento
            </TabsTrigger>
          </TabsList>

          {/* Live Data Tab */}
          <TabsContent value="live" className="space-y-6">
            <MarketWidget 
              symbols={watchlistSymbols}
              showSignals={true}
              autoRefresh={true}
              refreshInterval={30000}
            />
          </TabsContent>

          {/* Economic Calendar Tab */}
          <TabsContent value="calendar" className="space-y-6">
            <EconomicCalendar 
              days={7}
              compact={false}
            />
          </TabsContent>

          {/* Financial News Tab */}
          <TabsContent value="news" className="space-y-6">
            <FinancialNews 
              category="general"
              limit={15}
              showSentiment={true}
              compact={false}
            />
          </TabsContent>

          {/* Market Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-card-gradient border-purple shadow-lg">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-pink-400" />
                  Resumen General del Mercado
                </CardTitle>
              </CardHeader>
              <CardContent>
                {overviewLoading ? (
                  <div className="text-center text-purple-light py-8">
                    Cargando análisis de mercado...
                  </div>
                ) : marketData.length === 0 ? (
                  <div className="text-center text-purple-light py-8">
                    <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-purple-light" />
                    <p>No hay datos de mercado disponibles</p>
                    <p className="text-sm mt-2">Verifica tu clave API de TraderMade</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {marketData.map((market) => {
                      const volatilityInfo = getVolatilityLevel(market.volatility);
                      return (
                        <div key={market.symbol} className="p-4 border border-purple rounded-lg bg-purple-deep bg-opacity-40">
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-lg text-white">{market.symbol}</h3>
                            <Badge className={`${getTrendColor(market.trend)} text-white`}>
                              {market.trend === 'up' ? 'Alcista' : market.trend === 'down' ? 'Bajista' : 'Lateral'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <Label className="text-sm text-purple-light">Soporte</Label>
                              <div className="font-mono text-green-400">{market.support.toFixed(5)}</div>
                            </div>
                            <div>
                              <Label className="text-sm text-purple-light">Resistencia</Label>
                              <div className="font-mono text-red-400">{market.resistance.toFixed(5)}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <Label className="text-sm text-purple-light">Volatilidad</Label>
                              <div className={`font-medium ${volatilityInfo.color.replace('text-', 'text-')}`}>
                                {market.volatility.toFixed(2)}% ({volatilityInfo.level})
                              </div>
                            </div>
                            <div className="text-right">
                              <Label className="text-sm text-purple-light">Datos Históricos</Label>
                              <div className="text-white">{market.historical.length} períodos</div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Watchlist Tab */}
          <TabsContent value="watchlist" className="space-y-6">
            {/* Add Symbols Card */}
            <Card className="bg-card-gradient border-purple shadow-lg">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Search className="w-5 h-5 mr-2 text-pink-400" />
                  Agregar Nuevos Símbolos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <div className="flex-1">
                    <Label className="text-purple-light">Símbolos a Agregar</Label>
                    <Input
                      value={customSymbols}
                      onChange={handleInputChange}
                      placeholder="EURUSD, GBPUSD, USDJPY..."
                      maxLength={100}
                      className="bg-gray-800 border-purple-600/30 text-white placeholder:text-purple-300 focus:border-pink-400 focus:ring-2 focus:ring-pink-400/50 focus:ring-offset-0 caret-white"
                      style={{ color: 'white' }}
                    />
                    <div className="flex justify-between items-center mt-1">
                      <p className="text-sm text-purple-light">
                        Separa múltiples símbolos con comas (solo letras y números)
                      </p>
                      <p className="text-xs text-purple-400">
                        {customSymbols.length}/100
                      </p>
                    </div>
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={handleAddSymbol}
                      disabled={!customSymbols.trim()}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Watchlist Card */}
            <Card className="bg-card-gradient border-purple shadow-lg">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Target className="w-5 h-5 mr-2 text-pink-400" />
                  Lista de Seguimiento Actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {watchlistSymbols.map((symbol) => (
                    <div
                      key={symbol}
                      className="p-4 border border-purple rounded-lg bg-purple-deep bg-opacity-40 hover:bg-red-500 hover:bg-opacity-20 transition-colors cursor-pointer group"
                      onClick={() => handleRemoveSymbol(symbol)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white group-hover:text-red-300">
                          {symbol}
                        </span>
                        <span className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          ×
                        </span>
                      </div>
                      <p className="text-xs text-purple-light group-hover:text-red-200 mt-1">
                        Clic para eliminar
                      </p>
                    </div>
                  ))}
                  {watchlistSymbols.length === 0 && (
                    <div className="col-span-full p-8 text-center">
                      <div className="text-purple-light">
                        <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No hay símbolos en seguimiento</p>
                        <p className="text-sm mt-2">Agrega algunos símbolos arriba para comenzar</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Available Currencies Card */}
            {currencies.length > 0 && (
              <Card className="bg-card-gradient border-purple shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-pink-400" />
                    Pares de Divisas Disponibles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-64 overflow-y-auto">
                    {currencies.slice(0, 60).map((currency) => (
                      <div
                        key={currency}
                        className="p-3 border border-purple rounded-lg bg-purple-deep bg-opacity-20 hover:bg-purple-deep hover:bg-opacity-40 transition-colors cursor-pointer text-center"
                        onClick={() => {
                          if (!watchlistSymbols.includes(currency)) {
                            setWatchlistSymbols(prev => [...prev, currency]);
                          }
                        }}
                      >
                        <span className="text-sm font-mono text-purple-light hover:text-white">
                          {currency}
                        </span>
                      </div>
                    ))}
                  </div>
                  {currencies.length > 60 && (
                    <div className="mt-4 p-3 bg-purple-deep bg-opacity-20 rounded-lg border border-purple">
                      <p className="text-sm text-purple-light text-center">
                        Y {currencies.length - 60} pares más disponibles...
                      </p>
                    </div>
                  )}
                  <div className="mt-4 p-3 bg-purple-deep bg-opacity-20 rounded-lg border border-purple">
                    <p className="text-xs text-purple-light text-center">
                      💡 Haz clic en cualquier par para agregarlo a tu lista de seguimiento
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Sidebar Modal Integration */}
      <TradeForm open={showTradeForm} onOpenChange={setShowTradeForm} />
      <ImportModal 
        open={showImportModal} 
        onOpenChange={setShowImportModal}
        mode={importModalMode}
      />
    </div>
  );
}