
import { storage } from "./storage";

export interface SubscriptionLimits {
  maxTrades: number;
  maxAccounts: number;
  hasAIAnalysis: boolean;
  hasAdvancedReports: boolean;
  hasTradeSuggestions: boolean;
  hasEconomicCalendar: boolean;
}

export const SUBSCRIPTION_LIMITS = {
  freemium: {
    maxTrades: -1, // Ilimitado - Ahora gratuito
    maxAccounts: -1, // Ilimitado - Ahora gratuito
    hasAIAnalysis: true, // Ahora gratuito
    hasAdvancedReports: true, // Ahora gratuito
    hasTradeSuggestions: true, // Ahora gratuito
    hasEconomicCalendar: true, // Ahora gratuito
  },
  premium: {
    maxTrades: -1, // Ilimitado
    maxAccounts: -1, // Ilimitado
    hasAIAnalysis: true,
    hasAdvancedReports: true,
    hasTradeSuggestions: true,
    hasEconomicCalendar: true,
  }
};

export async function checkSubscriptionLimits(userId: string, feature: string): Promise<{ allowed: boolean; reason?: string; limits?: SubscriptionLimits }> {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      return { allowed: false, reason: "Usuario no encontrado" };
    }

    const subscriptionType = user.subscriptionType || "freemium";
    const limits = SUBSCRIPTION_LIMITS[subscriptionType as keyof typeof SUBSCRIPTION_LIMITS];

    // Verificar si la suscripción premium ha expirado
    if (subscriptionType === "premium" && user.subscriptionExpiry) {
      const now = new Date();
      const expiry = new Date(user.subscriptionExpiry);
      if (now > expiry) {
        // Degradar a freemium si la suscripción expiró
        await storage.updateSubscriptionStatus(userId, "freemium", undefined);
        return checkSubscriptionLimits(userId, feature);
      }
    }

    switch (feature) {
      case "trade_creation":
        if (limits.maxTrades > 0) {
          const trades = await storage.getTrades(userId);
          if (trades.length >= limits.maxTrades) {
            return { 
              allowed: false, 
              reason: `Límite de ${limits.maxTrades} trades alcanzado. Actualiza a Premium para trades ilimitados.`,
              limits 
            };
          }
        }
        break;

      case "account_creation":
        if (limits.maxAccounts > 0) {
          const accounts = await storage.getAccounts(userId);
          if (accounts.length >= limits.maxAccounts) {
            return { 
              allowed: false, 
              reason: `Límite de ${limits.maxAccounts} cuenta(s) alcanzado. Actualiza a Premium para cuentas ilimitadas.`,
              limits 
            };
          }
        }
        break;

      case "ai_analysis":
        if (!limits.hasAIAnalysis) {
          return { 
            allowed: false, 
            reason: "Análisis IA disponible solo para usuarios Premium.",
            limits 
          };
        }
        break;

      case "advanced_reports":
        if (!limits.hasAdvancedReports) {
          return { 
            allowed: false, 
            reason: "Reportes avanzados disponibles solo para usuarios Premium.",
            limits 
          };
        }
        break;

      case "trade_suggestions":
        if (!limits.hasTradeSuggestions) {
          return { 
            allowed: false, 
            reason: "Sugerencias de trading disponibles solo para usuarios Premium.",
            limits 
          };
        }
        break;

      case "economic_calendar":
        if (!limits.hasEconomicCalendar) {
          return { 
            allowed: false, 
            reason: "Calendario económico disponible solo para usuarios Premium.",
            limits 
          };
        }
        break;
    }

    return { allowed: true, limits };
  } catch (error) {
    console.error("Error checking subscription limits:", error);
    return { allowed: false, reason: "Error verificando límites de suscripción" };
  }
}

export function requiresPremium(feature: string) {
  return async (req: any, res: any, next: any) => {
    const userId = req.user?.claims?.sub || "demo-user-1";
    const check = await checkSubscriptionLimits(userId, feature);
    
    if (!check.allowed) {
      return res.status(403).json({ 
        error: check.reason,
        subscriptionRequired: true,
        currentLimits: check.limits
      });
    }
    
    req.subscriptionLimits = check.limits;
    next();
  };
}
