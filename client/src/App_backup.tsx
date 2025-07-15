import { Router, Route, Switch, Redirect } from 'wouter';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { queryClient } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import Sidebar from '@/components/Sidebar';
import { UserActionsProvider } from '@/contexts/UserActionsContext';
import Dashboard from '@/pages/Dashboard';
import Trades from '@/pages/Trades';
import Calendar from '@/pages/Calendar';
import Achievements from '@/pages/Achievements';
import Reports from '@/pages/Reports';
import AIAnalysis from '@/pages/AIAnalysis';
import TradeSuggestions from '@/pages/TradeSuggestions';
import MarketAnalysis from '@/pages/MarketAnalysis';
import Subscribe from '@/pages/Subscribe';
import Checkout from '@/pages/Checkout';
import SimpleCheckout from '@/pages/SimpleCheckout';
import TestCheckout from '@/pages/TestCheckout';
import CleanCheckout from '@/pages/CleanCheckout';
import FinalCheckout from '@/pages/FinalCheckout';
import WorkingCheckout from '@/pages/WorkingCheckout';
import Landing from '@/pages/Landing';
import ModernLanding from '@/pages/ModernLanding';
import ModernDashboard from '@/pages/ModernDashboard';
import ModernFeatures from '@/pages/ModernFeatures';
import AuthCallback from '@/pages/AuthCallback';
import NotFound from '@/pages/not-found';

function AppRouter() {
  const { isAuthenticated, isLoading } = useAuth();

  // Mostrar loading mientras verificamos autenticación
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-dark">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  // Si no está autenticado, mostrar landing page
  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={ModernLanding} />
        <Route path="/landing" component={Landing} />
        <Route path="/modern" component={ModernLanding} />
        <Route path="/features" component={ModernFeatures} />
        <Route path="/auth-callback" component={AuthCallback} />
        <Route component={() => <Redirect to="/" />} />
      </Switch>
    );
  }

  return (
    <ErrorBoundary>
      <Switch>
        <Route path="/landing">
          {/* Landing page sin sidebar */}
          <div className="w-full h-screen bg-gradient-dark text-white overflow-auto">
            <Landing />
          </div>
        </Route>
        <Route path="/subscribe">
          {/* Subscribe page sin sidebar */}
          <div className="w-full h-screen overflow-auto">
            <Subscribe />
          </div>
        </Route>
        <Route path="/checkout">
          {/* Checkout page sin sidebar */}
          <div className="w-full h-screen overflow-auto">
            <WorkingCheckout />
          </div>
        </Route>
        <Route>
          {/* Páginas principales con sidebar */}
          <UserActionsProvider>
            <div className="flex h-screen bg-gradient-dark text-white transition-colors duration-200 relative overflow-x-hidden mobile-safe">
              <ErrorBoundary fallback={<div className="hidden md:block w-64 bg-sidebar-gradient" />}>
                <Sidebar />
              </ErrorBoundary>
              <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gradient-dark w-full md:w-auto min-w-0">
                {/* Mobile content padding to account for menu button */}
                <div className="pt-16 md:pt-0 w-full min-w-0 px-2 md:px-0">
                  <ErrorBoundary>
                    <Switch>
                      <Route path="/dashboard" component={Dashboard} />
                      <Route path="/modern-dashboard" component={ModernDashboard} />
                      <Route path="/trades" component={Trades} />
                      <Route path="/suggestions" component={TradeSuggestions} />
                      <Route path="/calendar" component={Calendar} />
                      <Route path="/achievements" component={Achievements} />
                      <Route path="/reports" component={Reports} />
                      <Route path="/ai-analysis" component={AIAnalysis} />
                      <Route path="/market-analysis" component={MarketAnalysis} />
                      <Route path="/" component={() => <Redirect to="/modern-dashboard" />} />
                      <Route component={NotFound} />
                    </Switch>
                  </ErrorBoundary>
                </div>
              </main>
            </div>
          </UserActionsProvider>
        </Route>
      </Switch>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <Router>
            <AppRouter />
            <Toaster />
          </Router>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}