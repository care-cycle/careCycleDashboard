import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, Tooltip, Legend, CartesianGrid } from "recharts"
import { format, differenceInDays } from "date-fns"
import { DateRange } from 'react-day-picker';
const dispositionColors = {
  Voicemail: "#74E0BB",
  Transferred: "#293AF9",
  Busy: "#519d8f",
  Blocked: "#c2fff4",
  "Do Not Call": "#94b8ff"
}

interface CallDispositionsChartProps {
  data: any[]
  dateRange: DateRange | undefined
}

export function CallDispositionsChart({ data, dateRange }: CallDispositionsChartProps) {
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
    <Card className="glass-panel interactive cursor-pointer overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-gray-900">Call Dispositions</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={data} 
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
              height={45}
              interval="preserveEnd"
              minTickGap={30}
              tickMargin={8}
            />
            <YAxis
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
              width={50}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
            />
            {Object.entries(dispositionColors).map(([key, color]) => (
              <Bar
                key={key}
                dataKey={key}
                stackId="dispositions"
                fill={color}
                radius={[key === "Do Not Call" ? 4 : 0, key === "Do Not Call" ? 4 : 0, 0, 0]}
                maxBarSize={50}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}