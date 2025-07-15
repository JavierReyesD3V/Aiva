import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency, formatDateTime, getTradeColor, calculatePnLPercentage, calculateNetProfit } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TradeDetailsModalProps {
  trade: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TradeDetailsModal({ trade, open, onOpenChange }: TradeDetailsModalProps) {
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [closePrice, setClosePrice] = useState("");
  const [profit, setProfit] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setShowCloseForm(false);
      setClosePrice("");
      setProfit("");
    }
  }, [open]);

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const closeTradeMutation = useMutation({
    mutationFn: async () => {
      const updateData = {
        closeTime: new Date().toISOString(),
        closePrice: parseFloat(closePrice),
        profit: parseFloat(profit),
        isOpen: false
      };
      return apiRequest("PUT", `/api/trades/${trade.id}`, updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      toast({
        title: "Trade Cerrado",
        description: "El trade ha sido cerrado exitosamente.",
      });
      setShowCloseForm(false);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al cerrar el trade.",
        variant: "destructive",
      });
    },
  });

  const handleCloseTrade = () => {
    if (!closePrice || !profit) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }
    closeTradeMutation.mutate();
  };

  const calculateDuration = () => {
    if (!trade.closeTime) return "Open";

    const start = new Date(trade.openTime);
    const end = new Date(trade.closeTime);
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ${diffHours % 24}h ${diffMinutes % 60}m`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes % 60}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  if (!trade) return null;

  const profitPercentage = calculatePnLPercentage(trade, (userStats as any)?.accountSize || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 border border-purple-700">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white">
            <span>Detalles del Trade</span>
            <Badge
              variant={trade.isOpen ? "default" : "secondary"}
              className={`${
                trade.isOpen 
                  ? "bg-yellow-600 hover:bg-yellow-700 text-yellow-100" 
                  : "bg-gray-600 hover:bg-gray-700 text-gray-100"
              } font-semibold`}
            >
              {trade.isOpen ? "ABIERTO" : "CERRADO"}
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-purple-300">
            Información completa del trade incluyendo métricas financieras y opciones de gestión.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Core Trade Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-purple-300">Symbol</p>
                <p className="text-white font-bold text-xl">{trade.symbol}</p>
              </div>
              <div className="space-y-1">
                <p className="text-purple-300">Type</p>
                <Badge 
                  variant="outline" 
                  className={`${
                    trade.type === "Buy" 
                      ? "border-green-500 text-green-400" 
                      : "border-red-500 text-red-400"
                  } bg-transparent`}
                >
                  {trade.type}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-purple-300">Volume</p>
                <p className="text-white font-mono">{trade.lots} lots</p>
              </div>
              <div className="space-y-1">
                <p className="text-purple-300">Duration</p>
                <p className="text-white font-mono">{calculateDuration()}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-purple-300">Open Price</p>
                <p className="text-white font-mono text-lg">{trade.openPrice}</p>
              </div>
              <div className="space-y-1">
                <p className="text-purple-300">Open Time</p>
                <p className="text-white font-mono text-sm">{formatDateTime(trade.openTime)}</p>
              </div>
              {!trade.isOpen && (
                <>
                  <div className="space-y-1">
                    <p className="text-purple-300">Close Price</p>
                    <p className="text-white font-mono text-lg">
                      {trade.closePrice || "-"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-purple-300">Close Time</p>
                    <p className="text-white font-mono text-sm">
                      {trade.closeTime ? formatDateTime(trade.closeTime) : "-"}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <Separator className="bg-purple-600/30" />

          {/* Financial Details */}
          <div className="space-y-4">
            <h4 className="font-semibold text-white text-lg">Resultados Financieros</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-purple-300">Profit/Loss</p>
                <p 
                  className="font-bold text-2xl"
                  style={{ 
                    color: calculateNetProfit(trade) >= 0 ? '#10b981' : '#ef4444'
                  }}
                >
                  {formatCurrency(calculateNetProfit(trade))}
                </p>
                {profitPercentage !== null && (
                  <p 
                    className="text-sm font-medium"
                    style={{ 
                      color: calculateNetProfit(trade) >= 0 ? '#10b981' : '#ef4444'
                    }}
                  >
                    ({profitPercentage}%)
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-purple-300">Pips</p>
                <p 
                  className="font-bold text-lg"
                  style={{ 
                    color: calculateNetProfit(trade) >= 0 ? '#10b981' : '#ef4444'
                  }}
                >
                  {trade.pips !== null && trade.pips !== undefined && !isNaN(trade.pips) ? 
                    `${trade.pips >= 0 ? "+" : ""}${trade.pips.toFixed(1)}` : "-"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-purple-300">Commission</p>
                <p className="text-white font-mono">
                  {formatCurrency(trade.commission || 0)}
                </p>
              </div>
              {(trade.swap !== null && trade.swap !== undefined && trade.swap !== 0) && (
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-purple-300">Swap</p>
                  <p className="text-white font-mono">
                    {formatCurrency(trade.swap)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {trade.notes && (
            <>
              <Separator className="bg-purple-600/30" />
              <div className="space-y-2">
                <h4 className="font-semibold text-white text-lg">Notes</h4>
                <div className="text-gray-200 text-sm bg-gray-800/50 rounded-lg p-4 border border-purple-600/30 backdrop-blur-sm">
                  {trade.notes}
                </div>
              </div>
            </>
          )}

          {/* Close Trade Section */}
          {trade.isOpen && (
            <>
              <Separator className="bg-purple-600/30" />
              <div className="space-y-4">
                <h4 className="font-semibold text-white text-lg">Cerrar Trade</h4>
                
                {!showCloseForm ? (
                  <Button 
                    onClick={() => setShowCloseForm(true)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    Cerrar Trade
                  </Button>
                ) : (
                  <div className="space-y-4 bg-gray-800/50 rounded-lg p-4 border border-purple-600/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="closePrice" className="text-purple-300">
                          Precio de Cierre *
                        </Label>
                        <Input
                          id="closePrice"
                          type="number"
                          step="0.00001"
                          value={closePrice}
                          onChange={(e) => setClosePrice(e.target.value)}
                          placeholder="1.08500"
                          className="bg-gray-700 border-purple-600/30 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="profit" className="text-purple-300">
                          Profit/Loss *
                        </Label>
                        <Input
                          id="profit"
                          type="number"
                          step="0.01"
                          value={profit}
                          onChange={(e) => setProfit(e.target.value)}
                          placeholder="100.50"
                          className="bg-gray-700 border-purple-600/30 text-white"
                        />
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setShowCloseForm(false)}
                        variant="outline"
                        className="flex-1 border-purple-600/30 text-purple-300 hover:bg-purple-600/20"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleCloseTrade}
                        disabled={closeTradeMutation.isPending}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {closeTradeMutation.isPending ? "Cerrando..." : "Confirmar Cierre"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Trade ID */}
          <Separator className="bg-purple-600/30" />
          <div className="text-xs text-purple-400 font-mono">
            Ticket ID: {trade.ticketId || "Unknown"}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}