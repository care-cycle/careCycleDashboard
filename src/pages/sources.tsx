import { useQuery } from "@tanstack/react-query";
import { SourcesTable } from "@/components/sources/sources-table";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, InboxIcon, Plus, Settings } from "lucide-react";
import { RootLayout } from "@/components/layout/root-layout";
import { useInitialData } from "@/hooks/use-client-data";
import { getTopMetrics } from "@/lib/metrics";
import apiClient from "@/lib/api-client";
import { useState } from "react";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/date-range-picker";
import { subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { SourceDialog } from "@/components/sources/source-dialog";

export default function SourcesPage() {
  const { todayMetrics } = useInitialData();
  const navigate = useNavigate();
  const today = new Date();
  const yesterday = subDays(today, 1);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Add date range state with undefined type
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: yesterday,
    to: today,
  });

  const {
    data: sources,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sources", dateRange],
    queryFn: async () => {
      try {
        console.log("Fetching sources data...");
        const response = await apiClient.get("/portal/client/sources", {
          params: {
            from: dateRange?.from?.toISOString(),
            to: dateRange?.to?.toISOString(),
          },
        });
        console.log("Sources data:", response.data);
        return response.data.data;
      } catch (err) {
        console.error("Error fetching sources:", err);
        throw err;
      }
    },
  });

  return (
    <RootLayout topMetrics={getTopMetrics(todayMetrics)} hideKnowledgeSearch>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <PageHeader
            title="Sources"
            description="View and manage your call sources and their performance"
            noBorder
          />
          <div className="flex items-center gap-4">
            <DateRangePicker
              date={dateRange}
              onChange={setDateRange}
              defaultDate={{
                from: yesterday,
                to: today,
              }}
            />
            <Button
              variant="outline"
              onClick={() => navigate("/sources/manage")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Sources
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "There was an error loading the sources data. Please try again later."}
            </AlertDescription>
          </Alert>
        ) : !sources || sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[400px] border rounded-lg bg-muted/10">
            <InboxIcon className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground">
              No Sources Found
            </h3>
            <p className="text-sm text-muted-foreground mt-2">
              You don't have any sources configured yet.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/sources/manage")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Sources
            </Button>
          </div>
        ) : (
          <SourcesTable sources={sources} />
        )}

        <SourceDialog
          open={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
        />
      </div>
    </RootLayout>
  );
}
