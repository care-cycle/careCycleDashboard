import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface CreditBalanceProps {
  availableBalance: number;
  pricePerCallMs: number;
  topUpThreshold?: string;
  enableTopUp: boolean;
}

export function CreditBalance({
  availableBalance,
  pricePerCallMs,
  topUpThreshold = "1000.00",
  enableTopUp,
}: CreditBalanceProps) {
  const MAX_MINUTES = 500_000; // Fixed maximum of 500k minutes

  // Convert available balance to minutes
  const pricePerMinute = pricePerCallMs * 60000; // Convert ms rate to minute rate
  const availableMinutes = Math.floor(availableBalance / pricePerMinute);

  // Calculate percentage based on fixed maximum
  const percentage = Math.min((availableMinutes / MAX_MINUTES) * 100, 100);

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>Credit Balance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Progress value={percentage} className="h-2" />
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">
              Rate: ${pricePerMinute.toFixed(2)}/min
            </span>
            <span className="font-medium">
              {availableMinutes.toLocaleString()} /{" "}
              {MAX_MINUTES.toLocaleString()} minutes
            </span>
          </div>
        </div>

        {enableTopUp && (
          <div className="pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Auto-replenish Threshold</span>
              <span className="font-medium">
                At{" "}
                {Math.floor(
                  Number(topUpThreshold) / pricePerMinute,
                ).toLocaleString()}{" "}
                minutes
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
