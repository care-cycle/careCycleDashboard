import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  Trash2,
  HelpCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { Campaign, RetryPattern } from "@/types/campaign";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface RetryConfigProps {
  campaign: Campaign;
  pendingChanges: Partial<Campaign>;
  setPendingChanges: (changes: React.SetStateAction<Partial<Campaign>>) => void;
  isSaving: boolean;
  handleSave: () => void;
}

export function RetryConfig({
  campaign: selectedCampaign,
  pendingChanges,
  setPendingChanges,
  isSaving,
  handleSave,
}: RetryConfigProps) {
  const { toast } = useToast();

  const handleInputChange = (
    field: "hours" | "afterAttempts",
    value: number,
  ) => {
    setPendingChanges((prev: Partial<Campaign>) => {
      const currentRetrySettings = selectedCampaign.retrySettings || {
        cooldownPeriod: { hours: 24, afterAttempts: 3 },
        retryBehavior: {
          onDayComplete: "NEXT_DAY_START",
          onPatternComplete: "COOLDOWN",
          onCooldownComplete: "END",
        },
      };

      return {
        ...prev,
        retrySettings: {
          ...currentRetrySettings,
          cooldownPeriod: {
            ...currentRetrySettings.cooldownPeriod,
            [field]: value,
          },
        },
      };
    });
  };

  const handleStrategyChange = (value: Campaign["retryStrategy"]) => {
    setPendingChanges((prev: Partial<Campaign>) => ({
      ...prev,
      retryStrategy: value,
    }));
  };

  const handlePatternChange = (
    index: number,
    field: "attempts" | "intervalMinutes" | "days",
    value: number,
  ) => {
    setPendingChanges((prev: Partial<Campaign>) => {
      const patterns = [
        ...(prev.retryPatterns || selectedCampaign.retryPatterns || []),
      ];

      if (!patterns[index]) {
        patterns[index] = {
          days: { start: index, end: index },
          attempts: 1,
          intervalMinutes: 60,
        };
      }

      if (field === "days") {
        patterns[index] = {
          ...patterns[index],
          days: { start: value, end: value },
        };
      } else {
        patterns[index] = {
          ...patterns[index],
          [field]: value,
        };
      }

      return {
        ...prev,
        retryPatterns: patterns,
      };
    });
  };

  const addRetryPattern = () => {
    setPendingChanges((prev: Partial<Campaign>) => {
      const patterns = [
        ...(prev.retryPatterns || selectedCampaign.retryPatterns || []),
      ];
      const nextDay = patterns.length;

      patterns.push({
        days: { start: nextDay, end: nextDay },
        attempts: 4,
        intervalMinutes: 180,
      });

      return {
        ...prev,
        retryPatterns: patterns,
      };
    });
  };

  const removeRetryPattern = (index: number) => {
    setPendingChanges((prev: Partial<Campaign>) => {
      const patterns = [
        ...(prev.retryPatterns || selectedCampaign.retryPatterns || []),
      ];
      patterns.splice(index, 1);

      patterns.forEach((pattern, i) => {
        pattern.days.start = i;
        pattern.days.end = i;
      });

      return {
        ...prev,
        retryPatterns: patterns,
      };
    });
  };

  const handleDelaysChange = (value: string) => {
    setPendingChanges((prev: Partial<Campaign>) => ({
      ...prev,
      retryDelaysInput: value,
      retryDelays: value
        .split(",")
        .map((v) => v.trim())
        .filter((v) => v.length > 0)
        .map((v) => parseInt(v))
        .filter((v) => !isNaN(v)),
    }));
  };

  const canSave = React.useMemo(() => {
    const strategy =
      pendingChanges.retryStrategy || selectedCampaign.retryStrategy;

    if (!strategy) return false;

    switch (strategy) {
      case "NONE":
        return true;
      case "PATTERN":
        const patterns =
          pendingChanges.retryPatterns || selectedCampaign.retryPatterns || [];
        return patterns.length > 0;
      case "DELAYS":
        const delays =
          pendingChanges.retryDelays || selectedCampaign.retryDelays || [];
        const delaysInput =
          pendingChanges.retryDelaysInput ||
          selectedCampaign.retryDelays?.join(", ") ||
          "";
        return delays.length > 0 && delaysInput.trim() !== "";
      default:
        return false;
    }
  }, [pendingChanges, selectedCampaign]);

  return (
    <div className="px-6 pb-6">
      <div className="space-y-6">
        {/* Strategy Selection Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-medium">
                  {(pendingChanges.retryStrategy ||
                    selectedCampaign.retryStrategy) === "NONE" && "No Retries"}
                  {(pendingChanges.retryStrategy ||
                    selectedCampaign.retryStrategy) === "PATTERN" && "Pattern"}
                  {(pendingChanges.retryStrategy ||
                    selectedCampaign.retryStrategy) === "DELAYS" && "Delays"}
                  {!(
                    pendingChanges.retryStrategy ||
                    selectedCampaign.retryStrategy
                  ) && "Retry Strategy"}
                </h2>
              </div>
              <p className="text-xs text-gray-500">
                {(pendingChanges.retryStrategy ||
                  selectedCampaign.retryStrategy) === "NONE" &&
                  "Single contact attempt per customer"}
                {(pendingChanges.retryStrategy ||
                  selectedCampaign.retryStrategy) === "PATTERN" &&
                  "Configure retry patterns for different days with specific attempt counts and intervals"}
                {(pendingChanges.retryStrategy ||
                  selectedCampaign.retryStrategy) === "DELAYS" &&
                  "Set up evenly spaced retry attempts with consistent intervals"}
                {!(
                  pendingChanges.retryStrategy || selectedCampaign.retryStrategy
                ) && "Choose how to handle retry attempts for this campaign"}
              </p>
            </div>
            <div className="w-[280px]">
              <Select
                value={
                  pendingChanges.retryStrategy || selectedCampaign.retryStrategy
                }
                onValueChange={handleStrategyChange}
              >
                <SelectTrigger>
                  <SelectValue>
                    {pendingChanges.retryStrategy ||
                    selectedCampaign.retryStrategy
                      ? String(
                          pendingChanges.retryStrategy ||
                            selectedCampaign.retryStrategy,
                        )
                          .toLowerCase()
                          .replace(/^./, (str) => str.toUpperCase())
                      : "Select retry strategy"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-sm">
                  <SelectItem value="NONE" className="py-2">
                    <div>
                      <div className="font-medium">None</div>
                      <div className="text-xs text-gray-500">
                        Single contact attempt per customer
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="PATTERN" className="py-2">
                    <div>
                      <div className="font-medium">Pattern</div>
                      <div className="text-xs text-gray-500">
                        Complex, multi-day campaigns
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="DELAYS" className="py-2">
                    <div>
                      <div className="font-medium">Delays</div>
                      <div className="text-xs text-gray-500">
                        Simple, evenly spaced attempts
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Pattern Configuration Card */}
        {(pendingChanges.retryStrategy || selectedCampaign.retryStrategy) ===
          "PATTERN" && (
          <div className="grid grid-cols-2 gap-6">
            {/* Pattern Configuration */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium">Pattern Configuration</h4>
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
                        className="max-w-[350px] p-4 z-50"
                        sideOffset={5}
                      >
                        <div className="space-y-3">
                          <p className="text-sm text-gray-600">
                            Configure retry patterns for different days with
                            specific attempt counts and intervals.
                          </p>
                          <ul className="text-sm text-gray-600 space-y-2">
                            <li>
                              • Days: Schedule different attempt frequencies
                              across multiple days
                            </li>
                            <li>
                              • Attempts: Set the maximum number of contact
                              tries per day
                            </li>
                            <li>
                              • Interval: Configure time between attempts in
                              minutes
                            </li>
                          </ul>
                          <p className="text-sm text-gray-600">
                            Best for complex, multi-day campaigns where contact
                            urgency varies over time.
                          </p>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={addRetryPattern}
                  className="h-8"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Day
                </Button>
              </div>

              <div className="px-4 pb-4">
                <div className="grid grid-cols-[80px_100px_100px_40px] gap-x-4 gap-y-3">
                  <Label className="text-xs text-gray-500 font-medium">
                    Day
                  </Label>
                  <Label className="text-xs text-gray-500 font-medium">
                    Attempts
                  </Label>
                  <Label className="text-xs text-gray-500 font-medium">
                    Interval
                  </Label>
                  <div />
                  {(
                    pendingChanges.retryPatterns ||
                    selectedCampaign.retryPatterns ||
                    []
                  ).map((pattern: RetryPattern, index: number) => (
                    <React.Fragment key={index}>
                      <div className="text-sm font-medium text-gray-700 flex items-center">
                        Day {pattern.days.start + 1}
                      </div>
                      <div className="flex items-center">
                        <Input
                          type="number"
                          value={pattern.attempts}
                          onChange={(e) =>
                            handlePatternChange(
                              index,
                              "attempts",
                              parseInt(e.target.value),
                            )
                          }
                          min={1}
                          className="h-8 w-full"
                        />
                      </div>
                      <div className="flex items-center">
                        <Input
                          type="number"
                          value={pattern.intervalMinutes}
                          onChange={(e) =>
                            handlePatternChange(
                              index,
                              "intervalMinutes",
                              parseInt(e.target.value),
                            )
                          }
                          min={1}
                          className="h-8 w-full"
                        />
                      </div>
                      <div className="flex items-center justify-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRetryPattern(index)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                        </Button>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Cooldown Configuration */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-2 p-4">
                <h4 className="text-sm font-medium">Cooldown</h4>
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
                      className="max-w-[350px] p-4 z-50"
                      sideOffset={5}
                    >
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">
                          Cooldown periods help manage repeated contact attempts
                          and respect customer preferences.
                        </p>
                        <ul className="text-sm text-gray-600 space-y-2">
                          <li>
                            • Hours: How long to pause before potentially
                            restarting attempts (e.g., 24 hours for daily
                            campaigns, 48+ for less urgent ones)
                          </li>
                          <li>
                            • After Attempts: Number of tries before entering
                            cooldown, helping prevent customer fatigue
                          </li>
                        </ul>
                        <p className="text-sm text-gray-600">
                          All strategies respect customer time zones and legal
                          calling hours automatically.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Input
                      type="number"
                      value={
                        pendingChanges.retrySettings?.cooldownPeriod?.hours ??
                        selectedCampaign.retrySettings?.cooldownPeriod?.hours ??
                        48
                      }
                      onChange={(e) =>
                        handleInputChange("hours", parseInt(e.target.value))
                      }
                      min={1}
                      className="h-8"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Hours to pause before retrying
                    </p>
                  </div>
                  <div>
                    <Input
                      type="number"
                      value={
                        pendingChanges.retrySettings?.cooldownPeriod
                          ?.afterAttempts ??
                        selectedCampaign.retrySettings?.cooldownPeriod
                          ?.afterAttempts ??
                        20
                      }
                      onChange={(e) =>
                        handleInputChange(
                          "afterAttempts",
                          parseInt(e.target.value),
                        )
                      }
                      min={1}
                      className="h-8"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Tries before cooldown
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delays and Cooldown Configuration */}
        {(pendingChanges.retryStrategy || selectedCampaign.retryStrategy) ===
          "DELAYS" && (
          <div className="grid grid-cols-2 gap-6">
            {/* Delay Configuration */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div>
                <h4 className="text-sm font-medium">Delay Configuration</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Specify delays between retry attempts in minutes
                </p>
              </div>
              <div className="mt-4">
                <Input
                  type="text"
                  value={
                    pendingChanges.retryDelaysInput ??
                    selectedCampaign.retryDelays?.join(", ") ??
                    ""
                  }
                  onChange={(e) => handleDelaysChange(e.target.value)}
                  placeholder="5, 5, 5, 5, 5, 5, 5, 5"
                  className="font-mono h-8"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Enter comma-separated values in minutes
                </p>
              </div>
            </div>

            {/* Cooldown Configuration */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div>
                <h4 className="text-sm font-medium">Cooldown</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure pause periods between retry attempts
                </p>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <Input
                    type="number"
                    value={
                      pendingChanges.retrySettings?.cooldownPeriod?.hours ??
                      selectedCampaign.retrySettings?.cooldownPeriod?.hours ??
                      48
                    }
                    onChange={(e) =>
                      handleInputChange("hours", parseInt(e.target.value))
                    }
                    min={1}
                    className="h-8"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    How long to pause before restarting attempts
                  </p>
                </div>
                <div>
                  <Input
                    type="number"
                    value={
                      pendingChanges.retrySettings?.cooldownPeriod
                        ?.afterAttempts ??
                      selectedCampaign.retrySettings?.cooldownPeriod
                        ?.afterAttempts ??
                      20
                    }
                    onChange={(e) =>
                      handleInputChange(
                        "afterAttempts",
                        parseInt(e.target.value),
                      )
                    }
                    min={1}
                    className="h-8"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Number of tries before entering cooldown
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legal & Compliance Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
          <div>
            <h4 className="text-sm font-medium">
              Legal Calling Hours & Compliance
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Important regulations and restrictions for outbound calling
            </p>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <p>To ensure compliance with federal and state regulations:</p>
            <ul className="space-y-2">
              <li className="flex gap-2">
                • Customers aren't called between 9pm-8am in their local time,
                based on the provided zipcode or timezone
              </li>
              <li className="flex gap-2">
                • Some states have specific restrictions about number of call
                attempts in a day
              </li>
              <li className="flex gap-2">
                • Any customer receiving outbound dial attempts must provide
                prior express consent, and/or hold an existing business
                relationship with your company
              </li>
            </ul>
            <p>
              Visit our{" "}
              <a
                href="https://nodable.ai/utility-pages/tcpa-compliance-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-500 hover:underline"
              >
                TCPA compliance policy
              </a>{" "}
              for more information.
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={
              !canSave || isSaving || Object.keys(pendingChanges).length === 0
            }
            className="bg-emerald-500 text-white hover:bg-emerald-600"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
