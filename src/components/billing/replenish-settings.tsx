import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

const pricingTiers = [
  { range: "0 - 50,000", rate: 0.2 },
  { range: "50,001 - 500,000", rate: 0.18 },
  { range: "500,001+", rate: 0.16 },
];

export function ReplenishSettings() {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>Replenish Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4">
          <div className="space-y-2">
            <Label>Threshold (minutes)</Label>
            <Input type="number" placeholder="5,000" />
          </div>
          <div className="space-y-2">
            <Label>Replenish Amount</Label>
            <Input type="number" placeholder="10,000" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Current Usage Tier</Label>
            <Slider defaultValue={[20]} max={100} step={1} className="mt-2" />
            <p className="text-sm text-primary font-medium mt-2">
              Current tier: $0.20/minute
            </p>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Pricing Tiers</p>
            <div className="space-y-2">
              {pricingTiers.map((tier, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-gray-500">{tier.range}</span>
                  <span className="font-medium">
                    ${tier.rate.toFixed(2)}/minute
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
