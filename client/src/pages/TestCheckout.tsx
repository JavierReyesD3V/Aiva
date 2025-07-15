import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { apiRequest } from "@/lib/queryClient";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const CheckoutForm = () => {
  const stripe = useStripe();
  const elements = useElements();

  return (
    <div className="min-h-screen bg-purple-gradient flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center">Test Checkout</h2>
        
        <div className="mb-4 p-4 bg-gray-100 rounded">
          <p>Stripe: {stripe ? "✅ Cargado" : "❌ No cargado"}</p>
          <p>Elements: {elements ? "✅ Cargado" : "❌ No cargado"}</p>
        </div>

        <form>
          <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded">
            <p className="text-sm text-gray-600 mb-2">PaymentElement debería aparecer aquí:</p>
            <PaymentElement />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
            disabled={!stripe}
          >
            Test Payment
          </button>
        </form>
      </div>
    </div>
  );
};

export default function TestCheckout() {
  const [clientSecret, setClientSecret] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("TestCheckout: Starting payment intent creation");
    
    apiRequest("POST", "/api/create-payment-intent", { amount: 99 })
      .then((res) => {
        console.log("TestCheckout: Payment intent response", res.status);
        return res.json();
      })
      .then((data) => {
        console.log("TestCheckout: Payment intent data", data);
        if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          console.log("TestCheckout: Client secret set");
        } else {
          setError("No client secret received");
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("TestCheckout: Error creating payment intent:", error);
        setError(error.message);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-purple-gradient flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full mx-auto mb-4" />
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-purple-gradient flex items-center justify-center">
        <div className="bg-red-500 text-white p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-purple-gradient flex items-center justify-center">
        <div className="bg-yellow-500 text-black p-6 rounded-lg max-w-md">
          <h2 className="text-xl font-bold mb-2">No Client Secret</h2>
          <p>Client secret is empty or undefined</p>
        </div>
      </div>
    );
  }

  console.log("TestCheckout: Rendering Elements with clientSecret:", clientSecret);

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm />
    </Elements>
  );
}