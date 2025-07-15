import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useState, useCallback, useEffect } from 'react';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Stripe promise - solo se carga una vez
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY!);

interface CheckoutFormProps {
  onPaymentSuccess: () => void;
}

const CheckoutForm = ({ onPaymentSuccess }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard?payment=success`,
      },
    });

    setProcessing(false);

    if (error) {
      toast({
        title: "Error en el pago",
        description: error.message,
        variant: "destructive",
      });
    } else {
      onPaymentSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            TradingJournal Pro
          </h1>
          <p className="text-gray-600">Acceso Premium - $99 único pago</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Container for Stripe Payment Element */}
          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <PaymentElement />
          </div>
          
          <button
            type="submit"
            disabled={!stripe || processing}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {processing ? "Procesando..." : "Completar Pago - $99"}
          </button>
          
          <p className="text-xs text-gray-500 text-center">
            Pago seguro procesado por Stripe
          </p>
        </form>
      </div>
    </div>
  );
};

interface FinalCheckoutProps {}

const FinalCheckout = ({}: FinalCheckoutProps) => {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  // Crear payment intent cuando el componente se monta
  const initializePayment = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: 99
      });
      
      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }
      
      const data = await response.json();
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        setError("No se pudo crear el payment intent");
      }
    } catch (err) {
      console.error("Payment initialization error:", err);
      setError("Error al preparar el pago");
    } finally {
      setLoading(false);
    }
  }, []);

  // Inicializar al montar el componente
  useEffect(() => {
    initializePayment();
  }, [initializePayment]);

  const handlePaymentSuccess = () => {
    toast({
      title: "¡Pago exitoso!",
      description: "Acceso premium activado",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
          <p>Preparando checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center p-4">
        <div className="bg-red-500 text-white p-6 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="mb-4">{error}</p>
          <button 
            onClick={initializePayment}
            className="bg-white text-red-500 px-4 py-2 rounded font-semibold"
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
        <div className="bg-yellow-500 text-black p-6 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Sin Client Secret</h2>
          <p>No se pudo obtener el identificador de pago</p>
        </div>
      </div>
    );
  }

  // Solo crear Elements cuando tenemos clientSecret
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#8b5cf6',
      },
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm onPaymentSuccess={handlePaymentSuccess} />
    </Elements>
  );
};

export default FinalCheckout;