import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: (failureCount, error: any) => {
      // Reintentar hasta 3 veces si es 401 (útil después de login)
      if (error?.status === 401 && failureCount < 3) {
        return true;
      }
      return false;
    },
    retryDelay: 500, // Esperar 500ms entre reintentos
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
  };
}