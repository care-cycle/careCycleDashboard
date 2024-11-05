import { useState, useEffect } from 'react'
import { RootLayout } from '@/components/layout/root-layout'
import { BillingOverview } from '@/components/billing/billing-overview'
import { CreditBalance } from '@/components/billing/credit-balance'
import { BillingMethod } from '@/components/billing/billing-method'
import { RevenueCalculator } from '@/components/billing/revenue-calculator'
import { StripeProvider } from '@/components/billing/stripe-provider'
import { toast } from 'sonner'
import apiClient from '@/lib/api-client'

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
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchClientInfo() {
      try {
        const response = await apiClient.get('/portal/client/info')
        setClientInfo(response.data)
      } catch (error) {
        toast.error('Failed to load payment information')
      } finally {
        setIsLoading(false)
      }
    }
    fetchClientInfo()
  }, [])

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
          <StripeProvider>
            <BillingMethod 
              paymentMethod={clientInfo?.default_payment_method || null}
              onPaymentMethodUpdate={(newPaymentMethod) => {
                setClientInfo(prev => prev ? {
                  ...prev,
                  default_payment_method: newPaymentMethod
                } : null)
              }}
            />
          </StripeProvider>
        </div>
      </div>
    </RootLayout>
  )
}