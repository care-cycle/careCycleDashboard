import { useState } from 'react'
import { DateRange } from 'react-day-picker'
import { RootLayout } from '@/components/layout/root-layout'
import { KPICard } from '@/components/metrics/kpi-card'
import { CallDispositionsChart } from '@/components/charts/call-dispositions-chart'
import { EndedByChart } from '@/components/charts/ended-by-chart'
import { CallVolumeChart } from '@/components/charts/call-volume-chart'
import { DateRangePicker } from '@/components/date-range-picker'
import { AgentSelect } from '@/components/agent-select'
import { CallsByAgent } from '@/components/metrics/calls-by-agent'
import { generateTimeSeriesData, generateCallVolumeData } from '@/lib/data-utils'
import { PageTransition } from "@/components/layout/page-transition"

const topMetrics = [
  { title: "Total Calls", value: "12,345" },
  { title: "Total Spend", value: "$12,345" },
  { title: "Transfers", value: "1,234" },
  { title: "Cost per Transfer", value: "$10.00" }
]

const kpiData = [
  { 
    title: "Customers Engaged",
    value: "5,678",
    change: "+7.8%",
    info: "Number of unique customers who interacted with our AI assistants"
  },
  { 
    title: "Performance Score",
    value: "8.5/10",
    change: "+0.3",
    info: "Average AI performance score based on QA guidelines"
  },
  { 
    title: "Total Duration",
    value: "1,234 hrs",
    change: "+5.2%",
    info: "Total duration of all calls in the selected period"
  },
]

const endedByData = [
  { name: "Agent", value: 700 },
  { name: "Customer", value: 500 },
]

const callsByAgentData = [
  { name: "Agent A", calls: 50, trend: "up" as const },
  { name: "Agent B", calls: 25, trend: "down" as const },
  { name: "Agent C", calls: 30, trend: "up" as const },
]

const agents = ["Agent A", "Agent B", "Agent C"]

export default function Dashboard() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(2024, 9, 5),
    to: new Date(2024, 10, 31)
  })
  const [selectedAgent, setSelectedAgent] = useState("all")
  const [dispositionsData] = useState(() => generateTimeSeriesData())
  const [callVolumeData] = useState(() => generateCallVolumeData())

  return (
    <RootLayout topMetrics={topMetrics}>
      <PageTransition>
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
            <div className="flex gap-4">
              <AgentSelect
                agents={agents}
                value={selectedAgent}
                onValueChange={setSelectedAgent}
              />
              <DateRangePicker date={date} onChange={setDate} />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {kpiData.map((item, index) => (
              <KPICard
                key={index}
                title={item.title}
                value={item.value}
                change={item.change}
                info={item.info}
              />
            ))}
          </div>

          <div className="grid gap-6 grid-cols-2">
            <CallDispositionsChart data={dispositionsData} />
            <div className="space-y-6">
              <EndedByChart data={endedByData} />
              <CallVolumeChart data={callVolumeData} />
            </div>
          </div>

          <CallsByAgent data={callsByAgentData} />
        </div>
      </PageTransition>
    </RootLayout>
  )
}