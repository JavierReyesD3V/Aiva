import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUserActions } from "@/contexts/UserActionsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TradeForm from "@/components/TradeForm";
import ImportModal from "@/components/ImportModal";
import MobileHeader from "@/components/MobileHeader";
import { 
  Trophy, 
  Star, 
  Target, 
  Shield, 
  Medal,
  Crown,
  Flame,
  Calendar
} from "lucide-react";
import { formatDate, calculateLevel } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function Achievements() {
  const queryClient = useQueryClient();
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importModalMode, setImportModalMode] = useState<'new' | 'change' | 'clear'>('new');
  
  const { setUserActions } = useUserActions();

  // Configure context functions for Sidebar buttons
  useEffect(() => {
    setUserActions({
      onShowTradeForm: () => setShowTradeForm(true),
      onShowImportModal: (mode: 'new' | 'change' | 'clear') => {
        setImportModalMode(mode);
        setShowImportModal(true);
      }
    });
  }, [setUserActions]);
  
  const { data: achievements = [], refetch: refetchAchievements } = useQuery<any[]>({
    queryKey: ["/api/achievements"],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale
  });

  const { data: userStats, refetch: refetchUserStats } = useQuery({
    queryKey: ["/api/user/stats"],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale
  });

  // Invalidate cache when achievements are loaded to ensure fresh data
  useEffect(() => {
    if (achievements.length > 0) {
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
    }
  }, [achievements.length, queryClient]);

  const { data: dailyProgress = [] } = useQuery({
    queryKey: ["/api/progress/daily"],
    queryFn: () => fetch("/api/progress/daily?days=30").then(res => res.json()),
  });

  const levelInfo = calculateLevel((userStats as any)?.currentPoints || 0);

  const unlockedAchievements = Array.isArray(achievements) ? achievements.filter((a: any) => a.isUnlocked) : [];
  const lockedAchievements = Array.isArray(achievements) ? achievements.filter((a: any) => !a.isUnlocked) : [];

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case "streak":
        return Flame;
      case "performance":
        return Shield;
      case "milestone":
        return Target;
      default:
        return Trophy;
    }
  };

  const getAchievementColor = (type: string) => {
    switch (type) {
      case "streak":
        return "text-yellow-400";
      case "performance":
        return "text-blue-400";
      case "milestone":
        return "text-profit";
      default:
        return "text-purple-400";
    }
  };

  const recentProgress = Array.isArray(dailyProgress) ? dailyProgress.slice(0, 7) : [];
  const currentStreak = recentProgress.reduce((streak: number, day: any) => {
    return day.dailyProfitTarget ? streak + 1 : 0;
  }, 0);

  const progressStats = {
    totalPointsEarned: dailyProgress.reduce((sum: number, day: any) => sum + (day.pointsEarned || 0), 0),
    perfectDays: dailyProgress.filter((day: any) => 
      day.dailyProfitTarget && day.riskControl && day.noOvertrading
    ).length,
    currentStreak,
    longestStreak: Math.max(...dailyProgress.map((day: any) => day.dailyProfitTarget ? 1 : 0), 0),
  };

  // Calculate progress towards next achievements
  const nextAchievements = lockedAchievements.map((achievement: any) => {
    let progress = 0;
    let total = 1;
    let description = "";

    switch (achievement.condition) {
      case "profitable_streak_5":
        progress = Math.min(currentStreak, 5);
        total = 5;
        description = `${progress}/5 consecutive profitable trades`;
        break;
      case "risk_control_10_days":
        const riskControlDays = dailyProgress.filter((day: any) => day.riskControl).length;
        progress = Math.min(riskControlDays, 10);
        total = 10;
        description = `${progress}/10 days with perfect risk control`;
        break;
      case "profitable_days_7":
        progress = Math.min(currentStreak, 7);
        total = 7;
        description = `${progress}/7 consecutive profitable days`;
        break;
      case "perfect_week":
        progress = Math.min(progressStats.perfectDays, 7);
        total = 7;
        description = `${progress}/7 perfect trading days`;
        break;
      default:
        description = "Progress tracking not available";
    }

    return {
      ...achievement,
      progress,
      total,
      progressDescription: description,
      progressPercentage: (progress / total) * 100,
    };
  });

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Mobile Header */}
      <MobileHeader 
        title="Logros Trading" 
        subtitle="Trading Achievements"

      />
      
      {/* Desktop Header */}
      <header className="bg-card-gradient border-b border-purple p-6 shadow-sm hidden md:block">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Trophy className="w-8 h-8 mr-3 text-pink-400" />
              Logros y Progreso
            </h2>
            <p className="text-purple-light">
              Rastrea tus hitos de trading y progresión de nivel
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <p className="text-sm text-purple-light">Current Level</p>
                <p className="text-3xl font-bold text-pink-400">{levelInfo.currentLevel}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-purple-light">Total XP</p>
                <p className="text-3xl font-bold text-pink-400">{levelInfo.currentPoints}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Level Progress */}
        <Card className="bg-card-gradient border-purple shadow-lg">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Crown className="w-5 h-5 mr-2 text-pink-400" />
              Level Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Level {levelInfo.currentLevel}
                  </h3>
                  <p className="text-purple-light">
                    {levelInfo.pointsForNextLevel - levelInfo.currentPoints} XP to next level
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-pink-400">
                    {levelInfo.currentPoints}
                  </p>
                  <p className="text-sm text-purple-light">
                    / {levelInfo.pointsForNextLevel} XP
                  </p>
                </div>
              </div>
              <Progress value={levelInfo.progressPercentage} className="h-3" />
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-card-gradient border-purple shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-light text-sm">Achievements Unlocked</p>
                  <p className="text-2xl font-bold text-pink-400">{unlockedAchievements.length}</p>
                </div>
                <Medal className="w-8 h-8 text-pink-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-gradient border-purple shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-light text-sm">Current Streak</p>
                  <p className="text-2xl font-bold text-green-400">{currentStreak}</p>
                  <p className="text-xs text-purple-light">profitable days</p>
                </div>
                <Flame className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-gradient border-purple shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-light text-sm">Perfect Days</p>
                  <p className="text-2xl font-bold text-blue-400">{progressStats.perfectDays}</p>
                  <p className="text-xs text-purple-light">this month</p>
                </div>
                <Calendar className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card-gradient border-purple shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-light text-sm">Points Earned</p>
                  <p className="text-2xl font-bold text-pink-400">{progressStats.totalPointsEarned}</p>
                  <p className="text-xs text-purple-light">last 30 days</p>
                </div>
                <Star className="w-8 h-8 text-pink-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Achievements Tabs */}
        <Tabs defaultValue="unlocked" className="space-y-6">
          <TabsList className="flex w-full md:grid md:grid-cols-3 bg-card-gradient border border-purple overflow-x-auto">
            <TabsTrigger value="unlocked" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white text-purple-light hover:text-white flex-shrink-0">
              Unlocked ({unlockedAchievements.length})
            </TabsTrigger>
            <TabsTrigger value="progress" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white text-purple-light hover:text-white flex-shrink-0">
              In Progress ({nextAchievements.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-pink-500 data-[state=active]:text-white text-purple-light hover:text-white flex-shrink-0">
              All Achievements ({achievements.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unlocked" className="space-y-4">
            {unlockedAchievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {unlockedAchievements.map((achievement: any) => {
                  const Icon = getAchievementIcon(achievement.type);
                  const colorClass = getAchievementColor(achievement.type);
                  
                  return (
                    <Card key={achievement.id} className="bg-card-gradient border-purple shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className={`w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-white">{achievement.name}</h3>
                              <Badge variant="secondary" className="bg-pink-500 bg-opacity-20 text-pink-400 border-pink-400">
                                +{achievement.points} XP
                              </Badge>
                            </div>
                            <p className="text-purple-light text-sm mb-2">{achievement.description}</p>
                            <p className="text-xs text-purple-light opacity-70">
                              Unlocked {formatDate(achievement.unlockedAt)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-card-gradient border-purple shadow-lg">
                <CardContent className="p-12 text-center">
                  <Trophy className="w-16 h-16 text-purple-light mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    No achievements unlocked yet
                  </h3>
                  <p className="text-purple-light">
                    Start trading to unlock your first achievement!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            {nextAchievements.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {nextAchievements.map((achievement: any) => {
                  const Icon = getAchievementIcon(achievement.type);
                  const colorClass = getAchievementColor(achievement.type);
                  
                  return (
                    <Card key={achievement.id} className="bg-card-gradient border-purple shadow-lg">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-purple-700/50 rounded-lg flex items-center justify-center">
                            <Icon className={`w-6 h-6 ${colorClass}`} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-white">{achievement.name}</h3>
                              <Badge variant="secondary" className="bg-purple-500 bg-opacity-20 text-purple-300 border-purple-400">
                                +{achievement.points} XP
                              </Badge>
                            </div>
                            <p className="text-purple-light text-sm mb-3">{achievement.description}</p>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-purple-light">{achievement.progressDescription}</span>
                                <span className="text-white">{Math.round(achievement.progressPercentage)}%</span>
                              </div>
                              <Progress value={achievement.progressPercentage} className="h-2" />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="bg-card-gradient border-purple shadow-lg">
                <CardContent className="p-12 text-center">
                  <Trophy className="w-16 h-16 text-purple-light mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">
                    No achievements in progress
                  </h3>
                  <p className="text-purple-light">
                    All available achievements have been unlocked!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {achievements.map((achievement: any) => {
                const Icon = getAchievementIcon(achievement.type);
                const colorClass = getAchievementColor(achievement.type);
                
                return (
                  <Card key={achievement.id} className={`bg-card-gradient border-purple shadow-lg ${achievement.isUnlocked ? 'ring-1 ring-pink-500 ring-opacity-30' : ''}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          achievement.isUnlocked ? 'bg-pink-500' : 'bg-purple-700/50'
                        }`}>
                          <Icon className={`w-6 h-6 ${achievement.isUnlocked ? 'text-white' : colorClass}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className={`font-semibold ${achievement.isUnlocked ? 'text-white' : 'text-purple-light'}`}>
                              {achievement.name}
                            </h3>
                            <Badge 
                              variant="secondary"
                              className={achievement.isUnlocked ? 
                                "bg-pink-500 bg-opacity-20 text-pink-400 border-pink-400" : 
                                "bg-purple-500 bg-opacity-20 text-purple-300 border-purple-400"
                              }
                            >
                              +{achievement.points} XP
                            </Badge>
                          </div>
                          <p className={`text-sm mb-2 ${achievement.isUnlocked ? 'text-purple-light' : 'text-purple-light opacity-70'}`}>
                            {achievement.description}
                          </p>
                          {achievement.isUnlocked && (
                            <p className="text-xs text-purple-light opacity-70">
                              Unlocked {formatDate(achievement.unlockedAt)}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sidebar Modal Integration */}
      <TradeForm open={showTradeForm} onOpenChange={setShowTradeForm} />
      <ImportModal 
        open={showImportModal} 
        onOpenChange={setShowImportModal}
        mode={importModalMode}
      />
    </div>
  );
}
