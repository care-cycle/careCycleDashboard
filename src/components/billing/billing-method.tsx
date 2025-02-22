import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard as CardIcon } from "lucide-react";

interface PaymentMethod {
  last4: string;
  expMonth: number;
  expYear: number;
  brand: string;
}

interface BillingMethodProps {
  paymentMethod: PaymentMethod | null;
  onPaymentMethodUpdate: (paymentMethod: PaymentMethod) => void;
}

export function BillingMethod({ paymentMethod }: BillingMethodProps) {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>Billing Method</CardTitle>
      </CardHeader>
      <CardContent>
        {paymentMethod ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-gray-900 flex items-center justify-center">
                <CardIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-medium">
                  {paymentMethod.brand} ending in {paymentMethod.last4}
                </p>
                <p className="text-sm text-gray-500">
                  Expires {paymentMethod.expMonth}/{paymentMethod.expYear}
                </p>
              </div>
            </div>
            <Button variant="outline" disabled>
              Update
            </Button>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Work in Progress..</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
