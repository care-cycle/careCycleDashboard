import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import type { Campaign, SmsTypes, SmsContent } from "@/types/campaign";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  transformToBackendFormat,
  transformToFrontendFormat,
} from "@/utils/smsVariables";

const VARIABLES = [
  { name: "firstname", description: "Customer's first name" },
  { name: "lastname", description: "Customer's last name" },
  { name: "appointmenttime", description: "Scheduled time" },
  { name: "appointmentdate", description: "Scheduled date" },
];

interface SmsConfigProps {
  campaign: Campaign;
  pendingChanges: Partial<Campaign>;
  setPendingChanges: (changes: React.SetStateAction<Partial<Campaign>>) => void;
  hasDiscreteNumber: boolean;
  companyNameError: boolean;
  setCompanyNameError: (error: boolean) => void;
  isSaving: boolean;
  handleSave: () => void;
}

const defaultSmsTypes: SmsTypes = {
  redial: false,
  firstContact: false,
  appointmentBooked: false,
  missedAppointment: false,
  missedFirstContact: false,
  appointmentReminder: false,
};

const defaultSmsContent: SmsContent = {
  redial: "",
  firstContact: "",
  appointmentBooked: "",
  missedAppointment: "",
  missedFirstContact: "",
  appointmentReminder: "",
};

interface VariableAutocompleteProps {
  textareaId: string;
  onSelect: (variable: string, partialText: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function VariableAutocomplete({
  textareaId,
  onSelect,
  open,
  onOpenChange,
}: VariableAutocompleteProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [filter, setFilter] = React.useState("");

  const filteredVariables = React.useMemo(() => {
    if (!filter) return VARIABLES;
    const searchTerm = filter.toLowerCase().replace("{", "");
    return VARIABLES.filter(
      (v) =>
        v.name.toLowerCase().includes(searchTerm) ||
        v.description.toLowerCase().includes(searchTerm),
    );
  }, [filter]);

  React.useEffect(() => {
    if (open) {
      setSelectedIndex(0);
      setFilter("");
    }
  }, [open]);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!open) return;

    const textarea = document.getElementById(textareaId) as HTMLTextAreaElement;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = textarea.value.slice(0, cursorPos);
    const match = textBeforeCursor.match(/{[^}]*$/);

    switch (e.key) {
      case "ArrowDown":
      case "Tab":
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredVariables.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(
          (prev) =>
            (prev - 1 + filteredVariables.length) % filteredVariables.length,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (filteredVariables.length > 0 && match) {
          const selectedVariable = filteredVariables[selectedIndex];
          onSelect(`{${selectedVariable.name}}`, match[0]);
          onOpenChange(false);
        }
        break;
      case "Escape":
        e.preventDefault();
        onOpenChange(false);
        break;
      default:
        // Allow typing to filter
        if (match) {
          setFilter(match[0]);
          setSelectedIndex(0);
        }
    }
  };

  React.useEffect(() => {
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, selectedIndex, filteredVariables]);

  if (filteredVariables.length === 0) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute w-[180px] bg-white border border-gray-200 shadow-sm rounded-md overflow-hidden"
      style={{
        display: open ? "block" : "none",
        position: "absolute",
        left: 0,
        top: "100%",
        marginTop: "4px",
        zIndex: 100,
      }}
    >
      <div className="p-0 m-0">
        {filteredVariables.map((variable, index) => (
          <div
            key={variable.name}
            onClick={() => {
              const textarea = document.getElementById(
                textareaId,
              ) as HTMLTextAreaElement;
              if (textarea) {
                const cursorPos = textarea.selectionStart;
                const textBeforeCursor = textarea.value.slice(0, cursorPos);
                const match = textBeforeCursor.match(/{[^}]*$/);
                if (match) {
                  onSelect(`{${variable.name}}`, match[0]);
                  onOpenChange(false);
                }
              }
            }}
            className={cn(
              "cursor-pointer h-[32px] text-sm flex items-center px-3",
              index === selectedIndex ? "bg-gray-100" : "hover:bg-gray-50",
            )}
          >
            {variable.name}
          </div>
        ))}
      </div>
    </div>
  );
}

const SMS_TYPE_DESCRIPTIONS = {
  firstContact: "Sent before the first outbound call to notify the customer",
  missedFirstContact: "Sent when the first contact attempt was unsuccessful",
  redial:
    "Sent when attempting to reach the customer again after a missed call (applies to every redial attempt)",
  appointmentBooked: "Sent when an appointment is successfully booked",
  appointmentReminder:
    "Sent 5 minutes before a scheduled appointment as a reminder",
  missedAppointment: "Sent when a customer misses their scheduled appointment",
};

export function SmsConfig({
  campaign: selectedCampaign,
  pendingChanges,
  setPendingChanges,
  hasDiscreteNumber,
  companyNameError,
  setCompanyNameError,
  isSaving,
  handleSave: parentHandleSave,
}: SmsConfigProps) {
  const [showVariables, setShowVariables] = React.useState(false);
  const [activeTextareaId, setActiveTextareaId] = React.useState<string | null>(
    null,
  );
  const [cursorPosition, setCursorPosition] = React.useState<number | null>(
    null,
  );
  const [variableAnchorPoint, setVariableAnchorPoint] = React.useState({
    x: 0,
    y: 0,
  });

  // Transform the initial SMS content to frontend format
  const currentSmsContent = React.useMemo(() => {
    const content =
      pendingChanges.smsContent ??
      selectedCampaign?.smsContent ??
      defaultSmsContent;
    return Object.entries(content).reduce((acc, [key, value]) => {
      acc[key as keyof SmsContent] = value
        ? transformToFrontendFormat(value)
        : "";
      return acc;
    }, {} as SmsContent);
  }, [pendingChanges.smsContent, selectedCampaign?.smsContent]);

  // Ensure we have default values for smsTypes
  const currentSmsTypes =
    pendingChanges.smsTypes ?? selectedCampaign?.smsTypes ?? defaultSmsTypes;

  const getCaretCoordinates = (textarea: HTMLTextAreaElement) => {
    // Get the current cursor position
    const cursorPosition = textarea.selectionStart;

    // Create a dummy element to measure the text
    const dummy = document.createElement("div");
    dummy.style.position = "absolute";
    dummy.style.visibility = "hidden";
    dummy.style.whiteSpace = "pre-wrap";
    dummy.style.wordWrap = "break-word";
    dummy.style.width = window.getComputedStyle(textarea).width;
    dummy.style.fontSize = window.getComputedStyle(textarea).fontSize;
    dummy.style.lineHeight = window.getComputedStyle(textarea).lineHeight;
    dummy.style.padding = window.getComputedStyle(textarea).padding;

    // Add the text content up to the cursor
    const textBeforeCursor = textarea.value.substring(0, cursorPosition);
    dummy.textContent = textBeforeCursor;

    // Add the dummy element to the document
    document.body.appendChild(dummy);

    // Get the coordinates
    const dummyRect = dummy.getBoundingClientRect();
    const textareaRect = textarea.getBoundingClientRect();

    // Clean up
    document.body.removeChild(dummy);

    // Calculate the absolute position
    return {
      x: textareaRect.left + (dummyRect.width % textareaRect.width),
      y: textareaRect.top + Math.floor(dummyRect.height),
    };
  };

  const handleTextareaKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
    key: keyof SmsContent,
  ) => {
    if (e.key === "{") {
      const textarea = e.currentTarget;
      setCursorPosition(textarea.selectionStart);
      setActiveTextareaId(`smsContent-${key}`);
      setShowVariables(true);
    } else if (showVariables && e.key === "Escape") {
      setShowVariables(false);
    }
  };

  const handleTextareaChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    key: keyof SmsContent,
  ) => {
    const textarea = e.currentTarget;
    setCursorPosition(textarea.selectionStart);

    const companyName =
      pendingChanges.smsCompanyName ?? selectedCampaign?.smsCompanyName;
    const companyNameLength = (companyName?.length || 0) + 1;
    const stopText = " Reply STOP to opt-out.";
    const maxMainLength = 160 - stopText.length - companyNameLength;

    // Remove curly brackets for length calculation
    const textWithoutBrackets = e.target.value.replace(/{|}/g, "");
    if (textWithoutBrackets.length <= maxMainLength) {
      setPendingChanges((prev: Partial<Campaign>) => {
        const updatedSmsContent = {
          ...defaultSmsContent,
          ...currentSmsContent,
          [key]: e.target.value, // Store the raw value, transform only when sending to API
        };
        return {
          ...prev,
          smsContent: updatedSmsContent,
        };
      });
    }
  };

  // Update the character count display
  const getCharacterCount = (text: string, companyNameLength: number) => {
    const textWithoutBrackets = (text || "").replace(/{|}/g, "");
    const maxLength = 137 - companyNameLength;
    return `${textWithoutBrackets.length}/${maxLength}`;
  };

  const handleTextareaClick = (
    e: React.MouseEvent<HTMLTextAreaElement>,
    key: keyof SmsContent,
  ) => {
    const textarea = e.currentTarget;
    setCursorPosition(textarea.selectionStart);
    setActiveTextareaId(`smsContent-${key}`);
  };

  const handleVariableSelect = (variable: string, partialText: string) => {
    if (!activeTextareaId || cursorPosition === null) return;

    const key = activeTextareaId.replace("smsContent-", "") as keyof SmsContent;
    const content = currentSmsContent[key] || "";

    // Find the position of the partial text before the cursor
    const textBeforeCursor = content.slice(0, cursorPosition);
    const lastOpenBrace = textBeforeCursor.lastIndexOf("{");

    if (lastOpenBrace !== -1) {
      // Replace from the opening brace to the cursor with the complete variable
      const newContent =
        content.slice(0, lastOpenBrace) +
        variable +
        content.slice(cursorPosition);

      setPendingChanges((prev: Partial<Campaign>) => {
        const updatedSmsContent = {
          ...defaultSmsContent,
          ...currentSmsContent,
          [key]: newContent,
        };
        return {
          ...prev,
          smsContent: updatedSmsContent,
        };
      });

      // Focus back on the textarea and place cursor after the inserted variable
      const textarea = document.getElementById(
        activeTextareaId,
      ) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        const newPosition = lastOpenBrace + variable.length;
        textarea.setSelectionRange(newPosition, newPosition);
      }
    }

    setShowVariables(false);
  };

  // Add a focus handler for textareas
  const handleTextareaFocus = (key: string) => {
    setActiveTextareaId(`smsContent-${key}`);
  };

  // Add a blur handler to handle clicking outside
  const handleTextareaBlur = () => {
    // Use a small timeout to allow click events on variables to fire before clearing the active textarea
    setTimeout(() => {
      setActiveTextareaId(null);
    }, 200);
  };

  const handleSaveWrapper = async () => {
    try {
      // Log raw pending changes before saving
      console.log("[SMS Config] Pending changes before save:", {
        pendingChanges,
        currentSmsTypes,
        currentSmsContent,
      });

      await parentHandleSave();
      setPendingChanges({});
    } catch (error) {
      console.error("Error saving SMS configuration:", error);
    }
  };

  return (
    <div className="px-6 pb-6">
      {!hasDiscreteNumber ? (
        <p className="text-sm text-gray-600">
          Please contact careCycle to get an SMS number registered
        </p>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-24">
            <div>
              <div className="space-y-3 text-sm text-gray-600">
                <p className="flex items-center gap-2">
                  <span className="font-medium">•</span>
                  All messages will start with your company name
                </p>
                <p className="flex items-center gap-2">
                  <span className="font-medium">•</span>
                  All messages will automatically end with "Reply STOP to
                  opt-out."
                </p>
              </div>
              <div className="mt-6">
                <Label
                  htmlFor="company-name"
                  className="text-sm font-medium text-gray-900"
                >
                  SMS Company Name
                </Label>
                <div className="mt-2 w-1/2">
                  <Input
                    id="company-name"
                    type="text"
                    placeholder="Enter your SMS company name"
                    value={
                      (pendingChanges.smsCompanyName ??
                        selectedCampaign?.smsCompanyName) ||
                      ""
                    }
                    onChange={(e) => {
                      const newValue = e.target.value;
                      if (newValue) {
                        setCompanyNameError(false);
                      }
                      setPendingChanges((prev: Partial<Campaign>) => ({
                        ...prev,
                        smsCompanyName: newValue,
                        smsTypes: !newValue
                          ? {
                              redial: false,
                              firstContact: false,
                              appointmentBooked: false,
                              missedAppointment: false,
                              missedFirstContact: false,
                              appointmentReminder: false,
                            }
                          : prev.smsTypes,
                      }));
                    }}
                    required
                    className={cn(
                      companyNameError
                        ? "border-red-500 focus-visible:ring-red-500"
                        : "",
                      "transition-colors",
                    )}
                  />
                  {companyNameError && (
                    <p className="text-xs text-red-500 mt-1">
                      Company name is required to enable SMS messages
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    This name will be prepended to all SMS messages (a space is
                    added between the name and the message)
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                Available Variables
              </h4>
              <div className="space-y-3">
                {VARIABLES.map((variableItem) => (
                  <div
                    key={variableItem.name}
                    className="text-sm flex items-center gap-2"
                  >
                    <div className="relative group">
                      <code
                        className="font-mono px-2 py-1 rounded bg-gray-100 border border-gray-200 
                          cursor-pointer inline-block hover:bg-emerald-50 hover:border-emerald-200 
                          hover:text-emerald-600 transition-all duration-150 active:bg-emerald-100"
                        onClick={() => {
                          if (!activeTextareaId) return;
                          const textarea = document.getElementById(
                            activeTextareaId,
                          ) as HTMLTextAreaElement;
                          if (!textarea) return;

                          // Get the current cursor position directly from the textarea
                          const cursorPos = textarea.selectionStart;
                          const key = activeTextareaId.replace(
                            "smsContent-",
                            "",
                          ) as keyof SmsContent;
                          const content = currentSmsContent[key] || "";
                          const variableText = `{${variableItem.name}}`;

                          const newContent =
                            content.slice(0, cursorPos) +
                            variableText +
                            content.slice(cursorPos);
                          setPendingChanges((prev) => ({
                            ...prev,
                            smsContent: {
                              ...currentSmsContent,
                              [key]: newContent,
                            },
                          }));

                          // Focus back on textarea and place cursor after the inserted variable
                          textarea.focus();
                          const newPosition = cursorPos + variableText.length;
                          textarea.setSelectionRange(newPosition, newPosition);
                          setCursorPosition(newPosition);
                        }}
                      >{`{${variableItem.name}}`}</code>
                      <div
                        className="absolute invisible group-hover:visible bg-gray-900 text-white text-xs 
                        rounded px-2 py-1 left-1/2 -translate-x-1/2 -bottom-8 whitespace-nowrap z-10
                        after:content-[''] after:absolute after:left-1/2 after:-top-1 
                        after:w-2 after:h-2 after:bg-gray-900 after:-translate-x-1/2 after:rotate-45"
                      >
                        Click to insert at cursor position
                      </div>
                    </div>
                    <span className="text-gray-600">
                      {variableItem.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="font-medium text-gray-900">First Contact</h4>
            <div className="grid grid-cols-3 gap-6">
              {["firstContact", "missedFirstContact", "redial"].map((key) => (
                <div key={key} className="space-y-4">
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={
                          currentSmsTypes[key as keyof SmsTypes] || false
                        }
                        onCheckedChange={(checked) => {
                          if (!selectedCampaign?.smsCompanyName && checked) {
                            setCompanyNameError(true);
                            return;
                          }
                          setPendingChanges((prev: Partial<Campaign>) => ({
                            ...prev,
                            smsTypes: {
                              ...currentSmsTypes,
                              [key]: checked,
                            },
                          }));
                        }}
                        id={`sms-${key}`}
                      />
                      <Label
                        htmlFor={`sms-${key}`}
                        className="text-sm font-medium flex items-center gap-1"
                      >
                        {key === "firstContact"
                          ? "First Contact"
                          : key === "missedFirstContact"
                            ? "Missed First Contact"
                            : "Redial"}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent
                              side={
                                key === "missedAppointment" || key === "redial"
                                  ? "left"
                                  : "right"
                              }
                              align="center"
                              className="max-w-[220px]"
                            >
                              <p className="text-sm">
                                {
                                  SMS_TYPE_DESCRIPTIONS[
                                    key as keyof typeof SMS_TYPE_DESCRIPTIONS
                                  ]
                                }
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                    </div>
                    <div className="text-sm text-gray-500">
                      {(() => {
                        const companyName =
                          pendingChanges.smsCompanyName ??
                          selectedCampaign?.smsCompanyName;
                        const companyNameLength =
                          (companyName?.length || 0) + 1;
                        const currentText =
                          currentSmsContent[key as keyof SmsContent] || "";
                        return getCharacterCount(
                          currentText,
                          companyNameLength,
                        );
                      })()}
                    </div>
                  </div>
                  <div className="relative">
                    <Textarea
                      id={`smsContent-${key}`}
                      value={currentSmsContent[key as keyof SmsContent] || ""}
                      onChange={(e) =>
                        handleTextareaChange(e, key as keyof SmsContent)
                      }
                      onKeyDown={(e) =>
                        handleTextareaKeyDown(e, key as keyof SmsContent)
                      }
                      onClick={(e) => {
                        handleTextareaClick(e, key as keyof SmsContent);
                        setCursorPosition(e.currentTarget.selectionStart);
                      }}
                      onKeyUp={(e) => {
                        setCursorPosition(e.currentTarget.selectionStart);
                      }}
                      onFocus={(e) => {
                        handleTextareaFocus(key);
                        setCursorPosition(e.currentTarget.selectionStart);
                      }}
                      onBlur={handleTextareaBlur}
                      onSelect={(e) => {
                        const textarea = e.currentTarget;
                        setCursorPosition(textarea.selectionStart);
                      }}
                      placeholder={`Enter message (${
                        137 -
                        (
                          (pendingChanges.smsCompanyName ??
                            selectedCampaign?.smsCompanyName) ||
                          ""
                        ).length -
                        1
                      } chars max)...`}
                      disabled={!currentSmsTypes[key as keyof SmsTypes]}
                      className="h-24"
                      maxLength={137}
                    />
                    <div className="relative">
                      {showVariables &&
                        activeTextareaId === `smsContent-${key}` && (
                          <VariableAutocomplete
                            textareaId={`smsContent-${key}`}
                            onSelect={(variable, partialText) =>
                              handleVariableSelect(variable, partialText)
                            }
                            open={showVariables}
                            onOpenChange={setShowVariables}
                          />
                        )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <h4 className="font-medium text-gray-900">Appointment SMS</h4>
            <div className="grid grid-cols-3 gap-6">
              {[
                "appointmentBooked",
                "appointmentReminder",
                "missedAppointment",
              ].map((key) => (
                <div key={key} className="space-y-4">
                  <div className="flex items-center gap-2 justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={
                          currentSmsTypes[key as keyof SmsTypes] || false
                        }
                        onCheckedChange={(checked) => {
                          if (!selectedCampaign?.smsCompanyName && checked) {
                            setCompanyNameError(true);
                            return;
                          }
                          setPendingChanges((prev: Partial<Campaign>) => ({
                            ...prev,
                            smsTypes: {
                              ...currentSmsTypes,
                              [key]: checked,
                            },
                          }));
                        }}
                        id={`sms-${key}`}
                      />
                      <Label
                        htmlFor={`sms-${key}`}
                        className="text-sm font-medium flex items-center gap-1"
                      >
                        {key === "appointmentBooked"
                          ? "Appointment Booked"
                          : key === "appointmentReminder"
                            ? "Appointment Reminder"
                            : "Missed Appointment"}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-4 w-4 text-gray-400" />
                            </TooltipTrigger>
                            <TooltipContent
                              side={
                                key === "missedAppointment" || key === "redial"
                                  ? "left"
                                  : "right"
                              }
                              align="center"
                              className="max-w-[220px]"
                            >
                              <p className="text-sm">
                                {
                                  SMS_TYPE_DESCRIPTIONS[
                                    key as keyof typeof SMS_TYPE_DESCRIPTIONS
                                  ]
                                }
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </Label>
                    </div>
                    <div className="text-sm text-gray-500">
                      {(() => {
                        const companyName =
                          pendingChanges.smsCompanyName ??
                          selectedCampaign?.smsCompanyName;
                        const companyNameLength =
                          (companyName?.length || 0) + 1;
                        const currentText =
                          currentSmsContent[key as keyof SmsContent] || "";
                        return getCharacterCount(
                          currentText,
                          companyNameLength,
                        );
                      })()}
                    </div>
                  </div>
                  <div className="relative">
                    <Textarea
                      id={`smsContent-${key}`}
                      value={currentSmsContent[key as keyof SmsContent] || ""}
                      onChange={(e) =>
                        handleTextareaChange(e, key as keyof SmsContent)
                      }
                      onKeyDown={(e) =>
                        handleTextareaKeyDown(e, key as keyof SmsContent)
                      }
                      onClick={(e) => {
                        handleTextareaClick(e, key as keyof SmsContent);
                        setCursorPosition(e.currentTarget.selectionStart);
                      }}
                      onKeyUp={(e) => {
                        setCursorPosition(e.currentTarget.selectionStart);
                      }}
                      onFocus={(e) => {
                        handleTextareaFocus(key);
                        setCursorPosition(e.currentTarget.selectionStart);
                      }}
                      onBlur={handleTextareaBlur}
                      onSelect={(e) => {
                        const textarea = e.currentTarget;
                        setCursorPosition(textarea.selectionStart);
                      }}
                      placeholder={`Enter message (${
                        137 -
                        (
                          (pendingChanges.smsCompanyName ??
                            selectedCampaign?.smsCompanyName) ||
                          ""
                        ).length -
                        1
                      } chars max)...`}
                      disabled={!currentSmsTypes[key as keyof SmsTypes]}
                      className="h-24"
                      maxLength={137}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSaveWrapper}
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
      )}
    </div>
  );
}
