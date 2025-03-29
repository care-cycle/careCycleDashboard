import { useState, useMemo, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { RootLayout } from "@/components/layout/root-layout";
import { KPICard } from "@/components/metrics/kpi-card";
import { CallDispositionsChart } from "@/components/charts/call-dispositions-chart";
import { CallVolumeChart } from "@/components/charts/call-volume-chart";
import { ContactRateChart } from "@/components/charts/contact-rate-chart";
import { DateRangePicker } from "@/components/date-range-picker";
import { CampaignSelect } from "@/components/campaign-select";
import { CallsByCampaign } from "@/components/metrics/calls-by-campaign";
import { PageTransition } from "@/components/layout/page-transition";
import { useInitialData } from "@/hooks/use-client-data";
import { aggregateTimeseriesData } from "@/lib/date-utils";
import { assistantTypeLabels } from "@/components/charts/constants";
import { AssistantCountChart } from "@/components/charts/assistant-count-chart";
import { format, subDays } from "date-fns";
import { getTopMetrics } from "@/lib/metrics";
import { usePreferences } from "@/hooks/use-preferences";
import { differenceInDays } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { intervalManager } from "@/utils/interval-manager";

interface Campaign {
  id: string;
  name: string;
  type: string;
  hours: Array<{
    hour: string;
    hourFormatted: string;
    dateFormatted: string;
    inbound: number;
    outbound: number;
    uniqueCallers: number;
    totalCustomers: number;
    totalMs: number;
    dispositionCounts: Record<string, number>;
    assistantTypeCounts: Record<string, number>;
  }>;
}

interface TimeseriesDataPoint {
  timestamp: Date;
  hour: string;
  formattedHour: string;
  formattedDate: string;
  [key: string]: Date | string | number;
}

interface CallVolumeDataPoint extends TimeseriesDataPoint {
  Inbound: number;
  Outbound: number;
}

interface AssistantCountDataPoint {
  name: string;
  value: number;
}

interface CampaignLike {
  id: string;
  name: string;
}

type HourData = Campaign["hours"][number];

export default function Dashboard() {
  const today = new Date();
  const yesterday = subDays(today, 1);
  const [date, setDate] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    return {
      from: yesterday,
      to: today,
    };
  });

  // Use global campaign selection and auth
  const { selectedCampaignId } = usePreferences();
  const { user, loading } = useAuth();
  const {
    metrics,
    isLoading,
    isMetricsLoading,
    todayMetrics,
    fetchUniqueCallers,
  } = useInitialData();

  const [customersEngaged, setCustomersEngaged] = useState({
    value: "0",
    change: "N/A",
    description: "",
    rawValue: 0,
  });

  // All hooks and memoized values
  const getHoursData = (campaignId: string): HourData[] => {
    if (!metrics?.data?.data) return [];

    // For "all" campaigns, use the total data
    if (campaignId === "all") {
      return metrics.data.data.total || [];
    }

    // For specific campaigns, find the campaign and use its hours data
    const campaign = metrics.data.data.campaigns?.find(
      (c: Campaign) => c.id === campaignId,
    );
    return campaign?.hours || [];
  };

  // Update campaign selector to handle object structure
  const availableCampaigns = useMemo(() => {
    if (!metrics?.data) return [];

    const campaignsData = metrics.data;

    const campaignsList = Object.entries(campaignsData)
      .filter(
        ([id, data]) =>
          id !== "data" &&
          id !== "status" &&
          id !== "url" &&
          id !== "metadata" &&
          typeof data === "object" &&
          data !== null,
      )
      .map(([id, data]: [string, any]) => ({
        id,
        name: data.name || "24/7 Inbound Pre-Qualification",
        type: data.type,
        hours: data.hours || [],
      }));

    return [
      { id: "all", name: "All Campaigns" },
      ...campaignsList.map((campaign) => ({
        id: campaign.id,
        name: campaign.name,
      })),
    ];
  }, [metrics]);

  // Update campaign finding logic
  const findCampaign = (campaignId: string) => {
    if (!metrics?.data?.data || campaignId === "all") return null;

    const campaign = metrics.data.data.campaigns?.find(
      (c: any) => c.id === campaignId,
    );

    return campaign || null;
  };

  const callVolumeData = useMemo(() => {
    const hours = getHoursData(selectedCampaignId);

    if (!hours?.length) return [];

    const startDate = new Date(date?.from || new Date());
    startDate.setHours(0, 0, 0, 0);
    const startUTC = new Date(
      startDate.getTime() - startDate.getTimezoneOffset() * 60000,
    );

    const endDate = new Date(date?.to || new Date());
    endDate.setHours(23, 59, 59, 999);
    const endUTC = new Date(
      endDate.getTime() - endDate.getTimezoneOffset() * 60000,
    );

    const rawData = hours
      .filter((metric: HourData) => {
        const metricDate = new Date(metric.hour);
        return metricDate >= startUTC && metricDate <= endUTC;
      })
      .map((metric: HourData) => ({
        timestamp: new Date(metric.hour),
        hour: metric.hour,
        formattedHour: metric.hourFormatted,
        formattedDate: metric.dateFormatted,
        Inbound: Number(metric.inbound) || 0,
        Outbound: Number(metric.outbound) || 0,
      }));

    return aggregateTimeseriesData<CallVolumeDataPoint>(
      rawData,
      { from: startUTC, to: endUTC },
      (points) => ({
        timestamp: points[0].timestamp,
        hour: points[0].hour,
        formattedHour: points[0].formattedHour,
        formattedDate: points[0].formattedDate,
        Inbound: points.reduce((sum, p) => sum + p.Inbound, 0),
        Outbound: points.reduce((sum, p) => sum + p.Outbound, 0),
      }),
    );
  }, [date, selectedCampaignId, metrics]);

  // Use getHoursData for dispositions
  const dispositionsData = useMemo(() => {
    const hours = getHoursData(selectedCampaignId);

    if (!hours?.length) return [];

    const startDate = new Date(date?.from || new Date());
    startDate.setHours(0, 0, 0, 0);
    const startUTC = new Date(
      startDate.getTime() - startDate.getTimezoneOffset() * 60000,
    );

    const endDate = new Date(date?.to || new Date());
    endDate.setHours(23, 59, 59, 999);
    const endUTC = new Date(
      endDate.getTime() - endDate.getTimezoneOffset() * 60000,
    );

    // Filter hours by date range
    const filteredHours = hours.filter((hour) => {
      const metricDate = new Date(hour.hour);
      return metricDate >= startUTC && metricDate <= endUTC;
    });

    if (!filteredHours.length) return [];

    // Calculate the date difference
    const diffDays = differenceInDays(endUTC, startUTC);

    // Group and aggregate data based on time range
    if (diffDays <= 2) {
      // Hourly data for 2 days or less
      return filteredHours.map((hour) => ({
        timestamp: new Date(hour.hour).toISOString(),
        ...hour.dispositionCounts,
      }));
    } else if (diffDays <= 14) {
      // Daily aggregation for 2-14 days
      const dailyData = new Map();

      filteredHours.forEach((hour) => {
        const date = new Date(hour.hour);
        date.setHours(0, 0, 0, 0);
        const dateKey = date.toISOString();

        if (!dailyData.has(dateKey)) {
          dailyData.set(dateKey, {
            timestamp: dateKey,
            ...Object.fromEntries(
              Object.keys(hour.dispositionCounts || {}).map((key) => [key, 0]),
            ),
          });
        }

        const dayData = dailyData.get(dateKey);
        Object.entries(hour.dispositionCounts || {}).forEach(([key, value]) => {
          dayData[key] = (dayData[key] || 0) + (value as number);
        });
      });

      return Array.from(dailyData.values());
    } else {
      // Weekly aggregation for > 14 days
      const weeklyData = new Map();

      filteredHours.forEach((hour) => {
        const date = new Date(hour.hour);
        date.setHours(0, 0, 0, 0);
        // Set to start of week (Sunday)
        date.setDate(date.getDate() - date.getDay());
        const weekKey = date.toISOString();

        if (!weeklyData.has(weekKey)) {
          weeklyData.set(weekKey, {
            timestamp: weekKey,
            weekEnd: new Date(
              date.getTime() + 6 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            ...Object.fromEntries(
              Object.keys(hour.dispositionCounts || {}).map((key) => [key, 0]),
            ),
          });
        }

        const weekData = weeklyData.get(weekKey);
        Object.entries(hour.dispositionCounts || {}).forEach(([key, value]) => {
          weekData[key] = (weekData[key] || 0) + (value as number);
        });
      });

      return Array.from(weeklyData.values());
    }
  }, [selectedCampaignId, metrics, date]);

  const handleDateChange = async (newDate: DateRange | undefined) => {
    if (newDate?.from && newDate?.to) {
      const from = new Date(newDate.from);
      const to = new Date(newDate.to);

      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        setDate(newDate);
      }
    }
  };

  // Consolidated effect to update customersEngaged
  useEffect(() => {
    let isMounted = true;
    setCustomersEngaged({
      value: "Loading...",
      change: "Fetching data...",
      description: "",
      rawValue: 0,
    });

    if (date?.from && date?.to && !isLoading) {
      const fetchCustomerData = async () => {
        try {
          const from = new Date(date.from!);
          const to = new Date(date.to!);

          const daysDiff =
            Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) +
            1;

          if (daysDiff > 14) {
            setCustomersEngaged({
              value: "Loading...",
              change: `Processing ${daysDiff} day range in chunks`,
              description: "This may take a moment",
              rawValue: 0,
            });
          }

          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000);

          const response = await fetchUniqueCallers(from, to);

          clearTimeout(timeoutId);

          if (!isMounted) return;

          if (response.data.success && response.data.data) {
            const { currentPeriod, previousPeriod, comparison } =
              response.data.data;

            const rawValue =
              typeof currentPeriod?.uniqueCallers === "number"
                ? currentPeriod.uniqueCallers
                : parseInt(
                    String(currentPeriod?.uniqueCallers || "0").replace(
                      /[^0-9]/g,
                      "",
                    ),
                    10,
                  ) || 0;

            setCustomersEngaged({
              value: rawValue.toLocaleString(),
              change: !previousPeriod?.uniqueCallers
                ? `No data for previous ${daysDiff} day${daysDiff === 1 ? "" : "s"}`
                : `${comparison?.percentChange >= 0 ? "+" : ""}${comparison?.percentChange?.toFixed(1) ?? 0}% change from previous ${daysDiff} day${daysDiff === 1 ? "" : "s"}`,
              description: response.data.metadata?.timeRanges?.previousPeriod
                ? `${format(new Date(response.data.metadata.timeRanges.previousPeriod.from), "MMM d, yyyy")} - ${format(new Date(response.data.metadata.timeRanges.previousPeriod.to), "MMM d, yyyy")}`
                : "",
              rawValue: rawValue,
            });
          } else {
            setCustomersEngaged({
              value: "0",
              change: "No data available",
              description: "",
              rawValue: 0,
            });
          }
        } catch (error: any) {
          if (error.code === "ECONNABORTED" || error.name === "AbortError") {
            const fromDate = date?.from ? new Date(date.from) : new Date();
            const toDate = date?.to ? new Date(date.to) : new Date();
            const daysDiff =
              Math.ceil(
                (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24),
              ) + 1;

            setCustomersEngaged({
              value: "N/A",
              change: `Request timed out for ${daysDiff} day range`,
              description: "Try selecting a shorter date range",
              rawValue: 0,
            });
          } else {
            setCustomersEngaged({
              value: "0",
              change: "Error loading data",
              description: "",
              rawValue: 0,
            });
          }
        }
      };

      fetchCustomerData();
    }

    return () => {
      isMounted = false;
    };
  }, [date?.from, date?.to, isLoading, fetchUniqueCallers]);

  const campaignMetrics = useMemo(() => {
    if (isLoading || !metrics?.data?.data?.campaigns) return [];

    if (Object.keys(metrics.data.data.campaigns).length === 0) {
      return [];
    }

    if (
      !metrics.data.data.campaigns ||
      typeof metrics.data.data.campaigns !== "object"
    ) {
      return [];
    }

    const campaignsArray = Array.isArray(metrics.data.data.campaigns)
      ? metrics.data.data.campaigns
      : Object.values(metrics.data.data.campaigns);

    if (!Array.isArray(campaignsArray)) {
      return [];
    }

    const validCampaigns = campaignsArray.filter((c: any): c is Campaign => {
      const campaignLike = c as CampaignLike;
      return (
        campaignLike &&
        typeof campaignLike === "object" &&
        typeof campaignLike.id === "string" &&
        typeof campaignLike.name === "string"
      );
    });

    return validCampaigns.map((campaign: Campaign) => {
      const hours = campaign.hours || [];

      const currentPeriodCalls = hours.reduce((sum: number, hour: HourData) => {
        const hourDate = new Date(hour.hour);
        if (
          date?.from &&
          date?.to &&
          hourDate >= date.from &&
          hourDate <= date.to
        ) {
          return sum + (Number(hour.inbound || 0) + Number(hour.outbound || 0));
        }
        return sum;
      }, 0);

      const daysDiff =
        date?.from && date?.to
          ? Math.ceil(
              (date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24),
            )
          : 0;
      const previousFrom = date?.from
        ? new Date(date.from.getTime() - daysDiff * 24 * 60 * 60 * 1000)
        : new Date();
      const previousTo = date?.from
        ? new Date(date.from.getTime() - 1)
        : new Date();

      const previousPeriodCalls = hours.reduce(
        (sum: number, hour: HourData) => {
          const hourDate = new Date(hour.hour);
          if (hourDate >= previousFrom && hourDate <= previousTo) {
            return (
              sum + (Number(hour.inbound || 0) + Number(hour.outbound || 0))
            );
          }
          return sum;
        },
        0,
      );

      return {
        name: campaign.name,
        calls: currentPeriodCalls,
        trend:
          currentPeriodCalls >= previousPeriodCalls
            ? ("up" as const)
            : ("down" as const),
      };
    });
  }, [metrics, date, isLoading]);

  const totalDuration = useMemo(() => {
    if (isLoading || !metrics?.data)
      return { value: "0", change: "N/A", description: "" };

    let campaignData;
    if (selectedCampaignId === "all") {
      campaignData = metrics.data.data.total;
    } else {
      const campaign = findCampaign(selectedCampaignId);
      campaignData = campaign?.hours;
    }

    // Calculate date ranges exactly like customersEngaged
    const daysDiff =
      date?.from && date?.to
        ? Math.ceil(
            (date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24),
          ) + 1
        : 0;

    if (!campaignData?.length) {
      return {
        value: "0",
        change: `+0% change from previous ${daysDiff} day${daysDiff === 1 ? "" : "s"}`,
        description: "",
      };
    }

    // Calculate previous period date range
    const previousFrom = date?.from
      ? new Date(date.from.getTime() - daysDiff * 24 * 60 * 60 * 1000)
      : new Date();
    const previousTo = date?.from
      ? new Date(date.from.getTime() - 1)
      : new Date();

    // Calculate current and previous period totals
    let currentPeriodTotalMs = 0;
    let previousPeriodTotalMs = 0;

    // Process each record
    campaignData.forEach((metric: HourData) => {
      const metricDate = new Date(metric.hour);
      const totalMs = Number(metric.totalMs || 0);

      // Current period
      if (
        date?.from &&
        date?.to &&
        metricDate >= date.from &&
        metricDate <= date.to
      ) {
        currentPeriodTotalMs += totalMs;
      }
      // Previous period
      else if (
        date?.from &&
        metricDate >= previousFrom &&
        metricDate <= previousTo
      ) {
        previousPeriodTotalMs += totalMs;
      }
    });

    // Convert milliseconds to hours
    const currentPeriodHours = (
      currentPeriodTotalMs /
      (1000 * 60 * 60)
    ).toFixed(1);

    // Format the final value with "hrs" suffix
    const finalValue = `${parseFloat(currentPeriodHours).toLocaleString()} hrs`;

    // Calculate change text - EXACTLY like customersEngaged
    let change = `+0% change from previous ${daysDiff} day${daysDiff === 1 ? "" : "s"}`;

    if (previousPeriodTotalMs > 0) {
      const percentChange =
        ((currentPeriodTotalMs - previousPeriodTotalMs) /
          previousPeriodTotalMs) *
        100;
      change = `${percentChange >= 0 ? "+" : ""}${percentChange.toFixed(1)}% change from previous ${daysDiff} day${daysDiff === 1 ? "" : "s"}`;
    }

    return {
      value: finalValue,
      change,
      description: "",
    };
  }, [date, metrics, selectedCampaignId, isLoading]);

  const assistantTypesData = useMemo(() => {
    const hours = getHoursData(selectedCampaignId);

    if (!hours?.length) return [];

    // Filter hours by date range
    const startDate = new Date(date?.from || new Date());
    startDate.setHours(0, 0, 0, 0);
    const startUTC = new Date(
      startDate.getTime() - startDate.getTimezoneOffset() * 60000,
    );

    const endDate = new Date(date?.to || new Date());
    endDate.setHours(23, 59, 59, 999);
    const endUTC = new Date(
      endDate.getTime() - endDate.getTimezoneOffset() * 60000,
    );

    // Filter hours within the date range
    const filteredHours = hours.filter((hour: HourData) => {
      const hourDate = new Date(hour.hour);
      return hourDate >= startUTC && hourDate <= endUTC;
    });

    if (!filteredHours.length) return [];

    // Get all unique assistant types from the filtered hours
    const allAssistantTypes = new Set<string>();
    filteredHours.forEach((hour: HourData) => {
      if (hour.assistantTypeCounts) {
        Object.keys(hour.assistantTypeCounts).forEach((type) =>
          allAssistantTypes.add(type),
        );
      }
    });

    // Transform the hours data into the format expected by AssistantCountChart
    return Array.from(allAssistantTypes).map((name) => ({
      name,
      value: filteredHours.reduce(
        (sum, hour) => sum + (hour.assistantTypeCounts?.[name] || 0),
        0,
      ),
    }));
  }, [selectedCampaignId, date, metrics]);

  // Now handle loading and auth states
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-gray-400 border-t-transparent rounded-full">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user || user.organizationStatus === "removed") {
    return null;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <RootLayout topMetrics={getTopMetrics(todayMetrics)} hideKnowledgeSearch>
      <PageTransition>
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Dashboard
            </h1>
            <div className="flex gap-4">
              <DateRangePicker
                date={date}
                onChange={handleDateChange}
                className="w-[260px]"
                defaultDate={{
                  from: yesterday,
                  to: today,
                }}
                minDate={
                  metrics?.data?.data?.total?.[0]?.hour
                    ? new Date(metrics.data.data.total[0].hour)
                    : undefined
                }
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <KPICard
              title="Customers Engaged"
              value={customersEngaged.rawValue}
              change={customersEngaged.change}
              info={`Number of unique customers who interacted with our AI assistants`}
            />
            <KPICard
              title="Total Duration"
              value={totalDuration.value}
              change={totalDuration.change}
              info={`Total duration of all calls`}
            />
          </div>
          <div className="grid gap-6 grid-cols-2">
            <CallDispositionsChart
              data={dispositionsData}
              dateRange={date}
              isLoading={isMetricsLoading}
            />
            <div className="space-y-6">
              <AssistantCountChart
                data={assistantTypesData}
                isLoading={isMetricsLoading}
              />
              <CallVolumeChart
                data={callVolumeData}
                dateRange={date}
                isLoading={isMetricsLoading}
              />
            </div>
          </div>
          <ContactRateChart
            dateRange={date}
            campaignId={
              selectedCampaignId === "all"
                ? Object.entries(metrics?.data || {}).filter(
                    ([id, data]) =>
                      // Filter out non-campaign entries and ensure valid UUID
                      id !== "data" &&
                      id !== "status" &&
                      id !== "url" &&
                      typeof data === "object" &&
                      data !== null &&
                      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                        id,
                      ),
                  )[0]?.[0]
                : /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
                      selectedCampaignId,
                    )
                  ? selectedCampaignId
                  : undefined
            }
          />
          <CallsByCampaign data={campaignMetrics || []} />
        </div>
      </PageTransition>
    </RootLayout>
  );
}
