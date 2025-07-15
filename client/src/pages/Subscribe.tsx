import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Crown } from "lucide-react";
import { useLocation } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const SubscribeForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      toast({
        title: "Error en el Pago",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "¡Pago Exitoso!",
        description: "¡Bienvenido a TradingJournal Premium!",
      });
      setLocation("/dashboard");
    }

    setIsProcessing(false);
  }

  return (
    <div className="min-h-screen bg-purple-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Plan Information */}
        <Card className="bg-card-gradient border-purple shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Crown className="w-12 h-12 text-yellow-400" />
            </div>
            <CardTitle className="text-3xl font-bold text-white">
              TradingJournal Premium
            </CardTitle>
            <CardDescription className="text-purple-light text-lg">
              Desbloquea todo tu potencial como trader
            </CardDescription>
            <div className="text-center mt-6">
              <span className="text-4xl font-bold text-white">$29.99</span>
              <span className="text-purple-light">/mes</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                "Trades ilimitados",
                "Hasta 10 cuentas de trading",
                "Análisis AI avanzado con GPT-4",
                "Reportes profesionales en PDF",
                "Sugerencias de trading personalizadas",
                "Calendario económico completo",
                "Notificaciones en tiempo real",
                "Soporte prioritario 24/7"
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <span className="text-white">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Form */}
        <Card className="bg-card-gradient border-purple shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-white text-center">
              Información de Pago
            </CardTitle>
            <CardDescription className="text-purple-light text-center">
              Pago seguro procesado por Stripe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="bg-white p-4 rounded-lg">
                <PaymentElement />
              </div>
              <Button 
                type="submit" 
                disabled={!stripe || isProcessing}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 text-lg"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    Procesando...
                  </div>
                ) : (
                  "Suscribirse Ahora"
                )}
              </Button>
              <p className="text-xs text-purple-light text-center">
                Al suscribirte aceptas nuestros términos de servicio. 
                Puedes cancelar en cualquier momento.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function Subscribe() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Create subscription as soon as the page loads
    apiRequest("POST", "/api/create-subscription")
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'existing') {
          toast({
            title: "Suscripción Activa",
            description: "Ya tienes una suscripción premium activa",
          });
        }
        setClientSecret(data.clientSecret);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error creating subscription:", error);
        toast({
          title: "Error",
          description: "No se pudo inicializar el proceso de pago",
          variant: "destructive",
        });
        setIsLoading(false);
      });
  }, [toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-purple-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-white text-lg">Preparando tu suscripción...</p>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-purple-gradient flex items-center justify-center">
        <Card className="bg-card-gradient border-purple shadow-2xl max-w-md">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Error de Configuración</h2>
            <p className="text-purple-light">
              No se pudo inicializar el proceso de pago. Por favor, intenta de nuevo.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Make SURE to wrap the form in <Elements> which provides the stripe context.
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <SubscribeForm />
    </Elements>
  );
}