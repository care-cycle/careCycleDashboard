import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, Tooltip, Legend, CartesianGrid } from "recharts"
import { format, differenceInDays } from "date-fns"
import { DateRange } from 'react-day-picker';
import { Switch } from "@/components/ui/switch"
import { useMemo, useState } from "react"

const dispositionColors = {
  // Primary Positive Outcomes (these appear separately from verification flow)
  "Qualified": "#74E0BB",                     // Primary turquoise
  "Appointment Scheduled": "#64D1AC",         // Slightly deeper turquoise

  // Verification Flow Positives (these appear together)
  "Identity Verification Succeeded": "#293AF9", // Royal blue (brand)
  "Message Delivered": "#4B5EFA",              // Lighter royal blue
  "Transferred": "#6B82FB",                    // Soft royal blue

  // High Volume Neutrals (make up bulk of chart)
  "Busy/No Answer": "#55C39D",                // Rich turquoise
  "Voicemail": "#4B9B8A",                     // Deep turquoise

  // Warning States
  "Not Interested": "#FFD700",                // Bright gold
  "Pipeline Error": "#F2C94C",                // Muted gold
  "Telephony Block": "#E5BC47",               // Deep gold

  // Negative Outcomes
  "Do Not Call": "#FFB7C5",                   // Cherry blossom
  "Identity Verification Failed": "#FF8093",   // Deep cherry blossom
  "Unqualified": "#FF5674"                    // Deep rose
}

const NON_CONNECTED_DISPOSITIONS = [
  "Busy/No Answer",
  "Voicemail"
]

interface CallDispositionsChartProps {
  data: any[]
  dateRange: DateRange | undefined
}

export function CallDispositionsChart({ data, dateRange }: CallDispositionsChartProps) {
  const [showConnectedOnly, setShowConnectedOnly] = useState(true)

  const filteredData = useMemo(() => {
    if (!showConnectedOnly) return data;
    
    return data.map(entry => {
      const filteredEntry = { ...entry };
      NON_CONNECTED_DISPOSITIONS.forEach(disposition => {
        delete filteredEntry[disposition];
      });
      return filteredEntry;
    });
  }, [data, showConnectedOnly]);

  const getTimeFormatter = () => {
    if (!dateRange?.from || !dateRange?.to) return (time: string) => format(new Date(time), 'MMM dd')
    
    const diffDays = differenceInDays(dateRange.to, dateRange.from)
    
    return (time: string) => {
      try {
        const date = new Date(time)
        if (diffDays <= 2) {
          return format(date, 'HH:mm')
        } else if (diffDays <= 14) {
          return format(date, 'MMM dd')
        } else {
          // Just show the first day of the week
          return format(date, 'MMM dd')
        }
      } catch (e) {
        console.warn('Error formatting date:', time)
        return time
      }
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null

    let dateDisplay
    try {
      const dataPoint = payload[0].payload
      const startDate = new Date(dataPoint.timestamp)
      const diffDays = dateRange?.from && dateRange?.to ? differenceInDays(dateRange.to, dateRange.from) : 0

      if (diffDays <= 2) {
        dateDisplay = format(startDate, 'MMM dd, HH:mm')
      } else if (diffDays <= 14) {
        dateDisplay = format(startDate, 'MMM dd')
      } else {
        // Only use weekEnd if it exists (for weekly data)
        const endDate = dataPoint.weekEnd ? new Date(dataPoint.weekEnd) : startDate
        dateDisplay = `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd')}`
      }
    } catch (e) {
      console.error('Error in CustomTooltip:', e)
      return null
    }

    return (
      <div className="glass-panel bg-white/95 backdrop-blur-xl p-3 rounded-lg border border-white/20 shadow-lg">
        <p className="text-sm font-medium mb-2">{dateDisplay}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: dispositionColors[entry.name as keyof typeof dispositionColors] }}
              />
              <span className="text-sm text-gray-600">{entry.name}:</span>
              <span className="text-sm font-medium">{entry.value} calls</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <Card className="glass-panel interactive cursor-pointer h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-gray-900">Call Dispositions</CardTitle>
        <div className="flex items-center space-x-2">
          <Switch
            checked={showConnectedOnly}
            onCheckedChange={setShowConnectedOnly}
            id="connected-calls-filter"
          />
          <label 
            htmlFor="connected-calls-filter" 
            className="text-sm text-gray-600"
          >
            Show Connected Calls Only
          </label>
        </div>
      </CardHeader>
      <CardContent className="flex-1 h-[calc(100%-65px)]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={filteredData}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false}
              stroke="#E2E8F0" 
            />
            <XAxis 
              dataKey="timestamp"
              tickFormatter={getTimeFormatter()}
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <Tooltip content={CustomTooltip} />
            {Object.keys(dispositionColors).map((key) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="dispositions"
                fill={dispositionColors[key as keyof typeof dispositionColors]}
                radius={[0, 0, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}