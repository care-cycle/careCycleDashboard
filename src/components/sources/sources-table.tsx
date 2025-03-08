import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/lib/utils";
import { PhoneForwarded, FileDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Add Clerk types to window object
declare global {
  interface Window {
    Clerk?: {
      session: Promise<{
        getToken: () => Promise<string | null>;
      } | null>;
    };
  }
}

interface Source {
  sourceId: string;
  name: string;
  total_calls: number;
  billable_calls: number;
  billable_percentage: number;
  spend: number;
  new_transfers: number;
  new_calls: number;
  new_transfer_percentage: number;
  appointment_transfers: number;
  appointment_calls: number;
  appointment_transfer_percentage: number;
  total_transfers: number;
  total_transfer_percentage: number;
  billable_transfers: number;
  billable_transfer_rate: number;
  converted_calls: number;
  transfer_conversion_rate: number;
  cost_per_acquisition: number;
}

interface SourcesTableProps {
  sources: Source[];
}

function MetricCell({
  numerator,
  denominator,
  percentage,
}: {
  numerator: number;
  denominator: number;
  percentage: number;
}) {
  // Handle undefined, null, or NaN values
  const safeNumerator =
    typeof numerator === "number" && !isNaN(numerator) ? numerator : 0;
  const safeDenominator =
    typeof denominator === "number" && !isNaN(denominator) ? denominator : 0;
  const safePercentage =
    typeof percentage === "number" && !isNaN(percentage) ? percentage : 0;

  return (
    <div className="space-y-1">
      <div className="text-right">
        <span className="font-medium">{safeNumerator.toLocaleString()}</span>
        <span className="text-muted-foreground">
          /{safeDenominator.toLocaleString()}
        </span>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Progress value={safePercentage} className="w-[60px]" />
        <span className="text-sm text-muted-foreground w-[36px] text-right">
          {safePercentage}%
        </span>
      </div>
    </div>
  );
}

export function SourcesTable({ sources: initialSources }: SourcesTableProps) {
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc" | null;
  }>({ key: "", direction: null });

  const columns = [
    { key: "name", label: "Source Name" },
    { key: "spend", label: "Spend" },
    { key: "billable_calls", label: "Billable Calls" },
    { key: "new_transfers", label: "Transfers from 1st Call" },
    { key: "appointment_transfers", label: "Transfers from Appt." },
    { key: "total_transfers", label: "Total Transfers" },
    { key: "billable_transfer_rate", label: "Billable→Transfer" },
    { key: "transfer_conversion_rate", label: "Transfer→Converted" },
    { key: "cost_per_acquisition", label: "Cost/Acquisition" },
  ];

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" | null = "asc";

    if (sortConfig.key === key) {
      if (sortConfig.direction === "asc") {
        direction = "desc";
      } else if (sortConfig.direction === "desc") {
        direction = null;
      }
    }

    setSortConfig({ key, direction });
  };

  const handleCallsNavigation = (e: React.MouseEvent, source: Source) => {
    e.stopPropagation();
    const searchParams = new URLSearchParams();
    searchParams.set("search", source.name || source.sourceId);
    navigate(`/calls?${searchParams.toString()}`);
  };

  const handleDownloadDocumentation = async (
    e: React.MouseEvent,
    source: Source,
  ) => {
    e.stopPropagation();
    try {
      // Use toast.promise instead of toast.info to show loading state until promise resolves
      await toast.promise(
        (async () => {
          // Get the current active session and token
          const session = await window.Clerk?.session;
          const token = await session?.getToken();

          if (!token) {
            console.error("No auth token available for documentation download");
            throw new Error(
              "Authentication error. Please try again or refresh the page.",
            );
          }

          // Use apiClient directly to ensure authentication headers are included
          const response = await apiClient.get(
            `/portal/client/sources/${source.sourceId}/documentation`,
            {
              responseType: "blob", // Important for binary data
              headers: {
                // Explicitly set the Authorization header
                Authorization: `Bearer ${token}`,
              },
            },
          );

          console.log("Response received:", {
            status: response.status,
            contentType: response.headers["content-type"],
            contentLength: response.headers["content-length"],
          });

          // Create a URL for the blob
          const blob = new Blob([response.data], { type: "application/pdf" });
          const url = window.URL.createObjectURL(blob);

          // Create a temporary link element
          const link = document.createElement("a");
          link.href = url;

          // Use source name if available, otherwise use sourceId
          const fileName = source.name
            ? `careCycle-source-api-${source.name.replace(/[^a-zA-Z0-9-_]/g, "_")}`
            : `careCycle-source-api-${source.sourceId}`;

          link.download = `${fileName}.pdf`;

          // Append to the document, click it, and remove it
          document.body.appendChild(link);
          link.click();

          // Clean up
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }, 100);

          return response; // Return response to resolve the promise
        })(),
        {
          loading: "Preparing documentation for download...",
          success: "Documentation downloaded successfully!",
          error: "Failed to download documentation",
        },
      );
    } catch (error: any) {
      // Type as any to handle Axios error properties
      console.error("Download error:", error);

      // More detailed error message
      let errorMessage = "Failed to download documentation. Please try again.";
      if (error.response) {
        errorMessage += ` (Status: ${error.response.status})`;

        // Log more details for debugging
        console.error("Error response details:", {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: error.response.headers,
          data: error.response.data,
        });
      }

      // We don't need to show this error toast since toast.promise will handle it
      // toast.error(errorMessage);
    }
  };

  const sortedSources = [...initialSources].sort((a, b) => {
    if (!sortConfig.direction || !sortConfig.key) return 0;

    const getValue = (source: Source, key: string) => {
      switch (key) {
        case "name":
          return source.name || source.sourceId;
        case "billable_calls":
          return source.billable_calls;
        case "spend":
          return source.spend;
        case "new_transfers":
          return source.new_transfer_percentage;
        case "appointment_transfers":
          return source.appointment_transfer_percentage;
        case "total_transfers":
          return source.total_transfer_percentage;
        case "billable_transfer_rate":
          return source.billable_transfer_rate;
        case "transfer_conversion_rate":
          return source.transfer_conversion_rate;
        case "cost_per_acquisition":
          return source.cost_per_acquisition;
        default:
          return 0;
      }
    };

    const aValue = getValue(a, sortConfig.key);
    const bValue = getValue(b, sortConfig.key);

    if (sortConfig.direction === "asc") {
      return aValue > bValue ? 1 : -1;
    }
    return aValue < bValue ? 1 : -1;
  });

  return (
    <div className="rounded-md border glass-panel w-full relative">
      <div
        className="absolute top-0 bottom-0 right-0 border-l border-white/30 flex items-center justify-center z-10"
        style={{
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(16px)",
          width: "calc(250% / 12)", // Increased from 200% to 250% to better cover the columns
        }}
      >
        <span className="text-sm font-bold text-gray-600 whitespace-nowrap">
          Activate Welcome Calls to unlock
        </span>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12" />
            {columns.map((column) => (
              <TableHead
                key={column.key}
                className={`text-sm text-muted-foreground cursor-pointer hover:text-foreground ${
                  column.key === "name" ? "text-center" : "text-right"
                }`}
                onClick={() => handleSort(column.key)}
              >
                {column.label} ↑↓
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedSources.map((source) => (
            <TableRow key={source.sourceId} className="hover:bg-muted/30">
              <TableCell>
                <div className="h-8 w-8 flex items-center justify-center gap-1">
                  <PhoneForwarded
                    className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer"
                    onClick={(e) => handleCallsNavigation(e, source)}
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <FileDown
                          className="h-4 w-4 text-muted-foreground hover:text-primary cursor-pointer"
                          onClick={(e) =>
                            handleDownloadDocumentation(e, source)
                          }
                        />
                      </TooltipTrigger>
                      <TooltipContent side="right" align="center">
                        <p className="text-sm">
                          Download documentation for this source
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
              <TableCell className="font-medium text-center">
                {source.name || source.sourceId}
              </TableCell>
              <TableCell className="text-right">
                <div className="space-y-1">
                  <div className="text-right text-sm">
                    <span className="text-muted-foreground">
                      Per Transfer:{" "}
                    </span>
                    <span className="font-medium">
                      {source.total_transfers > 0
                        ? formatCurrency(source.spend / source.total_transfers)
                        : formatCurrency(0)}
                    </span>
                  </div>
                  <div className="text-right text-sm">
                    <span className="text-muted-foreground">Total: </span>
                    <span className="font-medium">
                      {formatCurrency(source.spend)}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <MetricCell
                  numerator={source.billable_calls}
                  denominator={source.total_calls}
                  percentage={source.billable_percentage}
                />
              </TableCell>
              <TableCell className="text-right">
                <MetricCell
                  numerator={source.appointment_transfers}
                  denominator={source.appointment_calls}
                  percentage={source.appointment_transfer_percentage}
                />
              </TableCell>
              <TableCell className="text-right">
                <MetricCell
                  numerator={source.total_transfers}
                  denominator={source.total_calls}
                  percentage={source.total_transfer_percentage}
                />
              </TableCell>
              <TableCell className="text-right border-l">
                <MetricCell
                  numerator={source.billable_transfers}
                  denominator={source.billable_calls}
                  percentage={source.billable_transfer_rate}
                />
              </TableCell>
              <TableCell className="text-right">
                <MetricCell
                  numerator={source.converted_calls}
                  denominator={source.total_transfers}
                  percentage={source.transfer_conversion_rate}
                />
              </TableCell>
              <TableCell className="text-right font-medium">
                {formatCurrency(source.cost_per_acquisition)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
