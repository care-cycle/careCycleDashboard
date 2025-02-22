import { formatDuration } from "./utils";

interface MetricsData {
  data?: {
    totalCalls?: number;
    totalDurationMs?: number;
    totalSpend?: number;
    totalVapiCost?: number;
  };
}

interface TopMetric {
  title: string;
  value: string;
}

export function getTopMetrics(
  metricsData: MetricsData | undefined | null,
): TopMetric[] {
  if (!metricsData?.data) return [];

  const {
    totalCalls = 0,
    totalDurationMs = 0,
    totalSpend = 0,
    totalVapiCost = 0,
  } = metricsData.data;

  return [
    {
      title: "Total Calls",
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
      title: "VAPI Cost",
      value: `$${totalVapiCost.toFixed(2)}`,
    },
  ];
}
