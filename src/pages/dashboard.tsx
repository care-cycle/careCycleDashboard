import { useState, useMemo } from 'react'
import { DateRange } from 'react-day-picker'
import { RootLayout } from '@/components/layout/root-layout'
import { KPICard } from '@/components/metrics/kpi-card'
import { CallDispositionsChart } from '@/components/charts/call-dispositions-chart'
import { CallVolumeChart } from '@/components/charts/call-volume-chart'
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
  const { metrics, clientInfo, isLoading, todayMetrics, fetchUniqueCallers } = useInitialData();

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
      const campaign = metrics.data.campaigns?.find(c => c.type === selectedCampaign);
      campaignData = campaign?.hours;
    }

    if (!campaignData?.length) return [];

    const rawData = campaignData
      .filter(metric => {
        const metricDate = new Date(metric.hour);
        return metricDate >= startDate && metricDate <= endDate;
      })
      .map(metric => ({
        timestamp: new Date(metric.hour),
        formattedHour: metric.hourFormatted,
        formattedDate: metric.dateFormatted,
        Inbound: Number(metric.inbound) || 0,
        Outbound: Number(metric.outbound) || 0
      }));

    return aggregateTimeseriesData(
      rawData,
      date,
      (points) => ({
        Inbound: points.reduce((sum, p) => sum + p.Inbound, 0),
        Outbound: points.reduce((sum, p) => sum + p.Outbound, 0),
        formattedHour: points[0].formattedHour,
        formattedDate: points[0].formattedDate
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
      const campaign = metrics.data.campaigns?.find(c => c.type === selectedCampaign);
      campaignData = campaign?.hours;
    }

    if (!campaignData?.length) return [];

    const rawData = campaignData
      .filter(metric => {
        const metricDate = new Date(metric.hour);
        return metricDate >= startDate && metricDate <= endDate;
      })
      .map(metric => ({
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
      date,
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
        
        try {
          const response = await fetchUniqueCallers(from, to)

          if (response.data.success) {
            const { currentPeriod, previousPeriod, comparison } = response.data.data
            const daysDiff = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1

            setCustomersEngaged({
              value: currentPeriod.uniqueCallers.toLocaleString(),
              change: previousPeriod.uniqueCallers === 0 
                ? `No data for previous ${daysDiff} day${daysDiff === 1 ? '' : 's'}`
                : `${comparison.percentChange >= 0 ? '+' : ''}${comparison.percentChange.toFixed(1)}% change from previous ${daysDiff} day${daysDiff === 1 ? '' : 's'}`,
              description: `${format(new Date(response.data.metadata.timeRanges.previousPeriod.from), 'MMM d, yyyy')} - ${format(new Date(response.data.metadata.timeRanges.previousPeriod.to), 'MMM d, yyyy')}`
            })
          }
        } catch (error) {
          console.error('Error fetching unique callers:', error)
        }
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

  const campaignMetrics = useMemo(() => {
    if (isLoading || !metrics?.data?.campaigns) return [];
    
    // Convert campaigns to array if it's an object
    const campaignsArray = Array.isArray(metrics.data.campaigns) 
      ? metrics.data.campaigns
      : Object.values(metrics.data.campaigns);
      
    return campaignsArray.map(campaign => {
      // Get all hours for this campaign
      const hours = campaign.hours || [];
      
      // Calculate total calls for current period
      const currentPeriodCalls = hours.reduce((sum, hour) => {
        const hourDate = new Date(hour.hour);
        if (hourDate >= date?.from && hourDate <= date?.to) {
          return sum + (Number(hour.inbound || 0) + Number(hour.outbound || 0));
        }
        return sum;
      }, 0);

      // Calculate previous period calls
      const daysDiff = Math.ceil((date?.to?.getTime() - date?.from?.getTime()) / (1000 * 60 * 60 * 24));
      const previousFrom = new Date(date?.from?.getTime() - (daysDiff * 24 * 60 * 60 * 1000));
      const previousTo = new Date(date?.from?.getTime() - 1);
      
      const previousPeriodCalls = hours.reduce((sum, hour) => {
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
      const campaign = metrics.data.campaigns?.find(c => c.type === selectedCampaign);
      campaignData = campaign?.hours;
    }

    if (!campaignData?.length) return { value: "0", change: "N/A", description: "" };

    // Calculate current period duration
    const currentPeriodMs = campaignData
      .filter(metric => {
        const metricDate = new Date(metric.hour);
        return metricDate >= date?.from && metricDate <= date?.to;
      })
      .reduce((sum, metric) => sum + (Number(metric.totalMs) || 0), 0);

    // Calculate the duration of the selected period in days
    const daysDiff = Math.ceil((date?.to?.getTime() - date?.from?.getTime()) / (1000 * 60 * 60 * 24)) + 1; // +1 because range is inclusive
    
    // Calculate the previous period
    const previousFrom = new Date(date?.from?.getTime() - (daysDiff * 24 * 60 * 60 * 1000));
    const previousTo = new Date(date?.from?.getTime() - 1);
    
    const previousPeriodMs = campaignData
      .filter(metric => {
        const metricDate = new Date(metric.hour);
        return metricDate >= previousFrom && metricDate <= previousTo;
      })
      .reduce((sum, metric) => sum + (Number(metric.totalMs) || 0), 0);

    // Convert milliseconds to hours
    const currentHours = Math.round(currentPeriodMs / (1000 * 60 * 60));
    const previousHours = Math.round(previousPeriodMs / (1000 * 60 * 60));

    // If we have no previous data, just show the current hours
    if (previousHours === 0) {
      return {
        value: `${currentHours.toLocaleString()} hrs`,
        change: `No data for previous ${daysDiff} day${daysDiff === 1 ? '' : 's'}`,
        description: `${previousFrom.toLocaleDateString()} - ${previousTo.toLocaleDateString()}`
      };
    }

    // Calculate percentage change
    const percentChange = ((currentHours - previousHours) / previousHours * 100);
    return {
      value: `${currentHours.toLocaleString()} hrs`,
      change: `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(1)}% change from previous ${daysDiff} day${daysDiff === 1 ? '' : 's'}`,
      description: `${previousFrom.toLocaleDateString()} - ${previousTo.toLocaleDateString()}`
    };
  }, [date, metrics, selectedCampaign, isLoading]);

  const assistantCountData = useMemo(() => {
    if (isLoading || !metrics?.data) return [];

    let campaignData;
    if (selectedCampaign === 'all') {
      campaignData = metrics.data.total;
    } else {
      const campaign = metrics.data.campaigns?.find(c => c.type === selectedCampaign);
      campaignData = campaign?.hours;
    }

    if (!campaignData?.length) return [];

    // Aggregate assistant type counts across the selected time period
    const typeCounts = campaignData
      .filter(metric => {
        const metricDate = new Date(metric.hour);
        return metricDate >= date?.from && metricDate <= date?.to;
      })
      .reduce((acc, hour) => {
        Object.entries(hour.assistantTypeCounts || {}).forEach(([type, count]) => {
          acc[type] = (acc[type] || 0) + Number(count);
        });
        return acc;
      }, {} as Record<string, number>);

    // Convert to array format and map to friendly names
    return Object.entries(typeCounts)
      .map(([type, count]) => ({
        name: assistantTypeLabels[type] || type,
        value: count
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
                isLoading={isLoading}
                campaigns={clientInfo?.campaigns}
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

          {isLoading ? (
            <div className="grid gap-6 grid-cols-2">
              <Card className="glass-panel">
                <CardContent className="flex items-center justify-center h-[400px]">
                  <p>Loading...</p>
                </CardContent>
              </Card>
              <div className="space-y-6">
                <Card className="glass-panel">
                  <CardContent className="flex items-center justify-center h-[200px]">
                    <p>Loading...</p>
                  </CardContent>
                </Card>
                <Card className="glass-panel">
                  <CardContent className="flex items-center justify-center h-[200px]">
                    <p>Loading...</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            <>
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
                />
                <div className="space-y-6">
                  <AssistantCountChart data={assistantCountData} />
                  <CallVolumeChart 
                    data={callVolumeData} 
                    dateRange={date}
                  />
                </div>
              </div>
            </>
          )}

          <CallsByCampaign data={campaignMetrics || []} />
        </div>
      </PageTransition>
    </RootLayout>
  )
}