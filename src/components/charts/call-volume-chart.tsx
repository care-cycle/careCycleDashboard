import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import {
  format,
  differenceInDays,
  startOfHour,
  endOfHour,
  addHours,
} from "date-fns";
import type { CallVolumeDataPoint } from "@/lib/data-utils";
import { DateRange } from "react-day-picker";
import { useMemo } from "react";
import { Loader2 } from "lucide-react";

interface CallVolumeChartProps {
  data: CallVolumeDataPoint[];
  dateRange: DateRange | undefined;
  isLoading?: boolean;
}

interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    payload: {
      timestamp: string;
      weekEnd?: string;
      formattedDate: string;
      formattedHour: string;
      Inbound: number;
      Outbound: number;
    };
  }>;
}

const volumeColors = {
  Inbound: "#74E0BB",
  Outbound: "#293AF9",
};

const HeaderLegend = () => {
  return (
    <div className="flex justify-center gap-6">
      {Object.entries(volumeColors).map(([name, color]) => (
        <div key={name} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm text-gray-600">{name}</span>
        </div>
      ))}
    </div>
  );
};

export function CallVolumeChart({
  data,
  dateRange,
  isLoading,
}: CallVolumeChartProps) {
  const processedData = useMemo(() => {
    if (!data?.length) return [];
    if (!dateRange?.from || !dateRange?.to) return data;

    const diffDays = differenceInDays(dateRange.to, dateRange.from);

    // Only process hourly data if we're looking at less than 2 days
    if (diffDays > 2) return data;

    // Create a map of existing timestamps
    const dataMap = new Map(
      data.map((d) => [new Date(d.timestamp).toISOString(), d]),
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
        Inbound: 0,
        Outbound: 0,
        formattedDate: format(current, "MMM dd"),
        formattedHour: format(current, "HH:mm"),
      };
      result.push(existingData);
      current = addHours(current, 1);
    }

    return result;
  }, [data, dateRange]);

  if (isLoading) {
    return (
      <Card className="glass-panel interactive cursor-pointer h-[400px]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-gray-900">Call Volume</CardTitle>
          <HeaderLegend />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[calc(100%-65px)]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </CardContent>
      </Card>
    );
  }

  if (!data?.length || !processedData?.length) {
    return (
      <Card className="glass-panel interactive cursor-pointer h-[400px]">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-gray-900">Call Volume</CardTitle>
          <HeaderLegend />
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[calc(100%-65px)]">
          <p className="text-gray-500">No data over selected time period</p>
        </CardContent>
      </Card>
    );
  }

  const getTimeFormatter = () => {
    if (!dateRange?.from || !dateRange?.to)
      return (time: string) => format(new Date(time), "MMM dd");

    const diffDays = differenceInDays(dateRange.to, dateRange.from);

    return (time: string) => {
      try {
        const date = new Date(time);
        if (diffDays <= 2) {
          return format(date, "HH:mm");
        } else if (diffDays <= 14) {
          return format(date, "MMM dd");
        } else {
          return format(date, "MMM dd");
        }
      } catch (e) {
        console.warn("Error formatting date:", time);
        return time;
      }
    };
  };

  const CustomTooltip = ({ active, payload }: TooltipProps) => {
    if (!active || !payload?.length) return null;

    let dateDisplay;
    try {
      const dataPoint = payload[0].payload;
      const startDate = new Date(dataPoint.timestamp);
      const diffDays =
        dateRange?.from && dateRange?.to
          ? differenceInDays(dateRange.to, dateRange.from)
          : 0;

      if (diffDays <= 2) {
        dateDisplay = format(startDate, "MMM dd, HH:mm");
      } else if (diffDays <= 14) {
        dateDisplay = format(startDate, "MMM dd");
      } else {
        const endDate = dataPoint.weekEnd
          ? new Date(dataPoint.weekEnd)
          : startDate;
        dateDisplay = `${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd")}`;
      }
    } catch (e) {
      console.error("Error in CustomTooltip:", e);
      return null;
    }

    return (
      <div className="glass-panel bg-white/95 backdrop-blur-xl p-3 rounded-lg border border-white/20 shadow-lg">
        <p className="text-sm font-medium mb-2">{dateDisplay}</p>
        <div className="space-y-1.5">
          {payload.map(
            (entry: {
              name: string;
              value: number;
              payload: {
                formattedDate: string;
                formattedHour: string;
                Inbound: number;
                Outbound: number;
              };
            }) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor:
                      volumeColors[entry.name as keyof typeof volumeColors],
                  }}
                />
                <span className="text-sm text-gray-600">{entry.name}:</span>
                <span className="text-sm font-medium">{entry.value} calls</span>
              </div>
            ),
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="glass-panel interactive cursor-pointer h-[400px]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-gray-900">Call Volume</CardTitle>
        <HeaderLegend />
      </CardHeader>
      <CardContent className="flex-1 h-[calc(100%-65px)]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={processedData}>
            <defs>
              <linearGradient id="inboundGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#74E0BB" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#74E0BB" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="outboundGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#293AF9" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#293AF9" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="timestamp"
              tickFormatter={getTimeFormatter()}
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#E2E8F0" }}
              height={45}
              interval="preserveEnd"
              minTickGap={30}
              tickMargin={8}
            />
            <YAxis
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#E2E8F0" }}
            />
            <Tooltip content={CustomTooltip} />
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
  );
}
