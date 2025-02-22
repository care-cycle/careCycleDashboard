import { useState, useMemo, useCallback, memo, useEffect } from "react";
import { RootLayout } from "@/components/layout/root-layout";
import { DateRange } from "react-day-picker";
import { useUI } from "@/contexts/ui-context";
import { usePreferences } from "@/contexts/preferences-context";
import { SMS } from "@/types/sms";
import { useInitialData } from "@/hooks/use-client-data";
import { DownloadIcon } from "@radix-ui/react-icons";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { DateRangePicker } from "@/components/date-range-picker";
import { CampaignSelect } from "@/components/campaign-select";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { subDays } from "date-fns";
import { getTopMetrics } from "@/lib/metrics";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SMSTableProps {
  messages: SMS[];
  onSort: (key: string, direction: "asc" | "desc" | null) => void;
  sortConfig: {
    key: string;
    direction: "asc" | "desc" | null;
  };
}

const getPageNumbers = (currentPage: number, totalPages: number) => {
  const delta = 2;
  const range: (number | string)[] = [];

  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 || // First page
      i === totalPages || // Last page
      (i >= currentPage - delta && i <= currentPage + delta) // Pages around current
    ) {
      range.push(i);
    } else if (i === currentPage - delta - 1 || i === currentPage + delta + 1) {
      range.push("...");
    }
  }

  return range;
};

// Create a memoized wrapper component for SMSTable
const MemoizedSMSTable = memo(function MemoizedSMSTable({
  messages,
  onSort,
  sortConfig,
}: SMSTableProps) {
  return (
    <div className="rounded-md border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="py-3 px-4 text-left">Direction</th>
            <th className="py-3 px-4 text-left">From</th>
            <th className="py-3 px-4 text-left">To</th>
            <th className="py-3 px-4 text-left">Content</th>
            <th className="py-3 px-4 text-left">Campaign</th>
            <th className="py-3 px-4 text-left">Cost</th>
            <th className="py-3 px-4 text-left">Sent At</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((message) => (
            <tr key={message.id} className="border-b hover:bg-muted/50">
              <td className="py-3 px-4">
                <Badge
                  variant={
                    message.direction === "inbound" ? "default" : "secondary"
                  }
                >
                  {message.direction}
                </Badge>
              </td>
              <td className="py-3 px-4">{message.fromNumber}</td>
              <td className="py-3 px-4">{message.toNumber}</td>
              <td className="py-3 px-4 max-w-md truncate">{message.content}</td>
              <td className="py-3 px-4">{message.campaign?.name || "-"}</td>
              <td className="py-3 px-4">${message.smsCost}</td>
              <td className="py-3 px-4">
                {format(
                  new Date(message.sentAt || message.createdAt),
                  "MMM d, yyyy h:mm a",
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

// SMS Filters Component
const SMSFilters = memo(function SMSFilters({
  searchQuery,
  onSearchChange,
  direction,
  onDirectionChange,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  direction: string;
  onDirectionChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1">
        <Input
          placeholder="Search messages..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <Select value={direction} onValueChange={onDirectionChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Direction" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Messages</SelectItem>
          <SelectItem value="inbound">Inbound</SelectItem>
          <SelectItem value="outbound">Outbound</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
});

interface MetricsData {
  totalCalls: number;
  totalDuration: number;
  totalCost: number;
  averageDuration: number;
  averageCost: number;
  successRate: number;
  transferRate: number;
  // Add any other metrics fields that are needed
}

export default function SMSPage() {
  const { todayMetrics, metrics, isLoading, sms, smsError, clientInfo } =
    useInitialData();
  const { setCallDetailsOpen } = useUI();
  const { smsSearch: searchQuery, setSmsSearch: setSearchQuery } =
    usePreferences();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Define today and yesterday
  const today = new Date();
  const yesterday = subDays(today, 1);

  // Get search params
  const initialSearch = searchParams.get("search") || "";
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");

  // Add effect to handle search from URL
  useEffect(() => {
    const searchFromUrl = searchParams.get("search");
    if (searchFromUrl) {
      setSearchQuery(searchFromUrl);
    }
  }, [searchParams, setSearchQuery]);

  // Set initial date range if provided
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (fromDate && toDate) {
      return {
        from: new Date(fromDate),
        to: new Date(toDate),
      };
    }
    // Default to yesterday/today if no dates provided
    return {
      from: yesterday,
      to: today,
    };
  });

  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCampaignId, setSelectedCampaignId] = useState("all");
  const [direction, setDirection] = useState("all");

  // Add sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc" | null;
  }>({ key: "", direction: null });

  // Update the filteredMessages useMemo to include search filtering
  const filteredMessages = useMemo(() => {
    return (sms?.data || []).filter((message) => {
      const campaignMatch =
        selectedCampaignId === "all" ||
        message.campaignId === selectedCampaignId;

      // Add date range filtering
      const messageDate = new Date(message.sentAt || message.createdAt);
      const dateMatch =
        dateRange?.from && dateRange?.to
          ? messageDate >= dateRange.from &&
            messageDate <= new Date(dateRange.to.setHours(23, 59, 59, 999))
          : true;

      // Add direction filtering
      const directionMatch =
        direction === "all" || message.direction === direction;

      if (!searchQuery) return campaignMatch && dateMatch && directionMatch;

      // Convert search term to lowercase once
      const searchLower = searchQuery.toLowerCase();

      // Check all fields
      const searchMatch = Object.entries(message).some(([key, value]) => {
        if (value === null || value === undefined) return false;

        // Convert value to lowercase string for comparison
        const valueStr =
          typeof value === "object"
            ? JSON.stringify(value).toLowerCase()
            : String(value).toLowerCase();

        return valueStr.includes(searchLower);
      });

      return campaignMatch && dateMatch && directionMatch && searchMatch;
    });
  }, [sms?.data, selectedCampaignId, dateRange, direction, searchQuery]);

  // Move sorting logic before pagination
  const sortedAndFilteredMessages = useMemo(() => {
    let result = filteredMessages;

    // Apply sorting if configured
    if (sortConfig.key && sortConfig.direction) {
      result = [...result].sort((a, b) => {
        let aValue = a[sortConfig.key as keyof SMS];
        let bValue = b[sortConfig.key as keyof SMS];

        // Handle special cases for date fields
        if (sortConfig.key === "sentAt" || sortConfig.key === "createdAt") {
          aValue = new Date(aValue as string).getTime();
          bValue = new Date(bValue as string).getTime();
        }

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [filteredMessages, sortConfig]);

  // Update pagination to use sorted results
  const paginatedMessages = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedAndFilteredMessages.slice(startIndex, endIndex);
  }, [sortedAndFilteredMessages, currentPage, rowsPerPage]);

  // Add these calculations before the useEffect
  const totalFilteredMessages = sortedAndFilteredMessages.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalFilteredMessages / rowsPerPage),
  );

  // Ensure current page is within bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleDateRangeChange = (date: DateRange | undefined) => {
    setDateRange(date);
  };

  const exportToCsv = () => {
    if (!filteredMessages.length) return;

    // Convert messages to CSV format
    const headers = Object.keys(filteredMessages[0] || {}).join(",");
    const rows = filteredMessages.map((message) =>
      Object.values(message)
        .map((value) => {
          if (value === null || value === undefined) return "";
          if (typeof value === "object")
            return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(","),
    );
    const csv = [headers, ...rows].join("\n");

    // Create and trigger download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const fileName = `sms_${format(new Date(), "yyyyMMdd")}.csv`;

    try {
      // Modern browsers
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting CSV:", error);
    }
  };

  // Add handler for sorting
  const handleSort = (key: string, direction: "asc" | "desc" | null) => {
    setSortConfig({ key, direction });
  };

  return (
    <RootLayout
      topMetrics={getTopMetrics(todayMetrics?.data)}
      hideKnowledgeSearch
    >
      <div className="space-y-6">
        <div className="flex items-start justify-end gap-4">
          <CampaignSelect
            value={selectedCampaignId}
            onValueChange={setSelectedCampaignId}
            campaigns={clientInfo?.campaigns ?? []}
          />
          <DateRangePicker
            date={dateRange}
            onChange={handleDateRangeChange}
            defaultDate={{
              from: yesterday,
              to: today,
            }}
          />
        </div>

        <SMSFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          direction={direction}
          onDirectionChange={setDirection}
        />

        <div className="mt-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <p>Loading messages...</p>
            </div>
          ) : (
            <MemoizedSMSTable
              messages={paginatedMessages}
              onSort={handleSort}
              sortConfig={sortConfig}
            />
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <Select
              value={rowsPerPage.toString()}
              onValueChange={(value) => {
                setRowsPerPage(Number(value));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[180px] bg-white/80 backdrop-blur-sm border border-white/20">
                <SelectValue placeholder="Show rows" />
              </SelectTrigger>
              <SelectContent className="bg-white/80 backdrop-blur-sm border border-white/20 shadow-lg">
                <SelectItem value="25">Show 25 rows</SelectItem>
                <SelectItem value="50">Show 50 rows</SelectItem>
                <SelectItem value="100">Show 100 rows</SelectItem>
                <SelectItem value="200">Show 200 rows</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-gray-600">
              Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
              {Math.min(currentPage * rowsPerPage, totalFilteredMessages)} of{" "}
              {totalFilteredMessages} entries
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-md border disabled:opacity-50"
              >
                «
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-md border disabled:opacity-50"
              >
                ‹
              </button>

              {getPageNumbers(currentPage, totalPages).map((page, index) => (
                <button
                  key={index}
                  onClick={() =>
                    typeof page === "number" && setCurrentPage(page)
                  }
                  disabled={page === currentPage || page === "..."}
                  className={`px-3 py-2 rounded-md border ${
                    page === currentPage
                      ? "bg-primary text-white border-primary"
                      : page === "..."
                        ? "border-transparent cursor-default"
                        : "hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-md border disabled:opacity-50"
              >
                ›
              </button>
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-md border disabled:opacity-50"
              >
                »
              </button>
            </div>
            <button
              onClick={exportToCsv}
              className="px-4 py-2 bg-emerald-400 text-white rounded-md flex items-center gap-2 ml-4"
            >
              <DownloadIcon className="w-4 h-4" />
              Export
            </button>
          </div>
        </div>
      </div>
    </RootLayout>
  );
}
