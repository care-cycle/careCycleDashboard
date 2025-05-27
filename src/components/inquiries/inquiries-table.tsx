import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown, PhoneForwarded } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPhoneNumber, formatDate } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useRedaction } from "@/hooks/use-redaction";
import { useCallback } from "react";

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
}

type InquiryKey = keyof Inquiry;

interface InquiriesTableProps {
  inquiries: Inquiry[];
  onSort: (key: InquiryKey, direction: "asc" | "desc" | null) => void;
  sortConfig: {
    key: InquiryKey;
    direction: "asc" | "desc" | null;
  };
}

export function InquiriesTable({
  inquiries,
  onSort,
  sortConfig,
}: InquiriesTableProps) {
  const navigate = useNavigate();
  const { isRedacted } = useRedaction();

  const handleSort = (key: InquiryKey) => {
    let direction: "asc" | "desc" | null = "asc";

    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        direction = null;
      }
    }

    onSort(key, direction);
  };

  const handleCallsNavigation = (
    e: React.MouseEvent,
    callerId: string | undefined,
  ) => {
    e.stopPropagation(); // Prevent row selection
    if (!callerId) return;

    // Format the phone number to ensure it starts with +
    const formattedNumber = callerId.startsWith("+")
      ? callerId
      : `+${callerId}`;

    const searchParams = new URLSearchParams();
    searchParams.set("search", formattedNumber);
    navigate(`/calls?${searchParams.toString()}`);
  };

  const getStatusColor = (status: Inquiry["status"]) => {
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

  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
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

  // Helper function to render customer name with redaction
  const renderCustomerName = useCallback(
    (firstName?: string, lastName?: string) => {
      if (isRedacted) {
        const firstNameRedacted = firstName ? "*".repeat(firstName.length) : "";
        const lastNameRedacted = lastName ? "*".repeat(lastName.length) : "";
        return `${firstNameRedacted} ${lastNameRedacted}`.trim();
      }
      return `${firstName || ""} ${lastName || ""}`.trim();
    },
    [isRedacted],
  );

  // Helper function to render phone number with redaction
  const renderPhoneNumber = useCallback(
    (phoneNumber?: string) => {
      if (!phoneNumber) return "";
      if (isRedacted) return "*".repeat(phoneNumber.length);
      return formatPhoneNumber(phoneNumber);
    },
    [isRedacted],
  );

  return (
    <div className="rounded-md border glass-panel w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" />
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("firstName" as InquiryKey)}
                className="hover:text-gray-900 text-gray-600 flex items-center gap-2"
              >
                Customer
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("severity" as InquiryKey)}
                  className="hover:text-gray-900 text-gray-600 flex items-center gap-2"
                >
                  Severity
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("carrierName" as InquiryKey)}
                className="hover:text-gray-900 text-gray-600 flex items-center gap-2"
              >
                Carrier & Plan
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("agentName" as InquiryKey)}
                className="hover:text-gray-900 text-gray-600 flex items-center gap-2"
              >
                Agent
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("inquiry" as InquiryKey)}
                className="hover:text-gray-900 text-gray-600 flex items-center gap-2"
              >
                Inquiry
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("primaryCategory" as InquiryKey)}
                className="hover:text-gray-900 text-gray-600 flex items-center gap-2"
              >
                Category
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  onClick={() => handleSort("status" as InquiryKey)}
                  className="hover:text-gray-900 text-gray-600 flex items-center gap-2"
                >
                  Status
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("resolvedAt" as InquiryKey)}
                className="hover:text-gray-900 text-gray-600 flex items-center gap-2"
              >
                Resolved At
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("createdAt" as InquiryKey)}
                className="hover:text-gray-900 text-gray-600 flex items-center gap-2"
              >
                Created At
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inquiries.length > 0 ? (
            inquiries.map((inquiry) => (
              <TableRow
                key={inquiry.id}
                className="hover:bg-black/5 cursor-pointer"
                onClick={() =>
                  navigate(`/inquiries/${inquiry.id}`, {
                    state: {
                      filteredInquiries: inquiries,
                      currentIndex: inquiries.findIndex(
                        (inq) => inq.id === inquiry.id,
                      ),
                    },
                  })
                }
              >
                <TableCell>
                  <div className="h-8 w-8 flex items-center justify-center">
                    <PhoneForwarded
                      className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer"
                      onClick={(e) =>
                        handleCallsNavigation(e, inquiry.callerId)
                      }
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {renderCustomerName(inquiry.firstName, inquiry.lastName)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {renderPhoneNumber(inquiry.callerId)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    {inquiry.severity ? (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(inquiry.severity)}`}
                      >
                        {formatSeverity(inquiry.severity)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {inquiry.carrierName || "-"}
                    </span>
                    <span className="text-sm text-gray-500">
                      {inquiry.planName || "-"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">
                    {inquiry.agentName || "-"}
                  </span>
                </TableCell>
                <TableCell className="max-w-md">
                  <div className="line-clamp-2">{inquiry.inquiry}</div>
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {inquiry.primaryCategory
                      ? formatCategory(inquiry.primaryCategory)
                      : "-"}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(inquiry.status)}`}
                    >
                      {formatStatus(inquiry.status)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {inquiry.resolvedAt ? formatDate(inquiry.resolvedAt) : "-"}
                </TableCell>
                <TableCell>{formatDate(inquiry.createdAt)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-4">
                No inquiries available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
