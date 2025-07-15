import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Brain, RefreshCw, CheckCircle, AlertTriangle, Target, Clock, Loader2 } from "lucide-react";
import TradingChatbot from "@/components/TradingChatbot";
import { useSubscription } from "@/hooks/useSubscription";
// PremiumModal removed - all features are now free

interface TradingAdvice {
  id: number;
  category: 'risk_management' | 'timing' | 'symbol_selection' | 'position_sizing' | 'psychology';
  title: string;
  advice: string;
  reasoning: string;
  basedOnData: string;
  priority: 'high' | 'medium' | 'low';
  confidenceScore: number;
  potentialImpact: string;
  createdAt: string;
  status: string;
}

export default function TradeSuggestions() {
  const { toast } = useToast();
  const { canAccess, isPremium } = useSubscription();
  // Premium modal removed - all features are now free

  const { data: advice = [], isLoading, error } = useQuery<TradingAdvice[]>({
    queryKey: ["/api/suggestions"],
  });

  const generateAdviceMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/suggestions/generate", {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
      toast({
        title: "Consejos Generados",
        description: "Nuevos consejos personalizados han sido creados basados en tu historial de trading.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudieron generar consejos.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/suggestions/${id}/status`, { status });
      return response.json();
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
      const statusMessage = status === 'implemented' ? 'implementado' : 'descartado';
      toast({
        title: "Consejo Actualizado",
        description: `El consejo ha sido ${statusMessage}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar el consejo.",
        variant: "destructive",
      });
    },
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-600/20 text-red-400 border-red-600/30';
      case 'medium': return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
      case 'low': return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      default: return 'bg-gray-600/20 text-gray-400 border-gray-600/30';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return 'bg-green-600/20 text-green-400 border-green-600/30';
    if (score >= 60) return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
    return 'bg-red-600/20 text-red-400 border-red-600/30';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'risk_management': return <AlertTriangle className="w-4 h-4" />;
      case 'timing': return <Clock className="w-4 h-4" />;
      case 'symbol_selection': return <Target className="w-4 h-4" />;
      case 'position_sizing': return <Brain className="w-4 h-4" />;
      case 'psychology': return <Brain className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chatbot IA - Sidebar */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <TradingChatbot />
          </div>
          
          {/* Consejos AI - Contenido Principal */}
          <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Asistente IA & Consejos</h1>
              <p className="text-gray-400">
                Chatea con tu asistente personal de trading y recibe consejos basados en tus datos
              </p>
            </div>

            <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center">
                <Brain className="w-6 h-6 mr-3 text-primary" />
                Generar Nuevos Consejos
              </div>
              <Button
                onClick={() => {
                  // All features are now free - generate suggestions directly
                  generateAdviceMutation.mutate();
                }}
                disabled={generateAdviceMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                {generateAdviceMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Generar Consejos AI
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm">
              Los consejos se generan analizando tus patrones de trading, pares más rentables, 
              mejores horarios, y gestión de riesgo basándose en tu historial real de trades.
            </p>
          </CardContent>
            </Card>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-700 rounded w-3/4 mb-3"></div>
                      <div className="h-3 bg-gray-700 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              </div>
            ) : error ? (
              <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
                <CardContent className="p-6 text-center">
                  <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                  <p className="text-red-400 mb-4">Error al cargar consejos</p>
                  <Button onClick={() => window.location.reload()}>
                    Reintentar
                  </Button>
                </CardContent>
              </Card>
            ) : advice.length === 0 ? (
              <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
                <CardContent className="p-12 text-center">
                  <Brain className="w-16 h-16 text-gray-600 mx-auto mb-6" />
                  <h3 className="text-xl font-semibold text-white mb-3">
                    No hay consejos disponibles
                  </h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    Primero importa tu historial de trades CSV, luego genera consejos personalizados 
                    basados en tu análisis de rendimiento.
                  </p>
                  <Button
                    onClick={() => {
                      // All features are now free - generate suggestions directly
                      generateAdviceMutation.mutate();
                    }}
                    disabled={generateAdviceMutation.isPending}
                    size="lg"
                    className="bg-primary hover:bg-primary/90"
                  >
                    {generateAdviceMutation.isPending ? (
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    ) : (
                      <Brain className="w-5 h-5 mr-2" />
                    )}
                    Generar Primeros Consejos
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {advice.map((adviceItem: any) => (
                  <Card 
                    key={adviceItem.id}
                    className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50 hover:border-primary/50 transition-colors"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${getPriorityColor(adviceItem.timeframe || 'medium')}`}>
                            {getCategoryIcon(adviceItem.type || 'risk_management')}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white text-lg leading-tight">
                              {adviceItem.reasoning?.split('.')[0] || 'Consejo de Trading'}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={getPriorityColor(adviceItem.timeframe || 'medium')}>
                                {adviceItem.timeframe === 'high' ? 'ALTA' : 
                                 adviceItem.timeframe === 'medium' ? 'MEDIA' : 'BAJA'} PRIORIDAD
                              </Badge>
                              <Badge className={getConfidenceColor(adviceItem.confidenceScore || 70)}>
                                {adviceItem.confidenceScore || 70}% CONFIANZA
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="bg-primary/10 border-l-4 border-primary p-4 rounded-r-lg">
                        <p className="text-gray-200 font-medium">
                          {adviceItem.reasoning || 'Consejo basado en análisis de patrones de trading'}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Basado en:</p>
                          <p className="text-sm text-gray-300">
                            {adviceItem.marketAnalysis || 'Análisis de historial de trading'}
                          </p>
                        </div>

                        <div className="bg-green-900/20 border border-green-600/30 p-3 rounded-lg">
                          <p className="text-sm text-green-400">
                            <strong>Impacto esperado:</strong> Mejorar rendimiento de trading
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => updateStatusMutation.mutate({ 
                              id: adviceItem.id, 
                              status: 'implemented' 
                            })}
                            disabled={updateStatusMutation.isPending}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Implementado
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatusMutation.mutate({ 
                              id: adviceItem.id, 
                              status: 'dismissed' 
                            })}
                            disabled={updateStatusMutation.isPending}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            Descartar
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatDate(adviceItem.createdAt || new Date().toISOString())}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PremiumModal removed - all features are now free */}
    </div>
  );
}