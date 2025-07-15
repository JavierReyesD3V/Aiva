import { useRef, useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { parseCSV, formatNumberWithCommas } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Check } from "lucide-react";
import AccountForm from "./AccountForm";

interface ImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'new' | 'change' | 'clear';
  hasExistingAccounts?: boolean;
}

export default function ImportModal({ open, onOpenChange, mode = 'new', hasExistingAccounts = false }: ImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [accountSize, setAccountSize] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountData, setAccountData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset modal state when modal closes or mode changes
  useEffect(() => {
    if (!open) {
      // Reset all internal state when modal closes
      setSelectedFile(null);
      setAccountSize("");
      setDragOver(false);
      setShowAccountForm(false);
      setAccountData(null);
    }
  }, [open]);

  // Reset state when mode changes
  useEffect(() => {
    setSelectedFile(null);
    setAccountSize("");
    setDragOver(false);
    setShowAccountForm(false);
    setAccountData(null);
  }, [mode]);

  const importMutation = useMutation({
    mutationFn: async (data: { trades: any[], accountSize: number, accountName?: string, accountNumber?: string, broker?: string, initialBalance: number }) => {
      const response = await apiRequest("POST", "/api/trades/import", data);
      return response.json();
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      
      toast({
        title: "Import Successful",
        description: response.message || "Trading data imported successfully.",
      });
      
      setSelectedFile(null);
      setAccountSize("");
      setShowAccountForm(false);
      setAccountData(null);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import CSV data. Please check the format.",
        variant: "destructive",
      });
    },
  });

  const clearDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/data/clear");
      return response.json();
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/metrics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/charts/profit-loss"] });
      queryClient.invalidateQueries({ queryKey: ["/api/progress/daily"] });
      
      toast({
        title: "Data Cleared",
        description: response.message || "All trading data has been cleared successfully.",
      });
      
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast({
        title: "Clear Failed",
        description: error.message || "Failed to clear trading data.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (file: File) => {
    if (file.type === "text/csv" || file.name.endsWith(".csv")) {
      setSelectedFile(file);
      // Don't show account form automatically - let user fill account size first
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a CSV file.",
        variant: "destructive",
      });
    }
  };

  const handleAccountSubmit = (accountInfo: any) => {
    setAccountData(accountInfo);
    setShowAccountForm(false);
  };

  const handleAccountSkip = () => {
    setAccountData(null);
    setShowAccountForm(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const processImport = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a CSV file first.",
        variant: "destructive",
      });
      return;
    }

    if (!accountSize || parseFloat(accountSize) <= 0) {
      toast({
        title: "Account Size Required",
        description: "Please enter a valid account size greater than 0.",
        variant: "destructive",
      });
      return;
    }

    try {
      const csvContent = await selectedFile.text();
      const csvData = parseCSV(csvContent);
      
      if (csvData.length === 0) {
        toast({
          title: "Empty File",
          description: "The CSV file appears to be empty.",
          variant: "destructive",
        });
        return;
      }

      // Use account data if available, otherwise use default account name
      const importData = {
        trades: csvData, 
        accountSize: parseFloat(accountSize),
        initialBalance: parseFloat(accountSize), // Use form balance as initial equity
        ...(accountData || {
          accountName: `Trading Account ${new Date().toLocaleDateString()}`
        })
      };

      importMutation.mutate(importData);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "File Error",
        description: "Failed to read the CSV file. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 border border-purple-700">
        <DialogHeader>
          <DialogTitle className="text-white">
            {mode === 'new' ? 'Importar Datos de Trading' : 
             mode === 'clear' ? 'Desvincular Datos' : 'Cambiar Cuenta'}
          </DialogTitle>
          <DialogDescription className="text-purple-300">
            {mode === 'new' 
              ? 'Sube tu archivo CSV para importar tu historial de trading'
              : mode === 'clear'
              ? 'Elimina todos los datos actuales para empezar con un nuevo archivo CSV'
              : 'Cambia a una cuenta de trading diferente o agrega una nueva'
            }
          </DialogDescription>
        </DialogHeader>

        {showAccountForm ? (
          <AccountForm
            onSubmit={handleAccountSubmit}
            onSkip={handleAccountSkip}
          />
        ) : mode === 'clear' ? (
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    ⚠️ Acción Irreversible
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>
                      Esta acción eliminará permanentemente:
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Todas las cuentas de trading</li>
                      <li>Todo el historial de trades</li>
                      <li>Estadísticas de rendimiento</li>
                      <li>Progreso de gamificación</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1 bg-red-600 hover:bg-red-700"
                onClick={() => clearDataMutation.mutate()}
                disabled={clearDataMutation.isPending}
              >
                {clearDataMutation.isPending ? "Eliminando..." : "Confirmar Eliminación"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {mode === 'change' && hasExistingAccounts && (
              <div className="mb-4">
                <Button
                  variant="outline"
                  className="w-full mb-3"
                  onClick={() => {
                    // TODO: Show account selector
                    console.log('Show existing accounts');
                  }}
                >
                  Switch to Existing Account
                </Button>
                <div className="text-center text-sm text-gray-500 mb-3">or</div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowAccountForm(true);
                  }}
                >
                  Add New Account
                </Button>
                <div className="text-center text-sm text-gray-500 my-3">or upload to current account:</div>
              </div>
            )}

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragOver
                  ? "border-primary bg-primary/10"
                  : "border-gray-600 hover:border-gray-500"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center space-x-3">
                  <Check className="w-8 h-8 text-profit" />
                  <div>
                    <p className="text-gray-300">{selectedFile.name}</p>
                    <p className="text-sm text-gray-500">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                  <p className="text-gray-300 mb-2">
                    Drop your CSV file here or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports MT4/MT5 export format
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                </>
              )}
            </div>

            {selectedFile && !showAccountForm && (
              <div className="space-y-3">
                <div>
                  <label className="text-gray-300 text-sm block">
                    Account Size (USD) *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., 10,000"
                    value={accountSize ? formatNumberWithCommas(accountSize) : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/,/g, '');
                      if (!isNaN(Number(value)) || value === '') {
                        setAccountSize(value);
                      }
                    }}
                    className="w-full bg-gray-700 border border-gray-600 text-white mt-1 px-3 py-2 rounded"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your account balance to calculate accurate performance percentages
                  </p>
                </div>
                
                <Button 
                  className="w-full" 
                  onClick={processImport}
                  disabled={importMutation.isPending || !accountSize || parseFloat(accountSize) <= 0}
                >
                  {importMutation.isPending ? "Importing..." : "Import Trades"}
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}