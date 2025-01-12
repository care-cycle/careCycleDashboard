import { useState, useMemo, useCallback, memo, useEffect } from 'react'
import { RootLayout } from '@/components/layout/root-layout'
import { CallsTable } from '@/components/calls/calls-table'
import { CallMetrics } from '@/components/calls/call-metrics'
import { CallFilters } from '@/components/calls/call-filters'
import { CallDetails } from '@/components/calls/call-details'
import { DateRange } from 'react-day-picker'
import { useUI } from '@/contexts/ui-context'
import { Call } from '@/types/calls'
import { useInitialData } from '@/hooks/use-client-data'
import { formatDuration } from '@/lib/utils'
import { DownloadIcon } from '@radix-ui/react-icons'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format } from 'date-fns'
import { DateRangePicker } from '@/components/date-range-picker'
import { CampaignSelect } from '@/components/campaign-select'

interface CallsTableProps {
  calls: Call[];
  onCallSelect: (call: Call) => void;
  showTestCalls: boolean;
  showConnectedOnly?: boolean;
}

const getTopMetrics = (todayMetrics: any) => [
  { 
    title: "Total Calls", 
    value: todayMetrics?.uniqueCalls?.toLocaleString() || "0" 
  },
  { 
    title: "Total Spend", 
    value: todayMetrics?.totalSpend ? `$${todayMetrics.totalSpend.toFixed(2)}` : "$0.00" 
  },
  { 
    title: "Total Duration", 
    value: todayMetrics?.totalDurationMs ? formatDuration(todayMetrics.totalDurationMs) : "0s"
  },
  { 
    title: "Avg Duration", 
    value: todayMetrics?.averageDurationMs ? formatDuration(todayMetrics.averageDurationMs) : "0s"
  }
]

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
      range.push('...');
    }
  }
  
  return range;
};

// Create a memoized wrapper component for CallsTable
const MemoizedCallsTable = memo(function MemoizedCallsTable({
  calls,
  onCallSelect,
  showTestCalls,
  showConnectedOnly
}: CallsTableProps) {
  return (
    <CallsTable
      calls={calls}
      onCallSelect={onCallSelect}
      showTestCalls={showTestCalls}
      showConnectedOnly={showConnectedOnly}
    />
  );
});

// Create a memoized wrapper component for CallDetails
const MemoizedCallDetails = memo(function MemoizedCallDetails({
  call,
  onClose
}: {
  call: Call;
  onClose: () => void;
}) {
  return <CallDetails call={call} onClose={onClose} />;
});

export default function CallsPage() {
  const { todayMetrics, metrics, isLoading, calls, callsError, clientInfo } = useInitialData();

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (!calls?.data?.length) return undefined;
    
    // Sort calls by date and get the first one
    const sortedCalls = [...calls.data].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    const firstCallDate = new Date(sortedCalls[0].createdAt);
    const today = new Date();
    
    return {
      from: firstCallDate,
      to: today
    };
  });

  // Move the dateRange state after useInitialData to ensure we have the calls data
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const { setCallDetailsOpen } = useUI();
  const [showTestCalls, setShowTestCalls] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCampaignType, setSelectedCampaignType] = useState(() => {
    // If there's exactly one campaign, use its type, otherwise use 'all'
    return clientInfo?.campaigns?.length === 1 
      ? clientInfo.campaigns[0].type 
      : "all";
  });
  const [selectedCampaignId, setSelectedCampaignId] = useState(() => {
    // If there's exactly one campaign, use its ID, otherwise use 'all'
    return clientInfo?.campaigns?.length === 1 
      ? clientInfo.campaigns[0].id 
      : "all";
  });

  // Add this function to handle campaign changes
  const handleCampaignChange = (campaignId: string) => {
    setSelectedCampaignId(campaignId);
  };

  // At the top of your component, define the campaign options
  const campaignOptions = useMemo(() => {
    if (!clientInfo?.campaigns) return [];
    
    return [
      { value: "all", label: "All Campaigns" },
      ...clientInfo.campaigns.map(campaign => ({
        value: campaign.id,
        label: campaign.name || campaign.description
      }))
    ];
  }, [clientInfo?.campaigns]);

  // Update the filteredCalls useMemo to include search filtering
  const filteredCalls = useMemo(() => {
    return (calls?.data || []).filter(call => {
      const campaignMatch = selectedCampaignId === "all" || call.campaignId === selectedCampaignId;
      const dateMatch = true; // your existing date matching logic
      const testMatch = showTestCalls || !call.testFlag;
      
      // Add search filtering
      const searchMatch = !searchQuery || Object.values(call).some(value => {
        if (value === null || value === undefined) return false;
        
        // Handle nested objects by converting to string
        const searchStr = typeof value === 'object' 
          ? JSON.stringify(value).toLowerCase()
          : String(value).toLowerCase();
          
        return searchStr.includes(searchQuery.toLowerCase());
      });
      
      return campaignMatch && dateMatch && testMatch && searchMatch;
    });
  }, [calls?.data, selectedCampaignId, showTestCalls, searchQuery]); // Add searchQuery to dependencies

  // Step 2: Calculate pagination values based on filtered results
  const totalFilteredCalls = filteredCalls.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCalls / rowsPerPage));
  
  // Step 3: Get the paginated slice of filtered data
  const paginatedCalls = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return filteredCalls.slice(startIndex, endIndex);
  }, [filteredCalls, currentPage, rowsPerPage]);

  // Ensure current page is within bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleCallSelect = useCallback((call: Call) => {
    setSelectedCall(call);
    setCallDetailsOpen(true);
  }, [setCallDetailsOpen]);

  const handleCallClose = useCallback(() => {
    setCallDetailsOpen(false);
    setSelectedCall(null);
  }, [setCallDetailsOpen]);

  const handleDateRangeChange = (date: DateRange | undefined) => {
    setDateRange(date)
  }

  const exportToCsv = () => {
    // Convert calls to CSV format
    const headers = Object.keys(filteredCalls[0] || {}).join(',');
    const rows = filteredCalls.map(call => 
      Object.values(call).map(value => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    );
    const csv = [headers, ...rows].join('\n');

    // Create and trigger download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const fileName = `calls_${format(new Date(), 'yyyyMMdd')}.csv`;
    
    if (navigator.msSaveBlob) { // IE 10+
      navigator.msSaveBlob(blob, fileName);
    } else {
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <RootLayout topMetrics={getTopMetrics(todayMetrics)} hideKnowledgeSearch>
      <div className="space-y-6">
        {selectedCall && (
          <MemoizedCallDetails 
            key={selectedCall.id}
            call={selectedCall} 
            onClose={handleCallClose} 
          />
        )}
        
        <div className="flex items-start justify-end gap-4">
          <Select
            value={selectedCampaignId}
            onValueChange={setSelectedCampaignId}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Campaign" />
            </SelectTrigger>
            <SelectContent>
              {campaignOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangePicker
            date={dateRange}
            onChange={handleDateRangeChange}
          />
        </div>

        <CallFilters 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showTestCalls={showTestCalls}
          onTestCallsChange={setShowTestCalls}
        />

        <MemoizedCallsTable 
          calls={paginatedCalls}
          onCallSelect={handleCallSelect}
          showTestCalls={showTestCalls}
        />

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
              Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalFilteredCalls)} of {totalFilteredCalls} entries
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
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-md border disabled:opacity-50"
              >
                ‹
              </button>
              
              {getPageNumbers(currentPage, totalPages).map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' && setCurrentPage(page)}
                  disabled={page === currentPage || page === '...'}
                  className={`px-3 py-2 rounded-md border ${
                    page === currentPage 
                      ? 'bg-primary text-white border-primary' 
                      : page === '...' 
                        ? 'border-transparent cursor-default'
                        : 'hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
  )
}