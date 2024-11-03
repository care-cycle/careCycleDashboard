import { useState } from 'react'
import { RootLayout } from '@/components/layout/root-layout'
import { CallsTable } from '@/components/calls/calls-table'
import { CallMetrics } from '@/components/calls/call-metrics'
import { CallFilters } from '@/components/calls/call-filters'
import { CallDetails } from '@/components/calls/call-details'
import { DateRange } from 'react-day-picker'
import { useUI } from '@/contexts/ui-context'
import { Call } from '@/types/calls'

const topMetrics = [
  { title: "Total Calls", value: "12,345" },
  { title: "Total Spend", value: "$12,345" },
  { title: "Transfers", value: "1,234" },
  { title: "Cost per Transfer", value: "$10.00" }
]

export default function CallsPage() {
  const [selectedCall, setSelectedCall] = useState<Call | null>(null)
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2024, 2, 12),
    to: new Date(2024, 2, 12)
  })
  const { setCallDetailsOpen } = useUI()

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
    <RootLayout topMetrics={topMetrics}>
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