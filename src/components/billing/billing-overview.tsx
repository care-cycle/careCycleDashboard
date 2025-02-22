import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface BillingOverviewProps {
  totalSpend: number;
  availableBalance: number;
}

export function BillingOverview({
  totalSpend,
  availableBalance,
}: BillingOverviewProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="glass-panel p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Total Spend
            </p>
            <p className="text-3xl font-bold text-foreground">
              ${totalSpend.toFixed(2)}
            </p>
          </div>
          <ArrowUpRight className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          {/* Current billing period */}
        </p>
      </Card>

      <Card className="glass-panel p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">
              Available Balance
            </p>
            <p className="text-3xl font-bold text-foreground">
              ${availableBalance.toFixed(2)}
            </p>
          </div>
          <ArrowDownRight className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
        </div>
        <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">
          Current available credits
        </p>
      </Card>
    </div>
  );
}
