import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, Tooltip, Legend, CartesianGrid } from "recharts"
import { format, differenceInDays, startOfHour, endOfHour, addHours } from "date-fns"
import { DateRange } from 'react-day-picker';
import { Switch } from "@/components/ui/switch"
import { useMemo, useState } from "react"
import { Loader2 } from "lucide-react"

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
  "Unqualified": "#FF5674",                    // Deep rose

  // Add these new ones:
  "Customer Did Not Answer": "#55C39D",  // Using similar color to "Busy/No Answer"
  "Bad Contact": "#FF8093",              // Using similar color to negative outcomes
  "Disposition Error": "#F2C94C",        // Using similar color to warning states
  "Do Not Contact": "#FFB7C5",           // Using similar color to "Do Not Call"
  
  // Note: If "Identity Verified" is different from "Identity Verification Succeeded",
  // you might want to add it as well:
  "Identity Verified": "#293AF9",        // Using same color as "Identity Verification Succeeded"
}

const NON_CONNECTED_DISPOSITIONS = [
  "Busy/No Answer",
  "Voicemail",
  "Customer Did Not Answer",
  "Bad Contact"
]

interface CallDispositionsChartProps {
  data: any[]
  dateRange: DateRange | undefined
}

export function CallDispositionsChart({ data, dateRange }: CallDispositionsChartProps) {
  const [showConnectedOnly, setShowConnectedOnly] = useState(true)

  const processedData = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return data;
    
    const diffDays = differenceInDays(dateRange.to, dateRange.from);
    
    // Only process hourly data if we're looking at less than 2 days
    if (diffDays > 2) return data;

    // Create a map of existing timestamps
    const dataMap = new Map(
      data.map(d => [new Date(d.timestamp).toISOString(), d])
    );
    
    // Generate all hour slots between from and to
    const result = [];
    let current = startOfHour(dateRange.from);
    const end = endOfHour(new Date()); // Use current time as end if later than dateRange.to
    const rangeEnd = dateRange.to > end ? end : dateRange.to;

    while (current <= rangeEnd) {
      const timestamp = current.toISOString();
      // Use existing data or create empty data point
      const existingData = dataMap.get(timestamp) || {
        timestamp,
        ...Object.fromEntries(Object.keys(dispositionColors).map(key => [key, 0]))
      };
      result.push(existingData);
      current = addHours(current, 1);
    }

    return result;
  }, [data, dateRange]);

  const filteredData = useMemo(() => {
    if (!showConnectedOnly) return processedData;
    
    return processedData.map(entry => {
      const filteredEntry = { ...entry };
      NON_CONNECTED_DISPOSITIONS.forEach(disposition => {
        delete filteredEntry[disposition];
      });
      return filteredEntry;
    });
  }, [processedData, showConnectedOnly]);

  if (!data?.length) {
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
        <CardContent className="flex items-center justify-center h-[calc(100%-65px)]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </CardContent>
      </Card>
    )
  }

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
          {[...payload].sort((a, b) => b.value - a.value).map((entry: any) => (
            <div key={entry.name} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: dispositionColors[entry.name as keyof typeof dispositionColors] }}
              />
              <span className="text-sm text-gray-600">{entry.name}:</span>
              <span className="text-sm font-medium">{entry.value} {entry.value === 1 ? 'call' : 'calls'}</span>
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
            {Object.keys(dispositionColors)
              .sort((a, b) => {
                // Get the total value for each disposition across all data points
                const sumA = data.reduce((sum, entry) => sum + (entry[a] || 0), 0);
                const sumB = data.reduce((sum, entry) => sum + (entry[b] || 0), 0);
                return sumB - sumA; // Sort descending
              })
              .map((key) => (
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