import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: 3,
    retryDelay: 500,
  });

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // Usuario autenticado exitosamente, ir a dashboard
        setLocation('/modern-dashboard');
      } else if (error) {
        // Error de autenticación, ir a landing
        setLocation('/modern-landing');
      }
    }
  }, [user, isLoading, error, setLocation]);

  return (
    <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <h2 className="text-2xl font-bold text-white mb-2">Iniciando sesión...</h2>
        <p className="text-purple-light">Por favor espera mientras verificamos tu autenticación</p>
      </div>
    </div>
  );
}