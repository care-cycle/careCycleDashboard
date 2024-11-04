import { RootLayout } from '@/components/layout/root-layout'
import { BillingOverview } from '@/components/billing/billing-overview'
import { CreditBalance } from '@/components/billing/credit-balance'
// import { ReplenishSettings } from '@/components/billing/replenish-settings'
import { BillingMethod } from '@/components/billing/billing-method'
import { RevenueCalculator } from '@/components/billing/revenue-calculator'

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
            {/* <ReplenishSettings /> */}
          </div>
          <BillingMethod />
        </div>
      </div>
    </RootLayout>
  )
}