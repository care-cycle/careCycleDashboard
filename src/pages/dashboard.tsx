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

  // Initialize selectedCampaign as null to handle auto-selection
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const {
    metrics,
    isLoading,
    isMetricsLoading,
    todayMetrics,
    fetchUniqueCallers,
  } = useInitialData();

  // Auto-select single campaign
  useEffect(() => {
    if (!isLoading && metrics?.data) {
      // Get campaigns directly from metrics.data
      const campaignsData = metrics.data;
      console.log("Raw campaigns data:", campaignsData);

      // Handle object structure where campaign ID is the key
      const campaignsList = Object.entries(campaignsData)
        .filter(
          ([id, data]) =>
            // Filter out non-campaign entries
            id !== "data" &&
            id !== "status" &&
            id !== "url" &&
            id !== "metadata" && // Also exclude metadata
            typeof data === "object" &&
            data !== null,
        )
        .map(([id, data]: [string, any]) => ({
          id,
          name: data.name,
          type: data.type,
          hours: data.hours || [],
        }));

      console.log("Processed campaigns list:", campaignsList);

      // If there's exactly one campaign, select it
      if (campaignsList.length === 1) {
        console.log("Auto-selecting single campaign:", campaignsList[0]);
        setSelectedCampaign(campaignsList[0].id);
      } else if (campaignsList.length > 1) {
        // If there are multiple campaigns, select the first valid one
        console.log(
          "Multiple campaigns found, selecting first:",
          campaignsList[0],
        );
        setSelectedCampaign(campaignsList[0].id);
      } else {
        // If no valid campaigns, set to "all"
        console.log("No valid campaigns found, setting to 'all'");
        setSelectedCampaign("all");
      }
    }
  }, [isLoading, metrics]);

  // Update campaign selector to handle object structure
  const availableCampaigns = useMemo(() => {
    if (!metrics?.data) return [];

    // Get campaigns directly from metrics.data
    const campaignsData = metrics.data;
    console.log("Building available campaigns from:", campaignsData);
    console.log(
      "Full metrics data structure:",
      JSON.stringify(metrics.data, null, 2).substring(0, 1000) + "...",
    );

    // Handle object structure where campaign ID is the key
    const campaignsList = Object.entries(campaignsData)
      .filter(
        ([id, data]) =>
          // Filter out non-campaign entries
          id !== "data" &&
          id !== "status" &&
          id !== "url" &&
          id !== "metadata" && // Also exclude metadata
          typeof data === "object" &&
          data !== null,
      )
      .map(([id, data]: [string, any]) => ({
        id,
        name: data.name || "24/7 Inbound Pre-Qualification",
        type: data.type,
        hours: data.hours || [],
      }));

    console.log("Available campaigns list:", campaignsList);

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
    if (!metrics?.data || campaignId === "all") return null;

    // Log all available campaign IDs for debugging
    console.log(
      "Available campaign IDs:",
      Object.keys(metrics.data).filter(
        (id) =>
          id !== "data" && id !== "status" && id !== "url" && id !== "metadata",
      ),
    );

    const campaignData = metrics.data[campaignId];
    console.log(
      "Found campaign data for ID:",
      campaignId,
      campaignData ? "exists" : "not found",
    );
    return campaignData ? { id: campaignId, ...campaignData } : null;
  };

  const callVolumeData = useMemo(() => {
    if (isLoading || !metrics?.data) return [];

    // Log the metrics data structure
    console.log("Metrics data structure:", {
      hasDataProperty: metrics.data.hasOwnProperty("data"),
      dataKeys: metrics.data.data ? Object.keys(metrics.data.data) : [],
      hasTotalProperty: metrics.data.data?.hasOwnProperty("total"),
      totalLength: metrics.data.data?.total?.length,
    });

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

    let campaignData;
    if (selectedCampaign === "all") {
      campaignData = metrics.data.data?.total || [];
      console.log("Using 'all' campaigns data:", {
        path: "metrics.data.data.total",
        exists: Boolean(metrics.data.data?.total),
        length: metrics.data.data?.total?.length || 0,
      });
    } else {
      const campaign = findCampaign(selectedCampaign);
      campaignData = campaign?.hours || [];
      console.log("Using specific campaign data:", {
        campaignId: selectedCampaign,
        campaignExists: Boolean(campaign),
        hoursExists: Boolean(campaign?.hours),
        length: campaign?.hours?.length || 0,
      });
    }

    console.log("Campaign data for call volume:", {
      selectedCampaign,
      dataLength: campaignData?.length || 0,
      sampleData: campaignData?.[0],
    });

    if (!campaignData?.length) return [];

    const rawData = campaignData
      .filter((metric: Campaign["hours"][number]) => {
        const metricDate = new Date(metric.hour);
        return metricDate >= startUTC && metricDate <= endUTC;
      })
      .map((metric: Campaign["hours"][number]) => ({
        timestamp: new Date(metric.hour),
        hour: metric.hour,
        formattedHour: metric.hourFormatted,
        formattedDate: metric.dateFormatted,
        Inbound: Number(metric.inbound) || 0,
        Outbound: Number(metric.outbound) || 0,
      }));

    console.log("Raw call volume data after filtering:", {
      length: rawData.length,
      sample: rawData[0],
    });

    const result = aggregateTimeseriesData<CallVolumeDataPoint>(
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

    console.log("Final call volume data:", {
      length: result.length,
      sample: result[0],
    });

    return result;
  }, [date, metrics, selectedCampaign, isLoading]);

  const dispositionsData = useMemo(() => {
    if (isLoading || !metrics?.data) return [];

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

    console.log("Date range for filtering:", {
      from: startUTC.toISOString(),
      to: endUTC.toISOString(),
      fromOriginal: date?.from,
      toOriginal: date?.to,
    });

    let campaignData;
    if (selectedCampaign === "all") {
      campaignData = metrics.data.data?.total || [];
      console.log("Using 'all' campaigns data for dispositions:", {
        path: "metrics.data.data.total",
        exists: Boolean(metrics.data.data?.total),
        length: metrics.data.data?.total?.length || 0,
      });
    } else {
      const campaign = findCampaign(selectedCampaign);
      campaignData = campaign?.hours || [];
      console.log("Using specific campaign data for dispositions:", {
        campaignId: selectedCampaign,
        campaignExists: Boolean(campaign),
        hoursExists: Boolean(campaign?.hours),
        length: campaign?.hours?.length || 0,
      });
    }

    console.log("Campaign data for dispositions:", {
      selectedCampaign,
      dataLength: campaignData?.length || 0,
      sampleData: campaignData?.[0],
    });

    if (!campaignData?.length) return [];

    const rawData = campaignData
      .filter((metric: Campaign["hours"][number]) => {
        const metricDate = new Date(metric.hour);
        return metricDate >= startUTC && metricDate <= endUTC;
      })
      .map((metric: Campaign["hours"][number]) => ({
        timestamp: new Date(metric.hour),
        formattedHour: metric.hourFormatted,
        formattedDate: metric.dateFormatted,
        ...Object.entries(metric.dispositionCounts).reduce(
          (acc, [key, value]) => ({
            ...acc,
            [key]: Number(value) || 0,
          }),
          {},
        ),
      }));

    console.log("Raw dispositions data after filtering:", {
      length: rawData.length,
      sample: rawData[0],
      keys: rawData[0] ? Object.keys(rawData[0]) : [],
    });

    const result = aggregateTimeseriesData(
      rawData,
      { from: startUTC, to: endUTC },
      (points) => {
        // Aggregate all disposition counts
        const dispositions = points.reduce(
          (acc, point) => {
            Object.entries(point)
              .filter(
                ([key]) =>
                  key !== "timestamp" &&
                  key !== "formattedHour" &&
                  key !== "formattedDate",
              )
              .forEach(([key, value]) => {
                acc[key] = (acc[key] || 0) + Number(value);
              });
            return acc;
          },
          {} as Record<string, number>,
        );

        return {
          ...dispositions,
          formattedHour: points[0].formattedHour,
          formattedDate: points[0].formattedDate,
        };
      },
    );

    // Convert timestamp to string for the chart component after aggregation
    const finalResult = result.map((item) => ({
      ...item,
      timestamp: item.timestamp.toISOString(),
      weekEnd: item.weekEnd ? item.weekEnd.toISOString() : undefined,
    }));

    console.log("Final dispositions data:", {
      length: finalResult.length,
      sample: finalResult[0],
      keys: finalResult[0] ? Object.keys(finalResult[0]) : [],
    });

    return finalResult;
  }, [date, metrics, selectedCampaign, isLoading]);

  const handleDateChange = async (newDate: DateRange | undefined) => {
    if (newDate?.from && newDate?.to) {
      const from = new Date(newDate.from);
      const to = new Date(newDate.to);

      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        setDate(newDate);
      } else {
        console.error("Invalid date selection:", newDate);
      }
    }
  };

  // Add state for customers engaged
  const [customersEngaged, setCustomersEngaged] = useState({
    value: "0",
    change: "N/A",
    description: "",
    rawValue: 0, // Add a raw numeric value for internal use
  });

  // Add debug logging for customersEngaged state changes
  useEffect(() => {
    console.log("customersEngaged state changed:", customersEngaged);
  }, [customersEngaged]);

  // Consolidated effect to update customersEngaged
  useEffect(() => {
    let isMounted = true;
    // Clear previous state when date changes to prevent stale data
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

          // Log the date range being requested
          const daysDiff =
            Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) +
            1;
          console.log("Fetching unique callers for date range:", {
            from: from.toISOString(),
            to: to.toISOString(),
            daysDiff,
          });

          // Show loading state for large date ranges
          if (daysDiff > 14) {
            setCustomersEngaged({
              value: "Loading...",
              change: `Processing ${daysDiff} day range in chunks`,
              description: "This may take a moment",
              rawValue: 0,
            });
          }

          // Create a controller to abort the request if it takes too long
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s overall timeout

          console.log("Calling fetchUniqueCallers with:", {
            from: from.toISOString(),
            to: to.toISOString(),
          });

          const response = await fetchUniqueCallers(from, to);

          console.log("fetchUniqueCallers response:", {
            success: response.data.success,
            currentPeriod: response.data.data?.currentPeriod,
            previousPeriod: response.data.data?.previousPeriod,
            comparison: response.data.data?.comparison,
          });

          clearTimeout(timeoutId);

          if (!isMounted) return;

          if (response.data.success && response.data.data) {
            const { currentPeriod, previousPeriod, comparison } =
              response.data.data;

            // Ensure uniqueCallers is a proper number - parse it strictly
            // First convert to string, then remove any non-numeric characters, then parse as integer
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

            // Debug log to check the value before setting state
            console.log("Setting customersEngaged with value:", {
              rawValue: currentPeriod?.uniqueCallers,
              parsedValue: rawValue,
              formattedValue: rawValue.toLocaleString(),
              valueType: typeof currentPeriod?.uniqueCallers,
            });

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
          console.error("Error fetching unique callers:", error);

          // Handle timeout specifically
          if (error.code === "ECONNABORTED" || error.name === "AbortError") {
            // Get the date range values from the closure
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

    // Handle empty object case
    if (Object.keys(metrics.data.data.campaigns).length === 0) {
      // console.log('Empty campaigns object detected');
      return [];
    }

    // Ensure we have a valid campaigns structure
    if (
      !metrics.data.data.campaigns ||
      typeof metrics.data.data.campaigns !== "object"
    ) {
      console.error("Invalid campaigns data structure");
      return [];
    }

    // Convert campaigns to array if it's an object
    const campaignsArray = Array.isArray(metrics.data.data.campaigns)
      ? metrics.data.data.campaigns
      : Object.values(metrics.data.data.campaigns);

    // Validate the converted array
    if (!Array.isArray(campaignsArray)) {
      console.error("Failed to convert campaigns to array");
      return [];
    }

    console.log("campaignsArray after conversion:", {
      isArray: Array.isArray(campaignsArray),
      length: campaignsArray.length,
      sample: campaignsArray[0],
    });

    // Filter out any invalid campaign entries
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
      // Get all hours for this campaign
      const hours = campaign.hours || [];

      // Calculate total calls for current period
      const currentPeriodCalls = hours.reduce(
        (sum: number, hour: Campaign["hours"][number]) => {
          const hourDate = new Date(hour.hour);
          if (
            date?.from &&
            date?.to &&
            hourDate >= date.from &&
            hourDate <= date.to
          ) {
            return (
              sum + (Number(hour.inbound || 0) + Number(hour.outbound || 0))
            );
          }
          return sum;
        },
        0,
      );

      // Calculate previous period calls
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
        (sum: number, hour: Campaign["hours"][number]) => {
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
    if (selectedCampaign === "all") {
      campaignData = metrics.data.data.total;
    } else {
      const campaign = findCampaign(selectedCampaign);
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
    campaignData.forEach((metric: Campaign["hours"][number]) => {
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
  }, [date, metrics, selectedCampaign, isLoading]);

  const assistantCountData = useMemo(() => {
    if (isLoading || !metrics?.data) return [];

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

    let campaignData;
    if (selectedCampaign === "all") {
      campaignData = metrics.data.data?.total || [];
      console.log("Using 'all' campaigns data for assistant types:", {
        path: "metrics.data.data.total",
        exists: Boolean(metrics.data.data?.total),
        length: metrics.data.data?.total?.length || 0,
      });
    } else {
      const campaign = findCampaign(selectedCampaign);
      campaignData = campaign?.hours || [];
      console.log("Using specific campaign data for assistant types:", {
        campaignId: selectedCampaign,
        campaignExists: Boolean(campaign),
        hoursExists: Boolean(campaign?.hours),
        length: campaign?.hours?.length || 0,
      });
    }

    console.log("Campaign data for assistant types:", {
      selectedCampaign,
      dataLength: campaignData?.length || 0,
      sampleData: campaignData?.[0],
    });

    if (!campaignData?.length) return [];

    // Aggregate assistant type counts across the selected time period
    const typeCounts = campaignData
      .filter((metric: Campaign["hours"][number]) => {
        const metricDate = new Date(metric.hour);
        return metricDate >= startUTC && metricDate <= endUTC;
      })
      .reduce(
        (acc: Record<string, number>, hour: Campaign["hours"][number]) => {
          Object.entries(hour.assistantTypeCounts || {}).forEach(
            ([type, count]) => {
              acc[type] = (acc[type] || 0) + Number(count);
            },
          );
          return acc;
        },
        {},
      );

    console.log("Assistant type counts:", typeCounts);

    // Convert to array format and map to friendly names
    const result = Object.entries(typeCounts)
      .map(
        ([type, count]): AssistantCountDataPoint => ({
          name: assistantTypeLabels[type] || type,
          value: Number(count),
        }),
      )
      .sort((a, b) => b.value - a.value); // Sort by count descending

    console.log("Final assistant count data:", {
      length: result.length,
      sample: result[0],
    });

    return result;
  }, [date, metrics, selectedCampaign, isLoading]);

  return (
    <RootLayout topMetrics={getTopMetrics(todayMetrics)} hideKnowledgeSearch>
      <PageTransition>
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Dashboard
            </h1>
            <div className="flex gap-4">
              <CampaignSelect
                value={selectedCampaign}
                onValueChange={setSelectedCampaign}
                isLoading={isLoading || isMetricsLoading}
                campaigns={availableCampaigns}
              />
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
                data={assistantCountData}
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
              selectedCampaign === "all"
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
                      selectedCampaign,
                    )
                  ? selectedCampaign
                  : undefined
            }
          />
          <CallsByCampaign data={campaignMetrics || []} />
        </div>
      </PageTransition>
    </RootLayout>
  );
}
