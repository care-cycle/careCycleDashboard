import { formatDuration } from './utils'

type MetricsData = {
  uniqueCustomers?: number
  uniqueCalls?: number
  totalCalls?: number
  totalSpend?: number
  totalDurationMs?: number
  averageDurationMs?: number
}

export const getTopMetrics = (todayMetrics: MetricsData | null | undefined) => [
  { 
    title: "Today's Total Calls", 
    value: todayMetrics?.totalCalls?.toLocaleString() || '0'
  },
  { 
    title: "Today's Total Spend", 
    value: `$${Number(todayMetrics?.totalSpend || 0).toFixed(2)}`
  },
  { 
    title: "Today's Total Duration", 
    value: formatDuration(todayMetrics?.totalDurationMs || 0)
  },
  { 
    title: "Today's Avg Duration", 
    value: formatDuration(todayMetrics?.averageDurationMs || 0)
  }
] 