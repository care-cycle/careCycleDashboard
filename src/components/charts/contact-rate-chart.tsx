import type { DateRange } from "react-day-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { format, isValid, isWeekend, differenceInDays } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { useClientData } from "@/hooks/use-client-data";
import { HelpCircle, Loader2 } from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as React from "react";

const chartColors = {
  contactRate: "#74E0BB",
  perDialRate: "#293AF9",
};

const HeaderLegend = () => {
  return (
    <div className="flex justify-center gap-6">
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: chartColors.contactRate }}
        />
        <span className="text-sm text-gray-600">Contact Rate</span>
      </div>
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: chartColors.perDialRate }}
        />
        <span className="text-sm text-gray-600">30-Day Per-Dial Rate</span>
      </div>
    </div>
  );
};

const METRIC_DESCRIPTIONS = {
  perDialRate: {
    name: "30-Day Per-Dial Rate",
    description:
      "Shows the success rate of call attempts over a rolling 30-day window. For each point, it looks back 30 days to calculate what percentage of calls were successful.",
    formula:
      "Successful Calls in Last 30 Days / Total Calls in Last 30 Days × 100",
  },
  movingAverageRate: {
    name: "Contact Rate",
    description:
      "Shows the success rate of call attempts for each hour. This represents what percentage of calls were successful during that specific hour.",
    formula: "Successful Calls / Total Calls in Hour × 100",
  },
} as const;

interface DataPoint {
  hour: string;
  totalCreated: number;
  completed: number;
  failed: number;
  pending: number;
}

interface ContactRateDataPoint {
  hour: string;
  formattedHour: string;
  formattedDate: string;
  perDialRate: number;
  movingAverageRate: number;
  totalCalls: number;
  uniqueCallers: number;
  uniqueCallers30d: number;
  totalCustomers30d: number;
  dispositionCounts: {
    Failed: number;
    Completed: number;
    Pending: number;
  };
  completed: number;
  totalCreated: number;
}

interface ChartData {
  data: DataPoint[];
}

interface ContactRateChartProps {
  dateRange: DateRange | undefined;
  campaignId?: string;
}

export function ContactRateChart({
  dateRange,
  campaignId,
}: ContactRateChartProps) {
  const { fetchContactRates } = useClientData();

  const { data, isLoading, error } = useQuery({
    queryKey: ["contactRates", dateRange?.from, dateRange?.to, campaignId],
    queryFn: async () => {
      if (!campaignId) {
        throw new Error("Campaign ID is required");
      }
      const response = (await fetchContactRates(
        dateRange?.from || new Date(),
        dateRange?.to || new Date(),
        campaignId,
      )) as ChartData;
      return response;
    },
    enabled: !!dateRange?.from && !!dateRange?.to && !!campaignId,
  });

  // Transform data to calculate contact rates
  const chartData = React.useMemo(() => {
    if (!data?.data) return [];

    // Calculate moving averages
    const movingAverages = (data.data as DataPoint[]).map(
      (point: DataPoint, index: number, array: DataPoint[]) => {
        // Look back 30 days (720 hours) for the moving average
        const startIdx = Math.max(0, index - 720);
        const window = array.slice(startIdx, index + 1);

        const totalCompleted = window.reduce(
          (acc: number, p: DataPoint) => acc + p.completed,
          0,
        );
        const totalCreated = window.reduce(
          (acc: number, p: DataPoint) => acc + p.totalCreated,
          0,
        );

        return {
          perDialRate:
            totalCreated > 0 ? (totalCompleted / totalCreated) * 100 : 0,
          totalCalls: totalCreated,
          uniqueCallers: totalCompleted,
        };
      },
    );

    // Transform the data and sort chronologically
    const transformedData = (data.data as DataPoint[]).map(
      (point: DataPoint, index: number) => {
        const movingAvg = movingAverages[index];

        return {
          hour: point.hour,
          formattedHour: format(new Date(point.hour), "MMM d, h:mm a"),
          formattedDate: format(new Date(point.hour), "MMM d"),
          perDialRate: movingAvg.perDialRate,
          movingAverageRate:
            point.completed > 0
              ? (point.completed / (point.totalCreated || 1)) * 100
              : 0,
          totalCalls: point.totalCreated,
          uniqueCallers: point.completed,
          uniqueCallers30d: point.completed,
          totalCustomers30d: point.totalCreated,
          dispositionCounts: {
            Failed: point.failed,
            Completed: point.completed,
            Pending: point.pending,
          },
          completed: point.completed,
          totalCreated: point.totalCreated,
        };
      },
    );

    // Sort chronologically (oldest to newest)
    return transformedData.sort(
      (a: ContactRateDataPoint, b: ContactRateDataPoint) =>
        new Date(a.hour).getTime() - new Date(b.hour).getTime(),
    );
  }, [data?.data]);

  // Determine if we should show hourly or daily ticks based on date range
  const showHourlyTicks = React.useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return true;
    return differenceInDays(dateRange.to, dateRange.from) <= 3;
  }, [dateRange]);

  const formatDateValue = (value: string) => {
    try {
      const date = new Date(value);
      if (!isValid(date)) return value;

      if (!dateRange?.from || !dateRange?.to) return value;
      const diff = dateRange.to.getTime() - dateRange.from.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

      // For single day view, show hours
      if (days <= 1) {
        return format(date, "h:mm a");
      }
      // For 2-3 days, show day and hour
      else if (days <= 3) {
        return format(date, "MMM d, ha");
      }
      // For longer ranges, just show the date
      return format(date, "MMM d");
    } catch (e) {
      return value;
    }
  };

  if (isLoading) {
    return (
      <Card className="glass-panel interactive cursor-pointer h-[400px]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-gray-900">Contact Rate</CardTitle>
          <HeaderLegend />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[calc(100%-65px)]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="glass-panel interactive cursor-pointer h-[400px]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-gray-900">Contact Rate</CardTitle>
          <HeaderLegend />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[calc(100%-65px)]">
          <p className="text-red-500">Error loading contact rate data</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-panel interactive cursor-pointer h-[400px]">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle className="text-gray-900">Contact Rate</CardTitle>
          <TooltipProvider delayDuration={0}>
            <UITooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-md p-1 hover:bg-accent hover:text-accent-foreground transition-colors"
                  aria-label="Help information about contact rate metrics"
                >
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                align="start"
                sideOffset={5}
                className="max-w-sm"
                style={{
                  zIndex: 9999,
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "12px",
                  boxShadow:
                    "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                }}
              >
                <p className="font-medium text-gray-900 mb-2">
                  Contact Rate Metrics
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                  <li>
                    <span className="font-medium">30-Day Per-Dial Rate:</span>{" "}
                    {METRIC_DESCRIPTIONS.perDialRate.description}
                  </li>
                  <li className="mt-2">
                    <span className="font-medium">Contact Rate:</span>{" "}
                    {METRIC_DESCRIPTIONS.movingAverageRate.description}
                  </li>
                </ul>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        <HeaderLegend />
      </CardHeader>
      <CardContent className="h-[calc(100%-65px)]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <defs>
              <linearGradient
                id="contactRateGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={chartColors.contactRate}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={chartColors.contactRate}
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient
                id="perDialRateGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={chartColors.perDialRate}
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor={chartColors.perDialRate}
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="formattedHour"
              tickFormatter={formatDateValue}
              interval={showHourlyTicks ? 4 : "preserveEnd"}
              angle={-20}
              textAnchor="end"
              height={50}
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#E2E8F0" }}
              tickMargin={8}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#E2E8F0" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;

                const dataPoint = payload[0].payload;
                const date = new Date(dataPoint.hour);
                const isWeekendDay = isWeekend(date);
                const timeInfo = format(date, "h:mm a");

                return (
                  <div className="glass-panel bg-white/95 backdrop-blur-xl p-3 rounded-lg border border-white/20 shadow-lg">
                    <p className="text-sm font-medium mb-2">{timeInfo}</p>
                    <div className="space-y-1.5">
                      {payload.map(
                        (entry: {
                          name: string;
                          value: number;
                          color: string;
                        }) => (
                          <div
                            key={entry.name}
                            className="flex items-center gap-2"
                          >
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{
                                backgroundColor: entry.color,
                              }}
                            />
                            <span className="text-sm text-gray-600">
                              {entry.name}:
                            </span>
                            <span className="text-sm font-medium">
                              {entry.value.toFixed(1)}%
                            </span>
                          </div>
                        ),
                      )}
                      {isWeekendDay && (
                        <p className="text-sm text-gray-500 mt-1">Weekend</p>
                      )}
                    </div>
                  </div>
                );
              }}
            />

            <Area
              type="monotone"
              dataKey="movingAverageRate"
              name="Contact Rate"
              stroke={chartColors.contactRate}
              fill="url(#contactRateGradient)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Area
              type="monotone"
              dataKey="perDialRate"
              name="30-Day Per-Dial Rate"
              stroke={chartColors.perDialRate}
              fill="url(#perDialRateGradient)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
