import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard as CardIcon } from "lucide-react"

export function BillingMethod() {
  return (
    <Card className="glass-panel">
      <CardHeader>
        <CardTitle>Billing Method</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-gray-900 flex items-center justify-center">
              <CardIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-medium">Visa ending in 4242</p>
              <p className="text-sm text-gray-500">Expires 12/24</p>
            </div>
          </div>
          <Button variant="outline">Update</Button>
        </div>
      </CardContent>
    </Card>
  )
}