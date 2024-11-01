import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface CallsByAgentProps {
  data: {
    name: string
    calls: number
    trend: "up" | "down"
  }[]
}

export function CallsByAgent({ data }: CallsByAgentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Calls by Agent</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((agent) => (
            <div key={agent.name} className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{agent.name}</p>
                <p className="text-sm text-muted-foreground">
                  {agent.calls} calls
                </p>
              </div>
              <div className={cn(
                "flex items-center",
                agent.trend === "up" ? "text-green-500" : "text-red-500"
              )}>
                {agent.trend === "up" ? (
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