import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useUserActions } from "@/contexts/UserActionsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TradeForm from "@/components/TradeForm";
import ImportModal from "@/components/ImportModal";
import MobileHeader from "@/components/MobileHeader";
import { 
  Brain, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Target,
  Clock,
  DollarSign,
  BarChart3,
  Lightbulb,
  RefreshCw,
  FileText,
  Download
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
// PremiumModal removed - all features are now free

export default function AIAnalysis() {
  const { toast } = useToast();
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importModalMode, setImportModalMode] = useState<'new' | 'change' | 'clear'>('new');
  const { canAccess, isPremium } = useSubscription();
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

  // Premium modal removed - all features are now free

  const { data: trades = [] } = useQuery<any[]>({
    queryKey: ["/api/trades"],
  });

  const generateAnalysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/analyze", {});
      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisData(data);
      toast({
        title: "Analysis Complete",
        description: "AI analysis has been generated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to generate AI analysis.",
        variant: "destructive",
      });
    },
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/reports/html", {
        method: "GET",
        headers: {
          "Accept": "text/html",
        },
        credentials: "include", // Include cookies for authentication
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al generar el reporte");
      }
      
      return response.blob();
    },
    onSuccess: (blob: Blob) => {
      // Create download link for the HTML report
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-analisis-trading-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Reporte HTML Generado",
        description: "Tu reporte completo de análisis ha sido descargado en formato HTML con diseño profesional.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error al Generar Reporte",
        description: error.message || "No se pudo generar el reporte completo.",
        variant: "destructive",
      });
    },
  });



  const handleGenerateAnalysis = async () => {
    // All features are now free - generate analysis directly
    generateAnalysisMutation.mutate();
  };

  const handleGenerateComprehensiveReport = async () => {
    // All features are now free - generate report directly
    generateReportMutation.mutate();
  };

  // Mock data for demonstration when no real analysis is available
  const mockAnalysis = {
    patterns: {
      timeBasedPatterns: [
        "Most successful trades occur during European session (8 AM - 4 PM GMT)",
        "Friday trades show 23% lower success rate due to weekend risk",
        "Early morning trades (6-9 AM) have highest win rate at 78%"
      ],
      symbolPerformance: [
        { symbol: "EURUSD", performance: "Excellent performance with 85% win rate", confidence: 0.92 },
        { symbol: "XAUUSD", performance: "Volatile but profitable, requires better risk management", confidence: 0.78 },
        { symbol: "GBPUSD", performance: "Inconsistent results, consider reducing exposure", confidence: 0.65 }
      ],
      riskPatterns: [
        "Stop-loss discipline is excellent with 98% adherence rate",
        "Position sizing could be optimized for better risk-reward",
        "Overtrading detected on high volatility days"
      ]
    },
    recommendations: {
      riskManagement: [
        "Reduce position size by 25% on XAUUSD trades during high volatility",
        "Implement maximum 3 trades per day rule to avoid overtrading",
        "Consider wider stop-losses on Friday trades due to gap risk"
      ],
      timing: [
        "Focus trading during European session for best results",
        "Avoid trading 30 minutes before major news releases",
        "Consider closing positions before weekend if holding overnight"
      ],
      strategy: [
        "Increase EURUSD allocation based on strong performance",
        "Develop specific strategy for XAUUSD to handle volatility",
        "Implement profit-taking rules for trades with >50 pip gains"
      ]
    },
    strengths: [
      "Excellent risk management with consistent stop-loss usage",
      "Strong performance on major currency pairs",
      "Good discipline in following trading plan",
      "Effective use of technical analysis for entries"
    ],
    weaknesses: [
      "Tendency to overtrade during volatile market conditions",
      "Inconsistent performance on exotic currency pairs",
      "Could improve position sizing for better risk optimization",
      "Weekend gap risk not adequately managed"
    ],
    overallScore: 78,
    nextSteps: [
      "Implement position sizing calculator for optimal risk per trade",
      "Create trading journal with entry/exit reasons for better analysis",
      "Develop specific rules for trading during news events",
      "Consider using trailing stops on profitable trades"
    ]
  };

  const displayData = analysisData || mockAnalysis;

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Mobile Header */}
      <MobileHeader 
        title="Análisis AIVA" 
        subtitle="AI Analysis"

      />
      
      {/* Desktop Header */}
      <header className="bg-card-gradient border-b border-purple p-6 shadow-sm hidden md:block">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Brain className="w-8 h-8 mr-3 text-pink-400" />
              Análisis AIVA
            </h2>
            <p className="text-purple-light">
              Análisis avanzados de AIVA para mejorar tu rendimiento de trading
            </p>
          </div>
          <Button
            onClick={handleGenerateAnalysis}
            disabled={generateAnalysisMutation.isPending}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
          >
            {generateAnalysisMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Generate New Analysis
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Overall Score */}
        <Card className="bg-card-gradient border-purple shadow-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Target className="w-5 h-5 mr-2 text-pink-400" />
              Trading Performance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <div className="relative w-24 h-24">
                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#6b7280"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#ec4899"
                    strokeWidth="2"
                    strokeDasharray={`${displayData.overallScore}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">{displayData.overallScore}</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {displayData.overallScore >= 80 ? "Excellent" : 
                   displayData.overallScore >= 60 ? "Good" : "Needs Improvement"} Trading Performance
                </h3>
                <p className="text-purple-light">
                  Based on analysis of {trades.length} trades, your trading shows strong fundamentals with room for optimization.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Tabs */}
        <Tabs defaultValue="patterns" className="space-y-6">
          <TabsList className="flex w-full md:grid md:grid-cols-4 bg-card-gradient border-purple overflow-x-auto">
            <TabsTrigger value="patterns" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-purple-light flex-shrink-0">
              Pattern Analysis
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-purple-light flex-shrink-0">
              Recommendations
            </TabsTrigger>
            <TabsTrigger value="strengths" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-purple-light flex-shrink-0">
              Strengths & Weaknesses
            </TabsTrigger>
            <TabsTrigger value="next-steps" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white text-purple-light flex-shrink-0">
              Next Steps
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patterns" className="space-y-6">
            {/* Time-Based Patterns */}
            <Card className="bg-card-gradient border-purple shadow-lg">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-pink-400" />
                  Time-Based Trading Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayData.patterns.timeBasedPatterns.map((pattern: string, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-pink-400 rounded-full mt-2"></div>
                      <p className="text-purple-light">{pattern}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Symbol Performance */}
            <Card className="bg-card-gradient border-purple shadow-lg">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2 text-pink-400" />
                  Symbol Performance Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayData.patterns.symbolPerformance.map((item: any, index: number) => (
                    <div key={index} className="bg-purple-deep bg-opacity-40 rounded-lg p-4 border border-purple">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-white">{item.symbol}</span>
                        <Badge 
                          variant="secondary"
                          className={
                            item.confidence >= 0.8 ? "bg-green-500 text-white" :
                            item.confidence >= 0.6 ? "bg-yellow-500 text-white" :
                            "bg-red-500 text-white"
                          }
                        >
                          {Math.round(item.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      <p className="text-purple-light text-sm">{item.performance}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Risk Patterns */}
            <Card className="bg-card-gradient border-purple shadow-lg">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
                  Risk Management Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayData.patterns.riskPatterns.map((pattern: string, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                      <p className="text-purple-light">{pattern}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-6">
            {/* Risk Management Recommendations */}
            <Card className="bg-card-gradient border-purple shadow-lg">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-yellow-400" />
                  Risk Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {displayData.recommendations.riskManagement.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <p className="text-purple-light">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Timing Recommendations */}
            <Card className="bg-card-gradient border-purple shadow-lg">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-pink-400" />
                  Timing Optimization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {displayData.recommendations.timing.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-pink-400 mt-0.5 flex-shrink-0" />
                      <p className="text-purple-light">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Strategy Recommendations */}
            <Card className="bg-card-gradient border-purple shadow-lg">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
                  Strategy Enhancement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {displayData.recommendations.strategy.map((rec: string, index: number) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                      <p className="text-purple-light">{rec}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="strengths" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Strengths */}
              <Card className="bg-card-gradient border-purple shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                    Your Trading Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {displayData.strengths.map((strength: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                        <p className="text-purple-light">{strength}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Weaknesses */}
              <Card className="bg-card-gradient border-purple shadow-lg">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {displayData.weaknesses.map((weakness: string, index: number) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
                        <p className="text-purple-light">{weakness}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="next-steps" className="space-y-6">
            <Card className="bg-card-gradient border-purple shadow-lg">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Lightbulb className="w-5 h-5 mr-2 text-pink-400" />
                  Actionable Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {displayData.nextSteps.map((step: string, index: number) => (
                    <div key={index} className="bg-purple-deep bg-opacity-40 rounded-lg p-4 border border-purple">
                      <div className="flex items-start space-x-4">
                        <div className="w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-medium text-sm">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-purple-light">{step}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Comprehensive Report Generation Button */}
        <Card className="bg-card-gradient border-purple shadow-lg">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-pink-500 bg-opacity-20 rounded-full flex items-center justify-center">
                  <FileText className="w-8 h-8 text-pink-400" />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-bold text-white">
                  Reporte Completo de Análisis Profundo
                </h3>
                <p className="text-purple-light max-w-2xl mx-auto">
                  Genera un análisis exhaustivo de tu trading que incluye patrones de tiempo, 
                  análisis de operaciones ganadoras vs perdedoras, gestión de riesgo, 
                  recomendaciones psicológicas y técnicas personalizadas con ejemplos específicos 
                  para mejorar tu rendimiento.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
                <div className="text-center">
                  <Clock className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                  <p className="text-sm text-purple-light">Análisis Temporal</p>
                </div>
                <div className="text-center">
                  <BarChart3 className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <p className="text-sm text-purple-light">Rendimiento por Símbolo</p>
                </div>
                <div className="text-center">
                  <Brain className="w-6 h-6 text-purple-light mx-auto mb-2" />
                  <p className="text-sm text-purple-light">Psicotrading</p>
                </div>
                <div className="text-center">
                  <Target className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                  <p className="text-sm text-purple-light">Recomendaciones</p>
                </div>
              </div>

              <Button
                onClick={handleGenerateComprehensiveReport}
                disabled={generateReportMutation.isPending || trades.length === 0}
                size="lg"
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 text-lg"
              >
                {generateReportMutation.isPending ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Generando Reporte...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5 mr-2" />
                    Generar Reporte PDF Completo
                  </>
                )}
              </Button>

              {trades.length === 0 && (
                <p className="text-sm text-purple-light">
                  Necesitas tener trades registrados para generar el reporte
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* PremiumModal removed - all features are now free */}

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
