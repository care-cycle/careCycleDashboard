import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Info } from "lucide-react"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export function RevenueCalculator() {
  const [revenuePerSale, setRevenuePerSale] = useState<string>('500')
  const [closeRate, setCloseRate] = useState<string>('20')
  const [estimatedRevenue, setEstimatedRevenue] = useState<number>(0)
  const transferCount = 1604 // This would come from your actual data

  useEffect(() => {
    const revenue = parseFloat(revenuePerSale) || 0
    const rate = parseFloat(closeRate) || 0
    const monthly = (transferCount * (rate / 100) * revenue)
    setEstimatedRevenue(monthly)
  }, [revenuePerSale, closeRate, transferCount])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Estimated Revenue
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="inline-flex items-center justify-center rounded-full hover:bg-white/20 dark:hover:bg-white/10 w-5 h-5 transition-colors">
                  <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                </button>
              </TooltipTrigger>
              <TooltipContent 
                side="top" 
                align="center"
                className="glass-panel bg-white/95 dark:bg-black/95 backdrop-blur-xl border border-white/30 dark:border-white/10 shadow-lg"
              >
                <p className="text-sm max-w-[200px] text-foreground">
                  Estimates revenue from AI transfers this month based on number of transfers, average close rate, and revenue per sale
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Estimated Revenue Display */}
        <div className="space-y-2">
          <div className="text-3xl font-bold text-foreground">
            {formatCurrency(estimatedRevenue)}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 dark:text-emerald-400 text-sm">+12.5% from last month</span>
            <span className="text-muted-foreground text-sm">
              Based on {transferCount.toLocaleString()} transfers
            </span>
          </div>
        </div>

        {/* Calculator Inputs */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Revenue per sale</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                $
              </span>
              <Input
                type="number"
                value={revenuePerSale}
                onChange={(e) => setRevenuePerSale(e.target.value)}
                className="pl-7"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Close rate</Label>
            <div className="relative">
              <Input
                type="number"
                value={closeRate}
                onChange={(e) => setCloseRate(e.target.value)}
                className="pr-7"
                min="0"
                max="100"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                %
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}