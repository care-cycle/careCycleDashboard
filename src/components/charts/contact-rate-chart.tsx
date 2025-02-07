import type { DateRange } from "react-day-picker"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { format, isValid, isWeekend, differenceInDays } from "date-fns"
import { useQuery } from '@tanstack/react-query'
import { useClientData } from '@/hooks/use-client-data'
import { HelpCircle } from "lucide-react"
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import * as React from 'react'

// List of dispositions that indicate a non-connected call
const NON_CONNECTED_DISPOSITIONS = [
  "Busy/No Answer",
  "Voicemail",
  "Customer Did Not Answer",
  "Bad Contact",
  "Pipeline Error",
  "Telephony Block"
] as const

const METRIC_DESCRIPTIONS = {
  perDialRate: {
    name: "30-Day Per-Dial Rate",
    description: "Shows the success rate of call attempts over a rolling 30-day window. For each point, it looks back 30 days to calculate what percentage of calls were successful.",
    formula: "Successful Calls in Last 30 Days / Total Calls in Last 30 Days × 100"
  },
  movingAverageRate: {
    name: "Contact Rate",
    description: "Shows the success rate of call attempts for each hour. This represents what percentage of calls were successful during that specific hour.",
    formula: "Successful Calls / Total Calls in Hour × 100"
  }
} as const

interface DataPoint {
  hour: string;
  totalCreated: number;
  completed: number;
  failed: number;
  pending: number;
}

interface ContactRateDataPoint {
  hour: string
  formattedHour: string
  formattedDate: string
  totalCalls: number
  uniqueCallers: number
  uniqueCallers30d: number
  totalCustomers30d: number
  perDialRate: number
  perDialRate30d: number
  movingAverageRate: number
  dispositionCounts: Record<string, number>
}

interface ContactRateChartProps {
  dateRange: DateRange | undefined
  campaignId?: string
}

export function ContactRateChart({ dateRange, campaignId }: ContactRateChartProps) {
  const { fetchContactRates } = useClientData()

  // Fetch data using react-query
  const { data, isLoading, error } = useQuery({
    queryKey: ['contactRates', dateRange?.from, dateRange?.to, campaignId],
    queryFn: () => {
      if (!campaignId) {
        throw new Error('Campaign ID is required');
      }
      return fetchContactRates(
        dateRange?.from || new Date(), 
        dateRange?.to || new Date(), 
        campaignId
      );
    },
    enabled: !!dateRange?.from && !!dateRange?.to && !!campaignId
  })

  // Transform data to calculate contact rates
  const chartData = React.useMemo(() => {
    if (!data?.data) return [];

    // Calculate totals for the summary metrics
    const totals = data.data.reduce((acc: { completed: number; created: number }, point: DataPoint) => ({
      completed: acc.completed + point.completed,
      created: acc.created + point.totalCreated
    }), { completed: 0, created: 0 });

    // First, calculate the 30-day moving averages
    const windowSize = 30;
    const movingAverages = data.data.map((point: DataPoint, index: number, array: DataPoint[]) => {
      // Look back 30 days (720 hours) for the moving average
      const startIdx = Math.max(0, index - 720);
      const window = array.slice(startIdx, index + 1);
      
      const totalCompleted = window.reduce((acc: number, p: DataPoint) => acc + p.completed, 0);
      const totalCreated = window.reduce((acc: number, p: DataPoint) => acc + p.totalCreated, 0);
      
      return {
        perDialRate: totalCreated > 0 ? (totalCompleted / totalCreated) * 100 : 0,
        totalCalls: totalCreated,
        uniqueCallers: totalCompleted
      };
    });

    // Transform the data and sort chronologically
    const transformedData = data.data.map((point: DataPoint, index: number) => {
      const movingAvg = movingAverages[index];
      
      return {
        hour: point.hour,
        formattedHour: format(new Date(point.hour), 'MMM d, h:mm a'),
        formattedDate: format(new Date(point.hour), 'MMM d'),
        perDialRate: movingAvg.perDialRate,
        movingAverageRate: point.completed > 0 ? 
          (point.completed / (point.totalCreated || 1)) * 100 : 0,
        totalCalls: point.totalCreated,
        uniqueCallers: point.completed,
        uniqueCallers30d: point.completed,
        totalCustomers30d: point.totalCreated,
        dispositionCounts: {
          'Failed': point.failed,
          'Completed': point.completed,
          'Pending': point.pending
        }
      };
    });

    // Sort chronologically (oldest to newest)
    return transformedData.sort((a: ContactRateDataPoint, b: ContactRateDataPoint) => 
      new Date(a.hour).getTime() - new Date(b.hour).getTime()
    );
  }, [data?.data]);

  // Calculate summary metrics
  const summaryMetrics = React.useMemo(() => {
    if (!chartData.length) return null;

    // Get the most recent hour's data
    const lastPoint = chartData[chartData.length - 1];
    
    // Calculate the contact rate for the most recent hour
    const currentRate = lastPoint.completed > 0 
      ? (lastPoint.completed / lastPoint.totalCreated) * 100 
      : 0;

    return {
      completed: lastPoint.completed,
      total: lastPoint.totalCreated,
      contactRate: Math.round(currentRate * 100) / 100
    };
  }, [chartData]);

  // Determine if we should show hourly or daily ticks based on date range
  const showHourlyTicks = React.useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return true
    return differenceInDays(dateRange.to, dateRange.from) <= 3
  }, [dateRange])

  const formatDateValue = (value: string) => {
    try {
      const date = new Date(value)
      if (!isValid(date)) return value
      
      if (!dateRange?.from || !dateRange?.to) return value
      const diff = dateRange.to.getTime() - dateRange.from.getTime()
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
      
      // For single day view, show hours
      if (days <= 1) {
        return format(date, 'h:mm a')
      }
      // For 2-3 days, show day and hour
      else if (days <= 3) {
        return format(date, 'MMM d, ha')
      }
      // For longer ranges, just show the date
      return format(date, 'MMM d')
    } catch (e) {
      return value
    }
  }

  const formatTooltipLabel = (label: string) => {
    try {
      const date = new Date(label)
      if (!isValid(date)) return label
      
      if (!dateRange?.from || !dateRange?.to) return label
      const diff = dateRange.to.getTime() - dateRange.from.getTime()
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
      
      // If range is more than 2 days, show date and time
      if (days > 2) {
        return format(date, 'MMM d, h:mm a')
      }
      // Otherwise show time only
      return format(date, 'h:mm a')
    } catch (e) {
      return label
    }
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle>Contact Rate</CardTitle>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-sm">
                  <p className="font-medium">Contact Rate Metrics</p>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>
                      <span className="font-medium">30-Day Per-Dial Rate:</span>
                      {" "}{METRIC_DESCRIPTIONS.perDialRate.description}
                    </li>
                    <li>
                      <span className="font-medium">Contact Rate:</span>
                      {" "}{METRIC_DESCRIPTIONS.movingAverageRate.description}
                    </li>
                  </ul>
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
          </div>
          {summaryMetrics && (
            <div className="flex items-center space-x-6 text-sm">
              <div>
                <span className="font-medium">Current Hour:</span>
                <span className="ml-2">{summaryMetrics?.completed?.toLocaleString() || '0'} / {summaryMetrics?.total?.toLocaleString() || '0'} successful</span>
              </div>
              <div>
                <span className="font-medium">Contact Rate:</span>
                <span className="ml-2">{summaryMetrics?.contactRate || '0'}%</span>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[400px]">
            <p>Loading...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-[400px]">
            <p className="text-red-500">Error loading contact rate data</p>
          </div>
        ) : (
          <>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="formattedHour"
                    tickFormatter={formatDateValue}
                    interval={showHourlyTicks ? 4 : "preserveEnd"}
                    angle={-20}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    formatter={(value: number, name: string, props: any) => {
                      const dataPoint = props.payload;
                      const date = new Date(dataPoint.hour);
                      const isWeekendDay = isWeekend(date);
                      const timeInfo = format(date, 'h:mm a');
                      
                      const result = [];
                      
                      if (name === "30-Day Per-Dial Rate") {
                        result.push(`${value.toFixed(1)}% of calls successful`);
                        result.push(`${dataPoint.uniqueCallers} completed / ${dataPoint.totalCalls} total calls`);
                      } else {
                        result.push(`${value.toFixed(1)}% contact rate`);
                        result.push(`${dataPoint.uniqueCallers30d} completed / ${dataPoint.totalCustomers30d} total attempts`);
                      }
                      
                      result.push(`Time: ${timeInfo}`);
                      if (isWeekendDay) result.push("Weekend");
                      
                      return result;
                    }}
                    labelFormatter={formatTooltipLabel}
                  />
                  <Legend />
                  
                  {/* Weekend shading - more subtle */}
                  {chartData.map((entry: ContactRateDataPoint, index: number) => {
                    const date = new Date(entry.hour);
                    if (isWeekend(date)) {
                      return (
                        <ReferenceLine
                          key={`weekend-${index}`}
                          x={entry.formattedHour}
                          stroke="rgba(200,200,200,0.1)"
                          strokeWidth={20}
                        />
                      );
                    }
                    return null;
                  })}
                  
                  <Line
                    type="monotone"
                    dataKey="movingAverageRate"
                    name="Contact Rate" 
                    stroke="#82ca9d"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="perDialRate"
                    name="30-Day Per-Dial Rate"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* Legend explanation */}
            <div className="mt-4 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <div>
                  <span className="inline-block w-3 h-3 bg-[#82ca9d] mr-2" />
                  Contact Rate: Percentage of successful contacts for each hour
                </div>
                <div>
                  <span className="inline-block w-3 h-3 bg-[#8884d8] mr-2" />
                  30-Day Per-Dial Rate: Success rate of calls over a rolling 30-day window
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
} 