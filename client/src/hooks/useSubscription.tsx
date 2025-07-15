import { useQuery } from '@tanstack/react-query';

interface SubscriptionStatus {
  subscriptionType: 'freemium' | 'premium';
  subscriptionExpiry?: string;
  limits: {
    maxTrades: number;
    maxAccounts: number;
    hasAIAnalysis: boolean;
    hasAdvancedReports: boolean;
    hasTradeSuggestions: boolean;
    hasEconomicCalendar: boolean;
  };
}

export function useSubscription() {
  const { data: subscription, isLoading } = useQuery<SubscriptionStatus>({
    queryKey: ['/api/subscription/status'],
  });

  const isPremium = subscription?.subscriptionType === 'premium';
  const isFreemium = subscription?.subscriptionType === 'freemium';

  const canAccess = (feature: string): boolean => {
    if (!subscription) return false;
    if (isPremium) return true;

    switch (feature) {
      case 'ai-analysis':
        return subscription.limits.hasAIAnalysis;
      case 'advanced-reports':
        return subscription.limits.hasAdvancedReports;
      case 'trade-suggestions':
        return subscription.limits.hasTradeSuggestions;
      case 'economic-calendar':
        return subscription.limits.hasEconomicCalendar;
      default:
        return true;
    }
  };

  return {
    subscription,
    isPremium,
    isFreemium,
    isLoading,
    canAccess,
  };
}