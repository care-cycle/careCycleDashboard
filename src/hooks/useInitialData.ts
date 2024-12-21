import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'

export function useInitialData() {
  const { data: clientInfo } = useQuery({
    queryKey: ['clientInfo'],
    queryFn: () => apiClient.get('/portal/client/info'),
    staleTime: Infinity,
    cacheTime: Infinity
  })

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => apiClient.get('/portal/client/metrics/8d2ab588-f852-4792-8de8-3510d9ff7f92'),
    staleTime: Infinity,
    cacheTime: Infinity
  })

  return {
    metrics: metrics?.data,
    clientInfo: clientInfo?.data,
    isLoading
  }
} 