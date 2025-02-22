import { useState, useMemo, useRef, useEffect } from "react";
import { RootLayout } from "@/components/layout/root-layout";
import { useInitialData } from "@/hooks/use-client-data";
import { CustomerFilters } from "@/components/customers/customer-filters";
import { CustomersTable } from "@/components/customers/customers-table";
import { DownloadIcon } from "@radix-ui/react-icons";
import { useLocation } from "react-router-dom";
import { usePreferences } from "@/contexts/preferences-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, formatDuration } from "date-fns";
import { getTopMetrics } from "@/lib/metrics";
import { TableRef } from "@/components/customers/customers-table";
import { Customer, CustomData } from "@/types/customers";

interface Campaign {
  campaign_id: string;
  campaign_name: string;
  campaign_status: string;
}

interface FormattedCustomer extends Customer {
  customData?: CustomData;
  campaigns?: Campaign[];
}

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
      range.push("...");
    }
  }

  return range;
};

export default function CustomersPage() {
  const { customers, isCustomersLoading, todayMetrics } = useInitialData();
  const location = useLocation();
  const {
    customerColumns: activeColumnKeys,
    setCustomerColumns: setActiveColumnKeys,
    customerSearch: searchQuery,
    setCustomerSearch: setSearchQuery,
  } = usePreferences();
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const customersTable = useRef<TableRef>(null);

  // Add pagination states
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Add sorting state at the page level
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc" | null;
  }>({ key: "last-contact", direction: "desc" });

  // Generate available columns
  const availableColumns = useMemo(() => {
    const defaultColumns = [
      { key: "customer", label: "Customer" },
      { key: "contact", label: "Contact" },
      { key: "location", label: "Location" },
      { key: "campaigns", label: "Active Campaigns" },
      { key: "calls", label: "Total Calls" },
      { key: "last-contact", label: "Last Contact" },
    ];

    // Create a Set of existing keys to prevent duplicates
    const existingKeys = new Set(defaultColumns.map((col) => col.key));

    // Filter out duplicate data fields and transform them
    const dataColumns = (customers?.dataFields || [])
      .filter((field: string) => !existingKeys.has(`data_${field}`)) // Filter out duplicates
      .map((field: string) => {
        const key = `data_${field}`;
        existingKeys.add(key); // Add to set of existing keys
        return {
          key,
          label: field
            .replace(/([A-Z])/g, " $1")
            .split(/(?=[A-Z])/)
            .map(
              (word: string) =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
            )
            .join(" ")
            .replace(/\b(Id|Sf)\b/gi, (match: string) => match.toUpperCase()),
        };
      });

    return [...defaultColumns, ...dataColumns].map((col) => ({
      ...col,
      isActive: activeColumnKeys.includes(col.key),
    }));
  }, [customers?.dataFields, activeColumnKeys]);

  // Handle column toggling
  const handleColumnToggle = (columnKey: string) => {
    setActiveColumnKeys((prev) => {
      if (prev.includes(columnKey)) {
        // Don't allow removing the last column
        if (prev.length <= 1) return prev;
        return prev.filter((key) => key !== columnKey);
      } else {
        return [...prev, columnKey];
      }
    });
  };

  // Add this effect to initialize columns when data is loaded
  useEffect(() => {
    if (!isCustomersLoading && customers?.customers) {
      // Force a re-render to update the columns
      setForceUpdate((prev) => !prev);
    }
  }, [isCustomersLoading, customers]);

  // Add this state to force re-renders
  const [forceUpdate, setForceUpdate] = useState(false);

  // Add debounce effect for search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update this effect to use location and handle URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchFromUrl = params.get("search");
    if (searchFromUrl) {
      // Format the phone number for display
      const formattedNumber = searchFromUrl.startsWith("+")
        ? searchFromUrl
        : `+${searchFromUrl}`;
      setSearchQuery(formattedNumber);
      setDebouncedSearch(formattedNumber); // Immediately set debounced value for URL params
    }
  }, [location.search, setSearchQuery]); // React to URL changes

  const formattedCustomers = useMemo(() => {
    if (!customers?.customers) return [];

    return customers.customers
      .filter((customer: FormattedCustomer) => {
        // Filter out placeholder/empty records
        if (!customer || !customer.id) return false;
        if (
          customer.firstName === "firstName" &&
          customer.lastName === "lastName"
        )
          return false;
        if (customer.email === "email" && customer.callerId === "phone")
          return false;

        if (!debouncedSearch) return true;

        // Convert search term to lowercase once
        const searchLower = debouncedSearch.toLowerCase();
        const searchDigits = debouncedSearch.replace(/\D/g, "");

        // Check phone number first for better performance
        if (customer.callerId && customer.callerId !== "phone") {
          const callerIdDigits = customer.callerId.replace(/\D/g, "");
          if (callerIdDigits === searchDigits) return true;
        }

        // Check basic fields
        const basicFieldsMatch = [
          customer.firstName !== "firstName" ? customer.firstName : null,
          customer.lastName !== "lastName" ? customer.lastName : null,
          customer.email !== "email" ? customer.email : null,
          customer.state !== "state" ? customer.state : null,
          customer.postalCode,
        ].some((field) => {
          if (!field) return false;
          const fieldLower = field.toLowerCase();
          return fieldLower.includes(searchLower);
        });

        if (basicFieldsMatch) return true;

        // Only check custom fields if no match found in basic fields
        return activeColumnKeys
          .filter((key) => key.startsWith("data_"))
          .some((key) => {
            const field = key.replace("data_", "");
            const value =
              customer.customData?.[field] ?? customer[field as keyof Customer];
            if (!value || value === "null") return false;
            const valueLower = String(value).toLowerCase();
            return valueLower.includes(searchLower);
          });
      })
      .map((customer: FormattedCustomer) => ({
        ...customer,
        campaigns: customer.campaigns?.map((campaign: Campaign) => ({
          campaign_id: campaign.campaign_id,
          campaign_name: campaign.campaign_name,
          campaign_status: campaign.campaign_status,
        })),
      }));
  }, [customers, debouncedSearch, activeColumnKeys]);

  // Move sorting logic before pagination
  const sortedAndFilteredCustomers = useMemo(() => {
    let result = formattedCustomers;

    // Apply sorting if configured
    if (sortConfig.key && sortConfig.direction) {
      result = [...result].sort((a, b) => {
        let aValue: any, bValue: any;

        switch (sortConfig.key) {
          case "customer":
            aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
            bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
            break;
          case "contact":
            aValue = a.callerId || "";
            bValue = b.callerId || "";
            break;
          case "location":
            aValue = [a.state, a.timezone, a.postalCode]
              .filter(Boolean)
              .join(",");
            bValue = [b.state, b.timezone, b.postalCode]
              .filter(Boolean)
              .join(",");
            break;
          case "campaigns":
            aValue = a.campaigns?.[0]?.campaign_status || "";
            bValue = b.campaigns?.[0]?.campaign_status || "";
            break;
          case "calls":
            aValue = a.totalCalls || 0;
            bValue = b.totalCalls || 0;
            break;
          case "last-contact":
            aValue = a.lastCallDate || "";
            bValue = b.lastCallDate || "";
            break;
          default:
            // Handle data field columns
            if (sortConfig.key.startsWith("data_")) {
              const field = sortConfig.key.replace("data_", "");
              aValue =
                a.customData?.[field] ?? a[field as keyof Customer] ?? "";
              bValue =
                b.customData?.[field] ?? b[field as keyof Customer] ?? "";

              // Convert to numbers if possible for proper numeric sorting
              if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
                aValue = Number(aValue);
                bValue = Number(bValue);
              } else {
                // Convert to lowercase strings for case-insensitive sorting
                aValue = String(aValue).toLowerCase();
                bValue = String(bValue).toLowerCase();
              }
            }
            break;
        }

        // Handle undefined/null values
        if (aValue === undefined || aValue === null) aValue = "";
        if (bValue === undefined || bValue === null) bValue = "";

        return sortConfig.direction === "asc"
          ? aValue > bValue
            ? 1
            : aValue < bValue
              ? -1
              : 0
          : aValue < bValue
            ? 1
            : aValue > bValue
              ? -1
              : 0;
      });
    }

    return result;
  }, [formattedCustomers, sortConfig]);

  // Update pagination calculations to use sorted results
  const totalFilteredCustomers = sortedAndFilteredCustomers.length;
  const totalPages = Math.max(
    1,
    Math.ceil(totalFilteredCustomers / rowsPerPage),
  );

  // Get paginated customers from sorted results
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const endIndex = startIndex + rowsPerPage;
    return sortedAndFilteredCustomers.slice(startIndex, endIndex);
  }, [sortedAndFilteredCustomers, currentPage, rowsPerPage]);

  // Add handler for sorting
  const handleSort = (key: string, direction: "asc" | "desc" | null) => {
    setSortConfig({ key, direction });
  };

  // Export function
  const exportToCsv = () => {
    // Get only the visible columns
    const visibleColumns = customersTable.current?.availableColumns || [];

    // Create headers array including special columns
    const headers = [
      ...visibleColumns.map((col: { key: string; label: string }) => col.label),
      "Do Not Contact",
      "SMS Consent",
    ];

    // Create rows array with visible data
    const rows = formattedCustomers.map((customer: FormattedCustomer) => {
      const rowData = visibleColumns.map(
        (col: { key: string; label: string }) => {
          switch (col.key) {
            case "customer":
              return `"${customer.firstName} ${customer.lastName || ""}"`;
            case "contact":
              return `"${customer.callerId || ""}${customer.email ? `, ${customer.email}` : ""}"`;
            case "location": {
              const location = [
                customer.state,
                customer.timezone,
                customer.postalCode,
              ]
                .filter(Boolean)
                .join(", ");
              return `"${location || "-"}"`;
            }
            case "campaigns": {
              const campaigns = customer.campaigns
                ?.map((c: Campaign) => c.campaign_name)
                .join(", ");
              return `"${campaigns || "-"}"`;
            }
            case "calls":
              return customer.totalCalls?.toString() || "0";
            case "last-contact":
              return customer.lastCallDate || "-";
            default:
              // Handle custom columns
              if (col.key.startsWith("data_")) {
                const field = col.key.replace("data_", "");
                const value =
                  customer.customData?.[field] ??
                  customer[field as keyof Customer];
                if (
                  value === null ||
                  value === undefined ||
                  value === "null" ||
                  value === ""
                )
                  return '"-"';
                if (typeof value === "boolean")
                  return `"${value ? "Yes" : "No"}"`;
                if (typeof value === "object") {
                  const stringified = JSON.stringify(value);
                  return `"${stringified === "null" ? "-" : stringified}"`;
                }
                return `"${String(value) === "null" ? "-" : String(value)}"`;
              }
              return '"-"';
          }
        },
      );

      // Add special columns
      rowData.push(
        customer.doNotContact ? "Yes" : "No",
        customer.smsConsent ? "Yes" : "No",
      );

      return rowData.join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const fileName = `customers_${format(new Date(), "yyyyMMdd")}.csv`;

    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    <RootLayout
      topMetrics={getTopMetrics(todayMetrics)}
      hideKnowledgeSearch={true}
    >
      <div className="space-y-6">
        <CustomerFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          availableColumns={availableColumns}
          activeColumns={activeColumnKeys}
          onColumnToggle={handleColumnToggle}
          isLoading={isCustomersLoading}
        />

        {!customers?.customers.length ? (
          <div className="flex items-center justify-center h-64">
            <p>No customers found.</p>
          </div>
        ) : (
          <>
            <CustomersTable
              ref={customersTable}
              customers={paginatedCustomers}
              dataFields={customers?.dataFields || []}
              onCustomerSelect={(customer: Customer) => {
                console.log("Selected customer:", customer);
              }}
              onSort={handleSort}
              sortConfig={sortConfig}
              activeColumnKeys={activeColumnKeys}
              onColumnToggle={handleColumnToggle}
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
                  Showing {(currentPage - 1) * rowsPerPage + 1} to{" "}
                  {Math.min(currentPage * rowsPerPage, totalFilteredCustomers)}{" "}
                  of {totalFilteredCustomers} entries
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
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(1, prev - 1))
                    }
                    disabled={currentPage === 1}
                    className="px-3 py-2 rounded-md border disabled:opacity-50"
                  >
                    ‹
                  </button>

                  {getPageNumbers(currentPage, totalPages).map(
                    (page, index) => (
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
                    ),
                  )}

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
          </>
        )}
      </div>
    </RootLayout>
  );
}
