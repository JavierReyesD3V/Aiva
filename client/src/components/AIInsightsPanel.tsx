import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Lightbulb, AlertTriangle, ThumbsUp } from "lucide-react";
import { useState } from "react";

export default function AIInsightsPanel() {
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  const { data: insights, isLoading } = useQuery({
    queryKey: ["/api/ai/insights"],
  });

  const generateFullReport = async () => {
    setIsGeneratingReport(true);
    try {
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
      
      const blob = await response.blob();
      
      // Create download link for the HTML report
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-analisis-trading-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Failed to generate HTML report:", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const mockInsights = [
    {
      type: "pattern",
      icon: Lightbulb,
      title: "Pattern Recognition",
      message: "Your EURUSD trades show 85% success rate during European session hours.",
      bgColor: "bg-blue-600 bg-opacity-10",
      borderColor: "border-blue-600 border-opacity-30",
      textColor: "text-blue-400",
    },
    {
      type: "warning",
      icon: AlertTriangle,
      title: "Risk Management",
      message: "Consider reducing position size on XAUUSD trades - higher volatility detected.",
      bgColor: "bg-yellow-600 bg-opacity-10",
      borderColor: "border-yellow-600 border-opacity-30",
      textColor: "text-yellow-400",
    },
    {
      type: "strength",
      icon: ThumbsUp,
      title: "Strength",
      message: "Excellent discipline in following stop-loss levels. Keep it up!",
      bgColor: "bg-profit bg-opacity-10",
      borderColor: "border-profit border-opacity-30",
      textColor: "text-profit",
    },
  ];

  const displayInsights = insights?.insights?.length > 0 
    ? insights.insights.map((insight: string, index: number) => ({
        ...mockInsights[index % mockInsights.length],
        message: insight,
      }))
    : mockInsights;

  return (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700/50">
      <CardHeader>
        <CardTitle className="flex items-center text-white">
          <Brain className="w-5 h-5 mr-2 text-primary" />
          Insights AIVA
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {displayInsights.slice(0, 3).map((insight, index) => {
              const Icon = insight.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-900/70 backdrop-blur-sm border border-gray-600/40 rounded-lg p-4 shadow-lg"
                >
                  <div className="flex items-start">
                    <Icon className={`${insight.textColor} mt-1 mr-3 w-5 h-5`} />
                    <div>
                      <h4 className={`font-medium ${insight.textColor} mb-1`}>
                        {insight.title}
                      </h4>
                      <p className="text-sm text-gray-100 font-medium leading-relaxed">{insight.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}

            <Button
              onClick={generateFullReport}
              disabled={isGeneratingReport}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isGeneratingReport ? (
                <>
                  <Brain className="w-4 h-4 mr-2 animate-pulse" />
                  Generating AI Report...
                </>
              ) : (
                "Generar Reporte PDF Completo"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
