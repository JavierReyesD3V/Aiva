import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, X } from "lucide-react";

interface Achievement {
  id: number;
  title: string;
  description: string;
  points: number;
  icon: string;
  timestamp: Date;
}

interface AchievementNotificationProps {
  achievement: Achievement | null;
  onDismiss: () => void;
}

export default function AchievementNotification({
  achievement,
  onDismiss,
}: AchievementNotificationProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (achievement) {
      setVisible(true);
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 300); // Wait for exit animation
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [achievement, onDismiss]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 300);
  };

  if (!achievement) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 transition-transform duration-300 ${
        visible ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <Card className="bg-gradient-to-r from-yellow-600 to-yellow-500 text-white p-4 shadow-lg max-w-sm">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold">Achievement Unlocked!</h4>
            <p className="text-sm opacity-90">{achievement.title}</p>
            <p className="text-xs opacity-75 mt-1">
              +{achievement.points} XP earned
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDismiss}
            className="text-white hover:bg-white hover:bg-opacity-20 p-1 h-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
