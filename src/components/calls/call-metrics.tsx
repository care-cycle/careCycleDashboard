import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

const metrics = [
  {
    title: "Total Calls",
    value: "156",
    change: "+12%",
    trend: "up"
  },
  {
    title: "Average Duration",
    value: "4m 23s",
    change: "-8%",
    trend: "down"
  },
  {
    title: "Performance Score",
    value: "8.5/10",
    change: "+0.5",
    trend: "up"
  }
]

export function CallMetrics() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {metrics.map((metric) => (
        <Card key={metric.title} className="glass-panel interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {metric.title}
            </CardTitle>
            {metric.trend === "up" ? (
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
            <p className={`text-xs ${
              metric.trend === "up" ? "text-emerald-500" : "text-red-500"
            }`}>
              {metric.change} from last period
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}