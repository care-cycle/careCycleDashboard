import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useMemo } from "react";
import { DateRange } from "react-day-picker";

interface CallMetricsProps {
  metrics?: any;
  date?: DateRange;
  isLoading?: boolean;
  calls?: any[];
}

// Helper function to convert duration string to milliseconds
function parseDuration(durationStr: string): number {
  const match = durationStr.match(/(?:(\d+)m\s*)?(?:(\d+)s)?/);
  if (!match) return 0;

  const minutes = parseInt(match[1] || "0", 10);
  const seconds = parseInt(match[2] || "0", 10);

  return (minutes * 60 + seconds) * 1000;
}

export function CallMetrics({ calls, date, isLoading }: CallMetricsProps) {
  const calculatedMetrics = useMemo(() => {
    if (isLoading || !calls) {
      return [];
    }

    let currentPeriodCalls = calls;
    let previousPeriodCalls: any[] = [];
    let daysDiff = 0;

    if (date?.from && date?.to) {
      // Filter calls within date range if dates are provided
      currentPeriodCalls = calls.filter((call) => {
        const callDate = new Date(call.createdAt);
        return callDate >= date.from && callDate <= date.to;
      });

      // Calculate previous period only if we have dates
      daysDiff = Math.ceil(
        (date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24),
      );
      const previousFrom = new Date(
        date.from.getTime() - daysDiff * 24 * 60 * 60 * 1000,
      );
      const previousTo = new Date(date.from.getTime() - 1);

      previousPeriodCalls = calls.filter((call) => {
        const callDate = new Date(call.createdAt);
        return callDate >= previousFrom && callDate <= previousTo;
      });
    }

    // Calculate total calls
    const totalCalls = currentPeriodCalls.length;

    // Calculate average duration
    const totalDurationMs = currentPeriodCalls.reduce((sum, call) => {
      return sum + parseDuration(call.duration || "0s");
    }, 0);

    const averageDurationMs = totalCalls > 0 ? totalDurationMs / totalCalls : 0;

    // Calculate previous period
    const previousTotalDurationMs = previousPeriodCalls.reduce((sum, call) => {
      return sum + parseDuration(call.duration || "0s");
    }, 0);

    const previousAverageDurationMs =
      previousPeriodCalls.length > 0
        ? previousTotalDurationMs / previousPeriodCalls.length
        : 0;

    // Calculate percentage changes
    const callsChange =
      previousPeriodCalls.length === 0
        ? null
        : ((totalCalls - previousPeriodCalls.length) /
            previousPeriodCalls.length) *
          100;

    const durationChange =
      previousAverageDurationMs === 0
        ? null
        : ((averageDurationMs - previousAverageDurationMs) /
            previousAverageDurationMs) *
          100;

    return [
      {
        title: "Total Calls",
        value: totalCalls.toLocaleString(),
        change:
          callsChange === null
            ? date?.from
              ? `No data for previous ${daysDiff} day${daysDiff === 1 ? "" : "s"}`
              : "Select a date range for comparison"
            : `${callsChange >= 0 ? "+" : ""}${callsChange.toFixed(1)}%`,
        trend:
          callsChange === null ? "neutral" : callsChange >= 0 ? "up" : "down",
      },
      {
        title: "Average Duration",
        value: formatDuration(Math.round(averageDurationMs)),
        change:
          durationChange === null
            ? date?.from
              ? `No data for previous ${daysDiff} day${daysDiff === 1 ? "" : "s"}`
              : "Select a date range for comparison"
            : `${durationChange >= 0 ? "+" : ""}${durationChange.toFixed(1)}%`,
        trend:
          durationChange === null
            ? "neutral"
            : durationChange >= 0
              ? "up"
              : "down",
      },
    ];
  }, [calls, date, isLoading]);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 max-w-[750px]">
        Loading metrics...
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 max-w-[750px]">
      {calculatedMetrics.map((metric) => (
        <Card key={metric.title} className="glass-panel interactive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {metric.title}
            </CardTitle>
            {metric.trend === "up" ? (
              <ArrowUpRight className="h-4 w-4 text-emerald-500" />
            ) : metric.trend === "down" ? (
              <ArrowDownRight className="h-4 w-4 text-red-500" />
            ) : null}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {metric.value}
            </div>
            <p
              className={cn("text-xs", {
                "text-emerald-500": metric.trend === "up",
                "text-red-500": metric.trend === "down",
                "text-gray-500": metric.trend === "neutral",
              })}
            >
              {metric.change}
              {date?.from && " from last period"}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Helper function to format duration in ms to a readable string
function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${minutes}m ${seconds}s`;
}

// Helper function to combine class names
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
