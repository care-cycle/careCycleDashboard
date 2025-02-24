import { formatDuration } from "./utils";

interface MetricsData {
  totalCalls?: number;
  totalDurationMs?: number;
  totalSpend?: number;
  transferredCalls?: number;
  uniqueCalls?: number;
  averageDurationMs?: number;
}

interface TopMetric {
  title: string;
  value: string;
}

export function getTopMetrics(
  metricsData: MetricsData | undefined | null,
): TopMetric[] {
  if (!metricsData) return [];

  const {
    totalCalls = 0,
    totalDurationMs = 0,
    totalSpend = 0,
    transferredCalls = 0,
  } = metricsData;

  return [
    {
      title: "Today's Total Calls",
      value: totalCalls.toString(),
    },
    {
      title: "Total Duration",
      value: formatDuration(totalDurationMs),
    },
    {
      title: "Total Cost",
      value: `$${totalSpend.toFixed(2)}`,
    },
    {
      title: "Today's Transfers",
      value: transferredCalls.toString(),
    },
  ];
}
