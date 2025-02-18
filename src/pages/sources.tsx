import { useQuery } from "@tanstack/react-query"
import { SourcesTable } from "@/components/sources/sources-table"
import { PageHeader } from "@/components/layout/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { RootLayout } from "@/components/layout/root-layout"
import { useInitialData } from "@/hooks/use-client-data"
import { getTopMetrics } from "@/lib/metrics"
import apiClient from "@/lib/api-client"

export default function SourcesPage() {
  const { todayMetrics } = useInitialData();
  const { data: sources, isLoading, error } = useQuery({
    queryKey: ['sources'],
    queryFn: async () => {
      try {
        console.log('Fetching sources data...');
        const response = await apiClient.get('/portal/client/sources');
        console.log('Sources data:', response.data);
        return response.data.data;
      } catch (err) {
        console.error('Error fetching sources:', err);
        throw err;
      }
    }
  });

  return (
    <RootLayout topMetrics={getTopMetrics(todayMetrics)} hideKnowledgeSearch>
      <div className="space-y-6">
        <PageHeader
          title="Sources"
          description="View and manage your call sources and their performance"
        />
        
        {isLoading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error instanceof Error ? error.message : 'There was an error loading the sources data. Please try again later.'}
            </AlertDescription>
          </Alert>
        ) : (
          <SourcesTable sources={sources || []} />
        )}
      </div>
    </RootLayout>
  )
} 