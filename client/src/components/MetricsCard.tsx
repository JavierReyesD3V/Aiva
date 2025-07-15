import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricsCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  colorScheme?: "profit" | "loss" | "primary" | "warning";
}

export default function MetricsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend = "neutral",
  colorScheme = "primary",
}: MetricsCardProps) {
  const getColorClasses = () => {
    switch (colorScheme) {
      case "profit":
        return {
          iconBg: "bg-green-500/20",
          iconColor: "text-green-400",
          valueColor: "text-green-400",
        };
      case "loss":
        return {
          iconBg: "bg-red-500/20",
          iconColor: "text-red-400",
          valueColor: "text-red-400",
        };
      case "warning":
        return {
          iconBg: "bg-yellow-500/20",
          iconColor: "text-yellow-400",
          valueColor: "text-yellow-400",
        };
      default:
        return {
          iconBg: "bg-pink-500/20",
          iconColor: "text-pink-400",
          valueColor: "text-white",
        };
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-400";
      case "down":
        return "text-red-400";
      default:
        return "text-gray-500";
    }
  };

  const colors = getColorClasses();

  return (
    <Card className="bg-card-gradient border-purple shadow-lg overflow-hidden">
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-purple-light text-xs sm:text-sm font-medium truncate">{title}</p>
            <p className={cn("text-lg sm:text-xl md:text-2xl font-bold mt-1 break-words", colors.valueColor)}>
              {value}
            </p>
            <p className={cn("text-xs sm:text-sm mt-1 line-clamp-2", getTrendColor())}>
              {subtitle}
            </p>
          </div>
          <div className={cn("w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0", colors.iconBg)}>
            <Icon className={cn("w-5 h-5 sm:w-6 sm:h-6", colors.iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
