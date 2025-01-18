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
import { format } from 'date-fns'

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
  const { customers, isCustomersLoading } = useInitialData();
  const [searchQuery, setSearchQuery] = useState("");
  const customersTable = useRef(null);

  // Add pagination states
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  const formattedCustomers = useMemo(() => {
    if (!customers?.customers) return [];
    
    return customers.customers
      .filter(customer => {
        if (!customer || !customer.id) return false;
        
        if (searchQuery) {
          const searchLower = searchQuery.toLowerCase();
          return (
            customer.firstName?.toLowerCase().includes(searchLower) ||
            customer.lastName?.toLowerCase().includes(searchLower) ||
            customer.callerId?.includes(searchQuery) ||
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

  // Add pagination calculations
  const totalFilteredCustomers = formattedCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalFilteredCustomers / rowsPerPage));

  // Get paginated customers
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return formattedCustomers.slice(startIndex, endIndex);
  }, [formattedCustomers, currentPage, rowsPerPage]);

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
      <RootLayout>
        <div className="flex items-center justify-center h-64">
          <p>Loading customers...</p>
        </div>
      </RootLayout>
    );
  }

  return (
    <RootLayout hideKnowledgeSearch={true}>
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
