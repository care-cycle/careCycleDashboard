import * as React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  MessageSquare,
  Phone,
  Calendar,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { Campaign, SmsTypes, SmsContent } from "@/types/campaign";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/use-toast";
import type { LucideIcon } from "lucide-react";

interface SmsConfigPanelProps {
  campaign: Campaign;
  pendingChanges: Partial<Campaign>;
  setPendingChanges: (changes: React.SetStateAction<Partial<Campaign>>) => void;
  hasDiscreteNumber: boolean;
  companyNameError: boolean;
  setCompanyNameError: (error: boolean) => void;
  isSaving: boolean;
  handleSave: () => void;
}

interface MessageGroup {
  title: string;
  description: string;
  icon: LucideIcon;
  types: readonly (keyof SmsContent)[];
  showIf?: (campaign: Campaign) => boolean;
}

const MESSAGE_GROUPS: Record<string, MessageGroup> = {
  contact: {
    title: "First Contact",
    description: "Messages sent during initial contact attempts",
    icon: Phone,
    types: ["firstContact", "missedFirstContact", "redial"],
  },
  appointment: {
    title: "Appointments",
    description: "Messages related to appointments",
    icon: Calendar,
    types: ["appointmentBooked", "appointmentReminder", "missedAppointment"],
  },
  inquiry: {
    title: "Inquiry",
    description: "Messages related to customer inquiries",
    icon: MessageSquare,
    types: ["newInquiry", "missedInquiry"],
    showIf: (campaign: Campaign) => campaign.hasInquiryCallback === true,
  },
  followup: {
    title: "Follow-ups",
    description: "Messages sent after successful interactions",
    icon: MessageSquare,
    types: ["informationalFollowup"],
    showIf: (campaign: Campaign) =>
      campaign.type === "WELCOME_CALL" || campaign.type === "APPROVAL_CALL",
  },
};

const MESSAGE_DESCRIPTIONS = {
  firstContact: "Sent before the first outbound call",
  missedFirstContact: "Sent when first contact attempt fails",
  redial: "Sent when attempting to reach again",
  appointmentBooked: "Confirms a scheduled appointment",
  appointmentReminder: "Reminds about upcoming appointment",
  missedAppointment: "Sent after a missed appointment",
  missedInquiry: "Sent when unable to respond to inquiry",
  newInquiry: "Sent to acknowledge receipt of new inquiry",
  informationalFollowup:
    "Sent after a successful call where information was provided to the customer. Use this to summarize key points discussed and provide a contact number for any follow-up questions.",
} as const;

const VARIABLE_MAPPINGS = {
  firstName: "clientCustomer.firstName",
  lastName: "clientCustomer.lastName",
  appointmentTime: "appointmentTime",
  appointmentDate: "appointmentDate",
} as const;

// GSM 7-bit default alphabet and extension table
const GSM_CHARS =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1BÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM_EXTENSION = "^{}\\[~]|€";

// Characters that count as two in GSM-7
const DOUBLE_SPACE_GSM = "^{}\\[~]|€";

function isGSMChar(char: string): boolean {
  return GSM_CHARS.includes(char) || GSM_EXTENSION.includes(char);
}

function needsUCS2(text: string): boolean {
  return !Array.from(text).every(isGSMChar);
}

function getCharacterCount(content: string, companyName: string = "") {
  // Clean up company name
  const companyNameClean = companyName.trim().replace(/^:+|:+$/g, "");

  // Replace template variables with their actual names (without braces)
  const textWithoutBraces = content.replace(/{(.*?)}/g, "$1");

  // Full message including company name and opt-out
  const fullText = `${companyNameClean}: ${textWithoutBraces} Reply STOP to opt-out.`;

  const needsUnicode = needsUCS2(fullText);
  const segmentSize = needsUnicode ? 70 : 160; // Single segment only

  let charCount = 0;
  Array.from(fullText).forEach((char) => {
    if (DOUBLE_SPACE_GSM.includes(char)) {
      charCount += 2; // Count extended GSM chars as 2
    } else {
      charCount += 1;
    }
  });

  // Calculate max chars for content only, accounting for company name and opt-out
  const companyPrefixLength = companyNameClean.length + 2; // +2 for ": "
  const optOutLength = 22; // " Reply STOP to opt-out."
  const maxContentChars = segmentSize - companyPrefixLength - optOutLength;

  return {
    current: textWithoutBraces.length,
    total: charCount,
    max: maxContentChars,
    encoding: needsUnicode ? "UCS-2" : "GSM-7",
  };
}

function MessageEditor({
  messageKey,
  content,
  enabled,
  onToggle,
  onChange,
  companyName,
}: {
  messageKey: keyof SmsContent;
  content: string;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  onChange: (value: string) => void;
  companyName: string;
}) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const charCount = getCharacterCount(content, companyName);

  const insertVariable = (displayName: string) => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newContent =
      content.substring(0, start) + `{${displayName}}` + content.substring(end);

    onChange(newContent);

    // Reset cursor position
    const newCursorPos = start + displayName.length + 2; // +2 for the { and }
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const isNearLimit = charCount.current > charCount.max * 0.8;
  const isAtLimit = charCount.current >= charCount.max;

  // Helper to transform variables into bold text for preview
  const formatPreviewText = (text: string) => {
    return text.replace(
      /{(firstName|lastName|appointmentTime|appointmentDate)}/g,
      (_, variable) => {
        return `<strong>${variable}</strong>`;
      },
    );
  };

  return (
    <div
      className={cn(
        "rounded-lg border transition-colors",
        enabled ? "border-gray-200" : "border-gray-100 bg-gray-50",
      )}
    >
      {/* Header Section */}
      <div className="flex items-center gap-4 p-3 border-b border-gray-100">
        <Switch checked={enabled} onCheckedChange={onToggle} />

        <div className="flex-1 flex items-center justify-between min-w-0">
          <div className="flex items-baseline gap-3">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium">
                {messageKey
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase())}
              </h4>
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
                    className="max-w-[300px] text-sm break-words"
                  >
                    <p>
                      {
                        MESSAGE_DESCRIPTIONS[
                          messageKey as keyof typeof MESSAGE_DESCRIPTIONS
                        ]
                      }
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            {enabled && (
              <span
                className={cn(
                  "text-xs",
                  charCount.total > (charCount.encoding === "UCS-2" ? 70 : 160)
                    ? "text-red-500"
                    : "text-gray-500",
                )}
              >
                {charCount.total}/
                {charCount.encoding === "UCS-2" ? "70" : "160"} chars
                {charCount.encoding === "UCS-2" && " · Unicode"}
              </span>
            )}
          </div>

          {enabled && (
            <div className="flex gap-1.5">
              {Object.keys(VARIABLE_MAPPINGS).map((displayName) => (
                <button
                  key={displayName}
                  onClick={() => insertVariable(displayName)}
                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium 
                    bg-white border border-gray-200 text-gray-600 
                    hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300
                    active:bg-gray-100
                    transition-all duration-150 ease-in-out
                    shadow-sm
                    whitespace-nowrap"
                >
                  {`{${displayName}}`}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content Section */}
      {enabled && (
        <div className="grid grid-cols-2 gap-3 p-3">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-[88px] p-2 rounded-md border border-gray-200 focus:border-emerald-300 focus:ring-emerald-100 text-sm resize-none"
            placeholder="Enter your message..."
            maxLength={charCount.max}
          />

          <div className="rounded-md bg-gray-50 border border-gray-100 h-[88px] flex flex-col">
            <div className="flex items-center gap-1.5 px-2 py-1 border-b border-gray-100 shrink-0">
              <MessageSquare className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-600">Preview</span>
            </div>
            <div className="p-2 overflow-hidden">
              <p className="text-sm text-gray-600 line-clamp-3">
                {/* Company name handling to match backend logic */}
                {companyName && (
                  <>
                    <span className="font-medium text-gray-900">
                      {companyName.trim().replace(/^:+|:+$/g, "")}
                    </span>
                    <span className="font-medium text-gray-900">: </span>
                  </>
                )}
                <span
                  dangerouslySetInnerHTML={{
                    __html:
                      formatPreviewText(content) ||
                      "Your message will appear here",
                  }}
                />
                {/* Add period and opt-out if there's content */}
                {content && (
                  <span className="text-gray-500">
                    {content.trim() && !content.trim().endsWith(".")
                      ? ". "
                      : " "}
                    Reply STOP to opt-out.
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const getDefaultSmsTypes = (): SmsTypes => ({
  redial: false,
  firstContact: false,
  appointmentBooked: false,
  missedAppointment: false,
  missedFirstContact: false,
  appointmentReminder: false,
  missedInquiry: false,
  newInquiry: false,
  informationalFollowup: false,
});

const getDefaultSmsContent = (): SmsContent => ({
  redial: "",
  firstContact: "",
  appointmentBooked: "",
  missedAppointment: "",
  missedFirstContact: "",
  appointmentReminder: "",
  missedInquiry: "",
  newInquiry: "",
  informationalFollowup: "",
});

// Helper to determine if a message type should be shown
const shouldShowMessageType = (
  messageKey: keyof SmsContent,
  campaign: Campaign,
) => {
  // Informational followup is only for WELCOME_CALL and APPROVAL_CALL
  if (messageKey === "informationalFollowup") {
    return (
      campaign.type === "WELCOME_CALL" || campaign.type === "APPROVAL_CALL"
    );
  }

  // Inquiry-related messages require hasInquiryCallback
  if (["newInquiry", "missedInquiry"].includes(messageKey)) {
    return campaign.hasInquiryCallback === true;
  }

  return true;
};

// Transform functions for SMS variables
const transformForDisplay = (text: string) => {
  return text
    .replace(/{{clientCustomer\.(.*?)}}/g, "{$1}")
    .replace(/{{(.*?)}}/g, "{$1}");
};

const transformForSubmit = (text: string) => {
  return text
    .replace(/{(firstName|lastName)}/g, "{{clientCustomer.$1}}")
    .replace(/{(appointmentTime|appointmentDate)}/g, "{{$1}}");
};

// Transform SMS content object for display
const transformContentForDisplay = (content: SmsContent): SmsContent => {
  const transformed = { ...content };
  Object.keys(transformed).forEach((key) => {
    if (transformed[key as keyof SmsContent]) {
      transformed[key as keyof SmsContent] = transformForDisplay(
        transformed[key as keyof SmsContent],
      );
    }
  });
  return transformed;
};

// Transform SMS content object for submission
const transformContentForSubmit = (content: SmsContent): SmsContent => {
  const transformed = { ...content };
  Object.keys(transformed).forEach((key) => {
    if (transformed[key as keyof SmsContent]) {
      transformed[key as keyof SmsContent] = transformForSubmit(
        transformed[key as keyof SmsContent],
      );
    }
  });
  return transformed;
};

export function SmsConfigPanel({
  campaign,
  pendingChanges,
  setPendingChanges,
  hasDiscreteNumber,
  companyNameError,
  setCompanyNameError,
  isSaving,
  handleSave,
}: SmsConfigPanelProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState("contact");
  const showCompanyPhone = false; // Remove company phone functionality

  // Transform content when getting from campaign or pendingChanges
  const currentContent = React.useMemo(() => {
    const content =
      pendingChanges.smsContent ??
      campaign?.smsContent ??
      getDefaultSmsContent();
    return transformContentForDisplay(content);
  }, [pendingChanges.smsContent, campaign?.smsContent]);

  // Filter visible tabs based on campaign type and inquiry callback status
  const visibleTabs = Object.entries(MESSAGE_GROUPS).filter(([_, group]) => {
    if (group.showIf) {
      return group.showIf(campaign);
    }
    return true;
  });

  const companyName =
    pendingChanges.smsCompanyName ?? campaign?.smsCompanyName ?? "";

  const currentTypes =
    pendingChanges.smsTypes ?? campaign?.smsTypes ?? getDefaultSmsTypes();

  const handleCompanyNameChange = (name: string) => {
    setCompanyNameError(!name);
    setPendingChanges((prev) => ({
      ...prev,
      smsCompanyName: name,
    }));
  };

  const handleTypeChange = (key: keyof SmsTypes, value: boolean) => {
    setPendingChanges((prev) => ({
      ...prev,
      smsTypes: {
        ...currentTypes,
        [key]: value,
      } as SmsTypes,
    }));
  };

  const handleContentChange = (key: keyof SmsContent, value: string) => {
    // Clean up any double commas or spaces that might occur from variable deletion
    const cleanedValue = value
      .replace(/,\s*,/g, ",") // Replace double commas with single comma
      .replace(/\s+/g, " ") // Replace multiple spaces with single space
      .replace(/,\s*\./g, ".") // Replace ", ." with just "."
      .trim();

    setPendingChanges((prev) => ({
      ...prev,
      smsContent: {
        ...currentContent,
        [key]: cleanedValue,
      } as SmsContent,
    }));
  };

  const canSave = () => {
    return (
      companyName.trim().length > 0 &&
      Object.values(currentTypes).some(Boolean) &&
      Object.entries(currentTypes)
        .filter(([_, enabled]) => enabled)
        .every(
          ([key]) => currentContent[key as keyof SmsContent]?.trim().length > 0,
        )
    );
  };

  const handleSaveWrapper = async () => {
    try {
      // Transform content back to API format before saving
      const transformedContent = transformContentForSubmit(currentContent);

      setPendingChanges((prev) => ({
        ...prev,
        smsContent: transformedContent,
      }));

      await handleSave();

      toast({
        title: "SMS Configuration Saved",
        description: (
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            <span>
              Your SMS message settings have been updated successfully.
            </span>
          </div>
        ),
        className: "border-emerald-500/20 bg-emerald-50",
      });
    } catch (error) {
      toast({
        title: "Failed to Save",
        description: (
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <span>
              There was an error saving your SMS configuration. Please try
              again.
            </span>
          </div>
        ),
        className: "border-red-500/20 bg-red-50",
      });
      console.error("Error saving SMS configuration:", error);
    }
  };

  if (!hasDiscreteNumber) {
    return (
      <div className="p-8 text-center">
        <p className="text-sm text-gray-600">
          Please contact careCycle to get an SMS number registered
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Name Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">Company Name</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              This name will appear at the start of every SMS message
            </p>
          </div>
          <div className="w-[280px]">
            <Input
              value={companyName}
              onChange={(e) => handleCompanyNameChange(e.target.value)}
              placeholder="Enter company name"
              className={cn("text-sm", companyNameError && "border-red-500")}
            />
            {companyNameError && (
              <p className="text-xs text-red-500 mt-1">
                Company name is required to enable SMS messages
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-gray-50 border border-gray-100 p-3">
          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
            <MessageSquare className="w-3 h-3" />
            Message Format
          </div>
          <p className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">
              {companyName
                ? `${companyName.trim().replace(/^:+|:+$/g, "")}: `
                : "[Company Name]: "}
            </span>
            Your message content.
            <span className="text-gray-500"> Reply STOP to opt-out.</span>
          </p>
        </div>
      </div>

      {/* Message Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="border-b border-gray-100">
            <TabsList className="p-0 bg-gray-50/50">
              {visibleTabs.map(([key, group], index) => {
                const Icon = group.icon;
                return (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white rounded-none border-r border-gray-100 last:border-r-0",
                      "first:rounded-tl-lg last:rounded-tr-lg",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {group.title}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {visibleTabs.map(([key, group]) => (
            <TabsContent key={key} value={key} className="p-4">
              <div className="space-y-4">
                {group.types
                  .filter((messageKey) =>
                    shouldShowMessageType(
                      messageKey as keyof SmsContent,
                      campaign,
                    ),
                  )
                  .map((messageKey) => (
                    <MessageEditor
                      key={messageKey}
                      messageKey={messageKey as keyof SmsContent}
                      content={
                        currentContent[messageKey as keyof SmsContent] || ""
                      }
                      enabled={
                        currentTypes[messageKey as keyof SmsTypes] || false
                      }
                      onToggle={(enabled) =>
                        handleTypeChange(messageKey as keyof SmsTypes, enabled)
                      }
                      onChange={(value) =>
                        handleContentChange(
                          messageKey as keyof SmsContent,
                          value,
                        )
                      }
                      companyName={companyName}
                    />
                  ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Actions */}
      <div className="flex justify-end">
        <Button
          onClick={handleSaveWrapper}
          disabled={!canSave() || isSaving}
          className="bg-emerald-500 text-white hover:bg-emerald-600"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}
