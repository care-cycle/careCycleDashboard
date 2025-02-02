import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/lib/api-client'
import { format } from 'date-fns'
import { useAuth } from '@clerk/clerk-react'
import { useCallback } from 'react'

interface CallsResponse {
  s: boolean;          
  d: {                 
    c: Array<{         
      i: string;       
      cid: string;     
      d: string;       
      ca: string;      
      cr: string;      
      r: string;       
      du: string;      
      at: string;      
      se: string;      
      su: string;      
      tr: string;      
      di: 'i' | 'o';   
      co: number;      
      tf: boolean;     
    }>;
  };
}

interface Customer {
  id: string;
  client_id: string;
  caller_id: string;
  first_name: string;
  last_name: string;
  email: string;
  total_calls: number;
  last_call_date: string;
  active_campaigns: number;
}

interface CustomersResponse {
  customers: Customer[];
  total: number;
}

interface CustomerStats {
  total: number;
  passed: number;
  failed: number;
  pending: number;
  remainingToCall: number;
}

interface Campaign {
  campaignName: string;
  campaignType: string;
  campaignDescription: string;
  campaignStatus: string;
  customerStats: CustomerStats;
}

interface CampaignsResponse {
  [key: string]: Campaign;
}

interface ClientInfo {
  id: string;
  name: string;
  email?: string;
  pricePerCallMs: string;
  pricePerSms: string;
  availableBalance: string;
  totalCallSpend: string;
  totalSmsSpend: string;
  topUpThreshold?: string;
  topUpAmount?: string;
  enableTopUp: boolean;
  associatedNumbers?: string[];
  customDataSchema?: Record<string, unknown>;
  createdAt: string;
  businessHours: Array<{
    dayOfWeek: number[]
    startHour: number
    endHour: number
    timezone: string
  }>;
  specialHours: Array<{
    type: 'special' | 'dateRange' | 'recurring'
    name: string
    date?: string
    startDate?: string
    endDate?: string
    recurrence?: 'weekly' | 'monthly' | 'yearly'
    dayOfMonth?: number
    dayOfWeek?: number[]
    hours: Array<{
      startHour: number
      endHour: number
    }>
  }>;
  holidayGroups: Array<{
    id: string
    name: string
    description?: string
    holidays: Array<{
      id: string
      name: string
      description?: string
      type: 'fixed' | 'floating' | 'custom'
      month?: number
      dayOfMonth?: number
      floatingRule?: {
        weekOfMonth: number
        dayOfWeek: number
        month: number
      }
      modifiedHours: null | Array<{
        startHour: number
        endHour: number
      }>
    }>
  }>;
  timezone: string;
  organizationId: string | null;
  isPersonal: boolean;
  default_payment_method: any | null;
}

export function useInitialData() {
  const { isLoaded, isSignedIn } = useAuth()

  // Essential metrics for header - high priority
  const { data: todayMetrics, isLoading: todayMetricsLoading } = useQuery({
    queryKey: ['todayMetrics'],
    queryFn: () => apiClient.get('/portal/client/metrics/today'),
    enabled: isLoaded && isSignedIn,
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000, // Cache for 4 minutes
  })

  // Client info - high priority
  const { data: clientInfo, isLoading: clientInfoLoading } = useQuery<ClientInfo>({
    queryKey: ['clientInfo'],
    queryFn: async () => {
      const response = await apiClient.get('/portal/client/info')
      return response.data
    },
    enabled: isLoaded && isSignedIn,
  })

  // Historical metrics - lower priority
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics'],
    queryFn: () => apiClient.get('/portal/client/metrics'),
    staleTime: 5 * 60 * 1000,
    enabled: isLoaded && isSignedIn,
  })

  // Calls data - lowest priority
  const { data: calls, isLoading: callsLoading, error: callsError } = useQuery({
    queryKey: ['calls'],
    queryFn: async () => {
      const response = await apiClient.get<CallsResponse>('/portal/client/calls');
      return response;
    },
    enabled: isLoaded && isSignedIn,
    // Add pagination to reduce initial load
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
    retry: 1, // Reduce retry attempts
  })

  // Customers data - lowest priority
  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['customers'],
    queryFn: () => apiClient.get<CustomersResponse>('/portal/client/customers/base'),
    enabled: isLoaded && isSignedIn,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const { data: campaigns, isLoading: isCampaignsLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => apiClient.get<CampaignsResponse>('/portal/client/campaigns'),
    staleTime: 5 * 60 * 1000,
    enabled: isLoaded && isSignedIn,
    retry: 1,
  });

  const fetchUniqueCallers = useCallback(async (from: Date, to: Date) => {
    const fromStr = format(from, 'yyyy-MM-dd HH:mm:ss')
    const toStr = format(to, 'yyyy-MM-dd HH:mm:ss')
    
    return apiClient.get('/portal/client/metrics/unique-callers', {
      params: { from: fromStr, to: toStr }
    })
  }, []); // No dependencies needed as apiClient and format are stable

  const isLoading = !isLoaded || todayMetricsLoading || clientInfoLoading;

  return {
    metrics: metrics?.data,
    clientInfo,
    calls,
    callsError,
    todayMetrics: todayMetrics?.data,
    // Split loading states by priority
    isHeaderLoading: !isLoaded || todayMetricsLoading || clientInfoLoading,
    isMetricsLoading: metricsLoading,
    isCallsLoading: callsLoading,
    fetchUniqueCallers,
    customers: customers?.data,
    isCustomersLoading: customersLoading,
    campaigns,
    isLoading,
  }
}

export function useClientData() {
  const queryClient = useQueryClient()

  const { data: clientInfo, isLoading } = useQuery<ClientInfo>({
    queryKey: ['clientInfo'],
    queryFn: async () => {
      const response = await apiClient.get('/portal/client/info')
      return response.data
    }
  })

  const mutation = useMutation({
    mutationFn: async (data: Partial<ClientInfo>) => {
      let endpoint = '/portal/client/info'
      
      // Use specific endpoints for different types of updates
      if ('businessHours' in data) {
        endpoint = '/portal/client/operating-hours'
      } else if ('specialHours' in data) {
        endpoint = '/portal/client/special-hours'
      } else if ('holidayGroups' in data) {
        endpoint = '/portal/client/holiday-groups'
      }

      const response = await apiClient.put(endpoint, data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientInfo'] })
    }
  })

  const mutate = async (data: Partial<ClientInfo>) => {
    await mutation.mutateAsync(data)
  }

  return {
    clientInfo,
    isLoading,
    mutate
  }
} 
