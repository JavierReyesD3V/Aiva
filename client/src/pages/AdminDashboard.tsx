import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Users,
  Activity,
  DollarSign,
  TrendingUp,
  BarChart3,
  Shield,
  Ban,
  UserPlus,
  Trash2,
  Edit,
  Search,
  RefreshCw
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { apiRequest } from "@/lib/queryClient";

// Form schemas
const promoCodeSchema = z.object({
  code: z.string().min(1, "Code is required").max(20, "Code too long"),
  discount: z.number().min(1).max(100),
  description: z.string().optional(),
  maxUses: z.number().min(1).optional(),
  expiresAt: z.string().optional().nullable(),
});

const userActionSchema = z.object({
  reason: z.string().min(1, "Reason is required"),
});

type PromoCodeForm = z.infer<typeof promoCodeSchema>;
type UserActionForm = z.infer<typeof userActionSchema>;

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [actionType, setActionType] = useState<string>("");

  // Check admin status
  const { data: adminStatus, isLoading: adminLoading } = useQuery({
    queryKey: ["/api/admin/status"],
    retry: false,
  });

  // System stats
  const { data: systemStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: adminStatus?.isAdmin,
  });

  // User management with search  
  const { data: usersData, isLoading: usersLoading, refetch: refetchUsers } = useQuery({
    queryKey: ["/api/admin/users", searchTerm],
    queryFn: () => apiRequest("GET", `/api/admin/users?search=${encodeURIComponent(searchTerm)}`).then(res => res.json()),
    enabled: adminStatus?.isAdmin,
  });

  // Promo codes
  const { data: promoCodes, isLoading: promoLoading } = useQuery({
    queryKey: ["/api/admin/promo-codes"],
    enabled: adminStatus?.isAdmin,
  });

  // Admin logs
  const { data: adminLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/admin/logs"],
    enabled: adminStatus?.isAdmin,
  });

  // Analytics data
  const { data: userGrowthData } = useQuery({
    queryKey: ["/api/admin/analytics/user-growth", { days: 30 }],
    enabled: adminStatus?.isAdmin,
  });

  const { data: tradeVolumeData } = useQuery({
    queryKey: ["/api/admin/analytics/trade-volume", { days: 30 }],
    enabled: adminStatus?.isAdmin,
  });

  // Mutations
  const updateUserRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: string }) =>
      apiRequest("PATCH", `/api/admin/users/${userId}/role`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Usuario actualizado", description: "Rol de usuario actualizado correctamente" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Error al actualizar rol de usuario",
        variant: "destructive" 
      });
    },
  });

  const suspendUserMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      apiRequest("PATCH", `/api/admin/users/${userId}/suspend`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Usuario suspendido", description: "Usuario suspendido correctamente" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Error al suspender usuario",
        variant: "destructive" 
      });
    },
  });

  const unsuspendUserMutation = useMutation({
    mutationFn: ({ userId }: { userId: string }) =>
      apiRequest("PATCH", `/api/admin/users/${userId}/unsuspend`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Usuario reactivado", description: "Usuario reactivado correctamente" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Error al reactivar usuario",
        variant: "destructive" 
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: ({ userId, reason }: { userId: string; reason: string }) =>
      apiRequest("DELETE", `/api/admin/users/${userId}`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Usuario eliminado", description: "Cuenta de usuario eliminada correctamente" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Error al eliminar usuario",
        variant: "destructive" 
      });
    },
  });

  const createPromoCodeMutation = useMutation({
    mutationFn: (data: PromoCodeForm) => {
      const payload = {
        ...data,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null
      };
      return apiRequest("POST", "/api/admin/promo-codes", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
      promoCodeForm.reset();
      toast({ title: "Código creado", description: "Código promocional creado correctamente" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Error al crear código promocional",
        variant: "destructive" 
      });
    },
  });

  // Forms
  const promoCodeForm = useForm<PromoCodeForm>({
    resolver: zodResolver(promoCodeSchema),
    defaultValues: {
      code: "",
      discount: 10,
      description: "",
    },
  });

  const userActionForm = useForm<UserActionForm>({
    resolver: zodResolver(userActionSchema),
    defaultValues: {
      reason: "",
    },
  });

  if (adminLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800 flex items-center justify-center">
        <div className="text-white">Verificando permisos de administrador...</div>
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
              <p>No tienes permisos de administrador para acceder a este panel.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleUserAction = (user: any, action: string) => {
    setSelectedUser(user);
    setActionType(action);
  };

  const executeUserAction = (data: UserActionForm) => {
    if (!selectedUser || !actionType) return;

    switch (actionType) {
      case "suspend":
        suspendUserMutation.mutate({ userId: selectedUser.id, reason: data.reason });
        break;
      case "delete":
        deleteUserMutation.mutate({ userId: selectedUser.id, reason: data.reason });
        break;
    }
    setSelectedUser(null);
    setActionType("");
    userActionForm.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Panel de Administrador</h1>
          <p className="text-purple-200">Gestiona usuarios, códigos promocionales y analiza el sistema</p>
        </div>

        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Usuarios</CardTitle>
              <Users className="h-4 w-4 text-purple-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {statsLoading ? "..." : systemStats?.totalUsers || 0}
              </div>
              <p className="text-xs text-purple-200">
                {systemStats?.activeUsers || 0} activos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Trades</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {statsLoading ? "..." : systemStats?.totalTrades || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Usuarios Premium</CardTitle>
              <Activity className="h-4 w-4 text-purple-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {statsLoading ? "..." : systemStats?.premiumUsers || 0}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Ingresos</CardTitle>
              <DollarSign className="h-4 w-4 text-purple-300" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                ${statsLoading ? "..." : systemStats?.revenueThisMonth?.toFixed(2) || 0}
              </div>
              <p className="text-xs text-purple-200">Este mes</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="bg-white/10 backdrop-blur border-white/20">
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-white/20">
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-white/20">
              Analíticas
            </TabsTrigger>
            <TabsTrigger value="promo-codes" className="text-white data-[state=active]:bg-white/20">
              Códigos Promo
            </TabsTrigger>
            <TabsTrigger value="logs" className="text-white data-[state=active]:bg-white/20">
              Logs
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Gestión de Usuarios</CardTitle>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-purple-300" />
                    <Input
                      placeholder="Buscar usuarios..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 bg-white/5 border-white/20 text-white placeholder:text-purple-300"
                    />
                  </div>
                  <Button
                    onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] })}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="text-center text-white py-4">Cargando usuarios...</div>
                ) : (
                  <div className="space-y-2">
                    {usersData?.users?.map((user: any) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">
                              {user.firstName} {user.lastName}
                            </span>
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                            <Badge variant={user.isActive ? 'default' : 'destructive'}>
                              {user.isActive ? 'Activo' : 'Suspendido'}
                            </Badge>
                            <Badge variant={user.subscriptionType === 'premium' ? 'default' : 'secondary'}>
                              {user.subscriptionType}
                            </Badge>
                          </div>
                          <p className="text-purple-200 text-sm">{user.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateUserRoleMutation.mutate({
                              userId: user.id,
                              role: user.role === 'admin' ? 'user' : 'admin'
                            })}
                            className="border-white/20 text-white hover:bg-white/10"
                            title={user.role === 'admin' ? 'Quitar admin' : 'Hacer admin'}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                          {user.isActive ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUserAction(user, 'suspend')}
                              className="border-white/20 text-white hover:bg-white/10"
                              title="Suspender usuario"
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => unsuspendUserMutation.mutate({ userId: user.id })}
                              className="border-white/20 text-white hover:bg-white/10"
                              title="Reactivar usuario"
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleUserAction(user, 'delete')}
                            title="Eliminar cuenta"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Crecimiento de Usuarios</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={userGrowthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
                      <YAxis stroke="rgba(255,255,255,0.7)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px'
                        }}
                      />
                      <Line type="monotone" dataKey="users" stroke="#8b5cf6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Volumen de Trading</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={tradeVolumeData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis dataKey="date" stroke="rgba(255,255,255,0.7)" />
                      <YAxis stroke="rgba(255,255,255,0.7)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px'
                        }}
                      />
                      <Line type="monotone" dataKey="trades" stroke="#ec4899" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Promo Codes Tab */}
          <TabsContent value="promo-codes" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Códigos Promocionales</CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-purple-600 hover:bg-purple-700">
                      Crear Código
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-white/20">
                    <DialogHeader>
                      <DialogTitle className="text-white">Crear Código Promocional</DialogTitle>
                    </DialogHeader>
                    <Form {...promoCodeForm}>
                      <form onSubmit={promoCodeForm.handleSubmit((data) => createPromoCodeMutation.mutate(data))} className="space-y-4">
                        <FormField
                          control={promoCodeForm.control}
                          name="code"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Código</FormLabel>
                              <FormControl>
                                <Input {...field} className="bg-white/5 border-white/20 text-white" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={promoCodeForm.control}
                          name="discount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Descuento (%)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                                  className="bg-white/5 border-white/20 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={promoCodeForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Descripción</FormLabel>
                              <FormControl>
                                <Input {...field} className="bg-white/5 border-white/20 text-white" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={promoCodeForm.control}
                          name="maxUses"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Máximo de usos (opcional)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  placeholder="Dejar vacío para usos ilimitados"
                                  onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) || undefined : undefined)}
                                  className="bg-white/5 border-white/20 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={promoCodeForm.control}
                          name="expiresAt"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-white">Fecha de expiración (opcional)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="datetime-local"
                                  className="bg-white/5 border-white/20 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button 
                          type="submit" 
                          className="w-full bg-purple-600 hover:bg-purple-700"
                          disabled={createPromoCodeMutation.isPending}
                        >
                          {createPromoCodeMutation.isPending ? 'Creando...' : 'Crear Código'}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {promoLoading ? (
                  <div className="text-center text-white py-4">Cargando códigos...</div>
                ) : (
                  <div className="space-y-2">
                    {promoCodes?.map((code: any) => (
                      <div
                        key={code.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{code.code}</span>
                            <Badge>{code.discount}% OFF</Badge>
                            <Badge variant={code.isActive ? 'default' : 'secondary'}>
                              {code.isActive ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                          <p className="text-purple-200 text-sm">{code.description}</p>
                          <p className="text-purple-300 text-xs">
                            Usado: {code.currentUses}/{code.maxUses || '∞'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={async () => {
                              try {
                                await apiRequest("PATCH", `/api/admin/promo-codes/${code.id}`, {
                                  isActive: !code.isActive
                                });
                                queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
                                toast({ 
                                  title: "Código actualizado", 
                                  description: `Código ${code.isActive ? 'desactivado' : 'activado'} correctamente`
                                });
                              } catch (error: any) {
                                toast({ 
                                  title: "Error", 
                                  description: error.message || "Error al actualizar código",
                                  variant: "destructive"
                                });
                              }
                            }}
                            className="border-white/20 text-white hover:bg-white/10"
                            title={code.isActive ? 'Desactivar código' : 'Activar código'}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={async () => {
                              if (confirm(`¿Estás seguro de que quieres eliminar el código "${code.code}"?`)) {
                                try {
                                  await apiRequest("DELETE", `/api/admin/promo-codes/${code.id}`);
                                  queryClient.invalidateQueries({ queryKey: ["/api/admin/promo-codes"] });
                                  toast({ 
                                    title: "Código eliminado", 
                                    description: "Código promocional eliminado correctamente"
                                  });
                                } catch (error: any) {
                                  toast({ 
                                    title: "Error", 
                                    description: error.message || "Error al eliminar código",
                                    variant: "destructive"
                                  });
                                }
                              }
                            }}
                            title="Eliminar código"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="space-y-4">
            <Card className="bg-white/10 backdrop-blur border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Logs de Actividad</CardTitle>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <div className="text-center text-white py-4">Cargando logs...</div>
                ) : (
                  <div className="space-y-2">
                    {adminLogs?.logs?.map((log: any) => (
                      <div
                        key={log.id}
                        className="p-3 bg-white/5 rounded-lg border border-white/10"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">{log.action}</span>
                          <span className="text-purple-300 text-sm">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-purple-200 text-sm mt-1">
                          Admin: {log.adminUserId} | Target: {log.targetType} {log.targetId}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* User Action Dialog */}
        <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
          <DialogContent className="bg-gray-900 border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">
                {actionType === 'suspend' ? 'Suspender Usuario' : 'Eliminar Usuario'}
              </DialogTitle>
            </DialogHeader>
            <Form {...userActionForm}>
              <form onSubmit={userActionForm.handleSubmit(executeUserAction)} className="space-y-4">
                <FormField
                  control={userActionForm.control}
                  name="reason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Motivo</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Especifica el motivo de esta acción..."
                          className="bg-white/5 border-white/20 text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setSelectedUser(null);
                      userActionForm.reset();
                    }}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant={actionType === 'delete' ? 'destructive' : 'default'}
                    className="flex-1"
                    disabled={suspendUserMutation.isPending || deleteUserMutation.isPending}
                  >
                    {(suspendUserMutation.isPending || deleteUserMutation.isPending) 
                      ? 'Procesando...' 
                      : actionType === 'suspend' ? 'Suspender' : 'Eliminar'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}