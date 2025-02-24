import { useState, useMemo } from "react";
import { RootLayout } from "@/components/layout/root-layout";
import { useInitialData } from "@/hooks/use-client-data";
import { InquiryFilters } from "@/components/inquiries/inquiry-filters";
import { InquiriesTable } from "@/components/inquiries/inquiries-table";
import { InquiryResponseDialog } from "@/components/inquiries/inquiry-response-dialog";
import { getTopMetrics } from "@/lib/metrics";

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

// Sort function for inquiries
const sortInquiries = (
  inquiries: Inquiry[],
  sortConfig: { key: InquiryKey; direction: "asc" | "desc" | null },
) => {
  if (!sortConfig.direction) return inquiries;

  return [...inquiries].sort((a, b) => {
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue === bValue) return 0;
    if (aValue === undefined) return 1;
    if (bValue === undefined) return -1;

    const comparison = aValue < bValue ? -1 : 1;
    return sortConfig.direction === "asc" ? comparison : -comparison;
  });
};

export default function InquiriesPage() {
  const { inquiries, isInquiriesLoading, todayMetrics } = useInitialData();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: InquiryKey;
    direction: "asc" | "desc" | null;
  }>({ key: "createdAt", direction: "desc" });

  // Filter and sort inquiries
  const filteredAndSortedInquiries = useMemo(() => {
    let result = inquiries;

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter((inquiry) => {
        return (
          inquiry.inquiry.toLowerCase().includes(searchLower) ||
          inquiry.response?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      result = result.filter((inquiry) => inquiry.status === statusFilter);
    }

    // Apply sorting
    if (sortConfig.key && sortConfig.direction) {
      result = sortInquiries(result, sortConfig);
    }

    return result;
  }, [inquiries, searchQuery, statusFilter, sortConfig]);

  // Handle sorting
  const handleSort = (key: InquiryKey, direction: "asc" | "desc" | null) => {
    setSortConfig({ key, direction });
  };

  // Handle inquiry selection
  const handleInquirySelect = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
  };

  if (isInquiriesLoading) {
    return (
      <RootLayout topMetrics={getTopMetrics(todayMetrics)}>
        <div className="flex items-center justify-center h-64">
          <p>Loading inquiries...</p>
        </div>
      </RootLayout>
    );
  }

  return (
    <RootLayout topMetrics={getTopMetrics(todayMetrics)} hideKnowledgeSearch>
      <div className="space-y-6">
        <InquiryFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          isLoading={isInquiriesLoading}
        />

        {!inquiries.length ? (
          <div className="flex items-center justify-center h-64">
            <p>No inquiries found.</p>
          </div>
        ) : (
          <InquiriesTable
            inquiries={filteredAndSortedInquiries}
            onSort={handleSort}
            sortConfig={sortConfig}
            onInquirySelect={handleInquirySelect}
          />
        )}

        <InquiryResponseDialog
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
        />
      </div>
    </RootLayout>
  );
}
