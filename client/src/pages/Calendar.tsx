import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useUserActions } from "@/contexts/UserActionsContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CalendarGrid from "@/components/CalendarGrid";
import TradeDetailsModal from "@/components/TradeDetailsModal";
import TradeSelectionModal from "@/components/TradeSelectionModal";
import TradeForm from "@/components/TradeForm";
import ImportModal from "@/components/ImportModal";
import MobileHeader from "@/components/MobileHeader";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [symbolFilter, setSymbolFilter] = useState("all");
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [selectedDayTrades, setSelectedDayTrades] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importModalMode, setImportModalMode] = useState<'new' | 'change' | 'clear'>('new');

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

  const { data: calendarRawData = {} } = useQuery({
    queryKey: ["/api/calendar", {
      month: currentDate.getMonth(),
      year: currentDate.getFullYear(),
    }],
  });

  // Convert object format to array format expected by the component
  const calendarData = Object.entries(calendarRawData as Record<string, any>).map(([date, data]: [string, any]) => ({
    date,
    trades: data.trades || [],
    totalProfit: data.profit || 0,
    winRate: data.winRate || 0,
    totalTrades: data.trades?.length || 0
  }));

  const { data: trades = [] } = useQuery({
    queryKey: ["/api/trades"],
  });

  // Calculate monthly P&L for current month
  const calculateMonthlyPL = () => {
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    return calendarData.reduce((total, day) => {
      const dayDate = new Date(day.date);
      if (dayDate.getMonth() === currentMonth && dayDate.getFullYear() === currentYear) {
        return total + (day.totalProfit || 0);
      }
      return total;
    }, 0);
  };

  const monthlyPL = calculateMonthlyPL();

  const navigateMonth = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    if (direction === "prev") {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const uniqueSymbols = Array.from(new Set((trades as any[]).map((trade: any) => trade.symbol)));

  const filteredCalendarData = symbolFilter === "all" 
    ? calendarData 
    : calendarData.map((day: any) => ({
        ...day,
        trades: day.trades.filter((trade: any) => trade.symbol === symbolFilter),
        totalProfit: day.trades
          .filter((trade: any) => trade.symbol === symbolFilter)
          .reduce((sum: number, trade: any) => sum + (trade.profit || 0), 0),
        profitableCount: day.trades
          .filter((trade: any) => trade.symbol === symbolFilter && trade.isProfit).length,
        lossCount: day.trades
          .filter((trade: any) => trade.symbol === symbolFilter && !trade.isProfit).length,
      })).filter((day: any) => day.trades.length > 0);

  const monthlyStats = calendarData.reduce((stats, day: any) => {
    const dayTrades = symbolFilter === "all" 
      ? day.trades 
      : day.trades.filter((trade: any) => trade.symbol === symbolFilter);

    return {
      totalTrades: stats.totalTrades + dayTrades.length,
      totalProfit: stats.totalProfit + (symbolFilter === "all" ? day.totalProfit : 
        dayTrades.reduce((sum: number, trade: any) => sum + (trade.profit || 0), 0)),
      profitableDays: stats.profitableDays + (
        (symbolFilter === "all" ? day.totalProfit : 
         dayTrades.reduce((sum: number, trade: any) => sum + (trade.profit || 0), 0)) > 0 ? 1 : 0
      ),
      tradingDays: stats.tradingDays + (dayTrades.length > 0 ? 1 : 0),
    };
  }, { totalTrades: 0, totalProfit: 0, profitableDays: 0, tradingDays: 0 });

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Mobile Header */}
      <MobileHeader 
        title="Calendario Trading" 
        subtitle="Trading Calendar"

      />
      
      {/* Desktop Header */}
      <header className="bg-card-gradient border-b border-purple p-6 shadow-sm hidden md:block">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Calendario de Trading</h2>
            <p className="text-purple-light">
              Visualiza tu actividad de trading y rendimiento a través del tiempo
            </p>
          </div>



          <div className="flex items-center space-x-4">
            <Select value={symbolFilter} onValueChange={setSymbolFilter}>
              <SelectTrigger className="w-40 bg-card-gradient border-purple text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Instruments</SelectItem>
                {uniqueSymbols.map((symbol) => (
                  <SelectItem key={symbol} value={symbol}>
                    {symbol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Monthly Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card-gradient border-purple shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-light text-sm">Total Trades</p>
                  <p className="text-2xl font-bold text-white">{monthlyStats.totalTrades}</p>
                </div>
                <CalendarIcon className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-gradient border-purple shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-light text-sm">
                    {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()} P&L
                  </p>
                  <p className={`text-2xl font-bold ${monthlyPL >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {monthlyPL >= 0 ? '+' : ''}{formatCurrency(monthlyPL)}
                  </p>
                </div>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  monthlyPL >= 0 ? 'bg-profit bg-opacity-20' : 'bg-loss bg-opacity-20'
                }`}>
                  <span className={`text-lg ${monthlyPL >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {monthlyPL >= 0 ? '↗' : '↘'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-gradient border-purple shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-light text-sm">Trading Days</p>
                  <p className="text-2xl font-bold text-white">{monthlyStats.tradingDays}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-500">📅</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-gradient border-purple shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-light text-sm">Profitable Days</p>
                  <p className="text-2xl font-bold text-profit">{monthlyStats.profitableDays}</p>
                  <p className="text-sm text-purple-light">
                    {monthlyStats.tradingDays > 0 ? 
                      `${Math.round((monthlyStats.profitableDays / monthlyStats.tradingDays) * 100)}% win rate` : 
                      '0% win rate'
                    }
                  </p>
                </div>
                <div className="w-8 h-8 bg-profit bg-opacity-20 rounded-lg flex items-center justify-center">
                  <span className="text-profit">✓</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card className="bg-card-gradient border-purple shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">
                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("prev")}
                  className="text-purple-light hover:text-white hover:bg-dark-hover"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentDate(new Date())}
                  className="text-purple-light hover:text-white hover:bg-dark-hover px-4"
                >
                  Today
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigateMonth("next")}
                  className="text-purple-light hover:text-white hover:bg-dark-hover"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <CalendarGrid
              currentDate={currentDate}
              calendarData={filteredCalendarData}
              onTradeClick={setSelectedTrade}
              onDayClick={(trades, date) => {
                setSelectedDayTrades(trades);
                setSelectedDate(date);
              }}
            />

            {/* Legend */}
            <div className="mt-6 flex items-center justify-center space-x-8 text-sm">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                <span className="text-purple-light">Profitable Trade</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-purple-light">Loss Trade</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-purple-light">Today</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trade Selection Modal */}
      <TradeSelectionModal
        trades={selectedDayTrades}
        date={selectedDate}
        open={selectedDayTrades.length > 0}
        onOpenChange={(open) => !open && setSelectedDayTrades([])}
        onTradeSelect={setSelectedTrade}
      />

      {/* Trade Details Modal */}
      <TradeDetailsModal
        trade={selectedTrade}
        open={!!selectedTrade}
        onOpenChange={(open) => !open && setSelectedTrade(null)}
      />

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