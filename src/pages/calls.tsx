import { useState } from 'react'
import { RootLayout } from '@/components/layout/root-layout'
import { CallsTable } from '@/components/calls/calls-table'
import { CallMetrics } from '@/components/calls/call-metrics'
import { CallFilters } from '@/components/calls/call-filters'
import { CallDetails } from '@/components/calls/call-details'
import { DateRange } from 'react-day-picker'
import { useUI } from '@/contexts/ui-context'
import { Call } from '@/types/calls'
import { useInitialData } from '@/hooks/useInitialData'
import { formatDuration } from '@/lib/utils'

const getTopMetrics = (todayMetrics: any) => [
  { 
    title: "Total Calls", 
    value: todayMetrics?.uniqueCalls?.toLocaleString() || "0" 
  },
  { 
    title: "Total Spend", 
    value: todayMetrics?.totalSpend ? `$${todayMetrics.totalSpend.toFixed(2)}` : "$0.00" 
  },
  { 
    title: "Total Duration", 
    value: todayMetrics?.totalDurationMs ? formatDuration(todayMetrics.totalDurationMs) : "0s"
  },
  { 
    title: "Avg Duration", 
    value: todayMetrics?.averageDurationMs ? formatDuration(todayMetrics.averageDurationMs) : "0s"
  }
]

export default function CallsPage() {
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2024, 2, 12),
    to: new Date(2024, 2, 12)
  })
  const { setCallDetailsOpen } = useUI()
  const { todayMetrics } = useInitialData();

  const handleCallSelect = (call: Call) => {
    setSelectedCall(call)
    setCallDetailsOpen(true)
  }

  const handleCallClose = () => {
    setSelectedCall(null)
    setCallDetailsOpen(false)
  }

  const handleDateRangeChange = (date: DateRange | undefined) => {
    setDateRange(date)
  }

  return (
    <RootLayout topMetrics={getTopMetrics(todayMetrics)}>
      <div className="space-y-6">
        <CallMetrics />
        <CallFilters 
          dateRange={dateRange} 
          onDateRangeChange={handleDateRangeChange} 
        />
        <CallsTable onCallSelect={handleCallSelect} />
        {selectedCall && (
          <CallDetails 
            call={selectedCall} 
            onClose={handleCallClose} 
          />
        )}
      </div>
    </RootLayout>
  )
}