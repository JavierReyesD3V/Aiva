import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUserActions } from "@/contexts/UserActionsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Brain } from "lucide-react";
import { Link } from "wouter";
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


export default function Dashboard() {
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importModalMode, setImportModalMode] = useState<'new' | 'change' | 'clear'>('new');
  const [achievementNotification, setAchievementNotification] = useState(null);
  const { setUserActions } = useUserActions();

  // Registrar las funciones en el contexto cuando el componente se monta
  useEffect(() => {
    setUserActions({
      onShowTradeForm: () => setShowTradeForm(true),
      onShowImportModal: (mode: 'new' | 'change' | 'clear') => {
        setImportModalMode(mode);
        setShowImportModal(true);
      }
    });
  }, []); // Sin dependencias para evitar bucle infinito

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
    <div className="min-h-screen bg-gradient-dark overflow-x-hidden dashboard-safe-area">
      {/* Header - Mobile Optimized with Safe Area */}
      <header className="bg-card-gradient border-b border-purple p-3 md:p-6 shadow-sm">
        <div className="flex flex-col space-y-3 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg md:text-2xl font-bold text-white truncate">Trading Dashboard</h2>
            <p className="text-purple-light text-sm md:text-base">
              ¡Bienvenido de vuelta! Analicemos tu rendimiento de trading.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 lg:gap-4">
            <AIAnalysisButton />
          </div>
        </div>
      </header>

      {/* Dashboard Content - Mobile Optimized with Reduced Top Spacing */}
      <div className="dashboard-content-mobile p-3 md:p-6 space-y-3 md:space-y-6 overflow-x-hidden">
        {/* Key Metrics Cards - Mobile-First Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-6">
          {keyMetrics.map((metric, index) => (
            <MetricsCard key={index} {...metric} />
          ))}
        </div>

        {/* Trading Chart - Mobile Responsive */}
        <div className="w-full overflow-x-hidden">
          <div className="min-w-0 bg-card-gradient border border-purple rounded-lg p-3 md:p-4">
            <TradingChart />
          </div>
        </div>

        {/* AI Analysis Section */}
        <Card className="bg-card-gradient border-purple shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="text-center">
              <Brain className="w-8 h-8 sm:w-12 sm:h-12 mx-auto text-pink-400 mb-3 sm:mb-4" />
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">Análisis AIVA de Trading</h3>
              <p className="text-sm sm:text-base text-purple-light mb-3 sm:mb-4 px-2">
                Obtén análisis completos impulsados por AIVA de tu rendimiento de trading con insights personalizados y recomendaciones.
              </p>
              <AIAnalysisButton />
            </div>
          </div>
        </Card>

        {/* Recent Trades and Panels */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Recent Trades Table - Mobile Optimized */}
          <div className="xl:col-span-2 bg-card-gradient rounded-lg border border-purple shadow-sm overflow-hidden">
            <div className="p-3 md:p-6 border-b border-purple">
              <div className="flex items-center justify-between">
                <h3 className="text-base md:text-lg font-semibold text-white">Trades Recientes</h3>
                <Link href="/trades">
                  <Button variant="link" className="text-pink-400 p-0 text-sm hover:text-pink-300">
                    Ver Todos
                  </Button>
                </Link>
              </div>
            </div>
            <div className="overflow-x-auto">
              <div className="p-3 md:p-6 min-w-0">
                {recentTrades.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow className="border-purple">
                      <TableHead className="text-purple-light">Símbolo</TableHead>
                      <TableHead className="text-purple-light">Tipo</TableHead>
                      <TableHead className="text-purple-light">Tamaño</TableHead>
                      <TableHead className="text-purple-light">P&L</TableHead>
                      <TableHead className="text-purple-light">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentTrades.map((trade: any) => (
                      <TableRow
                        key={trade.id}
                        className="border-purple hover:bg-purple-800/20 cursor-pointer"
                      >
                        <TableCell className="text-white font-medium">
                          {trade.symbol}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={trade.type === "Buy" ? "default" : "secondary"}
                            className={
                              trade.type === "Buy"
                                ? "bg-green-500/20 text-green-400 border-green-500/30"
                                : "bg-red-500/20 text-red-400 border-red-500/30"
                            }
                          >
                            {trade.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-purple-light">{trade.lots}</TableCell>
                        <TableCell className={`font-medium ${getTradeColor(trade.profit)}`}>
                          {formatCurrency(trade.profit || 0)}
                        </TableCell>
                        <TableCell className="text-purple-light text-sm">
                          {formatDateTime(trade.openTime).split(',')[0]}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <ChartLine className="w-12 h-12 text-purple-light mx-auto mb-4" />
                  <p className="text-white">No hay trades aún</p>
                  <p className="text-sm text-purple-light">
                    Agrega tu primer trade o importa datos para comenzar
                  </p>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Right Side Panels */}
          <div className="space-y-6">
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