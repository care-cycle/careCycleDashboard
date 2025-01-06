import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import { format } from 'date-fns'

export function useInitialData() {
  const { data: clientInfo } = useQuery({
    queryKey: ['clientInfo'],
    queryFn: () => apiClient.get('/portal/client/info'),
    staleTime: Infinity,
    cacheTime: Infinity
  })

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => apiClient.get(`/portal/client/metrics/${clientInfo?.data?.id}`),
    staleTime: Infinity,
    cacheTime: Infinity
  })

  const { data: todayMetrics, isLoading: todayMetricsLoading } = useQuery({
    queryKey: ['todayMetrics'],
    queryFn: () => apiClient.get(`/portal/client/metrics/today/${clientInfo?.data?.id}`),
    enabled: !!clientInfo?.data?.id,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  })

  const fetchUniqueCallers = async (from: Date, to: Date) => {
    const fromStr = format(from, 'yyyy-MM-dd HH:mm:ss')
    const toStr = format(to, 'yyyy-MM-dd HH:mm:ss')
    
    return apiClient.get(`/portal/client/metrics/unique-callers/${clientInfo?.data?.id}`, {
      params: { from: fromStr, to: toStr }
    })
  }

  return {
    metrics: metrics?.data,
    clientInfo: clientInfo?.data,
    todayMetrics: todayMetrics?.data,
    isLoading: metricsLoading || todayMetricsLoading,
    fetchUniqueCallers
  }
} 