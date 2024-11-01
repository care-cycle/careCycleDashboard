import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { format } from "date-fns"
import type { CallVolumeDataPoint } from "@/lib/data-utils"

interface CallVolumeChartProps {
  data: CallVolumeDataPoint[]
}

const volumeColors = {
  "Inbound": "#74E0BB",
  "Outbound": "#293AF9"
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null

  return (
    <div className="glass-panel bg-white/95 backdrop-blur-xl p-3 rounded-lg border border-white/20 shadow-lg">
      <p className="text-sm font-medium mb-2">{format(new Date(label), 'HH:mm')}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: volumeColors[entry.name as keyof typeof volumeColors] }}
            />
            <span className="text-sm text-gray-600">{entry.name}:</span>
            <span className="text-sm font-medium">{entry.value} calls</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const CustomLegend = ({ payload }: any) => {
  return (
    <div className="flex justify-center gap-6">
      {payload.map((entry: any) => (
        <div key={entry.value} className="flex items-center gap-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-gray-600">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}

export function CallVolumeChart({ data }: CallVolumeChartProps) {
  return (
    <Card className="glass-panel interactive cursor-pointer">
      <CardHeader>
        <CardTitle className="text-gray-900">Call Volume</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="inboundGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#74E0BB" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#74E0BB" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="outboundGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#293AF9" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#293AF9" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="timestamp"
              tickFormatter={(time) => format(new Date(time), 'HH:mm')}
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
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              content={<CustomLegend />}
              verticalAlign="bottom"
              height={36}
            />
            <Area
              type="monotone"
              dataKey="Inbound"
              stroke="#74E0BB"
              fill="url(#inboundGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="Outbound"
              stroke="#293AF9"
              fill="url(#outboundGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}