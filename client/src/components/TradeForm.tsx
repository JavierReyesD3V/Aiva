import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatNumberWithCommas } from "@/lib/utils";
import type { Account } from "@/../../shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const tradeFormSchema = z.object({
  ticketId: z.string().default(() => `MANUAL_${Date.now()}`),
  symbol: z.string().min(1, "Symbol is required"),
  type: z.enum(["Buy", "Sell"]),
  openPrice: z.coerce.number().positive("Open price must be positive"),
  lots: z.coerce.number().positive("Lot size must be positive"),
  stopLoss: z.coerce.number().optional(),
  takeProfit: z.coerce.number().optional(),
  openTime: z.string().min(1, "Open time is required"),
  notes: z.string().optional(),
  profit: z.coerce.number().default(0),
});

type TradeFormData = z.infer<typeof tradeFormSchema>;

interface TradeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SYMBOLS = ["EURUSD", "XAUUSD", "GBPUSD", "USDJPY", "USDCAD", "AUDUSD"];

export default function TradeForm({ open, onOpenChange }: TradeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get the active account
  const { data: activeAccount } = useQuery<Account>({
    queryKey: ["/api/accounts/active"],
    enabled: open, // Only fetch when modal is open
  });

  const form = useForm<TradeFormData>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: {
      ticketId: `MANUAL_${Date.now()}`,
      symbol: "",
      type: "Buy",
      openPrice: 0,
      lots: 0,
      stopLoss: undefined,
      takeProfit: undefined,
      openTime: new Date().toISOString().slice(0, 16),
      notes: "",
      profit: 0,
    },
  });

  const createTradeMutation = useMutation({
    mutationFn: async (data: TradeFormData) => {
      if (!activeAccount) {
        throw new Error("No active account found. Please create an account first.");
      }

      const tradeData = {
        accountId: activeAccount.id,
        ticketId: data.ticketId,
        symbol: data.symbol,
        type: data.type,
        openPrice: data.openPrice,
        lots: data.lots,
        stopLoss: data.stopLoss || null,
        takeProfit: data.takeProfit || null,
        openTime: data.openTime,
        notes: data.notes || null,
        isOpen: true,
        profit: data.profit,
        commission: 0,
        swap: 0,
        closeTime: null,
        closePrice: null,
        pips: null,
        reason: null,
        volume: data.lots * 100000,
      };

      return apiRequest("POST", "/api/trades", tradeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });

      toast({
        title: "Trade Added",
        description: "Your trade has been successfully added to the journal.",
      });

      form.reset();
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add trade. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TradeFormData) => {
    createTradeMutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card-gradient border-purple">
        <DialogHeader>
          <DialogTitle className="text-white">Agregar Nuevo Trade</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Symbol</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select symbol" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {SYMBOLS.map((symbol) => (
                          <SelectItem key={symbol} value={symbol}>
                            {symbol}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Buy">Buy</SelectItem>
                        <SelectItem value="Sell">Sell</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="openPrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Open Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.00001"
                        placeholder="1.15312"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lots"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lot Size</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="1.0"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stopLoss"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stop Loss (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.00001"
                        placeholder="Optional"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="takeProfit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Take Profit (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.00001"
                        placeholder="Optional"
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="openTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Open Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Trade analysis, strategy, or notes..."
                      className="h-20 resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={createTradeMutation.isPending || !activeAccount}
              >
                {createTradeMutation.isPending ? "Adding..." : !activeAccount ? "Loading..." : "Add Trade"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}