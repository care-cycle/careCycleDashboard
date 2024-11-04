import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function CreditBalance() {
  const used = 32768
  const total = 50000
  const percentage = (used / total) * 100

  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>Credit Balance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Progress value={percentage} className="h-2" />
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Used: {used.toLocaleString()} minutes</span>
            <span className="font-medium">{(total - used).toLocaleString()} minutes remaining</span>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Next Auto-replenish</span>
            <span className="font-medium">At 5,000 minutes</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}