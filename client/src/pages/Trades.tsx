import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserActions } from "@/contexts/UserActionsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import TradeForm from "@/components/TradeForm";
import ImportModal from "@/components/ImportModal";
import TradeDetailsModal from "@/components/TradeDetailsModal";
import MobileHeader from "@/components/MobileHeader";
import { Plus, Upload, Search, Filter, Eye, Edit, Trash2 } from "lucide-react";
import { formatCurrency, formatDateTime, getTradeColor } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Trades() {
  const [showTradeForm, setShowTradeForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [symbolFilter, setSymbolFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [importModalMode, setImportModalMode] = useState<'new' | 'change' | 'clear'>('new');

  const { toast } = useToast();
  const queryClient = useQueryClient();
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

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["/api/trades"],
  });

  const deleteTradeMutation = useMutation({
    mutationFn: async (tradeId: number) => {
      return apiRequest("DELETE", `/api/trades/${tradeId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      toast({
        title: "Trade Deleted",
        description: "Trade has been successfully removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete trade.",
        variant: "destructive",
      });
    },
  });

  const filteredTrades = (trades as any[]).filter((trade: any) => {
    const matchesSearch = 
      trade.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      trade.ticketId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSymbol = symbolFilter === "all" || trade.symbol === symbolFilter;
    const matchesType = typeFilter === "all" || trade.type === typeFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "open" && trade.isOpen) ||
      (statusFilter === "closed" && !trade.isOpen);

    return matchesSearch && matchesSymbol && matchesType && matchesStatus;
  });

  const uniqueSymbols = Array.from(new Set((trades as any[]).map((trade: any) => trade.symbol)));

  const handleDeleteTrade = (tradeId: number) => {
    if (confirm("Are you sure you want to delete this trade?")) {
      deleteTradeMutation.mutate(tradeId);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      {/* Mobile Header */}
      <MobileHeader 
        title="My Trades" 
        subtitle="Trading History"

      />
      
      {/* Desktop Header */}
      <header className="bg-card-gradient border-b border-purple p-6 shadow-sm hidden md:block">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">My Trades</h2>
            <p className="text-purple-light">
              Manage and analyze your trading history
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setShowTradeForm(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Trade
            </Button>
            <Button
              onClick={() => setShowImportModal(true)}
              className="bg-profit hover:bg-profit/90"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import CSV
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Filters and Search */}
        <Card className="bg-card-gradient border-purple shadow-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Filter className="w-5 h-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-purple-light" />
                <Input
                  placeholder="Search trades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-card-gradient border-purple text-white placeholder:text-purple-light"
                />
              </div>
              
              <Select value={symbolFilter} onValueChange={setSymbolFilter}>
                <SelectTrigger className="bg-card-gradient border-purple text-white">
                  <SelectValue placeholder="All Symbols" />
                </SelectTrigger>
                <SelectContent className="bg-card-gradient border-purple">
                  <SelectItem value="all" className="text-white hover:bg-purple-600/20">All Symbols</SelectItem>
                  {uniqueSymbols.map((symbol) => (
                    <SelectItem key={symbol} value={symbol} className="text-white hover:bg-purple-600/20">
                      {symbol}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-card-gradient border-purple text-white">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-card-gradient border-purple">
                  <SelectItem value="all" className="text-white hover:bg-purple-600/20">All Types</SelectItem>
                  <SelectItem value="Buy" className="text-white hover:bg-purple-600/20">Buy</SelectItem>
                  <SelectItem value="Sell" className="text-white hover:bg-purple-600/20">Sell</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-card-gradient border-purple text-white">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent className="bg-card-gradient border-purple">
                  <SelectItem value="all" className="text-white hover:bg-purple-600/20">All Status</SelectItem>
                  <SelectItem value="open" className="text-white hover:bg-purple-600/20">Open Trades</SelectItem>
                  <SelectItem value="closed" className="text-white hover:bg-purple-600/20">Closed Trades</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSymbolFilter("all");
                  setTypeFilter("all");
                  setStatusFilter("all");
                }}
                className="bg-[#3b82f6] text-white border-[#3b82f6] hover:bg-[#2563eb]"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Trades Table */}
        <Card className="bg-card-gradient border-purple shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">
                Trading History ({filteredTrades.length} trades)
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-purple-light">Loading trades...</div>
              </div>
            ) : filteredTrades.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-purple-600/20">
                      <TableHead className="text-purple-light">Ticket ID</TableHead>
                      <TableHead className="text-purple-light">Symbol</TableHead>
                      <TableHead className="text-purple-light">Type</TableHead>
                      <TableHead className="text-purple-light">Size</TableHead>
                      <TableHead className="text-purple-light">Open Price</TableHead>
                      <TableHead className="text-purple-light">Close Price</TableHead>
                      <TableHead className="text-purple-light">P&L</TableHead>
                      <TableHead className="text-purple-light">Open Time</TableHead>
                      <TableHead className="text-purple-light">Status</TableHead>
                      <TableHead className="text-purple-light">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTrades.map((trade: any) => (
                      <TableRow
                        key={trade.id}
                        className="border-purple-600/20 hover:bg-purple-600/10 transition-colors duration-200"
                      >
                        <TableCell className="text-white font-mono text-sm">
                          {trade.ticketId}
                        </TableCell>
                        <TableCell className="text-white font-medium">
                          {trade.symbol}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={trade.type === "Buy" ? "default" : "secondary"}
                            className={
                              trade.type === "Buy"
                                ? "bg-green-600/20 text-green-400 border-green-600/30"
                                : "bg-red-600/20 text-red-400 border-red-600/30"
                            }
                          >
                            {trade.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-white">{trade.lots}</TableCell>
                        <TableCell className="text-white font-mono">
                          {trade.openPrice?.toFixed(5)}
                        </TableCell>
                        <TableCell className="text-white font-mono">
                          {trade.closePrice?.toFixed(5) || "-"}
                        </TableCell>
                        <TableCell className={`font-medium ${getTradeColor(trade.profit)}`}>
                          {formatCurrency(trade.profit || 0)}
                        </TableCell>
                        <TableCell className="text-purple-light text-sm">
                          {formatDateTime(trade.openTime)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={trade.isOpen ? "default" : "secondary"}
                            className={
                              trade.isOpen
                                ? "bg-blue-600/20 text-blue-400 border-blue-600/30"
                                : "bg-gray-600/20 text-gray-400 border-gray-600/30"
                            }
                          >
                            {trade.isOpen ? "Open" : "Closed"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setSelectedTrade(trade)}
                              className="text-purple-light hover:text-white hover:bg-purple-600/20 transition-colors duration-200"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteTrade(trade.id)}
                              className="text-purple-light hover:text-red-400 hover:bg-red-600/20 transition-colors duration-200"
                              disabled={deleteTradeMutation.isPending}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">📊</div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">
                  No trades found
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || symbolFilter !== "all" || typeFilter !== "all" || statusFilter !== "all"
                    ? "Try adjusting your filters or search terms"
                    : "Start by adding your first trade or importing data"}
                </p>
                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={() => setShowTradeForm(true)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Trade
                  </Button>
                  <Button
                    onClick={() => setShowImportModal(true)}
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import CSV
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <TradeForm open={showTradeForm} onOpenChange={setShowTradeForm} />
      <ImportModal 
        open={showImportModal} 
        onOpenChange={setShowImportModal}
        mode={importModalMode}
      />
      <TradeDetailsModal
        trade={selectedTrade}
        open={!!selectedTrade}
        onOpenChange={() => setSelectedTrade(null)}
      />
    </div>
  );
}
