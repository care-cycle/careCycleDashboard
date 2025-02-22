import {
  startOfHour,
  startOfDay,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isSameHour,
  differenceInDays,
} from "date-fns";

type TimeseriesDataPoint = {
  timestamp: Date;
  [key: string]: any;
};

export function aggregateTimeseriesData<T extends TimeseriesDataPoint>(
  data: T[],
  dateRange: { from: Date; to: Date } | undefined,
  aggregateValues: (points: T[]) => Omit<T, "timestamp">,
): T[] {
  if (!dateRange?.from || !dateRange?.to || !data.length) return data;

  const diffDays = differenceInDays(dateRange.to, dateRange.from);

  // Group data points based on the time period
  const groupedData = data.reduce((acc, point) => {
    let key: Date;

    if (diffDays <= 2) {
      // Hour by hour for 2 days or less
      key = startOfHour(point.timestamp);
    } else if (diffDays <= 14) {
      // Day by day for 2-14 days
      key = startOfDay(point.timestamp);
    } else {
      // Week by week for >14 days
      key = startOfWeek(point.timestamp);
    }

    if (!acc.has(key.getTime())) {
      acc.set(key.getTime(), []);
    }
    acc.get(key.getTime())!.push(point);
    return acc;
  }, new Map<number, T[]>());

  // Aggregate values for each group
  return Array.from(groupedData.entries())
    .map(([timestamp, points]) => {
      const aggregated = aggregateValues(points);

      if (diffDays > 14) {
        // For weekly data, include weekEnd
        return {
          timestamp: new Date(timestamp),
          weekEnd: endOfWeek(new Date(timestamp)),
          ...aggregated,
        } as T;
      }

      return {
        timestamp: new Date(timestamp),
        ...aggregated,
      } as T;
    })
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
}
