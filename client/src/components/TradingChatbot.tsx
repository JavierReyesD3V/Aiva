import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  Loader2,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  BarChart3
} from "lucide-react";

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  message: string;
  timestamp: Date;
  suggestions?: string[];
}

export default function TradingChatbot() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      message: '¡Hola! Soy tu asistente de trading con IA. Puedo ayudarte a analizar tus trades, identificar patrones y darte consejos personalizados. ¿En qué te puedo ayudar hoy?',
      timestamp: new Date(),
      suggestions: [
        'Analiza mis trades recientes',
        'Dame consejos de gestión de riesgo',
        '¿Cuáles son mis mejores pares?',
        'Identifica patrones en mis operaciones'
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const { data: trades = [] } = useQuery({
    queryKey: ["/api/trades"],
  });

  const { data: metrics } = useQuery({
    queryKey: ["/api/metrics"],
  });

  const chatMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest("POST", "/api/chat/trading-assistant", {
        message,
        context: {
          totalTrades: trades.length,
          metrics: metrics,
          recentTrades: trades.slice(-10)
        }
      });
      return response.json();
    },
    onSuccess: (data) => {
      setIsTyping(false);
      const botMessage: ChatMessage = {
        id: Date.now().toString(),
        type: 'bot',
        message: data.response || 'Lo siento, no pude procesar tu consulta. ¿Podrías reformularla?',
        timestamp: new Date(),
        suggestions: data.suggestions
      };
      setMessages(prev => [...prev, botMessage]);
    },
    onError: (error: any) => {
      setIsTyping(false);
      toast({
        title: "Error",
        description: "No pude procesar tu mensaje. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      message: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate typing delay for better UX
    setTimeout(() => {
      chatMutation.mutate(inputMessage);
    }, 1000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const getMessageIcon = (type: 'user' | 'bot') => {
    return type === 'user' ? (
      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
        <User className="w-4 h-4 text-white" />
      </div>
    ) : (
      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
        <Bot className="w-4 h-4 text-white" />
      </div>
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getQuickActions = () => [
    {
      icon: <BarChart3 className="w-4 h-4" />,
      text: 'Analiza mi rendimiento',
      action: 'Analiza mi rendimiento general y dame insights clave'
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      text: 'Mejores estrategias',
      action: 'Identifica mis estrategias más exitosas'
    },
    {
      icon: <AlertTriangle className="w-4 h-4" />,
      text: 'Gestión de riesgo',
      action: 'Dame consejos para mejorar mi gestión de riesgo'
    },
    {
      icon: <Lightbulb className="w-4 h-4" />,
      text: 'Consejos personalizados',
      action: 'Dame 3 consejos específicos basados en mis datos'
    }
  ];

  return (
    <Card className="w-full h-full max-h-[calc(100vh-12rem)] flex flex-col">
      <CardHeader className="pb-4 flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-xl">
          <MessageCircle className="h-6 w-6 text-blue-500" />
          <span className="hidden sm:block">Asistente de Trading IA</span>
          <span className="block sm:hidden">Trading IA</span>
          <Badge variant="secondary" className="ml-auto">
            {trades.length} trades
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0 p-4 sm:p-6">
        <ScrollArea ref={scrollAreaRef} className="flex-1 pr-2 sm:pr-4 mb-4">
          <div className="space-y-3 sm:space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 sm:gap-3 ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`flex gap-2 sm:gap-3 max-w-[85%] sm:max-w-[80%] ${
                      message.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                    }`}>
                      {message.type === 'user' ? (
                        <User className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </div>
                    
                    <div className={`flex flex-col gap-2 ${
                      message.type === 'user' ? 'items-end' : 'items-start'
                    }`}>
                      <div className={`rounded-lg px-3 py-2 sm:px-4 sm:py-3 max-w-none ${
                        message.type === 'user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
                      }`}>
                        <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                          {message.message}
                        </div>
                      </div>
                      
                      {message.suggestions && message.suggestions.length > 0 && (
                        <div className="flex flex-wrap gap-1 sm:gap-2 mt-2">
                          {message.suggestions.map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="text-xs px-2 py-1 h-auto"
                              onClick={() => handleSuggestionClick(suggestion)}
                              disabled={isTyping}
                            >
                              <span className="hidden sm:block">{suggestion}</span>
                              <span className="block sm:hidden">{suggestion.length > 20 ? suggestion.substring(0, 20) + '...' : suggestion}</span>
                            </Button>
                          ))}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDateTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-2 sm:gap-3 justify-start">
                  <div className="flex gap-2 sm:gap-3 max-w-[85%] sm:max-w-[80%]">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
                      <Bot className="h-3 w-3 sm:h-4 sm:w-4" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 sm:px-4 sm:py-3">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-blue-500" />
                        <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                          <span className="hidden sm:block">Analizando tus datos...</span>
                          <span className="block sm:hidden">Analizando...</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

        
        <div className="flex gap-2 items-center flex-shrink-0">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Pregúntame sobre tus trades..."
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            disabled={isTyping}
            className="flex-1 text-sm"
          />
          <Button
            onClick={handleSendMessage}
            disabled={isTyping || !inputMessage.trim()}
            size="icon"
            className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
          >
            {isTyping ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Send className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}