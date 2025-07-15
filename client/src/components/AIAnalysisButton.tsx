import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Brain, Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AIAnalysisButton() {
  const { toast } = useToast();

  const generateAnalysisMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/analyze", {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Análisis Completado",
        description: "Tu análisis de trading ha sido generado exitosamente.",
      });
      
      // Mostrar resultados en un modal o actualizar la UI
      console.log("Análisis AI:", data);
    },
    onError: (error: any) => {
      toast({
        title: "Error en Análisis",
        description: error.message || "No se pudo generar el análisis. Intenta de nuevo.",
        variant: "destructive",
      });
    },
  });

  return (
    <Button
      onClick={() => generateAnalysisMutation.mutate()}
      disabled={generateAnalysisMutation.isPending}
      className="bg-purple-500 hover:bg-purple-600 text-white"
      size="lg"
    >
      {generateAnalysisMutation.isPending ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Generando Análisis...
        </>
      ) : (
        <>
          <Brain className="w-4 h-4 mr-2" />
          Generar Reporte de Análisis AIVA
        </>
      )}
    </Button>
  );
}