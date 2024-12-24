import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'

export function useInitialData() {
  const { data: clientInfo } = useQuery({
    queryKey: ['clientInfo'],
    queryFn: () => apiClient.get('/portal/client/info'),
    staleTime: Infinity,
    cacheTime: Infinity
  })

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => apiClient.get('/portal/client/metrics/8d2ab588-f852-4792-8de8-3510d9ff7f92'),
    staleTime: Infinity,
    cacheTime: Infinity
  })

  const { data: todayMetrics, isLoading: todayMetricsLoading } = useQuery({
    queryKey: ['todayMetrics'],
    queryFn: () => apiClient.get(`/portal/client/metrics/today/${clientInfo?.data?.id}`),
    enabled: !!clientInfo?.data?.id,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  return {
    metrics: metrics?.data,
    clientInfo: clientInfo?.data,
    todayMetrics: todayMetrics?.data,
    isLoading: metricsLoading || todayMetricsLoading
  }
} 