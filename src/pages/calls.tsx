import { useState, useMemo, useCallback, memo, useEffect } from 'react'
import { RootLayout } from '@/components/layout/root-layout'
import { CallsTable } from '@/components/calls/calls-table'
import { CallMetrics } from '@/components/calls/call-metrics'
import { CallFilters } from '@/components/calls/call-filters'
import { CallDetails } from '@/components/calls/call-details'
import { DateRange } from 'react-day-picker'
import { useUI } from '@/contexts/ui-context'
import { usePreferences } from '@/contexts/preferences-context'
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
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { subDays } from 'date-fns'
import { getTopMetrics } from '@/lib/metrics'

interface CallsTableProps {
  calls: Call[];
  onCallSelect: (call: Call) => void;
  showTestCalls: boolean;
  showConnectedOnly?: boolean;
  onSort: (key: string, direction: 'asc' | 'desc' | null) => void;
  sortConfig: {
    key: string;
    direction: 'asc' | 'desc' | null;
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
  showConnectedOnly,
  onSort,
  sortConfig
}: CallsTableProps) {
  return (
    <CallsTable
      calls={calls}
      onCallSelect={onCallSelect}
      showTestCalls={showTestCalls}
      showConnectedOnly={showConnectedOnly}
      onSort={onSort}
      sortConfig={sortConfig}
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
  const { 
    todayMetrics, 
    metrics, 
    isLoading, 
    isCallsLoading,
    calls, 
    callsError, 
    clientInfo 
  } = useInitialData();
  const { setCallDetailsOpen } = useUI();
  const { 
    showTestCalls,
    setShowTestCalls,
    showConnectedOnly,
    setShowConnectedOnly,
    callSearch: searchQuery,
    setCallSearch: setSearchQuery
  } = usePreferences();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Define today and yesterday
  const today = new Date();
  const yesterday = subDays(today, 1);

  // Get search params
  const initialSearch = searchParams.get('search') || '';
  const fromDate = searchParams.get('from');
  const toDate = searchParams.get('to');

  // Set initial date range if provided
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    if (fromDate && toDate) {
      return {
        from: new Date(fromDate),
        to: new Date(toDate)
      };
    }
    // Default to yesterday/today if no dates provided
    return {
      from: yesterday,
      to: today
    };
  });

  // Move the dateRange state after useInitialData to ensure we have the calls data
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
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

  // Add sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc' | null;
  }>({ key: '', direction: null });

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
      
      // Add date range filtering
      const callDate = new Date(call.createdAt);
      const dateMatch = dateRange?.from && dateRange?.to 
        ? callDate >= dateRange.from && callDate <= new Date(dateRange.to.setHours(23, 59, 59, 999))
        : true;
      
      const testMatch = showTestCalls || !call.testFlag;

      // Add connected calls filtering
      const connectedMatch = !showConnectedOnly || ![
        'Busy/No Answer',
        'Voicemail',
        'Telephony Block',
        'Customer Did Not Answer',
        'Pipeline Error'
      ].includes(call.disposition);
      
      if (!searchQuery) return campaignMatch && dateMatch && testMatch && connectedMatch;

      // Convert search term to lowercase once
      const searchLower = searchQuery.toLowerCase();
      const searchDigits = searchQuery.replace(/\D/g, '');

      // Check phone number fields first
      if (call.callerId) {
        const callerIdDigits = call.callerId.replace(/\D/g, '');
        if (callerIdDigits === searchDigits) return true;
      }

      // Then check all other fields
      const searchMatch = Object.entries(call).some(([key, value]) => {
        if (value === null || value === undefined) return false;
        
        // Convert value to lowercase string for comparison
        const valueStr = typeof value === 'object' 
          ? JSON.stringify(value).toLowerCase()
          : String(value).toLowerCase();
          
        return valueStr.includes(searchLower);
      });
      
      return campaignMatch && dateMatch && testMatch && connectedMatch && searchMatch;
    });
  }, [calls?.data, selectedCampaignId, dateRange, showTestCalls, showConnectedOnly, searchQuery]);

  // Move sorting logic before pagination
  const sortedAndFilteredCalls = useMemo(() => {
    let result = filteredCalls;

    // Apply sorting if configured
    if (sortConfig.key && sortConfig.direction) {
      result = [...result].sort((a, b) => {
        let aValue = a[sortConfig.key as keyof Call];
        let bValue = b[sortConfig.key as keyof Call];

        // Handle special cases for date fields
        if (sortConfig.key === 'createdAt') {
          aValue = new Date(aValue as string).getTime();
          bValue = new Date(bValue as string).getTime();
        }

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [filteredCalls, sortConfig]);

  // Update pagination to use sorted results
  const paginatedCalls = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedAndFilteredCalls.slice(startIndex, endIndex);
  }, [sortedAndFilteredCalls, currentPage, rowsPerPage]);

  // Add these calculations before the useEffect
  const totalFilteredCalls = sortedAndFilteredCalls.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCalls / rowsPerPage));

  // Ensure current page is within bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleCallSelect = useCallback((call: Call) => {
    setSelectedCall(call);
    setCallDetailsOpen(true);
    // Add call ID to URL without navigation
    navigate(`?id=${call.id}`, { replace: true });
  }, [setCallDetailsOpen, navigate]);

  const handleCallClose = useCallback(() => {
    setCallDetailsOpen(false);
    setSelectedCall(null);
    // Remove call ID from URL
    navigate('', { replace: true });
  }, [setCallDetailsOpen, navigate]);

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

  // Add effect to handle initial URL with call ID
  useEffect(() => {
    const callId = searchParams.get('id');
    if (callId && calls?.data) {
      const call = calls.data.find(c => c.id === callId);
      if (call) {
        setSelectedCall(call);
        setCallDetailsOpen(true);
      }
    }
  }, [calls?.data, searchParams, setCallDetailsOpen]);

  // Add handler for sorting
  const handleSort = (key: string, direction: 'asc' | 'desc' | null) => {
    setSortConfig({ key, direction });
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
            <SelectContent className="bg-white border shadow-md">
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
            defaultDate={{
              from: yesterday,
              to: today
            }}
            minDate={calls?.data?.[calls.data.length - 1]?.createdAt 
              ? new Date(calls.data[calls.data.length - 1].createdAt) 
              : undefined}
          />
        </div>

        <CallFilters 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          showTestCalls={showTestCalls}
          onTestCallsChange={setShowTestCalls}
          showConnectedOnly={showConnectedOnly}
          onConnectedOnlyChange={setShowConnectedOnly}
        />

        <div className="mt-0">
          {isCallsLoading ? (
            <div className="flex items-center justify-center h-64">
              <p>Loading calls...</p>
            </div>
          ) : (
            <MemoizedCallsTable 
              calls={paginatedCalls}
              onCallSelect={handleCallSelect}
              showTestCalls={showTestCalls}
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