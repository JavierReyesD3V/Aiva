
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Crown, AlertTriangle } from "lucide-react";

interface SubscriptionAlertProps {
  message: string;
  onUpgrade?: () => void;
  showUpgradeButton?: boolean;
}

export default function SubscriptionAlert({ 
  message, 
  onUpgrade, 
  showUpgradeButton = true 
}: SubscriptionAlertProps) {
  return (
    <Alert className="border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-orange-800">{message}</span>
        {showUpgradeButton && onUpgrade && (
          <Button 
            size="sm" 
            onClick={onUpgrade}
            className="ml-4 bg-[#3b82f6] hover:bg-[#2563eb]"
          >
            <Crown className="w-4 h-4 mr-1" />
            Actualizar
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
