import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface CallsByCampaignProps {
  data: {
    name: string
    calls: number
    trend: "up" | "down"
  }[]
}

export function CallsByCampaign({ data }: CallsByCampaignProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calls by Campaign</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((campaign) => (
            <div key={campaign.name} className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{campaign.name}</p>
                <p className="text-sm text-muted-foreground">
                  {campaign.calls.toLocaleString()} calls
                </p>
              </div>
              <div className={cn(
                "flex items-center",
                campaign.trend === "up" ? "text-green-500" : "text-red-500"
              )}>
                {campaign.trend === "up" ? (
                  <ArrowUp className="h-4 w-4 mr-1" />
                ) : (
                  <ArrowDown className="h-4 w-4 mr-1" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}