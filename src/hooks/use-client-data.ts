import { useQuery } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import { format } from 'date-fns'
import { useAuth } from '@clerk/clerk-react'

interface CallsResponse {
  s: boolean;          // success
  d: {                 // data
    c: Array<{         // calls
      i: string;       // id
      cid: string;     // campaignId 
      d: string;       // disposition
      ca: string;      // callerId
      cr: string;      // createdAt
      r: string;       // recordingUrl
      du: string;      // duration
      at: string;      // assistantType
      se: string;      // successEvaluation
      su: string;      // summary
      tr: string;      // transcript
      di: 'i' | 'o';   // direction (inbound/outbound)
      co: number;      // cost
      tf: boolean;     // testFlag
    }>;
  };
}

export function useInitialData() {
  const { isLoaded, isSignedIn } = useAuth()

  // Client Info Query - Primary query
  const { data: clientInfo, isLoading: clientInfoLoading } = useQuery({
    queryKey: ['clientInfo'],
    queryFn: () => apiClient.get('/portal/client/info'),
    staleTime: Infinity,
    cacheTime: Infinity,
    enabled: isLoaded && isSignedIn,
  })

  const clientId = clientInfo?.data?.id

  // Metrics Query - Depends on clientInfo
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics', clientId],
    queryFn: () => apiClient.get(`/portal/client/metrics/${clientId}`),
    enabled: !!clientId && isLoaded && isSignedIn,
    staleTime: Infinity,
    cacheTime: Infinity
  })

  // Today's Metrics Query - Depends on clientInfo
  const { data: todayMetrics, isLoading: todayMetricsLoading } = useQuery({
    queryKey: ['todayMetrics', clientId],
    queryFn: () => apiClient.get(`/portal/client/metrics/today/${clientId}`),
    enabled: !!clientId && isLoaded && isSignedIn,
    refetchInterval: 5 * 60 * 1000
  })

  const fetchUniqueCallers = async (from: Date, to: Date) => {
    const fromStr = format(from, 'yyyy-MM-dd HH:mm:ss')
    const toStr = format(to, 'yyyy-MM-dd HH:mm:ss')
    
    return apiClient.get(`/portal/client/metrics/unique-callers/${clientInfo?.data?.id}`, {
      params: { from: fromStr, to: toStr }
    })
  }

  // Calls Query - Depends on clientInfo
  const { data: calls, error: callsError } = useQuery({
    queryKey: ['calls', clientId],
    queryFn: async () => {
      const response = await apiClient.get<CallsResponse>(`/portal/client/calls/${clientId}`);
      return response;
    },
    enabled: !!clientId,
    select: (response) => {
      if (!response?.data?.d?.c) {
        return { data: [] };
      }

      const transformedData = {
        data: response.data.d.c.map(call => ({
          id: call.i,
          campaignId: call.cid,
          disposition: call.d,
          callerId: call.ca,
          createdAt: call.cr,
          recordingUrl: call.r,
          duration: call.du,
          assistantType: call.at,
          successEvaluation: call.se,
          summary: call.su,
          transcript: call.tr,
          direction: call.di === 'i' ? 'inbound' : 'outbound',
          cost: call.co,
          testFlag: call.tf
        }))
      };
      
      return transformedData;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
    onError: (error) => {
      console.error('Error in calls query:', error);
    }
  })

  return {
    metrics: metrics?.data,
    clientInfo: clientInfo?.data,
    calls,
    callsError,
    todayMetrics: todayMetrics?.data,
    isLoading: !isLoaded || clientInfoLoading || metricsLoading || todayMetricsLoading,
    fetchUniqueCallers
  }
} 
