import { PageHeader } from "@/components/layout/page-header";
import { RootLayout } from "@/components/layout/root-layout";
import { ManageSources } from "@/components/sources/manage-sources";
import { useInitialData } from "@/hooks/use-client-data";
import { getTopMetrics } from "@/lib/metrics";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ManageSourcesPage() {
  const { todayMetrics } = useInitialData();
  const navigate = useNavigate();

  return (
    <RootLayout topMetrics={getTopMetrics(todayMetrics)} hideKnowledgeSearch>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/sources")}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader
            title="Manage Sources"
            description="View and manage your call source configurations"
            noBorder
          />
        </div>
        <ManageSources />
      </div>
    </RootLayout>
  );
}
