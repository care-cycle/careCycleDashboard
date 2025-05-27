import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { RootLayout } from "@/components/layout/root-layout";
import { useInitialData } from "@/hooks/use-client-data";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  FileText,
  Clock,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import { formatDate, formatPhoneNumber } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getTopMetrics } from "@/lib/metrics";
import { useRedaction } from "@/hooks/use-redaction";
import { cn } from "@/lib/utils";
import { CompactCallDetails } from "@/components/inquiries/compact-call-details";
import { ContactHistoryDrawer } from "@/components/inquiries/contact-history-drawer";
import { CallDetailsDrawer } from "@/components/inquiries/call-details-drawer";

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
  primaryCategory?: string;
  subcategory?: string;
  severity?: string;
  suggestedHandling?: string;
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
  customer?: CustomerInfo | null;
}

interface CustomerInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  callerId: string;
  dateOfBirth?: string;
  state?: string;
  city?: string;
  postalCode?: string;
  address?: string;
  language?: string;
  timezone?: string;
  carrierName?: string;
  planName?: string;
  agentName?: string;
  enrollmentDate?: string;
  effectiveDate?: string;
  veteran?: boolean;
  medicareCard?: boolean;
  medicaid?: boolean;
  socialSecurityDisability?: boolean;
  existingCoverage?: string;
  employerPlan20Plus?: boolean;
  desiredCoverageStart?: string;
  subsidyAmount?: number;
  householdIncome?: number;
  filingStatus?: string;
  dependents?: number;
  smsConsent?: boolean;
  doNotContact?: boolean;
}

interface CallData {
  id: string;
  callerId: string;
  createdAt: string;
  disposition?: string;
  durationMs?: number;
  assistantType?: string;
  summary?: string;
  transcript?: string;
  recordingUrl?: string;
  direction?: string;
  cost?: number;
  successEvaluation?: string;
}

export default function InquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { todayMetrics, inquiries: allInquiries } = useInitialData();
  const queryClient = useQueryClient();
  const { isRedacted } = useRedaction();

  const [response, setResponse] = useState("");
  const [resolutionType, setResolutionType] = useState<"carecycle" | "manual">(
    "carecycle",
  );
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<
    "pending_resolution" | "resolved"
  >("resolved");
  const [showContactHistory, setShowContactHistory] = useState(false);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [selectedCallData, setSelectedCallData] = useState<CallData | null>(
    null,
  );
  const [hasCopiedId, setHasCopiedId] = useState(false);

  // Get filtered inquiries from navigation state, or fall back to all inquiries
  const locationState = location.state as {
    filteredInquiries?: Inquiry[];
    currentIndex?: number;
  } | null;
  const inquiries = locationState?.filteredInquiries || allInquiries;

  // Find current inquiry index and adjacent inquiries
  const currentIndex =
    locationState?.currentIndex ?? inquiries.findIndex((inq) => inq.id === id);
  const previousInquiry = currentIndex > 0 ? inquiries[currentIndex - 1] : null;
  const nextInquiry =
    currentIndex < inquiries.length - 1 ? inquiries[currentIndex + 1] : null;

  // Fetch inquiry details
  const { data: inquiry, isLoading: isLoadingInquiry } = useQuery({
    queryKey: ["inquiry", id],
    queryFn: async () => {
      const result = await apiClient.get(`/portal/client/inquiries/${id}`);
      return result.data?.data as Inquiry;
    },
    enabled: !!id,
  });

  // Use customer data from inquiry response
  const customer = inquiry?.customer || null;

  // Fetch call details if we have a callId
  const { data: callData, isLoading: isLoadingCall } = useQuery({
    queryKey: ["call", inquiry?.callId],
    queryFn: async () => {
      if (!inquiry?.callId) return null;

      const result = await apiClient.get("/portal/client/calls");

      // The API returns data in a nested structure
      const callsData = result.data?.d?.c || [];

      // Find the specific call by ID
      const call = callsData.find((c: any) => c.i === inquiry.callId);

      if (!call) return null;

      // Transform the API response to match our CallData interface
      return {
        id: call.i,
        callerId: call.ca,
        createdAt: call.cr,
        disposition: call.d,
        durationMs: call.du
          ? (() => {
              const match = call.du.match(/(\d+)m\s*(\d+)s/);
              if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                return (minutes * 60 + seconds) * 1000;
              }
              return 0;
            })()
          : undefined,
        assistantType: call.at,
        summary: call.su,
        transcript: call.tr,
        recordingUrl: call.r,
        direction: call.di === "i" ? "inbound" : "outbound",
        cost: call.co,
        successEvaluation: call.se,
      } as CallData;
    },
    enabled: !!inquiry?.callId,
  });

  // Fetch contact history (calls) when page loads
  const phoneNumber = inquiry?.callerId || customer?.callerId;
  const { data: contactCallsData, isLoading: isLoadingContactCalls } = useQuery(
    {
      queryKey: ["contact-calls", phoneNumber],
      queryFn: async () => {
        if (!phoneNumber) return [];

        const result = await apiClient.get("/portal/client/calls");
        const callsData = result.data?.d?.c || [];

        // Filter calls by phone number
        return callsData
          .filter((call: any) => call.ca === phoneNumber)
          .map((call: any) => ({
            id: call.i,
            createdAt: call.cr,
            disposition: call.d,
            durationMs: call.du
              ? (() => {
                  const match = call.du.match(/(\d+)m\s*(\d+)s/);
                  if (match) {
                    const minutes = parseInt(match[1]);
                    const seconds = parseInt(match[2]);
                    return (minutes * 60 + seconds) * 1000;
                  }
                  return 0;
                })()
              : 0,
            direction: call.di === "i" ? "inbound" : "outbound",
            type: "call" as const,
          }));
      },
      enabled: !!phoneNumber,
    },
  );

  // Fetch contact history (SMS) when page loads
  const { data: contactSmsData, isLoading: isLoadingContactSms } = useQuery({
    queryKey: ["contact-sms", phoneNumber],
    queryFn: async () => {
      if (!phoneNumber) return [];

      const formattedNumber = phoneNumber.startsWith("+")
        ? phoneNumber
        : `+${phoneNumber}`;
      const result = await apiClient.get(`/portal/client/sms`, {
        params: {
          search: formattedNumber,
          limit: 100,
        },
      });

      return (result.data?.data || []).map((sms: any) => ({
        id: sms.id,
        createdAt: sms.createdAt || sms.sentAt,
        content: sms.content,
        direction: sms.direction,
        type: "sms" as const,
      }));
    },
    enabled: !!phoneNumber,
  });

  // Fetch selected call details
  const { data: selectedCall, isLoading: isLoadingSelectedCall } = useQuery({
    queryKey: ["selected-call", selectedCallId],
    queryFn: async () => {
      if (!selectedCallId) return null;

      const result = await apiClient.get("/portal/client/calls");
      const callsData = result.data?.d?.c || [];

      // Find the specific call by ID
      const call = callsData.find((c: any) => c.i === selectedCallId);

      if (!call) return null;

      // Transform the API response to match our CallData interface
      return {
        id: call.i,
        callerId: call.ca,
        createdAt: call.cr,
        disposition: call.d,
        durationMs: call.du
          ? (() => {
              const match = call.du.match(/(\d+)m\s*(\d+)s/);
              if (match) {
                const minutes = parseInt(match[1]);
                const seconds = parseInt(match[2]);
                return (minutes * 60 + seconds) * 1000;
              }
              return 0;
            })()
          : undefined,
        assistantType: call.at,
        summary: call.su,
        transcript: call.tr,
        recordingUrl: call.r,
        direction: call.di === "i" ? "inbound" : "outbound",
        cost: call.co,
        successEvaluation: call.se,
      } as CallData;
    },
    enabled: !!selectedCallId,
  });

  // Update selected call data when query completes
  useEffect(() => {
    if (selectedCall) {
      setSelectedCallData(selectedCall);
    }
  }, [selectedCall]);

  // Handle call selection
  const handleCallSelect = (callId: string) => {
    if (callId) {
      setSelectedCallId(callId);
    } else {
      // Empty string means close the call details
      setSelectedCallId(null);
      setSelectedCallData(null);
    }
  };

  // Handle closing call details
  const handleCloseCallDetails = () => {
    setSelectedCallId(null);
    setSelectedCallData(null);
  };

  useEffect(() => {
    // Reset form state when inquiry changes
    if (inquiry) {
      setResponse(inquiry.response || "");
      setNotes("");
      setResolutionType("carecycle");
    }
  }, [inquiry?.id]); // Use inquiry.id to ensure it runs when navigating to a different inquiry

  // Keyboard navigation
  const handleKeyNavigation = useCallback(
    (e: KeyboardEvent) => {
      // Check if user is typing in a textarea or input
      const activeElement = document.activeElement;
      const isTyping =
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.tagName === "INPUT";

      if (!isTyping) {
        if ((e.key === "ArrowLeft" || e.key === "j") && previousInquiry) {
          e.preventDefault();
          // Close any open drawers before navigating
          setShowContactHistory(false);
          setSelectedCallId(null);
          setSelectedCallData(null);
          navigate(`/inquiries/${previousInquiry.id}`, {
            state: {
              filteredInquiries: inquiries,
              currentIndex: currentIndex - 1,
            },
          });
        } else if ((e.key === "ArrowRight" || e.key === "k") && nextInquiry) {
          e.preventDefault();
          // Close any open drawers before navigating
          setShowContactHistory(false);
          setSelectedCallId(null);
          setSelectedCallData(null);
          navigate(`/inquiries/${nextInquiry.id}`, {
            state: {
              filteredInquiries: inquiries,
              currentIndex: currentIndex + 1,
            },
          });
        } else if (e.key === "Escape") {
          e.preventDefault();
          // Close any open drawers before navigating
          setShowContactHistory(false);
          setSelectedCallId(null);
          setSelectedCallData(null);
          navigate("/inquiries");
        }
      }
    },
    [navigate, previousInquiry, nextInquiry, inquiries, currentIndex],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyNavigation);
    return () => window.removeEventListener("keydown", handleKeyNavigation);
  }, [handleKeyNavigation]);

  const handleSubmit = async () => {
    if (!inquiry || inquiry.response) return;

    // Validation based on resolution type
    if (resolutionType === "carecycle" && !response.trim()) {
      toast.error("Please provide a response for CareCycle callback");
      return;
    }

    if (resolutionType === "manual" && !notes.trim()) {
      toast.error("Please provide notes for manual resolution");
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: any = {
        resolutionType,
      };

      // Include response only for carecycle
      if (resolutionType === "carecycle") {
        updateData.response = response.trim();
      } else {
        // For manual resolution, handle response based on status
        if (
          inquiry.status === "new" &&
          selectedStatus === "pending_resolution"
        ) {
          // Don't set a response for pending resolution from new status
          // Just use notes
        } else {
          // For resolved status, use notes as the response with prefix
          updateData.response = `[Manually Resolved] ${notes.trim()}`;
        }

        // Set status based on current status and selection
        if (inquiry.status === "new") {
          updateData.status = selectedStatus;
        } else {
          updateData.status = "resolved";
        }
      }

      // Always include notes if provided
      if (notes.trim()) {
        updateData.notes = notes.trim();
      }

      const result = await apiClient.patch(
        `/portal/client/inquiries/${inquiry.id}`,
        updateData,
      );

      if (!result.data?.success) {
        throw new Error(result.data?.error || "Failed to submit response");
      }

      await queryClient.invalidateQueries({ queryKey: ["inquiry", id] });
      await queryClient.invalidateQueries({ queryKey: ["inquiries"] });

      let message = "";
      if (resolutionType === "manual") {
        if (updateData.status === "resolved") {
          message = "Inquiry manually resolved successfully";
        } else if (updateData.status === "pending_resolution") {
          message = "Inquiry marked as pending resolution";
        }
      } else {
        message = "Response submitted successfully - callback initiated";
      }

      toast.success(message);
    } catch (error) {
      toast.error("Failed to submit response. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "pending_resolution":
        return "bg-yellow-100 text-yellow-800";
      case "unresolved":
        return "bg-red-100 text-red-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "appointment_scheduled":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category?: string) => {
    if (!category) return "bg-gray-100 text-gray-800";
    switch (category.toLowerCase()) {
      case "application_status":
        return "bg-indigo-100 text-indigo-800";
      case "plan_information":
        return "bg-blue-100 text-blue-800";
      case "benefits_coverage":
        return "bg-cyan-100 text-cyan-800";
      case "cost_billing":
        return "bg-green-100 text-green-800";
      case "providers":
        return "bg-purple-100 text-purple-800";
      case "id_cards_documentation":
        return "bg-yellow-100 text-yellow-800";
      case "benefit_utilization":
        return "bg-pink-100 text-pink-800";
      case "cancellation_plan_changes":
        return "bg-red-100 text-red-800";
      case "personal_info_updates":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getSeverityColor = (severity?: string) => {
    if (!severity) return "bg-gray-100 text-gray-800";
    switch (severity.toLowerCase()) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "at_risk":
        return "bg-orange-100 text-orange-800";
      case "urgent":
        return "bg-yellow-100 text-yellow-800";
      case "medium":
        return "bg-green-100 text-green-800";
      case "minor":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatCategory = (category?: string) => {
    if (!category) return "";
    const categoryMap: Record<string, string> = {
      application_status: "Application Status",
      plan_information: "Plan Information",
      benefits_coverage: "Benefits & Coverage",
      cost_billing: "Cost & Billing",
      providers: "Providers",
      id_cards_documentation: "ID Cards & Documentation",
      benefit_utilization: "Benefit Utilization",
      cancellation_plan_changes: "Cancellation & Plan Changes",
      personal_info_updates: "Personal Info Updates",
    };
    return categoryMap[category.toLowerCase()] || category;
  };

  const formatSeverity = (severity?: string) => {
    if (!severity) return "";
    const severityMap: Record<string, string> = {
      critical: "Critical",
      at_risk: "At Risk",
      urgent: "Urgent",
      medium: "Medium",
      minor: "Minor",
    };
    return severityMap[severity.toLowerCase()] || severity;
  };

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const renderRedactedText = (text?: string, placeholder = "N/A") => {
    if (!text) return placeholder;
    if (isRedacted) return "*".repeat(text.length);
    return text;
  };

  const renderRedactedPhone = (phone?: string) => {
    if (!phone) return "N/A";
    if (isRedacted) return "*".repeat(phone.length);
    return formatPhoneNumber(phone);
  };

  const copyInquiryId = useCallback(async () => {
    if (!inquiry?.id) return;
    try {
      await navigator.clipboard.writeText(inquiry.id);
      setHasCopiedId(true);
      toast.success("Inquiry ID copied");
      setTimeout(() => setHasCopiedId(false), 2000);
    } catch (err) {
      toast.error("Failed to copy ID");
    }
  }, [inquiry?.id]);

  const formatShortId = (id: string) => {
    if (!id) return "";
    // Show first 8 characters and last 4 characters
    if (id.length <= 12) return id;
    return `${id.slice(0, 8)}...${id.slice(-4)}`;
  };

  if (isLoadingInquiry) {
    return (
      <RootLayout topMetrics={getTopMetrics(todayMetrics)}>
        <div className="flex items-center justify-center h-64">
          <p>Loading inquiry details...</p>
        </div>
      </RootLayout>
    );
  }

  if (!inquiry) {
    return (
      <RootLayout topMetrics={getTopMetrics(todayMetrics)}>
        <div className="flex items-center justify-center h-64">
          <p>Inquiry not found</p>
        </div>
      </RootLayout>
    );
  }

  const hasResponse = !!inquiry.response;

  return (
    <RootLayout topMetrics={getTopMetrics(todayMetrics)} hideKnowledgeSearch>
      <div className="space-y-4">
        {/* Header with breadcrumb and badges */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/inquiries")}
              title="Back to Inquiries (Esc)"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">Inquiry Details</h1>
                {inquiry.primaryCategory && (
                  <span
                    className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium",
                      getCategoryColor(inquiry.primaryCategory),
                    )}
                  >
                    {formatCategory(inquiry.primaryCategory)}
                  </span>
                )}
                <span
                  className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    getStatusColor(inquiry.status),
                  )}
                >
                  {formatStatus(inquiry.status)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <button
                  onClick={copyInquiryId}
                  className="flex items-center gap-1.5 hover:text-gray-900 group"
                  title="Click to copy full ID"
                >
                  <span>ID:</span>
                  <span className="font-mono">{formatShortId(inquiry.id)}</span>
                  {hasCopiedId ? (
                    <Check className="h-3 w-3 text-green-500" />
                  ) : (
                    <Copy className="h-3 w-3 text-gray-400" />
                  )}
                </button>
                <span>•</span>
                <span>Created {formatDate(inquiry.createdAt)}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {/* Navigation arrows with position indicator */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  previousInquiry &&
                  navigate(`/inquiries/${previousInquiry.id}`, {
                    state: {
                      filteredInquiries: inquiries,
                      currentIndex: currentIndex - 1,
                    },
                  })
                }
                disabled={!previousInquiry}
                title="Previous Inquiry (← or J)"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {inquiries.length > 0 && (
                <span className="text-sm text-gray-600 font-medium px-2">
                  {currentIndex + 1} of {inquiries.length}
                </span>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() =>
                  nextInquiry &&
                  navigate(`/inquiries/${nextInquiry.id}`, {
                    state: {
                      filteredInquiries: inquiries,
                      currentIndex: currentIndex + 1,
                    },
                  })
                }
                disabled={!nextInquiry}
                title="Next Inquiry (→ or K)"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Keyboard shortcuts hint - smaller and more subtle */}
            <div className="text-[10px] text-gray-400 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 text-[10px] bg-gray-50 border border-gray-200 rounded text-gray-500">
                  ←
                </kbd>
                <span className="text-gray-400">/</span>
                <kbd className="px-1 py-0.5 text-[10px] bg-gray-50 border border-gray-200 rounded text-gray-500">
                  J
                </kbd>
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 text-[10px] bg-gray-50 border border-gray-200 rounded text-gray-500">
                  →
                </kbd>
                <span className="text-gray-400">/</span>
                <kbd className="px-1 py-0.5 text-[10px] bg-gray-50 border border-gray-200 rounded text-gray-500">
                  K
                </kbd>
              </span>
              <span className="text-gray-300">•</span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 text-[10px] bg-gray-50 border border-gray-200 rounded text-gray-500">
                  Esc
                </kbd>
              </span>
            </div>
          </div>
        </div>

        {/* Two column layout - 50/50 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Left Column - Customer & Plan Info, Inquiry & Response */}
          <div className="space-y-4">
            {/* Customer Information */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-4">
                Customer Information
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-medium">
                    {renderRedactedText(inquiry.firstName)}{" "}
                    {renderRedactedText(inquiry.lastName)}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="font-medium">
                    {renderRedactedPhone(
                      inquiry.callerId || customer?.callerId,
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Location
                  </p>
                  <p className="font-medium">
                    {[customer?.state, customer?.timezone, customer?.postalCode]
                      .filter(
                        (value) => value && value !== "null" && value !== "",
                      )
                      .join(", ") || "N/A"}
                  </p>
                </div>
              </div>
              {customer?.email && (
                <div className="mt-3 space-y-1">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-sm">
                    {renderRedactedText(customer.email)}
                  </p>
                </div>
              )}
            </Card>

            {/* Plan Information */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-4">Plan Information</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Carrier</p>
                  <p className="font-medium">
                    {inquiry.carrierName || customer?.carrierName || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Plan</p>
                  <p className="font-medium">
                    {inquiry.planName || customer?.planName || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Agent</p>
                  <p className="font-medium">
                    {inquiry.agentName || customer?.agentName || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Enrollment Date</p>
                  <p className="font-medium">
                    {customer?.enrollmentDate
                      ? formatDate(customer.enrollmentDate)
                      : "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">Effective Date</p>
                  <p className="font-medium">
                    {customer?.effectiveDate
                      ? formatDate(customer.effectiveDate)
                      : "N/A"}
                  </p>
                </div>
              </div>
            </Card>

            {/* Inquiry */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold">Inquiry</h3>
                <div className="flex items-center gap-2">
                  {inquiry.severity && (
                    <span
                      className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        getSeverityColor(inquiry.severity),
                      )}
                    >
                      {formatSeverity(inquiry.severity)} Priority
                    </span>
                  )}
                </div>
              </div>

              {/* Category and Subcategory */}
              {(inquiry.primaryCategory || inquiry.subcategory) && (
                <div className="mb-3 flex items-center gap-2 text-sm">
                  {inquiry.primaryCategory && (
                    <span className="text-gray-600">
                      {formatCategory(inquiry.primaryCategory)}
                    </span>
                  )}
                  {inquiry.primaryCategory && inquiry.subcategory && (
                    <span className="text-gray-400">›</span>
                  )}
                  {inquiry.subcategory && (
                    <span className="text-gray-500">{inquiry.subcategory}</span>
                  )}
                </div>
              )}

              {/* Suggested Handling */}
              {inquiry.suggestedHandling && (
                <div className="mb-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-xs text-blue-600 font-medium">
                    Suggested Handling:{" "}
                    {inquiry.suggestedHandling === "carecycle"
                      ? "CareCycle Callback"
                      : "Manual Resolution"}
                  </p>
                </div>
              )}

              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-sm whitespace-pre-wrap">{inquiry.inquiry}</p>
              </div>
            </Card>

            {/* Response */}
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-3">Response</h3>

              {!hasResponse && (
                <div className="mb-4">
                  <div className="flex items-center gap-6">
                    <p className="text-xs text-gray-600">Resolution Type</p>
                    <RadioGroup
                      value={resolutionType}
                      onValueChange={(value) =>
                        setResolutionType(value as "carecycle" | "manual")
                      }
                      className="flex items-center gap-6"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="carecycle" id="carecycle" />
                        <Label
                          htmlFor="carecycle"
                          className="text-sm font-normal cursor-pointer"
                        >
                          CareCycle Call Back
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="manual" id="manual" />
                        <Label
                          htmlFor="manual"
                          className="text-sm font-normal cursor-pointer"
                        >
                          Manual Resolution
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
              )}

              {!hasResponse && resolutionType === "carecycle" && (
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Type your response here..."
                  className={cn(
                    "min-h-[150px] resize-none text-sm",
                    response.trim().length > 0
                      ? "border-emerald-500 focus-visible:ring-emerald-500"
                      : "",
                  )}
                  disabled={isSubmitting}
                />
              )}

              {!hasResponse && resolutionType === "manual" && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  {inquiry.status === "new" ? (
                    <>
                      <p className="text-sm text-blue-800 mb-3">
                        Choose how to handle this inquiry:
                      </p>
                      <RadioGroup
                        value={selectedStatus}
                        onValueChange={(value) =>
                          setSelectedStatus(
                            value as "pending_resolution" | "resolved",
                          )
                        }
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem
                            value="pending_resolution"
                            id="pending_resolution"
                          />
                          <Label
                            htmlFor="pending_resolution"
                            className="text-sm font-normal cursor-pointer"
                          >
                            Mark as Pending Resolution (requires follow-up)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="resolved" id="resolved" />
                          <Label
                            htmlFor="resolved"
                            className="text-sm font-normal cursor-pointer"
                          >
                            Mark as Resolved (no further action needed)
                          </Label>
                        </div>
                      </RadioGroup>
                      <p className="text-sm text-blue-800 mt-3">
                        Please add any relevant notes below.
                      </p>
                    </>
                  ) : inquiry.status === "pending_resolution" &&
                    inquiry.resolutionType === "manual" ? (
                    <p className="text-sm text-blue-800">
                      This inquiry was previously marked as pending resolution.
                      You can now resolve it. Please add any relevant notes
                      below.
                    </p>
                  ) : (
                    <p className="text-sm text-blue-800">
                      Manual resolution will mark this inquiry as resolved
                      without triggering a callback. Please add any relevant
                      notes below.
                    </p>
                  )}
                </div>
              )}

              {hasResponse && (
                <Textarea
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Response already submitted."
                  className="min-h-[150px] resize-none text-sm bg-gray-50"
                  disabled={true}
                  readOnly={true}
                />
              )}

              {!hasResponse && (
                <div className="mt-3">
                  <Label htmlFor="notes" className="text-xs text-gray-600">
                    Notes{" "}
                    {resolutionType === "manual"
                      ? "(Required for manual resolution)"
                      : "(Optional)"}
                  </Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={
                      resolutionType === "manual"
                        ? "Explain why this inquiry was manually resolved..."
                        : "Add any additional notes about this inquiry..."
                    }
                    className="mt-1 min-h-[100px] resize-none text-sm"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {hasResponse && inquiry.resolutionType && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Resolution Type</p>
                  <p className="text-sm font-medium">
                    {inquiry.resolutionType === "manual"
                      ? "Manual Resolution"
                      : "CareCycle Call Back"}
                  </p>
                  {inquiry.notes && (
                    <div className="mt-2">
                      <p className="text-xs text-gray-600">Notes</p>
                      <p className="text-sm">{inquiry.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {!hasResponse && (
                <div className="mt-3 flex justify-end">
                  <Button
                    onClick={handleSubmit}
                    disabled={
                      isSubmitting ||
                      (resolutionType === "carecycle" && !response.trim()) ||
                      (resolutionType === "manual" && !notes.trim())
                    }
                    className={cn(
                      "transition-colors",
                      (resolutionType === "carecycle" &&
                        response.trim().length > 0) ||
                        (resolutionType === "manual" && notes.trim().length > 0)
                        ? "bg-emerald-500 hover:bg-emerald-600"
                        : "",
                    )}
                  >
                    {isSubmitting
                      ? "Submitting..."
                      : resolutionType === "manual"
                        ? "Resolve Manually"
                        : "Submit Response"}
                  </Button>
                </div>
              )}
              {inquiry.resolvedAt && (
                <p className="text-xs text-gray-500 mt-2">
                  Resolved on {formatDate(inquiry.resolvedAt)}
                </p>
              )}
            </Card>
          </div>

          {/* Right Column - Call Details */}
          <div>
            <Card className="h-full overflow-hidden flex flex-col">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="text-sm font-semibold">Call Details</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowContactHistory(true)}
                >
                  View Contact History
                </Button>
              </div>
              {isLoadingCall ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-gray-500">
                    Loading call details...
                  </p>
                </div>
              ) : callData ? (
                <div className="flex-1 p-4 overflow-y-auto">
                  <CompactCallDetails call={callData} />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-sm text-gray-500">
                    No call details available
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Contact History Drawer */}
      <ContactHistoryDrawer
        isOpen={showContactHistory}
        onClose={() => setShowContactHistory(false)}
        phoneNumber={inquiry.callerId || customer?.callerId}
        customerName={`${inquiry.firstName || ""} ${inquiry.lastName || ""}`.trim()}
        callsData={contactCallsData}
        smsData={contactSmsData}
        isLoading={isLoadingContactCalls || isLoadingContactSms}
        onCallSelect={handleCallSelect}
        hasCallSelected={!!selectedCallId}
        selectedCallId={selectedCallId}
      />

      {/* Call Details Drawer */}
      <CallDetailsDrawer
        isOpen={!!selectedCallId}
        onClose={handleCloseCallDetails}
        call={selectedCallData}
        isLoading={isLoadingSelectedCall}
      />
    </RootLayout>
  );
}
