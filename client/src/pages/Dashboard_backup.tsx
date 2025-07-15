import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Upload, User, Brain, LogOut, Unlink } from "lucide-react";
import MetricsCard from "@/components/MetricsCard";
import TradingChart from "@/components/TradingChart";
import MarketOverview from "@/components/MarketOverview";
import FinancialNews from "@/components/FinancialNews";
import { Trade, UserStats, Account } from "@shared/schema";

import GamificationPanel from "@/components/GamificationPanel";
import TradeSuggestionsPanel from "@/components/TradeSuggestionsPanel";
import AIAnalysisButton from "@/components/AIAnalysisButton";
import TradeForm from "@/components/TradeForm";
import ImportModal from "@/components/ImportModal";
import AchievementNotification from "@/components/AchievementNotification";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  ChartLine,
  Target,
  ArrowRightLeft,
  Scale,
} from "lucide-react";
import { formatCurrency, formatPercentage, formatDateTime, getTradeColor, calculateNetProfit } from "@/lib/utils";
import SubscriptionStatus from "@/components/SubscriptionStatus";

export default function Dashboard() {
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importModalMode, setImportModalMode] = useState<'new' | 'change' | 'clear'>('new');
  const [achievementNotification, setAchievementNotification] = useState(null);

  const { data: trades = [] } = useQuery({
    queryKey: ["/api/trades"],
  }) as { data: Trade[] };

  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/accounts"],
  }) as { data: Account[] };

  const { data: metrics } = useQuery({
    queryKey: ["/api/metrics"],
  }) as { data: any };

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  }) as { data: UserStats | undefined };

  // Para el usuario demo, usamos información estática
  const currentUser = {
    firstName: "Demo",
    email: "demo@example.com",
    profileImageUrl: null
  };

  const recentTrades = trades.slice(0, 5);

  // Calculate total net profit including commissions and swaps
  const totalNetProfit = (trades || []).reduce((sum: number, trade: any) => 
    sum + calculateNetProfit(trade), 0);

  const totalProfitPercentage = userStats?.accountSize ? 
    (totalNetProfit / userStats.accountSize) * 100 : 0;

  const keyMetrics: Array<{
    title: string;
    value: string;
    subtitle: string;
    icon: any;
    trend: "up" | "down" | "neutral";
    colorScheme: "profit" | "loss" | "primary" | "warning";
  }> = [
    {
      title: "Total P&L",
      value: formatCurrency(totalNetProfit),
      subtitle: userStats?.accountSize ? 
        `${formatPercentage(totalProfitPercentage)} of account (${formatCurrency(userStats.accountSize)})` : 
        `${metrics?.totalTrades || 0} trades`,
      icon: ChartLine,
      trend: totalNetProfit >= 0 ? "up" : "down",
      colorScheme: totalNetProfit >= 0 ? "profit" : "loss",
    },
    {
      title: "Win Rate",
      value: formatPercentage(metrics?.winRate || 0),
      subtitle: "+3.1% vs last month",
      icon: Target,
      trend: "up",
      colorScheme: "primary",
    },
    {
      title: "Total Trades",
      value: String(metrics?.totalTrades || 0),
      subtitle: "This month: 28",
      icon: ArrowRightLeft,
      trend: "neutral",
      colorScheme: "warning",
    },
    {
      title: "Risk/Reward",
      value: `1:${(metrics?.riskRewardRatio || 0).toFixed(1)}`,
      subtitle: metrics?.riskRewardRatio >= 2 ? "Excellent ratio" : "Good ratio",
      icon: Scale,
      trend: "neutral",
      colorScheme: "primary",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-dark overflow-x-hidden">
      {/* Header */}
      <header className="bg-card-gradient border-b border-purple p-3 sm:p-4 md:p-6 shadow-sm">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white truncate">Trading Dashboard</h2>
            <p className="text-purple-light text-sm sm:text-base">
              ¡Bienvenido de vuelta! Analicemos tu rendimiento de trading.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 lg:gap-4">
            <Button
              onClick={() => setShowTradeForm(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white shadow-lg text-sm sm:text-base px-3 sm:px-4 py-2 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Nuevo Trade</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
            {(accounts as any[]).length > 0 && (trades as any[]).length > 0 ? (
              // When user has data, show option to change/clear
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    setImportModalMode('change');
                    setShowImportModal(true);
                  }}
                  className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-2 whitespace-nowrap"
                >
                  <Upload className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Cambiar Cuenta</span>
                  <span className="sm:hidden">Cambiar</span>
                </Button>
                <Button
                  onClick={() => {
                    setImportModalMode('clear');
                    setShowImportModal(true);
                  }}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 text-sm px-3 py-2 whitespace-nowrap"
                >
                  <Unlink className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Desvincular CSV</span>
                  <span className="sm:hidden">Desvincular</span>
                </Button>
              </div>
            ) : (
              // When user has no data, show import option
              <Button
                onClick={() => {
                  setImportModalMode('new');
                  setShowImportModal(true);
                }}
                className="bg-green-500 hover:bg-green-600 text-white text-sm px-3 py-2 whitespace-nowrap"
              >
                <Upload className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Subir CSV</span>
                <span className="sm:hidden">CSV</span>
              </Button>
            )}
            <Button
              onClick={() => window.location.href = '/api/logout'}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400 text-sm px-3 py-2 whitespace-nowrap"
            >
              <LogOut className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
              <span className="sm:hidden">Salir</span>
            </Button>
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              {currentUser?.profileImageUrl ? (
                <img 
                  src={currentUser.profileImageUrl}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {currentUser?.firstName?.charAt(0) || currentUser?.email?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
              {currentUser && (
                <div className="text-sm">
                  <div className="font-medium text-gray-900">
                    {currentUser.firstName || currentUser.email || 'Usuario'}
                  </div>
                  <div className="text-gray-500">
                    Nivel {userStats?.currentLevel || 1}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6 overflow-x-hidden">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
          {keyMetrics.map((metric, index) => (
            <MetricsCard key={index} {...metric} />
          ))}
        </div>

        {/* Trading Chart */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-0">
            <TradingChart />
          </div>
        </div>

        {/* AI Analysis Section */}
        <Card className="bg-white border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="text-center">
              <Brain className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-purple-500 mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Análisis IA de Trading</h3>
              <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 px-2">
                Obtén análisis completos impulsados por IA de tu rendimiento de trading con insights personalizados y recomendaciones.
              </p>
              <AIAnalysisButton />
            </div>
          </div>
        </Card>

        {/* Recent Trades and Panels */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Trades Table */}
          <div className="xl:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Trades Recientes</h3>
                <Button variant="link" className="text-blue-500 p-0 text-sm sm:text-base">
                  Ver Todos
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="p-4 sm:p-6 min-w-0">
                {recentTrades.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="text-gray-600">Símbolo</TableHead>
                      <TableHead className="text-gray-600">Tipo</TableHead>
                      <TableHead className="text-gray-600">Tamaño</TableHead>
                      <TableHead className="text-gray-600">P&L</TableHead>
                      <TableHead className="text-gray-600">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTrades.map((trade: any) => (
                      <TableRow
                        key={trade.id}
                        className="border-gray-200 hover:bg-gray-50 cursor-pointer"
                      >
                        <TableCell className="text-gray-900 font-medium">
                          {trade.symbol}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={trade.type === "Buy" ? "default" : "secondary"}
                            className={
                              trade.type === "Buy"
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }
                          >
                            {trade.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-700">{trade.lots}</TableCell>
                        <TableCell className={`font-medium ${getTradeColor(trade.profit)}`}>
                          {formatCurrency(trade.profit || 0)}
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {formatDateTime(trade.openTime).split(',')[0]}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <ChartLine className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No hay trades aún</p>
                  <p className="text-sm text-gray-500">
                    Agrega tu primer trade o importa datos para comenzar
                  </p>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Right Side Panels */}
          <div className="space-y-6">
            <SubscriptionStatus />
            <MarketOverview />
            <FinancialNews 
              category="forex"
              limit={5}
              showSentiment={true}
              compact={true}
            />
            <GamificationPanel />
          </div>
        </div>

        {/* AI Suggestions Panel */}
        <div className="mt-6">
          <TradeSuggestionsPanel />
        </div>
      </div>

      {/* Modals */}
      <TradeForm open={showTradeForm} onOpenChange={setShowTradeForm} />
      <ImportModal 
        open={showImportModal} 
        onOpenChange={setShowImportModal}
        mode={importModalMode}
        hasExistingAccounts={accounts.length > 0}
      />

      {/* Achievement Notification */}
      <AchievementNotification
        achievement={achievementNotification}
        onDismiss={() => setAchievementNotification(null)}
      />
    </div>
  );
}