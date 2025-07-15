import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Check, Crown, Tag } from "lucide-react";
import { useLocation } from "wouter";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [, setLocation] = useLocation();
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [finalPrice, setFinalPrice] = useState(99);

  const applyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast({
        title: "Código requerido",
        description: "Por favor ingresa un código promocional",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/validate-promo", { code: promoCode });
      const data = await response.json();
      
      if (data.valid) {
        setPromoApplied(true);
        setDiscount(data.discount);
        setFinalPrice(data.finalPrice);
        
        const message = data.discount === 100 
          ? `¡GRATIS! ${data.remainingUses ? `(${data.remainingUses - 1} usos restantes)` : ''}`
          : `Descuento de ${data.discount}% aplicado`;
          
        toast({
          title: "¡Código aplicado!",
          description: message,
        });
      } else {
        toast({
          title: "Código inválido",
          description: data.message || "El código promocional no es válido",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo validar el código promocional",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsProcessing(true);

    // Handle free access case
    if (finalPrice === 0) {
      try {
        await apiRequest("POST", "/api/create-payment-intent", { 
          amount: 0,
          promoCode 
        });
        toast({
          title: "¡Acceso Premium Activado!",
          description: "¡Bienvenido a TradingJournal Premium!",
        });
        setLocation("/dashboard");
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo activar el acceso premium",
          variant: "destructive",
        });
      }
      setIsProcessing(false);
      return;
    }

    if (!stripe || !elements) {
      setIsProcessing(false);
      return;
    }

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
              Acceso de por vida a todas las funciones premium
            </CardDescription>
            <div className="text-center mt-6">
              {promoApplied && discount > 0 ? (
                <div>
                  <div className="text-lg line-through text-purple-light">$99</div>
                  <div className="text-4xl font-bold text-green-400">
                    {finalPrice === 0 ? "¡GRATIS!" : `$${finalPrice}`}
                  </div>
                  <div className="text-sm text-green-400">
                    {discount === 100 ? "¡Acceso gratuito!" : `Descuento del ${discount}% aplicado`}
                  </div>
                </div>
              ) : (
                <>
                  <span className="text-4xl font-bold text-white">$99</span>
                  <span className="text-purple-light"> pago único</span>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                "Trades ilimitados de por vida",
                "Hasta 10 cuentas de trading",
                "Análisis AI avanzado con GPT-4",
                "Reportes profesionales en PDF",
                "Sugerencias de trading personalizadas",
                "Calendario económico completo",
                "Notificaciones en tiempo real",
                "Soporte prioritario de por vida"
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
              {/* Código Promocional */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-white">
                  <Tag className="w-4 h-4" />
                  <span className="text-sm font-medium">Código Promocional</span>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Ingresa tu código"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    disabled={promoApplied}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    onClick={applyPromoCode}
                    disabled={promoApplied || !promoCode.trim()}
                    variant="outline"
                    className="px-4"
                  >
                    {promoApplied ? "Aplicado" : "Aplicar"}
                  </Button>
                </div>
                {promoApplied && (
                  <div className="text-green-400 text-sm flex items-center gap-1">
                    <Check className="w-4 h-4" />
                    Código promocional aplicado exitosamente
                  </div>
                )}
              </div>
              
              {/* Formulario de pago de Stripe - siempre mostrar para debug */}
              <div className="bg-white p-4 rounded-lg min-h-[200px] border-2 border-red-500">
                <div className="text-black text-sm mb-2">
                  PaymentElement Container (precio: ${finalPrice})
                </div>
                <PaymentElement 
                  options={{
                    layout: 'tabs'
                  }}
                />
              </div>
              
              {/* Mensaje para acceso gratuito */}
              {finalPrice === 0 && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg text-center">
                  <h3 className="font-bold text-lg">¡Acceso Completamente Gratis!</h3>
                  <p>Haz clic en el botón para activar tu cuenta premium sin costo.</p>
                </div>
              )}
              
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
                  finalPrice === 0 ? "Activar Acceso Gratuito" : `Comprar Premium - $${finalPrice}`
                )}
              </Button>
              <p className="text-xs text-purple-light text-center">
                Pago único. Sin suscripciones. Acceso de por vida a todas las funciones premium.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function SimpleCheckout() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Create PaymentIntent as soon as the page loads
    apiRequest("POST", "/api/create-payment-intent", { amount: 99 })
      .then((res) => res.json())
      .then((data) => {
        if (data.freeAccess) {
          setClientSecret("free-access");
        } else {
          setClientSecret(data.clientSecret);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error creating payment intent:", error);
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
          <p className="text-white text-lg">Preparando tu pago...</p>
        </div>
      </div>
    );
  }

  if (!clientSecret || clientSecret === "free-access") {
    return <CheckoutForm />;
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm />
    </Elements>
  );
}