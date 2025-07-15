import { useEffect, useState } from 'react';
import { useSpring, animated, useTrail } from 'react-spring';
import { useInView } from 'react-intersection-observer';
import { useQuery } from '@tanstack/react-query';
import { useUserActions } from '@/contexts/UserActionsContext';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatNumber } from '@/lib/utils';
import { Link } from 'wouter';
import MobileHeader from '@/components/MobileHeader';

import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  Award, 
  Target, 
  Activity,
  Zap,
  Brain,
  Star,
  Users,
  Calendar,
  ArrowRight,
  Sparkles,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import TradingChart from '@/components/TradingChart';
import AIAnalysisButton from '@/components/AIAnalysisButton';
import GamificationPanel from '@/components/GamificationPanel';
import MarketOverview from '@/components/MarketOverview';
import TradeForm from '@/components/TradeForm';
import ImportModal from '@/components/ImportModal';

import Typewriter from 'typewriter-effect';

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

export default function ModernDashboard() {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [metricsRef, metricsInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [chartsRef, chartsInView] = useInView({ threshold: 0.1, triggerOnce: true });
  const [gamificationRef, gamificationInView] = useInView({ threshold: 0.1, triggerOnce: true });
  
  // Modal states for Sidebar buttons
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importModalMode, setImportModalMode] = useState<'new' | 'change' | 'clear'>('new');
  const { setUserActions } = useUserActions();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Configure context functions for Sidebar buttons like in Dashboard
  useEffect(() => {
    setUserActions({
      onShowTradeForm: () => setShowTradeForm(true),
      onShowImportModal: (mode: 'new' | 'change' | 'clear') => {
        setImportModalMode(mode);
        setShowImportModal(true);
      }
    });
  }, []); // Remove setUserActions from dependencies to prevent loop

  const { data: metrics } = useQuery({
    queryKey: ["/api/metrics"],
  });

  const { data: trades } = useQuery({
    queryKey: ["/api/trades"],
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
    refetchInterval: 30000,
  });

  // Animations
  const heroAnimation = useSpring({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0px)' : 'translateY(30px)',
    config: { tension: 280, friction: 60 }
  });

  const floatingElements = useSpring({
    from: { transform: 'translateY(0px) rotate(0deg)' },
    to: async (next) => {
      while (true) {
        await next({ transform: 'translateY(-8px) rotate(3deg)' });
        await next({ transform: 'translateY(0px) rotate(0deg)' });
      }
    },
    config: { duration: 6000, tension: 120, friction: 50 }
  });

  const metricsAnimation = useSpring({
    opacity: metricsInView ? 1 : 0,
    transform: metricsInView ? 'translateY(0px)' : 'translateY(50px)',
    config: { tension: 280, friction: 60 }
  });

  const chartsAnimation = useSpring({
    opacity: chartsInView ? 1 : 0,
    transform: chartsInView ? 'scale(1)' : 'scale(0.95)',
    config: { tension: 280, friction: 60 }
  });

  const gamificationAnimation = useSpring({
    opacity: gamificationInView ? 1 : 0,
    transform: gamificationInView ? 'translateX(0px)' : 'translateX(-50px)',
    config: { tension: 280, friction: 60 }
  });

  const metricCards = [
    {
      title: 'Total Trades',
      value: (metrics as any)?.totalTrades || 0,
      icon: Activity,
      color: 'from-blue-500 to-purple-500',
      trend: '+12%',
      isPositive: true
    },
    {
      title: 'Total Profit',
      value: `$${formatNumber((metrics as any)?.totalProfit || 0)}`,
      icon: DollarSign,
      color: 'from-green-500 to-emerald-500',
      trend: '+8.5%',
      isPositive: ((metrics as any)?.totalProfit || 0) >= 0
    },
    {
      title: 'Win Rate',
      value: `${((metrics as any)?.winRate || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      trend: '+2.3%',
      isPositive: true
    },
    {
      title: 'Profitable Trades',
      value: `${(metrics as any)?.profitableTrades || 0}`,
      icon: BarChart3,
      color: 'from-orange-500 to-red-500',
      trend: '+5.1%',
      isPositive: true
    }
  ];

  const trail = useTrail(metricCards.length, {
    opacity: metricsInView ? 1 : 0,
    transform: metricsInView ? 'translateY(0px)' : 'translateY(50px)',
    config: { tension: 280, friction: 60 }
  });

  const recentTrades = (trades as any)?.slice?.(0, 5) || [];
  const currentPoints = (userStats as any)?.currentPoints || 0;
  const levelInfo = calculateLevel(currentPoints);
  const currentLevel = levelInfo.currentLevel;
  const xpProgress = levelInfo.progressPercentage;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 text-white relative overflow-hidden">
      {/* Mobile Header */}
      <MobileHeader 
        title="Dashboard" 
        subtitle="Trading Analytics"
      />
      
      {/* Main Content */}
      <div className="p-4 md:p-6 space-y-6">{/* Restored original structure */}
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <animated.div 
          style={floatingElements}
          className="absolute top-20 right-20 w-32 h-32 bg-purple-500/10 rounded-full blur-xl"
        />
        <animated.div 
          style={floatingElements}
          className="absolute bottom-40 left-20 w-40 h-40 bg-pink-500/10 rounded-full blur-xl"
        />
        <animated.div 
          style={floatingElements}
          className="absolute top-1/2 left-1/3 w-24 h-24 bg-blue-500/10 rounded-full blur-xl"
        />
      </div>

      {/* Hero Section */}
      <animated.div style={heroAnimation} className="relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Welcome Back, Trader
            </h1>
            <div className="text-xl md:text-2xl text-purple-200 mb-4">
              <Typewriter
                options={{
                  strings: [
                    'Ready to analyze your performance?',
                    'Let\'s explore your trading journey',
                    'Time to unlock new insights',
                    'Your AI assistant is ready'
                  ],
                  autoStart: true,
                  loop: true,
                  delay: 80,
                  deleteSpeed: 40
                }}
              />
            </div>
            <div className="flex items-center gap-4 text-purple-300">
              <Badge variant="secondary" className="bg-purple-800/50 text-purple-200 border-purple-500/30">
                Level {currentLevel}
              </Badge>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>{currentPoints} XP</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <AIAnalysisButton />
            <Link href="/trades">
              <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none">
                View All Trades
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-purple-300">Level Progress</span>
            <span className="text-sm text-purple-300">{Math.round(xpProgress)}% to next level</span>
          </div>
          <Progress 
            value={xpProgress} 
            className="h-2 bg-purple-900/50 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500"
          />
        </div>
      </animated.div>

      {/* Metrics Cards */}
      <section ref={metricsRef} className="relative z-10">
        <animated.div style={metricsAnimation}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {trail.map((style, index) => {
              const metric = metricCards[index];
              const IconComponent = metric.icon;
              return (
                <animated.div key={index} style={style}>
                  <Card className="bg-gradient-to-br from-purple-900/70 to-pink-900/50 border-purple-500/30 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.color} flex items-center justify-center`}>
                          <IconComponent className="w-6 h-6 text-white" />
                        </div>
                        <Badge 
                          variant={metric.isPositive ? 'default' : 'destructive'}
                          className="bg-green-500/20 text-green-400 border-green-500/30"
                        >
                          {metric.trend}
                        </Badge>
                      </div>
                      <h3 className="text-sm font-medium text-purple-300 mb-2">{metric.title}</h3>
                      <p className="text-2xl font-bold text-white">{metric.value}</p>
                    </CardContent>
                  </Card>
                </animated.div>
              );
            })}
          </div>
        </animated.div>
      </section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">
        {/* Trading Chart */}
        <div className="lg:col-span-2">
          <animated.div ref={chartsRef} style={chartsAnimation}>
            <Card className="bg-gradient-to-br from-purple-900/70 to-pink-900/50 border-purple-500/30 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingUp className="w-5 h-5 text-purple-400" />
                  Trading Performance
                  <Sparkles className="w-4 h-4 text-pink-400" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <TradingChart />
              </CardContent>
            </Card>
          </animated.div>
        </div>

        {/* Gamification Panel */}
        <div>
          <animated.div ref={gamificationRef} style={gamificationAnimation}>
            <GamificationPanel />
          </animated.div>
        </div>
      </div>

      {/* Market Overview and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        {/* Market Overview */}
        <Card className="bg-gradient-to-br from-purple-900/70 to-pink-900/50 border-purple-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="w-5 h-5 text-purple-400" />
              Live Markets
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                Live
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MarketOverview />
          </CardContent>
        </Card>

        {/* Recent Trades */}
        <Card className="bg-gradient-to-br from-purple-900/70 to-pink-900/50 border-purple-500/30 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                Recent Trades
              </div>
              <Link href="/trades">
                <Button variant="ghost" size="sm" className="text-purple-300 hover:text-purple-200">
                  View All
                  <ArrowRight className="ml-1 w-4 h-4" />
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTrades.length > 0 ? (
                recentTrades.map((trade: any, index: number) => (
                  <div key={trade.id} className="flex items-center justify-between p-3 rounded-lg bg-purple-800/30 border border-purple-500/20">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        trade.type.toLowerCase() === 'buy' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                      }`}>
                        {trade.type.toLowerCase() === 'buy' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-white">{trade.symbol}</p>
                        <p className="text-sm text-purple-300">{trade.type} • {trade.lots} lots</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        trade.profit >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        ${formatNumber(trade.profit)}
                      </p>
                      <p className="text-sm text-purple-300">
                        {new Date(trade.openTime).toLocaleDateString('es-ES', { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-purple-300">
                  <Activity className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                  <p>No recent trades</p>
                  <p className="text-sm">Start trading to see your activity here</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-4 justify-center relative z-10">
        <Link href="/trades">
          <Button className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white border-none">
            <BarChart3 className="w-4 h-4 mr-2" />
            Manage Trades
          </Button>
        </Link>
        <Link href="/achievements">
          <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-none">
            <Award className="w-4 h-4 mr-2" />
            View Achievements
          </Button>
        </Link>
        <Link href="/market-analysis">
          <Button className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white border-none">
            <Target className="w-4 h-4 mr-2" />
            Market Analysis
          </Button>
        </Link>
      </div>

      {/* Modals */}
      <TradeForm 
        open={showTradeForm} 
        onOpenChange={setShowTradeForm} 
      />
      
      <ImportModal 
        open={showImportModal} 
        onOpenChange={setShowImportModal}
        mode={importModalMode}
      />
      </div>
    </div>
  );
}