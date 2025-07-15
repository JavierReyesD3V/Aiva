import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  RefreshCw, 
  Clock,
  Globe,
  TrendingUp,
  AlertTriangle,
  Info
} from "lucide-react";

interface EconomicEvent {
  time: string;
  country: string;
  event: string;
  impact: 'High' | 'Medium' | 'Low';
  forecast?: string;
  previous?: string;
  actual?: string;
  currency: string;
  importance: number;
  category: string;
}

interface EconomicCalendarResponse {
  success: boolean;
  calendar: {
    events: EconomicEvent[];
    lastUpdated: string;
    totalEvents: number;
  };
  timestamp: number;
}

interface EconomicCalendarProps {
  days?: number;
  compact?: boolean;
}

export default function EconomicCalendar({ 
  days = 7, 
  compact = false 
}: EconomicCalendarProps) {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const { 
    data: calendarData, 
    isLoading, 
    refetch,
    error 
  } = useQuery({
    queryKey: ['/api/market/economic-calendar', days],
    queryFn: async () => {
      const response = await fetch(`/api/market/economic-calendar?days=${days}`);
      if (!response.ok) {
        throw new Error('Failed to fetch economic calendar');
      }
      return response.json() as Promise<EconomicCalendarResponse>;
    },
    refetchInterval: 10 * 60 * 1000, // Refresh every 10 minutes
  });

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High':
        return 'bg-red-900/20 text-red-300 border-red-500/30';
      case 'Medium':
        return 'bg-yellow-900/20 text-yellow-300 border-yellow-500/30';
      case 'Low':
        return 'bg-green-900/20 text-green-300 border-green-500/30';
      default:
        return 'bg-purple-900/20 text-purple-300 border-purple-500/30';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'High':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'Medium':
        return <TrendingUp className="w-4 h-4 text-yellow-600" />;
      case 'Low':
        return <Info className="w-4 h-4 text-green-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getImportanceStars = (importance: number) => {
    return '★'.repeat(importance) + '☆'.repeat(5 - importance);
  };

  const formatTime = (timeString: string) => {
    try {
      const [date, time] = timeString.split(' ');
      return { date, time };
    } catch (error) {
      return { date: timeString, time: '' };
    }
  };

  const events = calendarData?.calendar?.events || [];
  
  const filteredEvents = events.filter(event => {
    if (selectedFilter === 'all') return true;
    return event.impact.toLowerCase() === selectedFilter;
  });

  if (error) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/30 border-purple-500/30 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-purple-300" />
            Calendario Económico
            <Badge variant="outline" className="ml-2 border-red-400/50 text-red-300 bg-red-900/20">
              Error
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-purple-200 py-4">
            <p>No se puede cargar el calendario económico</p>
            <p className="text-sm mt-1 text-purple-300">Verifica la configuración de la API</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/30 border-purple-500/30 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="text-white flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-purple-300" />
              Eventos Económicos
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="h-6 w-6 p-0 text-purple-300 hover:text-white hover:bg-purple-700/50"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''} text-purple-300`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 border border-purple-500/30 rounded-lg animate-pulse bg-purple-900/20">
                  <div className="bg-purple-600/40 h-4 w-3/4 mb-2 rounded"></div>
                  <div className="bg-purple-600/40 h-3 w-full rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {filteredEvents.slice(0, 5).map((event, index) => {
                const { date, time } = formatTime(event.time);
                return (
                  <div key={index} className="p-3 border border-purple-500/30 rounded-lg hover:bg-purple-800/30 transition-colors bg-purple-900/20">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-white text-sm leading-tight flex-1">
                        {event.event}
                      </h4>
                      <div className="ml-2 flex-shrink-0">
                        {getImpactIcon(event.impact)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-purple-200 flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-purple-300" />
                        {time}
                      </span>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs border-purple-400/50 text-purple-200 bg-purple-900/20">
                          {event.currency}
                        </Badge>
                        <span className="text-xs text-yellow-300">{getImportanceStars(event.importance)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-900/40 to-pink-900/30 border-purple-500/30 shadow-lg">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <div className="flex items-center">
            <Calendar className="w-6 h-6 mr-3 text-purple-300" />
            Calendario Económico
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="border-purple-400/50 text-purple-200 bg-purple-900/20">
              Próximos {days} días
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
              className="h-8 w-8 p-0 text-purple-300 hover:text-white hover:bg-purple-700/50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''} text-purple-300`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedFilter} onValueChange={(value) => setSelectedFilter(value as any)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 bg-purple-900/30 border border-purple-500/30">
            <TabsTrigger value="all" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-200 hover:text-white">
              Todos
            </TabsTrigger>
            <TabsTrigger value="high" className="data-[state=active]:bg-red-600 data-[state=active]:text-white text-purple-200 hover:text-white">
              Alto Impacto
            </TabsTrigger>
            <TabsTrigger value="medium" className="data-[state=active]:bg-yellow-600 data-[state=active]:text-white text-purple-200 hover:text-white">
              Medio Impacto
            </TabsTrigger>
            <TabsTrigger value="low" className="data-[state=active]:bg-green-600 data-[state=active]:text-white text-purple-200 hover:text-white">
              Bajo Impacto
            </TabsTrigger>
          </TabsList>

          <TabsContent value={selectedFilter} className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="p-4 border border-purple-500/30 rounded-lg animate-pulse bg-purple-900/20">
                    <div className="bg-purple-600/40 h-5 w-3/4 mb-3 rounded"></div>
                    <div className="bg-purple-600/40 h-4 w-full mb-2 rounded"></div>
                    <div className="bg-purple-600/40 h-4 w-2/3 rounded"></div>
                  </div>
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <div className="text-center text-purple-200 py-8">
                <Globe className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                <p>No hay eventos económicos para mostrar</p>
                <p className="text-sm mt-1 text-purple-300">Los eventos se actualizarán automáticamente</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {filteredEvents.map((event, index) => {
                  const { date, time } = formatTime(event.time);
                  return (
                    <div key={index} className="p-4 border border-purple-500/30 rounded-lg hover:bg-purple-800/30 transition-colors bg-purple-900/20">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white leading-tight mb-1">
                            {event.event}
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-purple-200">
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1 text-purple-300" />
                              {date} - {time}
                            </span>
                            <span>•</span>
                            <span>{event.country}</span>
                            <span>•</span>
                            <span>{event.category}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0 ml-4">
                          {getImpactIcon(event.impact)}
                          <Badge 
                            variant="outline" 
                            className={getImpactColor(event.impact)}
                          >
                            {event.impact}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="font-medium text-purple-300">{event.currency}</span>
                          <span className="text-yellow-300" title={`Importancia: ${event.importance}/5`}>
                            {getImportanceStars(event.importance)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-purple-200">
                          {event.previous && (
                            <span>
                              <span className="font-medium text-purple-300">Anterior:</span> {event.previous}
                            </span>
                          )}
                          {event.forecast && (
                            <span>
                              <span className="font-medium text-purple-300">Pronóstico:</span> {event.forecast}
                            </span>
                          )}
                          {event.actual && (
                            <span className="text-white font-medium">
                              <span className="font-medium text-purple-300">Actual:</span> {event.actual}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {calendarData && (
          <div className="mt-4 pt-3 border-t border-purple-500/30 text-center">
            <p className="text-sm text-purple-300">
              Última actualización: {new Date(calendarData.calendar.lastUpdated).toLocaleTimeString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}