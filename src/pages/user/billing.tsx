import { useState, useEffect } from 'react'
import { RootLayout } from '@/components/layout/root-layout'
import { BillingOverview } from '@/components/billing/billing-overview'
import { CreditBalance } from '@/components/billing/credit-balance'
import { BillingMethod } from '@/components/billing/billing-method'
import { RevenueCalculator } from '@/components/billing/revenue-calculator'
import { useAuthApi } from '@/hooks/use-auth-api'

interface PaymentMethod {
  last4: string
  expMonth: number
  expYear: number
  brand: string
}

interface ClientInfo {
  stripe_customer_id: string
  default_payment_method: PaymentMethod | null
}

const nextBillingDate = new Date()
nextBillingDate.setMonth(nextBillingDate.getMonth() + 1)
nextBillingDate.setDate(1)

const topMetrics = [
  { title: "Current Call Rate", value: "$0.20/min" },
  { title: "Current SMS Rate", value: "$0.02/sms" },
  // { title: "Next Tier", value: "47,234 mins" },
  { title: "Auto-replenish", value: "Enabled" },
  // { title: "Next Billing", value: nextBillingDate.toLocaleDateString('en-US', { 
  //   month: 'long',
  //   day: 'numeric',
  //   year: 'numeric'
  // })}
]

export default function BillingPage() {
  const { 
    data: clientInfo, 
    isLoading, 
    isAuthenticated,
    error 
  } = useAuthApi<ClientInfo>('/portal/client/info', {
    showErrorToast: true,
    onError: (error) => {
      console.error('Billing page error:', error);
    }
  });

  if (error) {
    return (
      <RootLayout topMetrics={topMetrics} hideKnowledgeSearch>
        <div className="text-center py-8">
          <p className="text-red-500">Failed to load billing information. Please try again later.</p>
        </div>
      </RootLayout>
    );
  }

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
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Billing</h1>
        
        <div className="grid gap-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <BillingOverview />
            <RevenueCalculator />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <CreditBalance />
          </div>
          <BillingMethod 
            paymentMethod={clientInfo?.default_payment_method || null}
            onPaymentMethodUpdate={() => {
              // Disabled for now
            }}
          />
        </div>
      </div>
    </RootLayout>
  );
}