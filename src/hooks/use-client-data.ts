import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { format } from "date-fns";
import { useAuth } from "@/providers/auth";
import { useCallback, useEffect } from "react";

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
      di: "i" | "o";
      co: number;
      tf: boolean;
      s?: string | null;
      ts?: string | null; // twilioSid
      nr?: string | null; // nodableRecordingUrl
      sr?: string | null; // stereoRecordingUrl
    }>;
    hasSourceTracking: boolean;
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
  dataFields: string[];
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

interface PaymentMethod {
  last4: string;
  expMonth: number;
  expYear: number;
  brand: string;
}

export interface ClientInfo {
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
  createdAt: string;
  businessHours: Array<{
    dayOfWeek: number[];
    startHour: number;
    endHour: number;
    timezone: string;
  }>;
  specialHours: Array<{
    type: "special" | "dateRange" | "recurring";
    name: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    recurrence?: "weekly" | "monthly" | "yearly";
    dayOfMonth?: number;
    dayOfWeek?: number[];
    hours: Array<{
      startHour: number;
      endHour: number;
    }>;
  }>;
  holidayGroups: Array<{
    id: string;
    name: string;
    description?: string;
    holidays: Array<{
      id: string;
      name: string;
      description?: string;
      type: "fixed" | "floating" | "custom";
      month?: number;
      dayOfMonth?: number;
      floatingRule?: {
        weekOfMonth: number;
        dayOfWeek: number;
        month: number;
      };
      modifiedHours: null | Array<{
        startHour: number;
        endHour: number;
      }>;
    }>;
  }>;
  timezone: string;
  organizationId: string | null;
  isPersonal: boolean;
  default_payment_method: PaymentMethod | null;
  campaigns?: Array<{
    id: string;
    name: string;
    type: string;
    description?: string;
    status: string;
  }>;
  user?: {
    id: string;
    role: string;
  };
}

export interface Appointment {
  id: string;
  customerId: string;
  firstName: string | null;
  lastName: string | null;
  timezone: string | null;
  state: string | null;
  postalCode: string | null;
  appointmentDateTime: string;
  appointmentAttended: boolean;
  campaignId: string;
  campaignName: string;
  callerId: string | null;
  appointmentType: string | null;
}

interface AppointmentsResponse {
  results: Appointment[];
  requestId: string;
}

interface ContactRateDataPoint {
  hour: string;
  formattedHour: string;
  formattedDate: string;
  totalCalls: number;
  uniqueCallers: number;
  totalCustomers: number;
  dispositionCounts: Record<string, number>;
}

interface ContactRateResponse {
  success: boolean;
  data: ContactRateDataPoint[];
  metadata: {
    timezone: string;
    timeRange: {
      from: string;
      to: string;
    };
    totalCustomers: number;
  };
}

interface TransformedCallsData {
  data: Array<{
    id: string;
    campaignId: string;
    disposition: string;
    callerId: string;
    createdAt: string;
    recordingUrl: string;
    duration: string;
    assistantType: string;
    successEvaluation: string;
    summary: string;
    transcript: string;
    direction: "inbound" | "outbound";
    cost: number;
    testFlag: boolean;
    source: string | null;
  }>;
  hasSourceTracking: boolean;
}

interface Inquiry {
  id: string;
  customerCampaignId: string;
  callId: string;
  inquiry: string;
  response?: string;
  status:
    | "new"
    | "pending_resolution"
    | "unresolved"
    | "resolved"
    | "appointment_scheduled";
  category?: string;
  severity?: string;
  resolutionType?: "carecycle" | "manual";
  notes?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
  carrierName?: string;
  planName?: string;
  agentName?: string;
  firstName?: string;
  lastName?: string;
  callerId?: string;
}

interface InquiriesResponse {
  success: boolean;
  data: Inquiry[];
}

interface SMSResponse {
  data: Array<{
    id: string;
    clientId: string;
    campaignId: string | null;
    fromNumber: string;
    toNumber: string;
    direction: "inbound" | "outbound";
    tellsSmsId: string | null;
    smsType: string | null;
    smsCost: number;
    content: string | null;
    sentAt: string | null;
    createdAt: string;
    updatedAt: string;
    campaign?: {
      id: string;
      name: string;
      type: string;
      status: string;
    } | null;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface CallData {
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
  di: "i" | "o";
  co: number;
  tf: boolean;
  s?: string | null;
  ts?: string | null; // twilioSid
  nr?: string | null; // nodableRecordingUrl
  sr?: string | null; // stereoRecordingUrl
}

export function useInitialData() {
  const { isLoaded, isSignedIn } = useAuth();
  const enabled = isLoaded && isSignedIn;
  const queryClient = useQueryClient();

  // Add event listener for campaign updates
  useEffect(() => {
    const handleCampaignsUpdate = (event: CustomEvent<Campaign[]>) => {
      queryClient.setQueryData(["campaigns"], event.detail);
    };

    window.addEventListener(
      "campaignsUpdated",
      handleCampaignsUpdate as EventListener,
    );
    return () => {
      window.removeEventListener(
        "campaignsUpdated",
        handleCampaignsUpdate as EventListener,
      );
    };
  }, [queryClient]);

  // Group all queries together to maintain consistent hook order
  const queries = {
    todayMetrics: useQuery({
      queryKey: ["todayMetrics"],
      queryFn: async () => {
        const response = await apiClient.get("/portal/client/metrics/today");
        return response.data;
      },
      enabled,
      refetchInterval: 5 * 60 * 1000,
      staleTime: 4 * 60 * 1000,
    }),

    clientInfo: useQuery<ClientInfo>({
      queryKey: ["clientInfo"],
      queryFn: async () => {
        const response = await apiClient.get("/portal/client/info");
        return response.data;
      },
      enabled,
    }),

    metrics: useQuery({
      queryKey: ["metrics"],
      queryFn: () => apiClient.get("/portal/client/metrics"),
      staleTime: 5 * 60 * 1000,
      enabled,
    }),

    calls: useQuery({
      queryKey: ["calls"],
      queryFn: async () => {
        const response = await apiClient.get<CallsResponse>(
          "/portal/client/calls",
        );
        return response;
      },
      enabled,
      select: (response): TransformedCallsData => {
        if (!response?.data?.d?.c) {
          return {
            data: [],
            hasSourceTracking: false,
          };
        }

        return {
          data: response.data.d.c.map((call: CallData) => ({
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
            direction: call.di === "i" ? "inbound" : "outbound",
            cost: call.co,
            testFlag: call.tf,
            source: call.s ?? null,
          })),
          hasSourceTracking: response.data.d.hasSourceTracking,
        };
      },
    }),

    sms: useQuery<SMSResponse>({
      queryKey: ["sms"],
      queryFn: async () => {
        const response = await apiClient.get("/portal/client/sms", {
          params: {
            limit: 200,
          },
        });
        return response.data;
      },
      enabled,
    }),

    customers: useQuery({
      queryKey: ["customers"],
      queryFn: () =>
        apiClient.get<CustomersResponse>("/portal/client/customers/base"),
      enabled,
      staleTime: 5 * 60 * 1000,
      retry: 1,
    }),

    campaigns: useQuery({
      queryKey: ["campaigns"],
      queryFn: async () => {
        const response = await apiClient.get<CampaignsResponse>(
          "/portal/client/campaigns",
        );
        return response.data;
      },
      staleTime: 5 * 60 * 1000,
      enabled,
      retry: 1,
    }),

    appointments: useQuery({
      queryKey: ["appointments"],
      queryFn: async () => {
        const response = await apiClient.get<AppointmentsResponse>(
          "/portal/client/customers/appointments",
        );
        return response.data;
      },
      enabled,
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    }),

    inquiries: useQuery<InquiriesResponse>({
      queryKey: ["inquiries"],
      queryFn: async () => {
        const response = await apiClient.get("/portal/client/inquiries");
        return response.data;
      },
      enabled,
      staleTime: 0,
      refetchOnMount: true,
      refetchOnWindowFocus: true,
    }),
  };

  const fetchUniqueCallers = useCallback(async (from: Date, to: Date) => {
    const fromStr = format(from, "yyyy-MM-dd HH:mm:ss");
    const toStr = format(to, "yyyy-MM-dd HH:mm:ss");

    // Calculate date range size
    const daysDiff = Math.ceil(
      (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24),
    );

    // For large date ranges (> 14 days), use a direct approach without chunking
    if (daysDiff > 14) {
      // Make a single request for the entire date range
      try {
        const response = await apiClient.get(
          "/portal/client/metrics/unique-callers",
          {
            params: {
              from: fromStr,
              to: toStr,
            },
            timeout: 30000, // 30s timeout for the full range
          },
        );

        // Ensure the response has numeric values
        if (response.data.success && response.data.data) {
          const currentUniqueCallers =
            parseInt(
              String(response.data.data.currentPeriod?.uniqueCallers).replace(
                /[^0-9]/g,
                "",
              ),
              10,
            ) || 0;
          const previousUniqueCallers =
            parseInt(
              String(response.data.data.previousPeriod?.uniqueCallers).replace(
                /[^0-9]/g,
                "",
              ),
              10,
            ) || 0;

          // Create a new response with the parsed values
          return {
            ...response,
            data: {
              ...response.data,
              data: {
                ...response.data.data,
                currentPeriod: {
                  ...response.data.data.currentPeriod,
                  uniqueCallers: currentUniqueCallers,
                },
                previousPeriod: {
                  ...response.data.data.previousPeriod,
                  uniqueCallers: previousUniqueCallers,
                },
              },
            },
          };
        }

        return response;
      } catch (error) {
        console.error(
          "Error fetching unique callers for large date range:",
          error,
        );

        // If the full range request fails, fall back to separate requests for current and previous periods
        const previousPeriodFrom = format(
          new Date(from.getTime() - daysDiff * 24 * 60 * 60 * 1000),
          "yyyy-MM-dd HH:mm:ss",
        );
        const previousPeriodTo = format(
          new Date(from.getTime() - 1),
          "yyyy-MM-dd HH:mm:ss",
        );

        try {
          const [currentResponse, previousResponse] = await Promise.all([
            apiClient.get("/portal/client/metrics/unique-callers", {
              params: {
                from: fromStr,
                to: toStr,
              },
              timeout: 30000,
            }),
            apiClient.get("/portal/client/metrics/unique-callers", {
              params: {
                from: previousPeriodFrom,
                to: previousPeriodTo,
              },
              timeout: 30000,
            }),
          ]);

          // Parse the values
          const currentUniqueCallers =
            parseInt(
              String(
                currentResponse.data.data?.currentPeriod?.uniqueCallers || "0",
              ).replace(/[^0-9]/g, ""),
              10,
            ) || 0;
          const previousUniqueCallers =
            parseInt(
              String(
                previousResponse.data.data?.currentPeriod?.uniqueCallers || "0",
              ).replace(/[^0-9]/g, ""),
              10,
            ) || 0;

          // Calculate percentage change
          const percentChange =
            previousUniqueCallers > 0
              ? ((currentUniqueCallers - previousUniqueCallers) /
                  previousUniqueCallers) *
                100
              : null;

          // Return a synthesized response
          return {
            data: {
              success: true,
              data: {
                currentPeriod: {
                  uniqueCallers: currentUniqueCallers,
                },
                previousPeriod: {
                  uniqueCallers: previousUniqueCallers,
                },
                comparison: {
                  percentChange: percentChange,
                  absoluteChange: currentUniqueCallers - previousUniqueCallers,
                },
              },
              metadata: {
                timeRanges: {
                  currentPeriod: {
                    from: fromStr,
                    to: toStr,
                  },
                  previousPeriod: {
                    from: previousPeriodFrom,
                    to: previousPeriodTo,
                  },
                },
              },
            },
          };
        } catch (error) {
          console.error("Error with separate period requests:", error);

          // If all else fails, return a default response
          return {
            data: {
              success: true,
              data: {
                currentPeriod: {
                  uniqueCallers: 0,
                },
                previousPeriod: {
                  uniqueCallers: 0,
                },
                comparison: {
                  percentChange: null,
                  absoluteChange: 0,
                },
              },
              metadata: {
                timeRanges: {
                  currentPeriod: {
                    from: fromStr,
                    to: toStr,
                  },
                  previousPeriod: {
                    from: previousPeriodFrom,
                    to: previousPeriodTo,
                  },
                },
                error: "Failed to fetch data after multiple attempts",
              },
            },
          };
        }
      }
    }

    // For smaller date ranges, use the original approach
    const response = await apiClient.get(
      "/portal/client/metrics/unique-callers",
      {
        params: {
          from: fromStr,
          to: toStr,
        },
        timeout: 30000, // 30s timeout for smaller ranges
      },
    );

    // Ensure the response has numeric values
    if (response.data.success && response.data.data) {
      const currentUniqueCallers =
        parseInt(
          String(response.data.data.currentPeriod?.uniqueCallers).replace(
            /[^0-9]/g,
            "",
          ),
          10,
        ) || 0;
      const previousUniqueCallers =
        parseInt(
          String(response.data.data.previousPeriod?.uniqueCallers).replace(
            /[^0-9]/g,
            "",
          ),
          10,
        ) || 0;

      // Create a new response with the parsed values
      return {
        ...response,
        data: {
          ...response.data,
          data: {
            ...response.data.data,
            currentPeriod: {
              ...response.data.data.currentPeriod,
              uniqueCallers: currentUniqueCallers,
            },
            previousPeriod: {
              ...response.data.data.previousPeriod,
              uniqueCallers: previousUniqueCallers,
            },
          },
        },
      };
    }

    return response;
  }, []);

  const isLoading =
    !isLoaded || queries.todayMetrics.isLoading || queries.clientInfo.isLoading;

  return {
    todayMetrics: queries.todayMetrics.data,
    metrics: queries.metrics.data,
    clientInfo: queries.clientInfo.data,
    calls: queries.calls.data,
    sms: queries.sms.data,
    isLoading,
    isCallsLoading: queries.calls.isLoading,
    isSmsLoading: queries.sms.isLoading,
    callsError: queries.calls.error,
    smsError: queries.sms.error,
    appointments: queries.appointments.data?.results ?? [],
    isHeaderLoading:
      !isLoaded ||
      queries.todayMetrics.isLoading ||
      queries.clientInfo.isLoading,
    isMetricsLoading: queries.metrics.isLoading,
    isAppointmentsLoading: queries.appointments.isLoading,
    fetchUniqueCallers,
    customers: queries.customers.data?.data,
    isCustomersLoading: queries.customers.isLoading,
    campaigns: queries.campaigns.data,
    inquiries: queries.inquiries.data?.data ?? [],
    isInquiriesLoading: queries.inquiries.isLoading,
  };
}

export function useClientData() {
  const queryClient = useQueryClient();

  const { data: clientInfo, isLoading } = useQuery<ClientInfo>({
    queryKey: ["clientInfo"],
    queryFn: async () => {
      const response = await apiClient.get("/portal/client/info");
      return response.data;
    },
  });

  const fetchAppointments = useCallback(async () => {
    console.log("🎯 Starting fetchAppointments");
    try {
      const response = await apiClient.get<AppointmentsResponse>(
        "/portal/client/customers/appointments",
      );
      console.log("✅ Appointments API Response:", {
        status: response.status,
        count: response.data?.results?.length,
        sample: response.data?.results?.slice(0, 2),
      });
      return response.data.results;
    } catch (error) {
      console.error("❌ Error fetching appointments:", error);
      throw error;
    }
  }, []);

  const fetchContactRates = useCallback(
    async (from: Date, to: Date, campaignId: string) => {
      const searchParams = new URLSearchParams({
        from: from.toISOString(),
        to: to.toISOString(),
        campaignId,
      });

      const response = await apiClient.get<ContactRateResponse>(
        `/portal/client/metrics/contact-rates?${searchParams.toString()}`,
      );
      return response.data;
    },
    [],
  );

  const mutation = useMutation({
    mutationFn: async (data: Partial<ClientInfo>) => {
      let endpoint = "/portal/client/info";

      // Use specific endpoints for different types of updates
      if ("businessHours" in data) {
        endpoint = "/portal/client/operating-hours";
      } else if ("specialHours" in data) {
        endpoint = "/portal/client/special-hours";
      } else if ("holidayGroups" in data) {
        endpoint = "/portal/client/holiday-groups";
      }

      const response = await apiClient.put(endpoint, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientInfo"] });
    },
  });

  const mutate = async (data: Partial<ClientInfo>) => {
    await mutation.mutateAsync(data);
  };

  return {
    clientInfo,
    isLoading,
    mutate,
    fetchAppointments,
    fetchContactRates,
  };
}
