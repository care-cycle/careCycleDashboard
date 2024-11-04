import { Card } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

export function BillingOverview() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="glass-panel p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total Spend</p>
            <p className="text-3xl font-bold text-foreground">$12,345</p>
          </div>
          <ArrowUpRight className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          +12.3% from last month
        </p>
      </Card>

      <Card className="glass-panel p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Estimated Savings</p>
            <p className="text-3xl font-bold text-foreground">$2,468</p>
          </div>
          <ArrowDownRight className="h-5 w-5 text-emerald-500 dark:text-emerald-400" />
        </div>
        <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-2">
          20% lower than standard rates
        </p>
      </Card>
    </div>
  )
}