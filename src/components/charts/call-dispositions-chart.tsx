import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Bar,
  Tooltip,
  CartesianGrid,
  TooltipProps,
} from "recharts";
import {
  format,
  differenceInDays,
  startOfHour,
  endOfHour,
  addHours,
} from "date-fns";
import { DateRange } from "react-day-picker";
import { Switch } from "@/components/ui/switch";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

// Base disposition colors - predefined for common dispositions
const BASE_DISPOSITION_COLORS = {
  // Primary Positive Outcomes
  Qualified: "#74E0BB", // Primary turquoise
  "Appointment Scheduled": "#64D1AC", // Slightly deeper turquoise
  Complete: "#74E0BB", // Same as qualified
  "Call Completed": "#64D1AC", // Same family as appointment scheduled

  // Verification Flow Positives
  "Identity Verification Succeeded": "#293AF9", // Royal blue (brand)
  "Identity Verified": "#293AF9", // Same as above
  "Message Delivered": "#4B5EFA", // Lighter royal blue
  Transferred: "#6B82FB", // Soft royal blue

  // High Volume Neutrals (make up bulk of chart)
  "Busy/No Answer": "#55C39D", // Rich turquoise
  Voicemail: "#4B9B8A", // Deep turquoise
  "Customer Did Not Answer": "#55C39D", // Same as Busy/No Answer
  "No Agents Available": "#E5BC47", // Deep gold
  "Customer Unresponsive": "#7DD3C0", // Light turquoise

  // Customer Actions
  "Customer Hungup": "#A78BFA", // Light purple
  "Early Disconnect": "#9CA3AF", // Gray
  "Not Interested": "#FFD700", // Bright gold
  "Bad Time": "#FDE047", // Yellow

  // Inquiry/Communication
  "Inquiry Raised": "#60A5FA", // Light blue
  "Inquiry Resolved": "#34D399", // Green

  // Warning States
  "Pipeline Error": "#F2C94C", // Muted gold
  "Disposition Error": "#F59E0B", // Orange
  "Telephony Block": "#E5BC47", // Deep gold

  // Negative Outcomes
  "Do Not Call": "#FFB7C5", // Cherry blossom
  "Identity Verification Failed": "#FF8093", // Deep cherry blossom
  Unqualified: "#FF5674", // Deep rose
  "Bad Contact": "#FF8093", // Same as identity verification failed

  // New Customer
  "New Customer": "#10B981", // Emerald green
};

// Color categories for generating colors for unknown dispositions
const COLOR_CATEGORIES = {
  positive: ["#74E0BB", "#64D1AC", "#34D399", "#10B981", "#6EE7B7"],
  neutral: ["#55C39D", "#4B9B8A", "#7DD3C0", "#A7F3D0", "#9CA3AF"],
  warning: ["#FFD700", "#F59E0B", "#E5BC47", "#FDE047", "#FCD34D"],
  negative: ["#FF5674", "#FF8093", "#FFB7C5", "#FCA5A5", "#F87171"],
  technical: ["#F2C94C", "#A78BFA", "#60A5FA", "#8B5CF6", "#6366F1"],
};

// Function to generate color for unknown dispositions
function generateDispositionColor(disposition: string, index: number): string {
  // Check if we have a predefined color
  if (
    BASE_DISPOSITION_COLORS[disposition as keyof typeof BASE_DISPOSITION_COLORS]
  ) {
    return BASE_DISPOSITION_COLORS[
      disposition as keyof typeof BASE_DISPOSITION_COLORS
    ];
  }

  // Categorize unknown dispositions and assign colors
  const lowerDisposition = disposition.toLowerCase();

  if (
    lowerDisposition.includes("qualified") ||
    lowerDisposition.includes("scheduled") ||
    lowerDisposition.includes("complete") ||
    lowerDisposition.includes("delivered") ||
    lowerDisposition.includes("verified") ||
    lowerDisposition.includes("resolved")
  ) {
    const colors = COLOR_CATEGORIES.positive;
    return colors[index % colors.length];
  }

  if (
    lowerDisposition.includes("error") ||
    lowerDisposition.includes("failed") ||
    lowerDisposition.includes("block") ||
    lowerDisposition.includes("pipeline")
  ) {
    const colors = COLOR_CATEGORIES.technical;
    return colors[index % colors.length];
  }

  if (
    lowerDisposition.includes("not interested") ||
    lowerDisposition.includes("do not") ||
    lowerDisposition.includes("unqualified") ||
    lowerDisposition.includes("bad")
  ) {
    const colors = COLOR_CATEGORIES.negative;
    return colors[index % colors.length];
  }

  if (
    lowerDisposition.includes("busy") ||
    lowerDisposition.includes("voicemail") ||
    lowerDisposition.includes("unresponsive") ||
    lowerDisposition.includes("hangup") ||
    lowerDisposition.includes("disconnect")
  ) {
    const colors = COLOR_CATEGORIES.neutral;
    return colors[index % colors.length];
  }

  // Default to warning colors for unknown categories
  const colors = COLOR_CATEGORIES.warning;
  return colors[index % colors.length];
}

// Function to get all disposition colors dynamically
function getDispositionColors(
  data: DispositionDataPoint[],
): Record<string, string> {
  const allDispositions = new Set<string>();

  // Collect all disposition keys from the data
  data.forEach((entry) => {
    Object.keys(entry).forEach((key) => {
      if (
        key !== "timestamp" &&
        key !== "weekEnd" &&
        typeof entry[key] === "number"
      ) {
        allDispositions.add(key);
      }
    });
  });

  // Generate colors for all dispositions
  const colors: Record<string, string> = {};
  const dispositionArray = Array.from(allDispositions);

  dispositionArray.forEach((disposition, index) => {
    colors[disposition] = generateDispositionColor(disposition, index);
  });

  return colors;
}

const NON_CONNECTED_DISPOSITIONS = [
  "Busy/No Answer",
  "Voicemail",
  "Customer Did Not Answer",
  "Bad Contact",
];

interface DispositionDataPoint {
  timestamp: string;
  weekEnd?: string;
  [key: string]: string | number | undefined;
}

interface CallDispositionsChartProps {
  data: DispositionDataPoint[];
  dateRange: DateRange | undefined;
  isLoading?: boolean;
}

export function CallDispositionsChart({
  data,
  dateRange,
  isLoading,
}: CallDispositionsChartProps) {
  const [showConnectedOnly, setShowConnectedOnly] = useState(true);

  // Generate disposition colors dynamically based on the data
  const dispositionColors = useMemo(() => getDispositionColors(data), [data]);

  const processedData = useMemo(() => {
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
        ...Object.fromEntries(
          Object.keys(dispositionColors).map((key) => [key, 0]),
        ),
      };
      result.push(existingData);
      current = addHours(current, 1);
    }

    return result;
  }, [data, dateRange]);

  const filteredData = useMemo(() => {
    if (!showConnectedOnly) return processedData;

    return processedData.map((entry) => {
      const filteredEntry = { ...entry };
      NON_CONNECTED_DISPOSITIONS.forEach((disposition) => {
        delete filteredEntry[disposition];
      });
      return filteredEntry;
    });
  }, [processedData, showConnectedOnly]);

  if (isLoading) {
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
    );
  }

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
          // Just show the first day of the week
          return format(date, "MMM dd");
        }
      } catch (e) {
        console.warn("Error formatting date:", time);
        return time;
      }
    };
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: TooltipProps<number, string>) => {
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
        // Only use weekEnd if it exists (for weekly data)
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
            (entry, index) =>
              entry.name && (
                <div
                  key={entry.name || index}
                  className="flex items-center gap-2"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: entry.color,
                    }}
                  />
                  <span className="text-sm text-gray-600">{entry.name}:</span>
                  <span className="text-sm font-medium">
                    {entry.value} {entry.value === 1 ? "call" : "calls"}
                  </span>
                </div>
              ),
          )}
        </div>
      </div>
    );
  };

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
            maxBarSize={100}
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
              axisLine={{ stroke: "#E2E8F0" }}
            />
            <YAxis
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#E2E8F0" }}
            />
            <Tooltip content={CustomTooltip} />
            {Object.keys(dispositionColors)
              .sort((a, b) => {
                // Get the total value for each disposition across all data points
                const sumA = data.reduce(
                  (sum, entry) => sum + (Number(entry[a]) || 0),
                  0,
                );
                const sumB = data.reduce(
                  (sum, entry) => sum + (Number(entry[b]) || 0),
                  0,
                );
                return sumB - sumA; // Sort descending
              })
              .map((key) => {
                return (
                  <Bar
                    key={key}
                    dataKey={key}
                    stackId="dispositions"
                    fill={
                      dispositionColors[key as keyof typeof dispositionColors]
                    }
                    radius={[4, 4, 4, 4]}
                  />
                );
              })}
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
