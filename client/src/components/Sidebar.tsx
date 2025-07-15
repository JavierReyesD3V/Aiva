import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  Home,
  Calendar,
  Brain,
  Trophy,
  FileText,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  User,
  Globe,
  Menu,
  X,
  Settings,
  Plus,
  Upload,
  Unlink,
  LogOut,
  ChevronDown,
  ChevronUp,
  Shield
} from "lucide-react";
import { calculateLevel } from "@/lib/utils";
import { Account, Trade } from "@shared/schema";
import { useUserActions } from "@/contexts/UserActionsContext";
import { useMobileMenu } from "@/contexts/MobileMenuContext";

export default function Sidebar() {
  const { onShowTradeForm, onShowImportModal } = useUserActions();
  const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();
  const [location] = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  // Auto-collapse on mobile and manage responsive behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
        setIsMobileMenuOpen(false);
      } else {
        setIsMobileMenuOpen(false);
      }
    };

    handleResize(); // Check on mount
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);



  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale
  });

  const { data: trades = [] } = useQuery({
    queryKey: ["/api/trades"],
  }) as { data: Trade[] };

  const { data: accounts = [] } = useQuery({
    queryKey: ["/api/accounts"],
  }) as { data: Account[] };

  // Check admin status
  const { data: adminStatus } = useQuery({
    queryKey: ["/api/admin/status"],
    retry: false,
  });

  const levelInfo = calculateLevel((userStats as any)?.currentPoints || 0);

  const navigationItems = [
    { path: "/modern-dashboard", label: "Dashboard", icon: Home },
    { path: "/trades", label: "Trades", icon: TrendingUp, count: Array.isArray(trades) ? trades.length : 0 },
    { path: "/market-analysis", label: "Mercados", icon: Globe },
    { path: "/calendar", label: "Calendario", icon: Calendar },
    { path: "/achievements", label: "Logros", icon: Trophy },
    { path: "/reports", label: "Reportes", icon: FileText },
    { path: "/ai-analysis", label: "Análisis AIVA", icon: Brain },
    ...(adminStatus?.isAdmin ? [{ path: "/admin", label: "Administrador", icon: Shield }] : []),
  ];

  return (
    <>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative top-0 left-0 z-40 h-screen
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed && !isMobileMenuOpen ? 'md:w-20' : 'w-64'} 
        border-r flex flex-col shadow-lg bg-sidebar-gradient border-purple 
        transition-all duration-300 transform md:transform-none
      `}>
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-purple flex items-center justify-between">
          {(!isCollapsed || isMobileMenuOpen) && (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">TradePro</h1>
                <p className="text-purple-300 text-sm">Análisis Inteligente</p>
              </div>
            </div>
          )}
          
          {/* Desktop collapse button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex hover:bg-purple-600/20 p-2 text-white hover:text-white"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </Button>
          
          {/* Mobile close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden hover:bg-purple-600/20 p-2 text-white hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 md:p-4 space-y-1 md:space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path;

            return (
              <Link 
                key={item.path} 
                href={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div
                  className={`flex items-center ${
                    isCollapsed && !isMobileMenuOpen 
                      ? 'justify-center px-2 py-4 min-h-[48px]' 
                      : 'px-3 md:px-4 py-4 md:py-3 min-h-[48px] md:min-h-[auto]'
                  } rounded-lg transition-all duration-200 cursor-pointer font-medium group relative touch-manipulation ${
                    isActive
                      ? "text-white bg-gradient-to-r from-pink-500 to-purple-600 shadow-lg"
                      : "text-purple-light hover:text-white hover:bg-purple-600/20"
                  }`}
                  title={isCollapsed && !isMobileMenuOpen ? item.label : ''}
                >
                  <Icon className={`${
                    isCollapsed && !isMobileMenuOpen 
                      ? 'w-7 h-7 group-hover:scale-110' 
                      : 'w-5 h-5 mr-3'
                  } transition-all duration-200 flex-shrink-0`} />
                  {(!isCollapsed || isMobileMenuOpen) && (
                    <>
                      <span className="flex-1 text-sm md:text-base">{item.label}</span>
                      {item.count !== undefined && item.count > 0 && (
                        <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full ml-2 flex-shrink-0">
                          {item.count}
                        </span>
                      )}
                    </>
                  )}

                  {/* Tooltip for collapsed state on desktop */}
                  {isCollapsed && !isMobileMenuOpen && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-purple-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg border border-purple-600">
                      {item.label}
                      {item.count !== undefined && item.count > 0 && ` (${item.count})`}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* User Progress - Full view */}
        {(!isCollapsed || isMobileMenuOpen) && (
          <div className="p-4 border-t border-purple">
            <div className="bg-card-gradient rounded-lg p-4 border border-purple">
              <div 
                className="flex items-center space-x-3 mb-3 cursor-pointer hover:bg-purple-800/20 rounded-lg p-2 -m-2 transition-colors"
                onClick={() => setIsUserManagementOpen(!isUserManagementOpen)}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">Nivel {levelInfo.currentLevel}</p>
                  <p className="text-xs text-purple-light">{levelInfo.currentPoints} XP</p>
                </div>
                <div className="text-purple-light">
                  {isUserManagementOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </div>

              {/* Progress Bar */}
              <Progress value={levelInfo.progressPercentage} className="h-2 mb-2" />
              <p className="text-xs text-purple-light">
                {levelInfo.pointsForNextLevel - levelInfo.currentPoints} XP para nivel {levelInfo.currentLevel + 1}
              </p>

              {/* User Management Options - Desktop version */}
              {isUserManagementOpen && !isMobileMenuOpen && (
                <div className="mt-4 pt-3 border-t border-purple-600 space-y-3 user-dropdown-menu">
                  <Button
                    onClick={() => onShowTradeForm?.()}
                    size="sm"
                    className="w-full min-h-[44px] bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs border-0 shadow-sm hover:shadow-md transition-all duration-200 touch-manipulation font-medium"
                  >
                    <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>Nuevo Trade</span>
                  </Button>
                  {(accounts.length > 0 && trades.length > 0) ? (
                    <>
                      <Button
                        onClick={() => onShowImportModal?.('clear')}
                        size="sm"
                        className="w-full min-h-[44px] bg-gradient-to-r from-red-500/30 to-red-600/30 hover:from-red-500/40 hover:to-red-600/40 text-red-100 hover:text-white text-xs border border-red-400/50 hover:border-red-300/70 transition-all duration-200 font-medium shadow-sm hover:shadow-md touch-manipulation"
                      >
                        <Unlink className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span>Desvincular CSV</span>
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={() => onShowImportModal?.('new')}
                      size="sm"
                      className="w-full min-h-[44px] bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-xs border-0 shadow-sm hover:shadow-md transition-all duration-200 font-medium touch-manipulation"
                    >
                      <Upload className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span>Subir CSV</span>
                    </Button>
                  )}
                  <Button
                    onClick={() => window.location.href = '/api/logout'}
                    size="sm"
                    className="w-full min-h-[44px] bg-gradient-to-r from-red-500/30 to-red-600/30 hover:from-red-500/40 hover:to-red-600/40 text-red-100 hover:text-white text-xs border border-red-400/50 hover:border-red-300/70 transition-all duration-200 font-medium shadow-sm hover:shadow-md touch-manipulation"
                  >
                    <LogOut className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>Cerrar Sesión</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Progress - Collapsed view */}
        {isCollapsed && !isMobileMenuOpen && (
          <div className="p-4 border-t border-purple flex justify-center">
            <div className="relative group">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="absolute left-full ml-2 px-3 py-2 bg-purple-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 shadow-lg border border-purple-600">
                Nivel {levelInfo.currentLevel} - {levelInfo.currentPoints} XP
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile User Management Menu - Positioned absolutely */}
      {isUserManagementOpen && isMobileMenuOpen && (
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
          <div className="bg-card-gradient rounded-lg p-4 border border-purple shadow-2xl space-y-3">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-medium text-sm">Opciones de Usuario</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsUserManagementOpen(false)}
                className="hover:bg-purple-600/20 p-1 text-white hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <Button
              onClick={() => {
                onShowTradeForm?.();
                setIsMobileMenuOpen(false);
                setIsUserManagementOpen(false);
              }}
              size="sm"
              className="w-full min-h-[48px] bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-sm border-0 shadow-sm hover:shadow-md transition-all duration-200 touch-manipulation font-medium"
            >
              <Plus className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>Nuevo Trade</span>
            </Button>
            
            {(accounts.length > 0 && trades.length > 0) ? (
              <Button
                onClick={() => {
                  onShowImportModal?.('clear');
                  setIsMobileMenuOpen(false);
                  setIsUserManagementOpen(false);
                }}
                size="sm"
                className="w-full min-h-[48px] bg-gradient-to-r from-red-500/30 to-red-600/30 hover:from-red-500/40 hover:to-red-600/40 text-red-100 hover:text-white text-sm border border-red-400/50 hover:border-red-300/70 transition-all duration-200 font-medium shadow-sm hover:shadow-md touch-manipulation"
              >
                <Unlink className="w-5 h-5 mr-3 flex-shrink-0" />
                <span>Desvincular CSV</span>
              </Button>
            ) : (
              <Button
                onClick={() => {
                  onShowImportModal?.('new');
                  setIsMobileMenuOpen(false);
                  setIsUserManagementOpen(false);
                }}
                size="sm"
                className="w-full min-h-[48px] bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-sm border-0 shadow-sm hover:shadow-md transition-all duration-200 font-medium touch-manipulation"
              >
                <Upload className="w-5 h-5 mr-3 flex-shrink-0" />
                <span>Subir CSV</span>
              </Button>
            )}
            
            <Button
              onClick={() => window.location.href = '/api/logout'}
              size="sm"
              className="w-full min-h-[48px] bg-gradient-to-r from-red-500/30 to-red-600/30 hover:from-red-500/40 hover:to-red-600/40 text-red-100 hover:text-white text-sm border border-red-400/50 hover:border-red-300/70 transition-all duration-200 font-medium shadow-sm hover:shadow-md touch-manipulation"
            >
              <LogOut className="w-5 h-5 mr-3 flex-shrink-0" />
              <span>Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}