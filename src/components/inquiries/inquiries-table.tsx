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
  onInquirySelect?: (inquiry: Inquiry) => void;
}

export function InquiriesTable({
  inquiries,
  onSort,
  sortConfig,
  onInquirySelect,
}: InquiriesTableProps) {
  const navigate = useNavigate();

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
                onClick={() => handleSort("response" as InquiryKey)}
                className="hover:text-gray-900 text-gray-600 flex items-center gap-2"
              >
                Response
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead>
              <Button
                variant="ghost"
                onClick={() => handleSort("status" as InquiryKey)}
                className="hover:text-gray-900 text-gray-600 flex items-center gap-2"
              >
                Status
                <ArrowUpDown className="h-4 w-4" />
              </Button>
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
                onClick={() => onInquirySelect?.(inquiry)}
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
                      {inquiry.firstName} {inquiry.lastName}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatPhoneNumber(inquiry.callerId || "")}
                    </span>
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
                <TableCell className="max-w-md">
                  <div className="line-clamp-2">{inquiry.inquiry}</div>
                </TableCell>
                <TableCell className="max-w-md">
                  <div className="line-clamp-2">{inquiry.response || "-"}</div>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(inquiry.status)}`}
                  >
                    {formatStatus(inquiry.status)}
                  </span>
                </TableCell>
                <TableCell>
                  {inquiry.resolvedAt ? formatDate(inquiry.resolvedAt) : "-"}
                </TableCell>
                <TableCell>{formatDate(inquiry.createdAt)}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-4">
                No inquiries available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
