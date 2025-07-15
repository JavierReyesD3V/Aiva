import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserActions } from "@/contexts/UserActionsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TradeForm from "@/components/TradeForm";
import ImportModal from "@/components/ImportModal";
import MobileHeader from "@/components/MobileHeader";
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter,
  BarChart3,
  TrendingUp,
  DollarSign,
  Target,
  Trash2,
  Eye
} from "lucide-react";
import { formatCurrency, formatPercentage, formatDate } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Reports() {
  const [reportType, setReportType] = useState("comprehensive");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadingReportId, setDownloadingReportId] = useState<number | null>(null);
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importModalMode, setImportModalMode] = useState<'new' | 'change' | 'clear'>('new');
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  const { data: trades = [] } = useQuery({
    queryKey: ["/api/trades"],
  });

  const { data: metrics } = useQuery({
    queryKey: ["/api/metrics"],
  });

  const { data: reportHistory = [] } = useQuery({
    queryKey: ["/api/reports/history"],
  });

  const generateReportMutation = useMutation({
    mutationFn: async (reportData: any) => {
      const params = new URLSearchParams();
      if (reportData.startDate) params.append('startDate', reportData.startDate);
      if (reportData.endDate) params.append('endDate', reportData.endDate);
      
      const response = await fetch(`/api/reports/html?${params.toString()}`, {
        method: "GET",
        headers: {
          "Accept": "text/html",
        },
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
      link.download = `reporte-trading-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Reporte HTML Generado",
        description: "Tu reporte de trading ha sido descargado en formato HTML con diseño profesional.",
      });
      
      // Invalidate reports history to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/reports/history"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al Generar Reporte",
        description: error.message || "No se pudo generar el reporte HTML.",
        variant: "destructive",
      });
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      return apiRequest("DELETE", `/api/reports/history/${reportId}`);
    },
    onSuccess: () => {
      toast({
        title: "Reporte Eliminado",
        description: "El reporte ha sido eliminado del historial.",
      });
      
      // Invalidate reports history to refresh the list
      queryClient.invalidateQueries({ queryKey: ["/api/reports/history"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al Eliminar Reporte",
        description: error.message || "No se pudo eliminar el reporte.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    try {
      const reportData = {
        type: reportType,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      };
      
      await generateReportMutation.mutateAsync(reportData);
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate date ranges for quick filters
  const getDateRange = (period: string) => {
    const end = new Date();
    const start = new Date();
    
    switch (period) {
      case "7d":
        start.setDate(start.getDate() - 7);
        break;
      case "30d":
        start.setDate(start.getDate() - 30);
        break;
      case "90d":
        start.setDate(start.getDate() - 90);
        break;
      case "ytd":
        start.setMonth(0, 1);
        break;
      default:
        return { start: "", end: "" };
    }
    
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    };
  };

  const setQuickDateRange = (period: string) => {
    const { start, end } = getDateRange(period);
    setStartDate(start);
    setEndDate(end);
  };

  const reportTemplates = [
    {
      id: "comprehensive",
      name: "Comprehensive Report",
      description: "Complete trading analysis with AI insights, performance metrics, and detailed trade history",
      features: ["Trade History", "Performance Metrics", "AI Analysis", "Risk Assessment", "Charts & Graphs"],
    },
    {
      id: "performance",
      name: "Performance Summary",
      description: "Focus on key performance indicators and trading statistics",
      features: ["P&L Summary", "Win/Loss Ratios", "Key Metrics", "Monthly Performance"],
    },
    {
      id: "tax",
      name: "Tax Report",
      description: "Formatted report for tax purposes with realized gains/losses",
      features: ["Realized P&L", "Trade Details", "Tax-Compliant Format", "Yearly Summary"],
    },
    {
      id: "risk",
      name: "Risk Analysis",
      description: "Deep dive into risk management and drawdown analysis",
      features: ["Risk Metrics", "Drawdown Analysis", "Position Sizing", "Risk-Adjusted Returns"],
    },
  ];

  const quickStats = {
    totalTrades: (trades as any[]).length,
    totalProfit: (metrics as any)?.totalProfit || 0,
    winRate: (metrics as any)?.winRate || 0,
    avgTradeReturn: (trades as any[]).length > 0 ? ((metrics as any)?.totalProfit || 0) / (trades as any[]).length : 0,
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Mobile Header */}
      <MobileHeader 
        title="Reportes Trading" 
        subtitle="Trading Reports"

      />
      
      {/* Desktop Header */}
      <header className="bg-card-gradient border-b border-purple p-6 shadow-sm hidden md:block">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <FileText className="w-8 h-8 mr-3 text-green-500" />
              Reportes de Trading
            </h2>
            <p className="text-purple-light">
              Genera reportes completos y análisis para tu rendimiento de trading
            </p>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        

        <Tabs defaultValue="generate" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 bg-card-gradient border border-purple">
            <TabsTrigger value="generate" className="data-[state=active]:bg-gradient-to-r from-pink-500 to-purple-600 data-[state=active]:text-white text-purple-light">
              Generate Report
            </TabsTrigger>
            <TabsTrigger value="history" className="data-[state=active]:bg-gradient-to-r from-pink-500 to-purple-600 data-[state=active]:text-white text-purple-light">
              Report History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="generate" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Report Configuration */}
              <div className="lg:col-span-1">
                <Card className="bg-card-gradient border-purple shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center">
                      <Filter className="w-5 h-5 mr-2 text-pink-400" />
                      Report Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Date Range */}
                    <div className="space-y-4">
                      <Label className="text-white">Date Range</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-sm text-purple-light">Start Date</Label>
                          <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-gray-800 border-purple text-white focus:border-pink-400"
                          />
                        </div>
                        <div>
                          <Label className="text-sm text-purple-light">End Date</Label>
                          <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-gray-800 border-purple text-white focus:border-pink-400"
                          />
                        </div>
                      </div>
                      
                      {/* Quick Date Filters */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuickDateRange("7d")}
                          className="bg-pink-500 text-white border-pink-500 hover:bg-pink-600"
                        >
                          Last 7 Days
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuickDateRange("30d")}
                          className="bg-pink-500 text-white border-pink-500 hover:bg-pink-600"
                        >
                          Last 30 Days
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuickDateRange("90d")}
                          className="bg-pink-500 text-white border-pink-500 hover:bg-pink-600"
                        >
                          Last 90 Days
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setQuickDateRange("ytd")}
                          className="bg-pink-500 text-white border-pink-500 hover:bg-pink-600"
                        >
                          Year to Date
                        </Button>
                      </div>
                    </div>

                    {/* Generate Button */}
                    <Button
                      onClick={handleGenerateReport}
                      disabled={isGenerating || generateReportMutation.isPending}
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                    >
                      {isGenerating || generateReportMutation.isPending ? (
                        <>
                          <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Generate Report
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Report Templates */}
              <div className="lg:col-span-2">
                <Card className="bg-card-gradient border-purple shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-white">Report Templates</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {reportTemplates.map((template) => (
                        <div
                          key={template.id}
                          className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                            reportType === template.id
                              ? "border-pink-500 bg-pink-500 bg-opacity-20"
                              : "border-purple text-white hover:border-pink-400"
                          }`}
                          onClick={() => setReportType(template.id)}
                        >
                          <h3 className="font-semibold text-white mb-2">{template.name}</h3>
                          <p className="text-sm text-purple-light mb-3">{template.description}</p>
                          <div className="space-y-1">
                            {template.features.map((feature, index) => (
                              <div key={index} className="flex items-center text-sm text-purple-light">
                                <div className="w-1.5 h-1.5 bg-pink-400 rounded-full mr-2"></div>
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="bg-card-gradient border-purple shadow-lg">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-pink-400" />
                  Generated Reports ({(reportHistory as any[]).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(reportHistory as any[]).length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-purple-light mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">
                      No reports generated yet
                    </h3>
                    <p className="text-purple-light mb-6">
                      Generate your first report to see it here
                    </p>
                    <Button
                      onClick={() => (document.querySelector('[value="generate"]') as HTMLElement)?.click()}
                      className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white"
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      Generate Report
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {(reportHistory as any[]).map((report: any) => (
                      <div key={report.id} className="bg-gray-800 rounded-lg p-4 border border-purple">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h3 className="text-white font-medium">{report.title}</h3>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-purple-light">
                              <span>
                                <Calendar className="w-4 h-4 inline mr-1" />
                                {formatDate(new Date(report.createdAt))}
                              </span>
                              <span>
                                <FileText className="w-4 h-4 inline mr-1" />
                                {report.reportType}
                              </span>
                              {report.fileSize && (
                                <span>
                                  {(report.fileSize / 1024).toFixed(1)} KB
                                </span>
                              )}
                            </div>
                            {report.reportData && (
                              <div className="flex items-center space-x-4 mt-2 text-xs text-purple-light">
                                <span>{report.reportData.tradesCount} trades</span>
                                <span>{formatCurrency(report.reportData.totalProfit)} profit</span>
                                <span>{formatPercentage(report.reportData.winRate)} win rate</span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                // Re-download the same report without creating a new history entry
                                setDownloadingReportId(report.id);
                                try {
                                  const params = new URLSearchParams();
                                  if (report.dateRange?.startDate) {
                                    params.append('startDate', new Date(report.dateRange.startDate).toISOString().slice(0, 10));
                                  }
                                  if (report.dateRange?.endDate) {
                                    params.append('endDate', new Date(report.dateRange.endDate).toISOString().slice(0, 10));
                                  }
                                  // Add a flag to prevent saving to history again
                                  params.append('redownload', 'true');
                                  
                                  const response = await fetch(`/api/reports/html?${params.toString()}`, {
                                    method: "GET",
                                    headers: {
                                      "Accept": "text/html",
                                    },
                                    credentials: "include",
                                  });
                                  
                                  if (!response.ok) {
                                    throw new Error("Error al descargar el reporte");
                                  }
                                  
                                  const blob = await response.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = report.fileName;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  window.URL.revokeObjectURL(url);
                                  
                                  toast({
                                    title: "Reporte Descargado",
                                    description: "El reporte ha sido descargado exitosamente.",
                                  });
                                } catch (error: any) {
                                  toast({
                                    title: "Error al Descargar",
                                    description: error.message || "No se pudo descargar el reporte.",
                                    variant: "destructive",
                                  });
                                } finally {
                                  setDownloadingReportId(null);
                                }
                              }}
                              className="bg-pink-500 text-white border-pink-500 hover:bg-pink-600"
                              disabled={generateReportMutation.isPending || downloadingReportId === report.id}
                              title={downloadingReportId === report.id ? "Descargando..." : "Descargar reporte"}
                            >
                              {downloadingReportId === report.id ? (
                                <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                              ) : (
                                <Download className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteReportMutation.mutate(report.id)}
                              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                              disabled={deleteReportMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
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
