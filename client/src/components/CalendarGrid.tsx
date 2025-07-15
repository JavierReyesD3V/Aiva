import { getDaysInMonth, getFirstDayOfMonth, isToday, isSameDay, formatCurrency, cn, calculateNetProfit } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CalendarDay {
  date: string;
  trades: any[];
  totalProfit: number;
  profitableCount: number;
  lossCount: number;
}

interface CalendarGridProps {
  currentDate: Date;
  calendarData: CalendarDay[];
  onTradeClick: (trade: any) => void;
  onDayClick?: (trades: any[], date: string) => void;
}

export default function CalendarGrid({ currentDate, calendarData, onTradeClick, onDayClick }: CalendarGridProps) {
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfMonth = getFirstDayOfMonth(year, month);

  // Create a map for quick lookup of calendar data
  const calendarMap = new Map<string, CalendarDay>();
  calendarData.forEach(day => {
    calendarMap.set(day.date, day);
  });

  // Generate calendar days including previous month overflow
  const calendarDays = [];
  
  // Previous month overflow days
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const prevMonthDays = getDaysInMonth(prevYear, prevMonth);
    const day = prevMonthDays - i;
    
    calendarDays.push({
      day,
      date: new Date(prevYear, prevMonth, day),
      isCurrentMonth: false,
      isToday: false,
      data: null,
    });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateString = date.toISOString().slice(0, 10);
    const dayData = calendarMap.get(dateString);
    
    calendarDays.push({
      day,
      date,
      isCurrentMonth: true,
      isToday: isToday(date),
      data: dayData || null,
    });
  }

  // Next month overflow days to fill the grid (42 days total - 6 weeks)
  const remainingDays = 42 - calendarDays.length;
  for (let day = 1; day <= remainingDays; day++) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    
    calendarDays.push({
      day,
      date: new Date(nextYear, nextMonth, day),
      isCurrentMonth: false,
      isToday: false,
      data: null,
    });
  }

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleDayClick = (dayInfo: any) => {
    if (dayInfo.data && dayInfo.data.trades.length > 0) {
      if (dayInfo.data.trades.length === 1) {
        // Single trade - show directly
        onTradeClick(dayInfo.data.trades[0]);
      } else {
        // Multiple trades - use selection modal
        if (onDayClick) {
          onDayClick(dayInfo.data.trades, dayInfo.data.date);
        }
      }
    }
  };

  const renderTradeIndicators = (dayData: CalendarDay) => {
    if (!dayData || dayData.trades.length === 0) return null;

    const maxIndicators = 4;
    const trades = dayData.trades.slice(0, maxIndicators);
    const hasMore = dayData.trades.length > maxIndicators;

    return (
      <div className="flex flex-wrap gap-0.5 mt-1 justify-center">
        {trades.map((trade, index) => (
          <div
            key={index}
            className={cn(
              "w-1 h-1 rounded-full",
              trade.isProfit ? "bg-profit" : "bg-loss"
            )}
          />
        ))}
        {hasMore && (
          <div className="w-1 h-1 rounded-full bg-gray-400" />
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {weekDays.map(day => (
          <div key={day} className="text-purple-light font-semibold py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <TooltipProvider>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((dayInfo, index) => {
            const isWinningDay = dayInfo.data && dayInfo.data.totalProfit > 0;
            const isLosingDay = dayInfo.data && dayInfo.data.totalProfit < 0;
            const profitAmount = dayInfo.data?.totalProfit || 0;
            
            // Calculate transparency based on profit magnitude (max at $1000)
            const alpha = Math.min(Math.abs(profitAmount) / 1000, 0.7);
            
            const dayContent = (
              <div
                key={index}
                className={cn(
                  "aspect-square flex flex-col items-center justify-center p-1 text-sm border border-transparent transition-all duration-200 relative overflow-hidden",
                  dayInfo.isCurrentMonth
                    ? "text-white hover:scale-102 rounded-lg cursor-pointer shadow-sm font-semibold" // Clear white text for current month
                    : "text-gray-500 opacity-60", // Dimmed text for adjacent months
                  dayInfo.isToday && "ring-2 ring-pink-400 font-bold scale-105 text-white", // Today gets pink ring and white text
                  !dayInfo.isCurrentMonth && "pointer-events-none"
                )}
                style={{
                  backgroundColor: dayInfo.data && dayInfo.isCurrentMonth
                    ? isWinningDay 
                      ? `rgba(34, 197, 94, ${alpha})` // Green with transparency
                      : isLosingDay 
                        ? `rgba(239, 68, 68, ${alpha})` // Red with transparency
                        : 'rgba(138, 43, 226, 0.1)' // Light purple for trading days without profit/loss
                    : dayInfo.isCurrentMonth 
                      ? 'rgba(75, 85, 99, 0.3)' // Subtle background for current month non-trading days
                      : 'transparent' // No background for adjacent months
                }}
                onClick={() => dayInfo.isCurrentMonth && handleDayClick(dayInfo)}
              >
                <span className={cn(
                  "text-xs font-bold relative z-10",
                  dayInfo.isCurrentMonth 
                    ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" // Clear white text with strong shadow for current month
                    : "text-gray-400" // Dimmed text for adjacent months
                )}
                style={{
                  textShadow: dayInfo.isCurrentMonth ? '0 1px 3px rgba(0,0,0,0.8), 0 0 0 1px rgba(0,0,0,0.5)' : 'none'
                }}
                >{dayInfo.day}</span>
                {dayInfo.isCurrentMonth && dayInfo.data && renderTradeIndicators(dayInfo.data)}
                
                {/* Enhanced background contrast for better text readability */}
                {dayInfo.data && dayInfo.isCurrentMonth && (
                  <div className="absolute inset-0 bg-black opacity-20 rounded-lg"></div>
                )}
              </div>
            );

            // If the day has trades, wrap with tooltip
            if (dayInfo.isCurrentMonth && dayInfo.data && dayInfo.data.trades.length > 0) {
              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    {dayContent}
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-center">
                      <div className="font-medium">{dayInfo.data.trades.length} trade(s)</div>
                      <div className={cn(
                        "font-semibold",
                        dayInfo.data.totalProfit >= 0 ? "text-green-500" : "text-red-500"
                      )}>
                        {formatCurrency(dayInfo.data.totalProfit)}

                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            }

            return dayContent;
          })}
        </div>
      </TooltipProvider>
    </div>
  );
}
