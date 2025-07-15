import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime, getTradeColor } from "@/lib/utils";

interface TradeSelectionModalProps {
  trades: any[];
  date: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTradeSelect: (trade: any) => void;
}

export default function TradeSelectionModal({ 
  trades, 
  date, 
  open, 
  onOpenChange, 
  onTradeSelect 
}: TradeSelectionModalProps) {
  if (!trades || trades.length === 0) return null;

  const totalPnL = trades.reduce((sum, trade) => sum + (trade.profit || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 border border-purple-700">
        <DialogHeader>
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white">
            <span>Trades for {new Date(date).toLocaleDateString()}</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {trades.length} trade{trades.length > 1 ? 's' : ''}
              </Badge>
              <Badge
                variant={totalPnL >= 0 ? "default" : "destructive"}
                className={
                  totalPnL >= 0
                    ? "bg-green-600 bg-opacity-20 text-green-400"
                    : "bg-red-600 bg-opacity-20 text-red-400"
                }
              >
                {formatCurrency(totalPnL)}
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {trades.map((trade, index) => (
            <div key={trade.id || index}>
              <Button
                variant="ghost"
                className="w-full p-4 h-auto justify-start bg-gray-800/30 hover:bg-purple-800/40 border border-purple-600/30 backdrop-blur-sm"
                onClick={() => {
                  onTradeSelect(trade);
                  onOpenChange(false);
                }}
              >
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">{trade.symbol}</span>
                        <Badge
                          variant={trade.type === "Buy" ? "default" : "secondary"}
                          className={
                            trade.type === "Buy"
                              ? "bg-green-600 bg-opacity-20 text-green-400 text-xs"
                              : "bg-red-600 bg-opacity-20 text-red-400 text-xs"
                          }
                        >
                          {trade.type}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-400">
                        {trade.lots || 0} lots @ {trade.openPrice ? trade.openPrice.toFixed(5) : "N/A"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {trade.openTime ? formatDateTime(trade.openTime) : "N/A"} • #{trade.ticketId || "Unknown"}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-medium ${getTradeColor(trade.profit || 0)}`}>
                      {formatCurrency(trade.profit || 0)}
                    </div>
                    {trade.pips !== null && trade.pips !== undefined && !isNaN(trade.pips) && (
                      <div className={`text-sm ${getTradeColor(trade.profit || 0)}`}>
                        {trade.pips >= 0 ? "+" : ""}{trade.pips.toFixed(1)} pips
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      {trade.isOpen ? "Open" : "Closed"}
                    </div>
                  </div>
                </div>
              </Button>
              
              
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}