import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast({
        title: "Error",
        description: "Stripe no está listo",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?payment=success`,
        },
      });

      if (error) {
        toast({
          title: "Error en el pago",
          description: error.message,
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Error inesperado en el pago",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            TradingJournal Pro
          </h1>
          <p className="text-gray-600">Acceso Premium - Pago único $99</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Stripe Payment Element con configuración estática */}
            <div>
              <PaymentElement />
            </div>
            
            <div className="text-sm text-gray-600 text-center">
              <p>✅ Pago seguro con Stripe</p>
              <p>✅ Acceso inmediato después del pago</p>
              <p>✅ Una sola vez - Sin suscripciones</p>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={!stripe || processing}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-4 px-6 rounded-lg font-bold text-lg hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
          >
            {processing ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
                Procesando...
              </div>
            ) : (
              "Completar Pago - $99"
            )}
          </button>
          
          <div className="text-xs text-gray-500 text-center">
            Procesado de forma segura por Stripe. No guardamos información de tarjetas.
          </div>
        </form>
      </div>
    </div>
  );
};

export default function WorkingCheckout() {
  const [clientSecret, setClientSecret] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const initPayment = async () => {
      try {
        console.log("Iniciando creación de payment intent...");
        
        const response = await apiRequest("POST", "/api/create-payment-intent", {
          amount: 99
        });
        
        console.log("Respuesta del servidor:", response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Datos recibidos:", data);
        
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          console.log("Client secret establecido correctamente");
        } else {
          throw new Error("No se recibió clientSecret");
        }
      } catch (err: any) {
        console.error("Error en initPayment:", err);
        setError(err.message || "Error al crear el pago");
      } finally {
        setLoading(false);
      }
    };

    initPayment();
  }, []); // Solo ejecutar una vez al montar

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Preparando checkout...</h2>
          <p className="text-purple-200 mt-2">Conectando con Stripe</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center p-4">
        <div className="bg-red-500 text-white p-8 rounded-xl max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p className="mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="bg-white text-red-500 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center p-4">
        <div className="bg-yellow-500 text-black p-8 rounded-xl max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Problema de configuración</h2>
          <p>No se pudo obtener el identificador de pago de Stripe.</p>
        </div>
      </div>
    );
  }

  // Opciones de Stripe Elements con configuración estática
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#8b5cf6',
        colorBackground: '#ffffff',
        colorText: '#262626',
        colorDanger: '#df1b41',
        fontFamily: 'system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
    },
  };

  console.log("Renderizando Elements con clientSecret:", clientSecret);

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm />
    </Elements>
  );
}