import { cn } from "@/lib/utils"

interface TopMetricsBarProps extends React.HTMLAttributes<HTMLDivElement> {
  metrics: {
    title: string
    value: string
  }[]
}

export function TopMetricsBar({ metrics, className }: TopMetricsBarProps) {
  return (
    <div className={cn("sticky top-0 left-0 right-0 z-10 bg-white/90 backdrop-blur-xl border-b", className)}>
      <div className="container flex items-center h-12 max-w-screen-2xl mx-auto px-4">
        <div className="flex-1 grid grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <div key={index} className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-500">{metric.title}</span>
              <span className="text-sm font-bold text-gray-900">
                {metric.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}