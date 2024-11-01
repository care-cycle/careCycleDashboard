import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts"

interface EndedByChartProps {
  data: {
    name: string
    value: number
  }[]
}

const endedByColors = {
  "Agent": "#74E0BB",
  "Customer": "#293AF9"
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload) return null

  const data = payload[0]
  return (
    <div className="glass-panel bg-white/95 backdrop-blur-xl p-3 rounded-lg border border-white/20 shadow-lg">
      <div className="flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: data.payload.fill }}
        />
        <span className="text-sm text-gray-600">{data.name}:</span>
        <span className="text-sm font-medium">{data.value} calls</span>
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

export function EndedByChart({ data }: EndedByChartProps) {
  return (
    <Card className="glass-panel interactive cursor-pointer">
      <CardHeader>
        <CardTitle className="text-gray-900">Ended By</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={160}>
          <PieChart>
            <defs>
              <filter id="pieGlow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={60}
              innerRadius={45}
              fill="#74E0BB"
              dataKey="value"
              filter="url(#pieGlow)"
            >
              {data.map((entry) => (
                <Cell 
                  key={entry.name}
                  fill={endedByColors[entry.name as keyof typeof endedByColors]}
                  style={{
                    filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1))'
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              content={<CustomLegend />}
              verticalAlign="bottom"
              height={36}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}