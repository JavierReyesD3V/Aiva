import { useQuery } from "@tanstack/react-query";
import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Shield } from "lucide-react";

interface AdminRouteProps {
  children: ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { data: adminStatus, isLoading } = useQuery({
    queryKey: ["/api/admin/status"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center">
        <div className="text-white">Verificando permisos...</div>
      </div>
    );
  }

  if (!adminStatus?.isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center">
        <Card className="bg-white/10 backdrop-blur border-white/20">
          <CardContent className="pt-6">
            <div className="text-center text-white">
              <Shield className="mx-auto h-12 w-12 mb-4" />
              <h2 className="text-xl font-bold mb-2">Acceso Denegado</h2>
              <p>No tienes permisos de administrador para acceder a esta página.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}