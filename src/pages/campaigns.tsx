import * as React from "react";
import { useToast } from "@/components/ui/use-toast";
import { RootLayout } from "@/components/layout/root-layout";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Users,
  Phone,
  Megaphone,
  Pencil,
  Check,
  X,
  ChevronDown,
  HelpCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useInitialData } from "@/hooks/use-client-data";
import { getTopMetrics } from "@/lib/metrics";
import { usePreferences } from "@/hooks/use-preferences";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { SmsConfig } from "@/components/campaign/sms-config";
import { RetryConfig } from "@/components/campaign/retry-config";
import type { Campaign, SmsTypes, SmsContent } from "@/types/campaign";
import apiClient from "@/lib/api-client";
import { transformToBackendFormat } from "@/utils/smsVariables";
import { useQueryClient } from "@tanstack/react-query";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CampaignData {
  [key: string]: {
    id: string;
    name: string;
    type: string;
    description: string;
    status: string;
    smsCompanyName: string;
    hasInquiryCallback: boolean;
    retryStrategy: string;
    retryDelays: number[];
    retryPatterns: RetryPattern[];
    retrySettings: RetrySettings;
    successCriteria: CampaignCriteria;
    failureCriteria: CampaignCriteria;
    maxAttempts: number;
    smsTypes: SmsTypes;
    smsContent: SmsContent;
    customerStats: {
      total: number;
      totalCalls: number;
      statusCounts: {
        pending: number;
        in_progress: number;
        completed: number;
        failed: number;
        expired: number;
        cancelled: number;
        skipped: number;
        exceeded_max_calls: number;
      };
    };
  };
}

interface RetryPattern {
  days: {
    start: number;
    end: number;
  };
  attempts: number;
  intervalMinutes: number;
}

interface RetrySettings {
  cooldownPeriod: {
    hours: number;
    afterAttempts: number;
  };
  retryBehavior: {
    onDayComplete: string;
    onPatternComplete: string;
    onCooldownComplete: string;
  };
}

interface CampaignCriteria {
  operator: string;
  conditions: Array<{
    field: string;
    operator: string;
    value: boolean;
  }>;
}

export default function CampaignsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const {
    todayMetrics,
    campaigns: campaignsData,
    clientInfo,
    isLoading,
  } = useInitialData();
  const { selectedCampaignId } = usePreferences();
  const [pendingChanges, setPendingChanges] = React.useState<Partial<Campaign>>(
    {},
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [showTcpaDialog, setShowTcpaDialog] = React.useState(false);
  const [editingField, setEditingField] = React.useState<
    "name" | "description" | null
  >(null);
  const [editValue, setEditValue] = React.useState("");
  const [isRetryOpen, setIsRetryOpen] = React.useState(true);
  const [isSmsOpen, setIsSmsOpen] = React.useState(true);
  const [companyNameError, setCompanyNameError] = React.useState(false);

  // Add check for discrete associated number
  const hasDiscreteNumber = React.useMemo(() => {
    return (
      (
        clientInfo?.associatedNumbers as
          | { type: string; number: string }[]
          | undefined
      )?.some((num) => num.type === "discrete" && Boolean(num.number)) ?? false
    );
  }, [clientInfo]);

  // Transform campaigns data into our format
  const campaigns = React.useMemo(() => {
    if (!campaignsData) return [];

    return Object.entries(campaignsData as unknown as CampaignData).map(
      ([id, campaign]) => ({
        id,
        name: campaign.name,
        type: campaign.type,
        description: campaign.description,
        status: campaign.status,
        smsCompanyName: campaign.smsCompanyName,
        smsTypes: campaign.smsTypes,
        smsContent: campaign.smsContent,
        retryStrategy: campaign.retryStrategy,
        retryDelays: campaign.retryDelays,
        retryPatterns: campaign.retryPatterns,
        retrySettings: campaign.retrySettings,
        maxAttempts: campaign.maxAttempts,
        customerStats: campaign.customerStats,
        hasInquiryCallback: campaign.hasInquiryCallback || false,
        metrics: {
          customers: campaign.customerStats?.total || 0,
          calls: campaign.customerStats?.totalCalls || 0,
          sources: 0, // API doesn't provide this, so default to 0
          customersByStatus: {
            pending: campaign.customerStats?.statusCounts?.pending || 0,
            in_progress: campaign.customerStats?.statusCounts?.in_progress || 0,
            completed: campaign.customerStats?.statusCounts?.completed || 0,
            failed: campaign.customerStats?.statusCounts?.failed || 0,
            expired: campaign.customerStats?.statusCounts?.expired || 0,
            cancelled: campaign.customerStats?.statusCounts?.cancelled || 0,
            skipped: campaign.customerStats?.statusCounts?.skipped || 0,
            exceeded_max_calls:
              campaign.customerStats?.statusCounts?.exceeded_max_calls || 0,
          },
        },
      }),
    );
  }, [campaignsData]);

  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId);

  // Initialize pendingChanges with selected campaign's SMS configuration
  React.useEffect(() => {
    if (selectedCampaign) {
      setPendingChanges({
        smsCompanyName: selectedCampaign.smsCompanyName,
        smsTypes: selectedCampaign.smsTypes,
        smsContent: selectedCampaign.smsContent,
      });
    }
  }, [selectedCampaign]);

  const handleStartEdit = (field: "name" | "description") => {
    setEditingField(field);
    setEditValue(selectedCampaign?.[field] || "");
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const handleSaveEdit = async () => {
    if (!selectedCampaign || !editingField) return;

    setIsSaving(true);
    try {
      const response = await apiClient.patch(
        `/portal/client/campaigns/${selectedCampaign.id}`,
        { [editingField]: editValue },
      );

      if (!response.data) {
        throw new Error("Failed to update campaign");
      }

      toast({
        title: "Success",
        description: `Campaign ${editingField} updated successfully`,
      });

      await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to update campaign ${editingField}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
      setEditingField(null);
    }
  };

  const handleSmsUpdate = async (
    campaignId: string,
    updateData: Partial<Campaign>,
  ) => {
    setIsSaving(true);
    try {
      // Only include SMS-related fields
      const smsUpdateData: {
        smsCompanyName?: string;
        smsContent?: SmsContent;
        smsTypes?: SmsTypes;
      } = {};

      // Add company name if present
      if (updateData.smsCompanyName) {
        smsUpdateData.smsCompanyName = updateData.smsCompanyName;
      }

      // Transform SMS content if present
      if (updateData.smsContent) {
        const transformedContent = { ...updateData.smsContent };
        Object.entries(transformedContent).forEach(([key, value]) => {
          if (typeof value === "string") {
            transformedContent[key as keyof SmsContent] =
              transformToBackendFormat(value);
          }
        });
        smsUpdateData.smsContent = transformedContent;
      }

      // Transform SMS types if present
      if (updateData.smsTypes) {
        smsUpdateData.smsTypes = { ...updateData.smsTypes };
      }

      const response = await apiClient.patch(
        `/portal/client/campaigns/${campaignId}`,
        smsUpdateData,
      );

      if (!response.data) {
        throw new Error("Failed to update campaign");
      }

      await queryClient.invalidateQueries({ queryKey: ["campaigns"] });

      setPendingChanges({});
    } catch (error) {
      console.error("[Campaign Update - SMS] Error details:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetryUpdate = async (
    campaignId: string,
    updateData: Partial<Campaign>,
  ) => {
    setIsSaving(true);
    try {
      // Ensure we have all required fields for the retry configuration
      const retryUpdateData: any = {
        retryStrategy: updateData.retryStrategy,
      };

      // Add retry patterns if present
      if (updateData.retryPatterns) {
        retryUpdateData.retryPatterns = updateData.retryPatterns;
      }

      // Add retry delays if present
      if (updateData.retryDelays) {
        retryUpdateData.retryDelays = updateData.retryDelays;
      }

      // Always include retry settings with defaults if not provided
      retryUpdateData.retrySettings = updateData.retrySettings || {
        cooldownPeriod: {
          hours:
            (updateData.retrySettings as Campaign["retrySettings"])
              ?.cooldownPeriod?.hours || 24,
          afterAttempts:
            (updateData.retrySettings as Campaign["retrySettings"])
              ?.cooldownPeriod?.afterAttempts || 3,
        },
        retryBehavior: {
          onDayComplete: "NEXT_DAY_START",
          onPatternComplete: "COOLDOWN",
          onCooldownComplete: "END",
        },
      };

      const response = await apiClient.patch(
        `/portal/client/campaigns/${campaignId}`,
        retryUpdateData,
      );

      if (!response.data) {
        throw new Error("Failed to update campaign");
      }

      await queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      setPendingChanges({});
      setShowTcpaDialog(false);
    } catch (error) {
      console.error("[Campaign Update - Retry] Error details:", error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSmsConfigSave = async () => {
    if (selectedCampaign && Object.keys(pendingChanges).length > 0) {
      setIsSaving(true);
      try {
        await handleSmsUpdate(selectedCampaign.id, pendingChanges);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleRetryConfigSave = () => {
    if (Object.keys(pendingChanges).length > 0 && selectedCampaign) {
      setShowTcpaDialog(true);
    }
  };

  const handleConfirmSave = async () => {
    if (selectedCampaign) {
      try {
        await handleRetryUpdate(selectedCampaign.id, pendingChanges);
      } catch (error) {
        console.error("Error saving retry configuration:", error);
      }
    }
  };

  if (isLoading || !campaignsData) {
    return (
      <RootLayout topMetrics={getTopMetrics(todayMetrics)} hideKnowledgeSearch>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </RootLayout>
    );
  }

  // Show prompt when no campaign is selected or "All Campaigns" is selected
  if (!selectedCampaignId || selectedCampaignId === "all") {
    return (
      <RootLayout topMetrics={getTopMetrics(todayMetrics)} hideKnowledgeSearch>
        <div className="container mx-auto p-6">
          <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Select a Campaign
            </h2>
            <p className="text-gray-500 text-center max-w-md">
              Please select a specific campaign from the dropdown above to view
              and manage its configuration.
            </p>
          </div>
        </div>
      </RootLayout>
    );
  }

  return (
    <RootLayout topMetrics={getTopMetrics(todayMetrics)} hideKnowledgeSearch>
      <div className="container mx-auto p-6">
        <div className="flex flex-col space-y-4 mb-6">
          {selectedCampaign && (
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="group relative">
                  {editingField === "name" ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="text-2xl font-semibold h-10 py-1"
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={handleSaveEdit}
                          disabled={isSaving}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-2 group cursor-pointer"
                      onClick={() => handleStartEdit("name")}
                    >
                      <h1 className="text-2xl font-semibold text-gray-900">
                        {selectedCampaign.name}
                      </h1>
                      <Pencil className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>

                <div className="group relative">
                  {editingField === "description" ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="text-sm h-8 py-1"
                        placeholder="Add a description..."
                        autoFocus
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={handleSaveEdit}
                          disabled={isSaving}
                        >
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                        >
                          <X className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className="flex items-center gap-2 group cursor-pointer"
                      onClick={() => handleStartEdit("description")}
                    >
                      <p className="text-sm text-gray-500">
                        {selectedCampaign.description || "Add a description..."}
                      </p>
                      <Pencil className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-8">
                <div className="flex items-center">
                  <Users className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-500 mr-1">Customers</span>
                  <span className="font-semibold">
                    {selectedCampaign.metrics?.customers?.toLocaleString() ||
                      "0"}
                  </span>
                </div>

                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-500 mr-1">
                    Total Calls
                  </span>
                  <span className="font-semibold">
                    {selectedCampaign.metrics?.calls?.toLocaleString() || "0"}
                  </span>
                </div>

                <div className="flex items-center">
                  <Megaphone className="h-4 w-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-500 mr-1">Sources</span>
                  <span className="font-semibold">
                    {selectedCampaign.metrics?.sources?.toLocaleString() || "0"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {selectedCampaign && (
            <>
              <div className="glass-panel rounded-lg overflow-hidden">
                <Collapsible open={isSmsOpen} onOpenChange={setIsSmsOpen}>
                  <div className="flex items-center justify-between p-6">
                    <h3 className="text-lg font-medium text-gray-900">
                      SMS Configuration
                    </h3>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-9 p-0">
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-300 ease-in-out ${isSmsOpen ? "rotate-0" : "-rotate-90"}`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent className="transition-all duration-300 ease-in-out">
                    <SmsConfig
                      campaign={selectedCampaign as Campaign}
                      pendingChanges={pendingChanges}
                      setPendingChanges={setPendingChanges}
                      hasDiscreteNumber={hasDiscreteNumber}
                      companyNameError={companyNameError}
                      setCompanyNameError={setCompanyNameError}
                      isSaving={isSaving}
                      handleSave={handleSmsConfigSave}
                      hasInquiryCallback={
                        selectedCampaign?.hasInquiryCallback || false
                      }
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>

              <div className="glass-panel rounded-lg overflow-visible">
                <Collapsible open={isRetryOpen} onOpenChange={setIsRetryOpen}>
                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        Retry Configuration
                      </h3>
                      <TooltipProvider delayDuration={0}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button type="button" className="inline-flex">
                              <HelpCircle className="w-4 h-4 text-gray-400" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            align="start"
                            className="max-w-[400px] p-4 space-y-4"
                            sideOffset={5}
                          >
                            <div>
                              <h4 className="font-medium mb-2">
                                About Retry Strategies
                              </h4>
                              <div className="space-y-4">
                                <div>
                                  <h5 className="font-medium text-sm mb-1">
                                    None
                                  </h5>
                                  <p className="text-sm text-gray-600">
                                    No retry attempts will be made. The campaign
                                    will only attempt to contact each customer
                                    once. Choose this when you only need a
                                    single contact attempt per customer.
                                  </p>
                                </div>
                                <div>
                                  <h5 className="font-medium text-sm mb-1">
                                    Pattern
                                  </h5>
                                  <p className="text-sm text-gray-600">
                                    Best for complex, multi-day campaigns where
                                    contact urgency varies over time. Ideal for
                                    lead qualification, sales follow-up, and
                                    time-sensitive notifications.
                                  </p>
                                  <ul className="text-sm text-gray-600 mt-2 space-y-1">
                                    <li>
                                      • Days: Schedule different attempt
                                      frequencies across multiple days
                                    </li>
                                    <li>
                                      • Attempts: Set the maximum number of
                                      contact tries per day
                                    </li>
                                    <li>
                                      • Interval: Configure time between
                                      attempts in minutes
                                    </li>
                                  </ul>
                                </div>
                                <div>
                                  <h5 className="font-medium text-sm mb-1">
                                    Delays
                                  </h5>
                                  <p className="text-sm text-gray-600">
                                    Perfect for simple, consistent follow-ups
                                    with evenly spaced attempts. Ideal for
                                    welcome calls, appointment reminders, and
                                    verification calls.
                                  </p>
                                  <p className="text-sm text-gray-600 mt-2">
                                    Example: Try again after 1 hour, then 3
                                    hours, then 6 hours for a gradual follow-up
                                    pattern.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-9 p-0">
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-300 ease-in-out ${isRetryOpen ? "rotate-0" : "-rotate-90"}`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                  </div>

                  <CollapsibleContent className="transition-all duration-300 ease-in-out overflow-visible">
                    <RetryConfig
                      campaign={selectedCampaign as Campaign}
                      pendingChanges={pendingChanges}
                      setPendingChanges={setPendingChanges}
                      isSaving={isSaving}
                      handleSave={handleRetryConfigSave}
                    />
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </>
          )}
        </div>
      </div>

      <AlertDialog open={showTcpaDialog} onOpenChange={setShowTcpaDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">
              TCPA Compliance Check
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              I confirm that I have read and understand{" "}
              <a
                href="https://nodable.ai/utility-pages/tcpa-compliance-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                TCPA guidelines
              </a>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowTcpaDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmSave}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              My cadence is compliant
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RootLayout>
  );
}
