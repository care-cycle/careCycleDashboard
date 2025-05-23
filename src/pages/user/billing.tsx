import { RootLayout } from "@/components/layout/root-layout";
import { BillingOverview } from "@/components/billing/billing-overview";
import { CreditBalance } from "@/components/billing/credit-balance";
import { BillingMethod } from "@/components/billing/billing-method";
import { RevenueCalculator } from "@/components/billing/revenue-calculator";
import { useInitialData } from "@/hooks/use-client-data";

export default function BillingPage() {
  // Use the existing data from the app-level fetch
  const { clientInfo } = useInitialData();
  const isAuthenticated = Boolean(clientInfo?.id);

  const topMetrics = [
    {
      title: "Today's Call Rate",
      value: clientInfo
        ? `$${(Number(clientInfo.pricePerCallMs) * 60000).toFixed(2)}/min`
        : "-",
    },
    {
      title: "Today's SMS Rate",
      value: clientInfo
        ? `$${Number(clientInfo.pricePerSms).toFixed(2)}/sms`
        : "-",
    },
    {
      title: "Auto-replenish",
      value: clientInfo?.enableTopUp ? "Enabled" : "Disabled",
    },
  ];

  if (!isAuthenticated) {
    return (
      <RootLayout topMetrics={topMetrics} hideKnowledgeSearch>
        <div className="text-center py-8">
          <p>Please sign in to view billing information.</p>
        </div>
      </RootLayout>
    );
  }

  return (
    <RootLayout topMetrics={topMetrics} hideKnowledgeSearch>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Billing
        </h1>

        <div className="grid gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <BillingOverview
              totalSpend={
                Number(clientInfo?.totalCallSpend) +
                Number(clientInfo?.totalSmsSpend)
              }
              availableBalance={Number(clientInfo?.availableBalance)}
            />
            <RevenueCalculator />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <CreditBalance
              availableBalance={Number(clientInfo?.availableBalance)}
              pricePerCallMs={Number(clientInfo?.pricePerCallMs)}
              topUpThreshold={clientInfo?.topUpThreshold}
              enableTopUp={clientInfo?.enableTopUp ?? false}
            />
          </div>

          {/* Payment method component temporarily disabled */}
          <div className="p-4 border rounded-md bg-white shadow-sm">
            <h3 className="text-lg font-medium mb-2">Payment Method</h3>
            <p className="text-gray-500">
              Payment method management is temporarily disabled. Please contact
              support if you need to update your payment information.
            </p>
          </div>

          {/* 
          <BillingMethod
            paymentMethod={clientInfo?.default_payment_method || undefined}
            onPaymentMethodChange={() => {
              // Refresh the client data after updating the payment method
              window.location.reload();
            }}
            clientId={clientInfo?.id || ""}
          />
          */}
        </div>
      </div>
    </RootLayout>
  );
}
