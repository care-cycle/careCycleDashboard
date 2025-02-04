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

interface Appointment {
  id: string
  customerId: string
  firstName: string | null
  lastName: string | null
  timezone: string | null
  state: string | null
  postalCode: string | null
  appointmentDateTime: string
  campaignId: string
  campaignName: string
  callerId: string | null
}

interface AppointmentsResponse {
  results: Appointment[]
  requestId: string
}

export function useInitialData() {
  const { isLoaded, isSignedIn } = useAuth()
  const enabled = isLoaded && isSignedIn

  // Group all queries together to maintain consistent hook order
  const queries = {
    todayMetrics: useQuery({
      queryKey: ['todayMetrics'],
      queryFn: () => apiClient.get('/portal/client/metrics/today'),
      enabled,
      refetchInterval: 5 * 60 * 1000,
      staleTime: 4 * 60 * 1000,
    }),

    clientInfo: useQuery<ClientInfo>({
      queryKey: ['clientInfo'],
      queryFn: async () => {
        const response = await apiClient.get('/portal/client/info')
        return response.data
      },
      enabled,
    }),

    metrics: useQuery({
      queryKey: ['metrics'],
      queryFn: () => apiClient.get('/portal/client/metrics'),
      staleTime: 5 * 60 * 1000,
      enabled,
    }),

    calls: useQuery({
      queryKey: ['calls'],
      queryFn: async () => {
        const response = await apiClient.get<CallsResponse>('/portal/client/calls')
        return response
      },
      enabled,
      select: (response) => {
        if (!response?.data?.d?.c) {
          return { data: [] }
        }

        const transformedData = {
          data: response.data.d.c.map((call: {
            i: string
            cid: string
            d: string
            ca: string
            cr: string
            r: string
            du: string
            at: string
            se: string
            su: string
            tr: string
            di: 'i' | 'o'
            co: number
            tf: boolean
          }) => ({
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
        }
        
        return transformedData
      },
      staleTime: 5 * 60 * 1000,
      retry: 1,
    }),

    customers: useQuery({
      queryKey: ['customers'],
      queryFn: () => apiClient.get<CustomersResponse>('/portal/client/customers/base'),
      enabled,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    }),

    campaigns: useQuery({
      queryKey: ['campaigns'],
      queryFn: () => apiClient.get<CampaignsResponse>('/portal/client/campaigns'),
      staleTime: 5 * 60 * 1000,
      enabled,
      retry: 1,
    }),

    appointments: useQuery({
      queryKey: ['appointments'],
      queryFn: async () => {
        const response = await apiClient.get<AppointmentsResponse>(
          '/portal/client/customers/appointments'
        )
        return response.data
      },
      enabled,
      staleTime: 5 * 60 * 1000, // Cache for 5 minutes
      gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }),
  }

  const fetchUniqueCallers = useCallback(async (from: Date, to: Date) => {
    const fromStr = format(from, 'yyyy-MM-dd HH:mm:ss')
    const toStr = format(to, 'yyyy-MM-dd HH:mm:ss')
    
    return apiClient.get('/portal/client/metrics/unique-callers', {
      params: { from: fromStr, to: toStr }
    })
  }, [])

  const isLoading = !isLoaded || queries.todayMetrics.isLoading || queries.clientInfo.isLoading

  return {
    metrics: queries.metrics.data?.data,
    clientInfo: queries.clientInfo.data,
    calls: queries.calls.data,
    callsError: queries.calls.error,
    todayMetrics: queries.todayMetrics.data?.data,
    appointments: queries.appointments.data?.results ?? [],
    isHeaderLoading: !isLoaded || queries.todayMetrics.isLoading || queries.clientInfo.isLoading,
    isMetricsLoading: queries.metrics.isLoading,
    isCallsLoading: queries.calls.isLoading,
    isAppointmentsLoading: queries.appointments.isLoading,
    fetchUniqueCallers,
    customers: queries.customers.data?.data,
    isCustomersLoading: queries.customers.isLoading,
    campaigns: queries.campaigns.data,
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

  const fetchAppointments = useCallback(async () => {
    const response = await apiClient.get<AppointmentsResponse>(
      '/portal/client/customers/appointments'
    )
    return response.data.results
  }, [])

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
    mutate,
    fetchAppointments
  }
} 
