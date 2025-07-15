import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { TrendingUp, TrendingDown, BarChart3, Zap, Target } from "lucide-react";

interface ChartData {
  date: string;
  profit: number;
  cumulativeProfit?: number;
  accountPercentage?: number;
}

export default function TradingChart() {
  const [timeframe, setTimeframe] = useState<"7D" | "30D" | "90D">("30D");
  const [chartType, setChartType] = useState<"line" | "area">("area");

  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ["/api/charts/profit-loss"],
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  // Use raw chartData directly from API
  const displayData = (chartData as any[]) || [];

  // Calculate performance metrics
  const initialBalance = displayData[0]?.balance || 100000;
  const currentEquity = displayData[displayData.length - 1]?.equity || initialBalance;
  const totalPnL = currentEquity - initialBalance;
  const pnlPercentage = ((totalPnL / initialBalance) * 100) || 0;
  const isProfit = totalPnL >= 0;
  
  // Determine performance status for dynamic effects
  const getPerformanceStatus = () => {
    if (pnlPercentage > 20) return "excellent";
    if (pnlPercentage > 10) return "good";
    if (pnlPercentage > 0) return "positive";
    if (pnlPercentage > -10) return "slight-loss";
    return "heavy-loss";
  };

  const performanceStatus = getPerformanceStatus();
  
  // Dynamic colors and effects based on performance
  const getThemeColors = () => {
    switch (performanceStatus) {
      case "excellent":
        return {
          gradient: "from-green-500 via-emerald-500 to-teal-500",
          lineColor: "#10b981",
          glowColor: "shadow-green-500/50",
          badgeColor: "bg-green-500/20 text-green-400 border-green-500/30",
          icon: TrendingUp,
        };
      case "good":
        return {
          gradient: "from-green-400 via-green-500 to-green-600",
          lineColor: "#22c55e",
          glowColor: "shadow-green-400/40",
          badgeColor: "bg-green-400/20 text-green-300 border-green-400/30",
          icon: TrendingUp,
        };
      case "positive":
        return {
          gradient: "from-blue-400 via-green-400 to-green-500",
          lineColor: "#3b82f6",
          glowColor: "shadow-blue-400/30",
          badgeColor: "bg-blue-400/20 text-blue-300 border-blue-400/30",
          icon: TrendingUp,
        };
      case "slight-loss":
        return {
          gradient: "from-orange-400 via-orange-500 to-red-400",
          lineColor: "#f97316",
          glowColor: "shadow-orange-400/30",
          badgeColor: "bg-orange-400/20 text-orange-300 border-orange-400/30",
          icon: TrendingDown,
        };
      default:
        return {
          gradient: "from-red-500 via-red-600 to-red-700",
          lineColor: "#ef4444",
          glowColor: "shadow-red-500/50",
          badgeColor: "bg-red-500/20 text-red-400 border-red-500/30",
          icon: TrendingDown,
        };
    }
  };

  const theme = getThemeColors();
  const StatusIcon = theme.icon;
  


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gradient-to-br from-purple-900/95 to-pink-900/95 border border-purple-400/30 rounded-lg p-3 shadow-xl backdrop-blur-sm">
          <p className="text-purple-200 text-xs">Trade #{data.trade}</p>
          <p className="text-white text-sm font-medium">
            Equity: {formatCurrency(data.equity)}
          </p>
          <p className={`text-sm font-medium ${data.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            P&L: {formatCurrency(data.profit)}
          </p>
          <p className="text-purple-300 text-xs">
            Symbol: {data.symbol || 'N/A'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className={`bg-gradient-to-br from-purple-900/70 to-pink-900/50 border-purple-500/30 backdrop-blur-sm ${theme.glowColor} shadow-2xl transition-all duration-500`}>
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-3 text-white">
            <div className={`p-2 rounded-lg bg-gradient-to-r ${theme.gradient}`}>
              <StatusIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg">Performance Chart</span>
              <Badge className={`ml-3 ${theme.badgeColor}`}>
                {isProfit ? "+" : ""}{pnlPercentage.toFixed(2)}%
              </Badge>
            </div>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={chartType === "area" ? "default" : "ghost"}
              onClick={() => setChartType("area")}
              className={chartType === "area" 
                ? `bg-gradient-to-r ${theme.gradient} text-white` 
                : "text-purple-300 hover:text-white hover:bg-purple-600/20"
              }
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Area
            </Button>
            <Button
              size="sm"
              variant={chartType === "line" ? "default" : "ghost"}
              onClick={() => setChartType("line")}
              className={chartType === "line" 
                ? `bg-gradient-to-r ${theme.gradient} text-white` 
                : "text-purple-300 hover:text-white hover:bg-purple-600/20"
              }
            >
              <Zap className="w-4 h-4 mr-1" />
              Line
            </Button>
          </div>
        </div>
        
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 rounded-lg bg-purple-800/20 border border-purple-500/20">
            <p className="text-xs text-purple-300">Initial</p>
            <p className="text-sm font-bold text-white">{formatCurrency(initialBalance)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-purple-800/20 border border-purple-500/20">
            <p className="text-xs text-purple-300">Current</p>
            <p className="text-sm font-bold text-white">{formatCurrency(currentEquity)}</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-purple-800/20 border border-purple-500/20">
            <p className="text-xs text-purple-300">P&L</p>
            <p className={`text-sm font-bold ${isProfit ? 'text-green-400' : 'text-red-400'}`}>
              {formatCurrency(totalPnL)}
            </p>
          </div>
          <div className="text-center p-3 rounded-lg bg-purple-800/20 border border-purple-500/20">
            <p className="text-xs text-purple-300">Trades</p>
            <p className="text-sm font-bold text-white">{displayData.length}</p>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-purple-300">Loading performance data...</div>
          </div>
        ) : displayData.length > 0 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === "area" ? (
                <AreaChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={theme.lineColor} stopOpacity={0.4} />
                      <stop offset="95%" stopColor={theme.lineColor} stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis
                    dataKey="trade"
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickFormatter={(value) => `#${value}`}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickFormatter={formatCurrency}
                    domain={['dataMin - 500', 'dataMax + 500']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="equity"
                    stroke={theme.lineColor}
                    strokeWidth={2}
                    fill="url(#equityGradient)"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              ) : (
                <LineChart data={displayData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
                  <XAxis
                    dataKey="trade"
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickFormatter={(value) => `#${value}`}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={10}
                    tickFormatter={formatCurrency}
                    domain={['dataMin - 500', 'dataMax + 500']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="equity"
                    stroke={theme.lineColor}
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, stroke: theme.lineColor, strokeWidth: 2, fill: "#ffffff" }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-center">
            <div className="space-y-4">
              <Target className="w-12 h-12 text-purple-400 mx-auto" />
              <div>
                <p className="text-purple-300 text-lg font-medium">No trading data available</p>
                <p className="text-sm text-purple-400">
                  Import trades from CSV to see your performance curve
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
