
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Lock, Check, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function SubscriptionStatus() {
  const { data: subscription } = useQuery({
    queryKey: ["/api/subscription/status"],
  });

  const handleUpgrade = async () => {
    try {
      const response = await fetch("/api/subscription/upgrade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ months: 1 }),
      });

      if (response.ok) {
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || "Error actualizando suscripción");
      }
    } catch (error) {
      console.error("Error upgrading subscription:", error);
      alert("Error actualizando suscripción");
    }
  };

  if (!subscription) return null;

  const isPremium = subscription.subscriptionType === "premium" && !subscription.isExpired;

  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            {isPremium ? (
              <>
                <Crown className="w-5 h-5 text-yellow-500" />
                Plan Premium
              </>
            ) : (
              <>
                <Lock className="w-5 h-5 text-gray-500" />
                Plan Freemium
              </>
            )}
          </CardTitle>
          <Badge variant={isPremium ? "default" : "secondary"}>
            {isPremium ? "Activo" : "Básico"}
          </Badge>
        </div>
        {isPremium && subscription.subscriptionExpiry && (
          <p className="text-sm text-gray-600">
            Expira: {formatDate(new Date(subscription.subscriptionExpiry))}
          </p>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {subscription.limits.maxTrades === -1 ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-red-500" />
                )}
                <span>
                  Trades: {subscription.limits.maxTrades === -1 ? "Ilimitados" : subscription.limits.maxTrades}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {subscription.limits.maxAccounts === -1 ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-red-500" />
                )}
                <span>
                  Cuentas: {subscription.limits.maxAccounts === -1 ? "Ilimitadas" : subscription.limits.maxAccounts}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {subscription.limits.hasAIAnalysis ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-red-500" />
                )}
                <span>Análisis IA</span>
              </div>
              <div className="flex items-center gap-2">
                {subscription.limits.hasTradeSuggestions ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <X className="w-4 h-4 text-red-500" />
                )}
                <span>Sugerencias</span>
              </div>
            </div>
          </div>
          
          {!isPremium && (
            <div className="pt-3 border-t border-gray-200">
              <Button onClick={handleUpgrade} className="w-full bg-[#3b82f6] hover:bg-[#2563eb]">
                <Crown className="w-4 h-4 mr-2" />
                Actualizar a Premium
              </Button>
              <p className="text-xs text-gray-600 mt-2 text-center">
                Desbloquea todas las funciones avanzadas
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
