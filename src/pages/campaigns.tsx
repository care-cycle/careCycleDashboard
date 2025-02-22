import { useState } from "react";
import { RootLayout } from "@/components/layout/root-layout";
import { useInitialData } from "@/hooks/use-client-data";
import { getTopMetrics } from "@/lib/metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CampaignsPage() {
  const { todayMetrics, campaigns, isLoading } = useInitialData();

  // Helper function to format criteria stats
  const formatCriteriaStats = (criteria: Record<string, number>) => {
    return Object.entries(criteria).map(([key, value]) => ({
      label: key, // Use the key directly as it's already formatted
      value,
    }));
  };

  if (isLoading) {
    return (
      <RootLayout topMetrics={getTopMetrics(todayMetrics)}>
        <div className="flex items-center justify-center h-64">
          <p>Loading campaigns...</p>
        </div>
      </RootLayout>
    );
  }

  return (
    <RootLayout topMetrics={getTopMetrics(todayMetrics)} hideKnowledgeSearch>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Campaigns
        </h1>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(campaigns?.data || {}).map(([id, campaign]) => (
            <Card key={id} className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>{campaign.campaignName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {/* <div>
                    <span className="text-sm font-medium text-gray-500">Type: </span>
                    <span className="text-sm text-gray-900">{campaign.campaignType}</span>
                  </div> */}
                  <div>
                    <span className="text-sm font-medium text-gray-500">
                      Status:{" "}
                    </span>
                    <span className="text-sm text-gray-900">
                      {campaign.campaignStatus}
                    </span>
                  </div>
                  {campaign.campaignDescription && (
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Description:{" "}
                      </span>
                      <span className="text-sm text-gray-900">
                        {campaign.campaignDescription}
                      </span>
                    </div>
                  )}
                  <div className="pt-2 space-y-1">
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Total Customers:{" "}
                      </span>
                      <span className="text-sm text-gray-900">
                        {campaign.customerStats.total}
                      </span>
                    </div>

                    {/* Success Criteria Section */}
                    {campaign.customerStats.successCriteria && (
                      <div className="pt-1">
                        <div className="text-sm font-medium text-gray-500">
                          Success Criteria Met:
                        </div>
                        {formatCriteriaStats(
                          campaign.customerStats.successCriteria,
                        ).map(({ label, value }) => (
                          <div key={label} className="pl-2">
                            <span className="text-sm text-gray-500">
                              {label}:{" "}
                            </span>
                            <span className="text-sm text-emerald-600">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Failure Criteria Section */}
                    {campaign.customerStats.failureCriteria && (
                      <div className="pt-1">
                        <div className="text-sm font-medium text-gray-500">
                          Failure Criteria Met:
                        </div>
                        {formatCriteriaStats(
                          campaign.customerStats.failureCriteria,
                        ).map(({ label, value }) => (
                          <div key={label} className="pl-2">
                            <span className="text-sm text-gray-500">
                              {label}:{" "}
                            </span>
                            <span className="text-sm text-red-600">
                              {value}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-1">
                      <span className="text-sm font-medium text-gray-500">
                        Met Success Criteria:{" "}
                      </span>
                      <span className="text-sm text-emerald-600">
                        {campaign.customerStats.metSuccessCriteria}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Met Failure Criteria:{" "}
                      </span>
                      <span className="text-sm text-red-600">
                        {campaign.customerStats.metFailureCriteria}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Pending:{" "}
                      </span>
                      <span className="text-sm text-gray-900">
                        {campaign.customerStats.pending}
                      </span>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-500">
                        Remaining to Call:{" "}
                      </span>
                      <span className="text-sm text-gray-900">
                        {campaign.customerStats.remainingToCall}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {Object.keys(campaigns?.data || {}).length === 0 && (
          <div className="flex items-center justify-center h-64">
            <p>No campaigns found.</p>
          </div>
        )}
      </div>
    </RootLayout>
  );
}
