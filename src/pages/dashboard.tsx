import { useState, useMemo, useEffect } from 'react'
import { DateRange } from 'react-day-picker'
import { RootLayout } from '@/components/layout/root-layout'
import { KPICard } from '@/components/metrics/kpi-card'
import { CallDispositionsChart } from '@/components/charts/call-dispositions-chart'
import { CallVolumeChart } from '@/components/charts/call-volume-chart'
import { ContactRateChart } from '@/components/charts/contact-rate-chart'
import { DateRangePicker } from '@/components/date-range-picker'
import { CampaignSelect } from '@/components/campaign-select'
import { CallsByCampaign } from '@/components/metrics/calls-by-campaign'
import { PageTransition } from "@/components/layout/page-transition"
import { useInitialData } from '@/hooks/use-client-data'
import { Card, CardContent } from '@/components/ui/card'
import { aggregateTimeseriesData } from '@/lib/date-utils'
import { assistantTypeLabels } from '@/components/charts/assistant-count-chart'
import { AssistantCountChart } from '@/components/charts/assistant-count-chart'
import { format, subDays } from 'date-fns';
import { getTopMetrics } from '@/lib/metrics'
import { cn } from '@/lib/utils'

interface Campaign {
  id: string
  name: string
  type: string
  hours: Array<{
    hour: string
    hourFormatted: string
    dateFormatted: string
    inbound: number
    outbound: number
    uniqueCallers: number
    totalCustomers: number
    totalMs: number
    dispositionCounts: Record<string, number>
    assistantTypeCounts: Record<string, number>
  }>
}

interface MetricsData {
  total: Campaign['hours']
  campaigns?: Campaign[]
}

interface Metrics {
  data?: MetricsData
}

interface ClientInfo {
  id: string
  name: string
  internalName?: string
  campaigns?: Campaign[]
}

interface TimeseriesDataPoint {
  timestamp: Date
  hour: string
  formattedHour: string
  formattedDate: string
  [key: string]: any
}

interface CallVolumeDataPoint extends TimeseriesDataPoint {
  Inbound: number
  Outbound: number
}

interface ContactRateDataPoint extends TimeseriesDataPoint {
  totalCalls: number
  uniqueCallers: number
  totalCustomers: number
  dispositionCounts: Record<string, number>
}

interface AssistantCountDataPoint {
  name: string
  value: number
}

interface AssistantTypeLabels {
  [key: string]: string
}

export default function Dashboard() {
  const today = new Date()
  const yesterday = subDays(today, 1)
  const [date, setDate] = useState<DateRange | undefined>(() => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    return {
      from: yesterday,
      to: today
    };
  });
  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const { metrics, clientInfo, isLoading, isMetricsLoading, todayMetrics, fetchUniqueCallers } = useInitialData();

  const callVolumeData = useMemo(() => {
    if (isLoading || !metrics?.data) return [];
    
    const startDate = new Date(date?.from || new Date());
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date?.to || new Date());
    endDate.setHours(23, 59, 59, 999);

    let campaignData;
    if (selectedCampaign === 'all') {
      campaignData = metrics.data.total;
    } else {
      const campaign = metrics.data.campaigns?.find((c: Campaign) => c.id === selectedCampaign);
      campaignData = campaign?.hours;
    }

    if (!campaignData?.length) return [];

    const rawData = campaignData
      .filter((metric: Campaign['hours'][number]) => {
        const metricDate = new Date(metric.hour);
        return date?.from && date?.to && metricDate >= date.from && metricDate <= date.to;
      })
      .map((metric: Campaign['hours'][number]) => ({
        timestamp: new Date(metric.hour),
        hour: metric.hour,
        formattedHour: metric.hourFormatted,
        formattedDate: metric.dateFormatted,
        Inbound: Number(metric.inbound) || 0,
        Outbound: Number(metric.outbound) || 0
      }));

    return aggregateTimeseriesData<CallVolumeDataPoint>(
      rawData,
      { from: date?.from || new Date(), to: date?.to || new Date() },
      (points) => ({
        timestamp: points[0].timestamp,
        hour: points[0].hour,
        formattedHour: points[0].formattedHour,
        formattedDate: points[0].formattedDate,
        Inbound: points.reduce((sum, p) => sum + p.Inbound, 0),
        Outbound: points.reduce((sum, p) => sum + p.Outbound, 0)
      })
    );
  }, [date, metrics, selectedCampaign, isLoading]);

  const dispositionsData = useMemo(() => {
    if (isLoading || !metrics?.data) return [];

    const startDate = new Date(date?.from || new Date());
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(date?.to || new Date());
    endDate.setHours(23, 59, 59, 999);

    let campaignData;
    if (selectedCampaign === 'all') {
      campaignData = metrics.data.total;
    } else {
      const campaign = metrics.data.campaigns?.find((c: Campaign) => c.id === selectedCampaign);
      campaignData = campaign?.hours;
    }

    if (!campaignData?.length) return [];

    const rawData = campaignData
      .filter((metric: Campaign['hours'][number]) => {
        const metricDate = new Date(metric.hour);
        return metricDate >= startDate && metricDate <= endDate;
      })
      .map((metric: Campaign['hours'][number]) => ({
        timestamp: new Date(metric.hour),
        formattedHour: metric.hourFormatted,
        formattedDate: metric.dateFormatted,
        ...Object.entries(metric.dispositionCounts).reduce((acc, [key, value]) => ({
          ...acc,
          [key]: Number(value) || 0
        }), {})
      }));

    return aggregateTimeseriesData(
      rawData,
      { from: date?.from || new Date(), to: date?.to || new Date() },
      (points) => {
        // Aggregate all disposition counts
        const dispositions = points.reduce((acc, point) => {
          Object.entries(point)
            .filter(([key]) => key !== 'timestamp' && key !== 'formattedHour' && key !== 'formattedDate')
            .forEach(([key, value]) => {
              acc[key] = (acc[key] || 0) + Number(value);
            });
          return acc;
        }, {} as Record<string, number>);

        return {
          ...dispositions,
          formattedHour: points[0].formattedHour,
          formattedDate: points[0].formattedDate
        };
      }
    );
  }, [date, metrics, selectedCampaign, isLoading]);

  const handleDateChange = async (newDate: DateRange | undefined) => {
    if (newDate?.from && newDate?.to) {
      const from = new Date(newDate.from)
      const to = new Date(newDate.to)
      
      if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
        setDate(newDate)
      } else {
        console.error('Invalid date selection:', newDate)
      }
    }
  }

  // Add state for customers engaged
  const [customersEngaged, setCustomersEngaged] = useState({
    value: "0",
    change: "N/A",
    description: ""
  });

  // Consolidated effect to update customersEngaged
  useEffect(() => {
    let isMounted = true;

    if (date?.from && date?.to && !isLoading) {
      const fetchCustomerData = async () => {
        try {
          const from = new Date(date.from!);
          const to = new Date(date.to!);
          const response = await fetchUniqueCallers(from, to);
          
          if (!isMounted) return;

          if (response.data.success && response.data.data) {
            const { currentPeriod, previousPeriod, comparison } = response.data.data;
            const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;

            setCustomersEngaged({
              value: (currentPeriod?.uniqueCallers ?? 0).toLocaleString(),
              change: !previousPeriod?.uniqueCallers 
                ? `No data for previous ${daysDiff} day${daysDiff === 1 ? '' : 's'}`
                : `${comparison?.percentChange >= 0 ? '+' : ''}${comparison?.percentChange?.toFixed(1) ?? 0}% change from previous ${daysDiff} day${daysDiff === 1 ? '' : 's'}`,
              description: response.data.metadata?.timeRanges?.previousPeriod 
                ? `${format(new Date(response.data.metadata.timeRanges.previousPeriod.from), 'MMM d, yyyy')} - ${format(new Date(response.data.metadata.timeRanges.previousPeriod.to), 'MMM d, yyyy')}`
                : ''
            });
          } else {
            setCustomersEngaged({
              value: "0",
              change: "No data available",
              description: ""
            });
          }
        } catch (error) {
          console.error('Error fetching unique callers:', error);
          setCustomersEngaged({
            value: "0",
            change: "Error loading data",
            description: ""
          });
        }
      };

      fetchCustomerData();
    }

    return () => {
      isMounted = false;
    };
  }, [date?.from, date?.to]);

  const campaignMetrics = useMemo(() => {
    if (isLoading || !metrics?.data?.campaigns) return [];
    
    // Convert campaigns to array if it's an object
    const campaignsArray = Array.isArray(metrics.data.campaigns) 
      ? metrics.data.campaigns
      : Object.values(metrics.data.campaigns);
      
    return campaignsArray.map((campaign: Campaign) => {
      // Get all hours for this campaign
      const hours = campaign.hours || [];
      
      // Calculate total calls for current period
      const currentPeriodCalls = hours.reduce((sum: number, hour: Campaign['hours'][number]) => {
        const hourDate = new Date(hour.hour);
        if (date?.from && date?.to && hourDate >= date.from && hourDate <= date.to) {
          return sum + (Number(hour.inbound || 0) + Number(hour.outbound || 0));
        }
        return sum;
      }, 0);

      // Calculate previous period calls
      const daysDiff = date?.from && date?.to 
        ? Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
      const previousFrom = date?.from 
        ? new Date(date.from.getTime() - (daysDiff * 24 * 60 * 60 * 1000))
        : new Date();
      const previousTo = date?.from 
        ? new Date(date.from.getTime() - 1)
        : new Date();
      
      const previousPeriodCalls = hours.reduce((sum: number, hour: Campaign['hours'][number]) => {
        const hourDate = new Date(hour.hour);
        if (hourDate >= previousFrom && hourDate <= previousTo) {
          return sum + (Number(hour.inbound || 0) + Number(hour.outbound || 0));
        }
        return sum;
      }, 0);

      return {
        name: campaign.name,
        calls: currentPeriodCalls,
        trend: currentPeriodCalls >= previousPeriodCalls ? "up" : "down"
      };
    });
  }, [metrics, date, isLoading]);


  const totalDuration = useMemo(() => {
    if (isLoading || !metrics?.data) return { value: "0", change: "N/A", description: "" };

    let campaignData;
    if (selectedCampaign === 'all') {
      campaignData = metrics.data.total;
    } else {
      const campaign = metrics.data.campaigns?.find((c: Campaign) => c.id === selectedCampaign);
      campaignData = campaign?.hours;
    }

    if (!campaignData?.length) return { value: "0", change: "N/A", description: "" };

    const rawData = campaignData
      .filter((metric: Campaign['hours'][number]) => {
        const metricDate = new Date(metric.hour);
        return date?.from && date?.to && metricDate >= date.from && metricDate <= date.to;
      })
      .map((metric: Campaign['hours'][number]) => ({
        hour: metric.hour,
        formattedHour: metric.hourFormatted,
        formattedDate: metric.dateFormatted,
        totalMs: Number(metric.totalMs || 0)
      }));

    const aggregatedData = aggregateTimeseriesData(
      rawData,
      { from: date?.from || new Date(), to: date?.to || new Date() },
      (points) => ({
        hour: points[0].hour,
        formattedHour: points[0].formattedHour,
        formattedDate: points[0].formattedDate,
        totalMs: points.reduce((sum, point) => sum + point.totalMs, 0)
      })
    );

    // Convert milliseconds to hours
    const totalHours = Math.round(aggregatedData[0]?.totalMs / (1000 * 60 * 60)) || 0;

    return {
      value: `${totalHours.toLocaleString()} hrs`,
      change: "N/A",
      description: ""
    };
  }, [date, metrics, selectedCampaign, isLoading]);

  const assistantCountData = useMemo(() => {
    if (isLoading || !metrics?.data) return [];

    let campaignData;
    if (selectedCampaign === 'all') {
      campaignData = metrics.data.total;
    } else {
      const campaign = metrics.data.campaigns?.find((c: Campaign) => c.id === selectedCampaign);
      campaignData = campaign?.hours;
    }

    if (!campaignData?.length) return [];

    // Aggregate assistant type counts across the selected time period
    const typeCounts = campaignData
      .filter((metric: Campaign['hours'][number]) => {
        const metricDate = new Date(metric.hour);
        return date?.from && date?.to && metricDate >= date.from && metricDate <= date.to;
      })
      .reduce((acc: Record<string, number>, hour: Campaign['hours'][number]) => {
        Object.entries(hour.assistantTypeCounts || {}).forEach(([type, count]) => {
          acc[type] = (acc[type] || 0) + Number(count);
        });
        return acc;
      }, {});

    // Convert to array format and map to friendly names
    return Object.entries(typeCounts)
      .map(([type, count]): AssistantCountDataPoint => ({
        name: assistantTypeLabels[type] || type,
        value: Number(count)
      }))
      .sort((a, b) => b.value - a.value); // Sort by count descending
  }, [date, metrics, selectedCampaign, isLoading]);

  return (
    <RootLayout topMetrics={getTopMetrics(todayMetrics)} hideKnowledgeSearch>
      <PageTransition>
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
            <div className="flex gap-4">
              <CampaignSelect
                value={selectedCampaign}
                onValueChange={setSelectedCampaign}
                isLoading={isLoading || isMetricsLoading}
                campaigns={metrics?.data?.campaigns?.map((c: Campaign) => ({
                  id: c.id,
                  name: c.name
                })) || []}
              />
              <DateRangePicker 
                date={date} 
                onChange={handleDateChange} 
                className="w-[260px]"
                defaultDate={{
                  from: yesterday,
                  to: today
                }}
                minDate={metrics?.data?.total?.[0]?.hour 
                  ? new Date(metrics.data.total[0].hour) 
                  : undefined}
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <KPICard
              title="Customers Engaged"
              value={customersEngaged.value}
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
            campaignId={selectedCampaign === 'all' ? metrics?.data?.campaigns?.[0]?.id : metrics?.data?.campaigns?.find((c: Campaign) => c.id === selectedCampaign)?.id}
          />
          <CallsByCampaign data={campaignMetrics || []} />
        </div>
      </PageTransition>
    </RootLayout>
  )
}