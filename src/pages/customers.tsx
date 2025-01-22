import { useState, useMemo, useRef } from 'react'
import { RootLayout } from '@/components/layout/root-layout'
import { useInitialData } from '@/hooks/use-client-data'
import { CustomerFilters } from '@/components/customers/customer-filters'
import { CustomersTable } from '@/components/customers/customers-table'
import { DownloadIcon } from '@radix-ui/react-icons'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { format, formatDuration } from 'date-fns'
import { getTopMetrics } from '@/lib/metrics'

// Helper function for pagination numbers
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

export default function CustomersPage() {
  const { customers, isCustomersLoading, todayMetrics } = useInitialData();
  const [searchQuery, setSearchQuery] = useState("");
  const customersTable = useRef(null);

  // Add pagination states
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Add sorting state at the page level
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc' | null;
  }>({ key: '', direction: null });

  const formattedCustomers = useMemo(() => {
    if (!customers?.customers) return [];
    
    return customers.customers
      .filter(customer => {
        if (!customer || !customer.id) return false;
        
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          // Normalize the callerId by removing spaces and dashes for comparison
          const normalizedCallerId = customer.callerId?.replace(/[\s-]/g, '') || '';
          const normalizedSearch = searchQuery.replace(/[\s-]/g, '');
          
          return (
            customer.firstName?.toLowerCase().includes(searchLower) ||
            customer.lastName?.toLowerCase().includes(searchLower) ||
            normalizedCallerId.includes(normalizedSearch) ||
            customer.email?.toLowerCase().includes(searchLower) ||
            customer.state?.toLowerCase().includes(searchLower) ||
            customer.postalCode?.includes(searchQuery) ||
            Object.values(customer.customData || {}).some(value => 
              String(value).toLowerCase().includes(searchLower)
            )
          );
        }
        
        return true;
      })
      .map(customer => ({
        ...customer,
        campaigns: customer.campaigns?.map(campaign => ({
          campaign_id: campaign.campaign_id,
          campaign_name: campaign.campaign_name,
          campaign_status: campaign.campaign_status
        }))
      }));
  }, [customers, searchQuery]);

  // Move sorting logic before pagination
  const sortedAndFilteredCustomers = useMemo(() => {
    let result = formattedCustomers;

    // Apply sorting if configured
    if (sortConfig.key && sortConfig.direction) {
      result = [...result].sort((a, b) => {
        let aValue, bValue;
        
        switch (sortConfig.key) {
          case 'customer':
            aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
            bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
            break;
          case 'contact':
            aValue = a.callerId || '';
            bValue = b.callerId || '';
            break;
          case 'location':
            aValue = [a.state, a.timezone, a.postalCode].filter(Boolean).join(',');
            bValue = [b.state, b.timezone, b.postalCode].filter(Boolean).join(',');
            break;
          case 'campaigns':
            aValue = a.campaigns?.[0]?.campaign_status || '';
            bValue = b.campaigns?.[0]?.campaign_status || '';
            break;
          case 'calls':
            aValue = a.totalCalls || 0;
            bValue = b.totalCalls || 0;
            break;
          case 'last-contact':
            aValue = a.lastCallDate || '';
            bValue = b.lastCallDate || '';
            break;
          default:
            if (sortConfig.key.startsWith('custom_')) {
              const customKey = sortConfig.key.replace('custom_', '');
              aValue = a.customData?.[customKey] || '';
              bValue = b.customData?.[customKey] || '';
            } else {
              return 0;
            }
        }

        return sortConfig.direction === 'asc' 
          ? aValue > bValue ? 1 : -1
          : aValue < bValue ? 1 : -1;
      });
    }

    return result;
  }, [formattedCustomers, sortConfig]);

  // Update pagination calculations to use sorted results
  const totalFilteredCustomers = sortedAndFilteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCustomers / rowsPerPage));

  // Get paginated customers from sorted results
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedAndFilteredCustomers.slice(startIndex, endIndex);
  }, [sortedAndFilteredCustomers, currentPage, rowsPerPage]);

  // Add handler for sorting
  const handleSort = (key: string, direction: 'asc' | 'desc' | null) => {
    setSortConfig({ key, direction });
  };

  // Add export function
  const exportToCsv = () => {
    // Get only the visible columns
    const visibleColumns = customersTable.current?.activeColumnKeys || [];
    
    // Create headers array including special columns
    const headers = [
      ...visibleColumns.map(key => {
        const column = customersTable.current?.availableColumns.find(col => col.key === key);
        return column?.label || key;
      }),
      'Do Not Contact',
      'SMS Consent'
    ];

    // Create rows array with visible data
    const rows = formattedCustomers.map(customer => {
      const rowData = visibleColumns.map(key => {
        switch (key) {
          case 'customer':
            return `"${customer.firstName} ${customer.lastName}"`;
          case 'contact':
            return `"${customer.callerId}${customer.email ? `, ${customer.email}` : ''}"`;
          case 'location':
            return `"${[customer.state, customer.timezone, customer.postalCode].filter(Boolean).join(', ')}"`;
          case 'campaigns':
            return `"${customer.campaigns?.map(c => c.campaign_name).join(', ') || ''}"`;
          case 'calls':
            return customer.totalCalls?.toString() || '0';
          case 'last-contact':
            return customer.lastCallDate || '';
          default:
            // Handle custom columns
            if (key.startsWith('custom_')) {
              const customKey = key.replace('custom_', '');
              return `"${customer.customData?.[customKey] || ''}"`;
            }
            return '';
        }
      });

      // Add special columns
      rowData.push(
        customer.doNotContact ? 'Yes' : 'No',
        customer.smsConsent ? 'Yes' : 'No'
      );

      return rowData.join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const fileName = `customers_${format(new Date(), 'yyyyMMdd')}.csv`;
    
    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(blob, fileName);
    } else {
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (isCustomersLoading) {
    return (
      <RootLayout topMetrics={getTopMetrics(todayMetrics)}>
        <div className="flex items-center justify-center h-64">
          <p>Loading customers...</p>
        </div>
      </RootLayout>
    );
  }

  return (
    <RootLayout topMetrics={getTopMetrics(todayMetrics)} hideKnowledgeSearch={true}>
      <div className="space-y-6">
        <CustomerFilters 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          availableColumns={customersTable.current?.availableColumns || []}
          activeColumns={customersTable.current?.activeColumnKeys || []}
          onColumnToggle={(columnKey) => customersTable.current?.handleColumnToggle(columnKey)}
        />
        
        {!formattedCustomers.length ? (
          <div className="flex items-center justify-center h-64">
            <p>No customers found.</p>
          </div>
        ) : (
          <>
            <CustomersTable 
              ref={customersTable}
              customers={paginatedCustomers}
              onCustomerSelect={(customer) => {
                console.log('Selected customer:', customer);
              }}
              onSort={handleSort}
              sortConfig={sortConfig}
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
                  Showing {((currentPage - 1) * rowsPerPage) + 1} to {Math.min(currentPage * rowsPerPage, totalFilteredCustomers)} of {totalFilteredCustomers} entries
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
          </>
        )}
      </div>
    </RootLayout>
  );
}
