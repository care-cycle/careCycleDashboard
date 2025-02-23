import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { Campaign, RetryPattern } from "@/types/campaign";

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
  const handleInputChange = (
    field: "hours" | "afterAttempts",
    value: number,
  ) => {
    setPendingChanges((prev: Partial<Campaign>) => ({
      ...prev,
      retrySettings: {
        ...selectedCampaign.retrySettings,
        cooldownPeriod: {
          ...selectedCampaign.retrySettings.cooldownPeriod,
          [field]: value,
        },
      },
    }));
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

  return (
    <div className="px-6 pb-6">
      <div className="flex gap-6">
        <div className="w-1/2 space-y-6">
          <div className="space-y-6">
            <div>
              <div className="flex gap-4">
                <Label className="text-sm font-medium text-gray-900 min-w-[120px] pt-2">
                  Retry Strategy
                </Label>
                <div className="flex-1">
                  <Select
                    value={
                      pendingChanges.retryStrategy ||
                      selectedCampaign.retryStrategy
                    }
                    onValueChange={handleStrategyChange}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue placeholder="Select retry strategy" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="PATTERN">Pattern</SelectItem>
                      <SelectItem value="DELAYS">Delays</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    {(pendingChanges.retryStrategy ||
                      selectedCampaign.retryStrategy) === "NONE" &&
                      "No retry attempts will be made"}
                    {(pendingChanges.retryStrategy ||
                      selectedCampaign.retryStrategy) === "PATTERN" &&
                      "Retry based on specific patterns"}
                    {(pendingChanges.retryStrategy ||
                      selectedCampaign.retryStrategy) === "DELAYS" &&
                      "Retry after specified delays"}
                  </p>
                </div>
              </div>
            </div>

            {(pendingChanges.retryStrategy ||
              selectedCampaign.retryStrategy) !== "NONE" && (
              <div className="space-y-6">
                {(pendingChanges.retryStrategy ||
                  selectedCampaign.retryStrategy) === "PATTERN" && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium text-gray-900">
                        Pattern Settings
                      </Label>
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
                    <div className="grid grid-cols-[auto_1fr_1fr_auto] gap-x-4 gap-y-2 items-center">
                      <Label className="text-sm text-gray-500">Day</Label>
                      <Label className="text-sm text-gray-500">Attempts</Label>
                      <Label className="text-sm text-gray-500">
                        Interval (min)
                      </Label>
                      <div />
                      {(
                        pendingChanges.retryPatterns ||
                        selectedCampaign.retryPatterns ||
                        []
                      ).map((pattern: RetryPattern, index: number) => (
                        <React.Fragment key={index}>
                          <div className="text-sm font-medium">
                            {pattern.days.start}
                          </div>
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
                            className="h-8"
                          />
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
                            className="h-8"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRetryPattern(index)}
                            className="h-8 px-2"
                          >
                            <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                          </Button>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {(pendingChanges.retryStrategy ||
                  selectedCampaign.retryStrategy) === "DELAYS" && (
                  <div className="flex gap-4">
                    <Label className="text-sm font-medium text-gray-900 min-w-[120px] pt-2">
                      Delay
                    </Label>
                    <div className="flex-1">
                      <Input
                        type="text"
                        value={
                          pendingChanges.retryDelaysInput ??
                          selectedCampaign.retryDelays.join(", ")
                        }
                        onChange={(e) => handleDelaysChange(e.target.value)}
                        placeholder="60, 180, 360"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Enter comma-separated values in minutes
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <Label className="text-sm font-medium text-gray-900 min-w-[120px] pt-2">
                    Cooldown
                  </Label>
                  <div className="flex-1 flex items-center gap-4">
                    <div className="flex-1">
                      <Input
                        type="number"
                        value={
                          pendingChanges.retrySettings?.cooldownPeriod?.hours ??
                          selectedCampaign.retrySettings.cooldownPeriod.hours
                        }
                        onChange={(e) =>
                          handleInputChange("hours", parseInt(e.target.value))
                        }
                        min={1}
                        className="h-8"
                        placeholder="Cooldown Hours"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        How long to pause before restarting attempts
                      </p>
                    </div>
                    <div className="flex-1">
                      <Input
                        type="number"
                        value={
                          pendingChanges.retrySettings?.cooldownPeriod
                            ?.afterAttempts ??
                          selectedCampaign.retrySettings.cooldownPeriod
                            .afterAttempts
                        }
                        onChange={(e) =>
                          handleInputChange(
                            "afterAttempts",
                            parseInt(e.target.value),
                          )
                        }
                        min={1}
                        className="h-8"
                        placeholder="After Attempts"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Number of tries before entering cooldown
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 mt-6">
              <h5 className="font-medium text-gray-700">
                Legal Calling Hours & Compliance
              </h5>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  To ensure compliance with federal and state regulations:
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>
                    • Customers aren't called between 9pm-8am in their local
                    time, based on the provided zipcode or timezone
                  </li>
                  <li>
                    • Some states have specific restrictions about number of
                    call attempts in a day
                  </li>
                  <li>
                    • Any customer receiving outbound dial attempts must provide
                    prior express consent, and/or hold an existing business
                    relationship with your company
                  </li>
                </ul>
                <p className="text-sm text-gray-600">
                  Visit our{" "}
                  <a
                    href="https://nodable.ai/utility-pages/tcpa-compliance-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    TCPA compliance policy
                  </a>{" "}
                  for more information.
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={Object.keys(pendingChanges).length === 0 || isSaving}
                className="bg-emerald-400 text-white hover:bg-emerald-500"
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

        <div className="w-1/2">
          <h4 className="text-lg font-medium text-gray-900 mb-6">
            About Retry Strategies
          </h4>
          <div className="space-y-6">
            <div>
              <h5 className="font-medium text-gray-700">None</h5>
              <p className="text-sm text-gray-600">
                No retry attempts will be made. The campaign will only attempt
                to contact each customer once. Choose this when you only need a
                single contact attempt per customer.
              </p>
            </div>

            <div>
              <h5 className="font-medium text-gray-700">Pattern</h5>
              <p className="text-sm text-gray-600">
                Best for complex, multi-day campaigns where contact urgency
                varies over time. Ideal for lead qualification, sales follow-up,
                and time-sensitive notifications. This strategy allows you to:
              </p>
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                <li>
                  • Days: Schedule different attempt frequencies across multiple
                  days (e.g., more attempts on day 1, fewer on following days)
                </li>
                <li>
                  • Attempts: Set the maximum number of contact tries per day to
                  optimize reach
                </li>
                <li>
                  • Interval: Configure time between attempts in minutes to
                  respect customer availability
                </li>
              </ul>
            </div>

            <div>
              <h5 className="font-medium text-gray-700">Delays</h5>
              <p className="text-sm text-gray-600">
                Perfect for simple, consistent follow-ups with evenly spaced
                attempts. Ideal for welcome calls, appointment reminders, and
                verification calls. Uses fixed intervals between each attempt.
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Example: Try again after 1 hour, then 3 hours, then 6 hours for
                a gradual follow-up pattern.
              </p>
            </div>

            <div>
              <h5 className="font-medium text-gray-700">Cooldown Settings</h5>
              <p className="text-sm text-gray-600">
                Cooldown periods help manage repeated contact attempts and
                respect customer preferences:
              </p>
              <ul className="mt-2 text-sm text-gray-600 space-y-1">
                <li>
                  • Hours: How long to pause before potentially restarting
                  attempts (e.g., 24 hours for daily campaigns, 48+ for less
                  urgent ones)
                </li>
                <li>
                  • After Attempts: Number of tries before entering cooldown,
                  helping prevent customer fatigue
                </li>
              </ul>
              <p className="mt-2 text-sm text-gray-600">
                All strategies respect customer time zones and legal calling
                hours automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
