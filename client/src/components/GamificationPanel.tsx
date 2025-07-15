import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Target, Shield, Award, Sparkles, ArrowRight } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { Link } from "wouter";

// Level calculation function (matches server-side logic)
function calculateLevel(points: number) {
  let level = 1;
  let pointsRequired = 100; // Base points for level 1
  let totalPointsForLevel = 0;

  while (points >= totalPointsForLevel + pointsRequired) {
    totalPointsForLevel += pointsRequired;
    level++;
    pointsRequired = Math.floor(pointsRequired * 1.1); // 10% increase per level
  }

  const pointsForCurrentLevel = totalPointsForLevel;
  const pointsForNextLevel = totalPointsForLevel + pointsRequired;
  const progressPercentage = pointsRequired > 0 ? 
    ((points - pointsForCurrentLevel) / pointsRequired) * 100 : 0;

  return {
    currentLevel: level,
    currentPoints: points,
    pointsForCurrentLevel,
    pointsForNextLevel,
    progressPercentage,
  };
}

export default function GamificationPanel() {
  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
    refetchInterval: 30000,
  });

  const { data: achievements } = useQuery({
    queryKey: ["/api/achievements"],
    refetchInterval: 60000,
  });

  const { data: dailyProgress } = useQuery({
    queryKey: ["/api/progress/daily"],
    refetchInterval: 45000,
  });

  // Calculate level info based on current points
  const currentPoints = (userStats as any)?.currentPoints || 0;
  const levelInfo = calculateLevel(currentPoints);
  const currentLevel = levelInfo.currentLevel;
  const xpProgress = levelInfo.progressPercentage;

  // Get unlocked achievements
  const unlockedAchievements = Array.isArray(achievements) 
    ? achievements.filter((a: any) => a.isUnlocked) 
    : [];
  
  const recentAchievements = unlockedAchievements
    .sort((a: any, b: any) => 
      new Date(b.unlockedAt || Date.now()).getTime() - new Date(a.unlockedAt || Date.now()).getTime()
    )
    .slice(0, 3);

  const getAchievementIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case "streak":
        return Star;
      case "performance":
        return Shield;
      case "milestone":
        return Target;
      case "risk_management":
        return Shield;
      case "profit":
        return Award;
      case "advanced":
        return Sparkles;
      default:
        return Trophy;
    }
  };

  return (
    <Card className="bg-gradient-to-br from-purple-900/70 to-pink-900/50 border-purple-500/30 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="w-5 h-5 text-purple-400" />
            Achievements
            <Sparkles className="w-4 h-4 text-pink-400" />
          </CardTitle>
          <Badge className="bg-purple-500/20 text-purple-200 border-purple-400/30">
            Level {currentLevel}
          </Badge>
        </div>
        
        {/* Level Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-purple-300">XP Progress</span>
            <span className="text-sm text-purple-300">{currentPoints} XP</span>
          </div>
          <Progress 
            value={xpProgress} 
            className="h-2 bg-purple-900/50 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500"
          />
          <div className="text-xs text-purple-400">
            {Math.round(xpProgress)}% to Level {currentLevel + 1} ({levelInfo.pointsForNextLevel - currentPoints} XP needed)
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Recent Achievements */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-purple-300">Recent Unlocked</h4>
          {recentAchievements.length > 0 ? (
            recentAchievements.map((achievement: any) => {
              const Icon = getAchievementIcon(achievement.category);
              return (
                <div
                  key={achievement.id}
                  className="flex items-center p-3 rounded-lg bg-purple-800/30 border border-purple-500/20 hover:border-purple-400/40 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mr-3">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white truncate">
                      {achievement.name}
                    </h4>
                    <p className="text-xs text-purple-300 truncate">
                      {achievement.description}
                    </p>
                  </div>
                  <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">
                    +{achievement.points} XP
                  </Badge>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6">
              <Trophy className="w-10 h-10 text-purple-400 mx-auto mb-3" />
              <p className="text-purple-300 text-sm mb-2">No achievements yet</p>
              <p className="text-xs text-purple-400">
                Complete trades to unlock rewards!
              </p>
            </div>
          )}
        </div>

        {/* Achievement Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-3 rounded-lg bg-purple-800/20">
            <p className="text-lg font-bold text-white">{unlockedAchievements.length}</p>
            <p className="text-xs text-purple-300">Unlocked</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-purple-800/20">
            <p className="text-lg font-bold text-white">{Array.isArray(achievements) ? achievements.length : 0}</p>
            <p className="text-xs text-purple-300">Total</p>
          </div>
        </div>

        <Link href="/achievements">
          <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none">
            <Trophy className="w-4 h-4 mr-2" />
            View All Achievements
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
