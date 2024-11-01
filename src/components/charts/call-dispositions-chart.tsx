import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, Tooltip, Legend, CartesianGrid } from "recharts"

const dispositionColors = {
  Voicemail: "#74E0BB",
  Transferred: "#293AF9",
  Busy: "#519d8f",
  Blocked: "#c2fff4",
  "Do Not Call": "#94b8ff"
}

interface CallDispositionsChartProps {
  data: any[]
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload) return null

  return (
    <div className="glass-panel bg-white/95 backdrop-blur-xl p-3 rounded-lg border border-white/20 shadow-lg">
      <p className="text-sm font-medium mb-2">{label}</p>
      <div className="space-y-1.5">
        {payload.map((entry: any) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.fill }}
            />
            <span className="text-sm text-gray-600">{entry.name}:</span>
            <span className="text-sm font-medium">{entry.value} calls</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CallDispositionsChart({ data }: CallDispositionsChartProps) {
  return (
    <Card className="glass-panel interactive cursor-pointer overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-gray-900">Call Dispositions</CardTitle>
        <div className="text-sm text-gray-500">Business Hours</div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          <div className="flex justify-center">
            <Legend 
              verticalAlign="top"
              height={36}
              align="center"
              iconType="circle"
              wrapperStyle={{
                lineHeight: '24px',
              }}
              formatter={(value) => (
                <span className="text-sm text-gray-600">{value}</span>
              )}
            />
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={data} 
              className="chart-glass"
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#E2E8F0" 
                vertical={false}
              />
              <XAxis 
                dataKey="time" 
                stroke="#64748B"
                fontSize={12}
                tickLine={false}
                axisLine={{ stroke: '#E2E8F0' }}
                tickFormatter={(value) => value.replace(':00', '')}
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
        </div>
      </CardContent>
    </Card>
  )
}