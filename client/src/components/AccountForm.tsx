import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNumberWithCommas } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AccountFormProps {
  onSubmit: (accountData: {
    accountName: string;
    accountNumber?: string;
    broker?: string;
    initialBalance?: number;
  }) => void;
  onSkip: () => void;
}

export default function AccountForm({ onSubmit, onSkip }: AccountFormProps) {
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [broker, setBroker] = useState("");
  const [initialBalance, setInitialBalance] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      accountName: accountName || "Trading Account",
      accountNumber: accountNumber || undefined,
      broker: broker || undefined,
      initialBalance: initialBalance ? parseFloat(initialBalance) : undefined,
    });
  };

  return (
    <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Account Information</CardTitle>
        <p className="text-gray-400 text-sm">
          Provide details about your trading account (optional)
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="accountName" className="text-gray-300">
              Account Name *
            </Label>
            <Input
              id="accountName"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="My Trading Account"
              className="bg-gray-700 border-gray-600 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="accountNumber" className="text-gray-300">
              Account Number
            </Label>
            <Input
              id="accountNumber"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="123456789"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="broker" className="text-gray-300">
              Broker
            </Label>
            <Input
              id="broker"
              value={broker}
              onChange={(e) => setBroker(e.target.value)}
              placeholder="e.g., MetaTrader, IG, etc."
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="initialBalance" className="text-gray-300">
              Initial Balance (USD)
            </Label>
            <Input
              id="initialBalance"
              type="number"
              step="0.01"
              value={initialBalance}
              onChange={(e) => setInitialBalance(e.target.value)}
              placeholder="10000.00"
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90">
              Continue with Account Info
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onSkip}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Skip
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}