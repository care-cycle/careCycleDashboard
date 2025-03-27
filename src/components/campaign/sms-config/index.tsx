import * as React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Campaign, SmsTypes, SmsContent } from "@/types/campaign";
import { transformToFrontendFormat } from "@/utils/smsVariables";
import { DEFAULT_SMS_CONTENT } from "@/lib/sms-config";
import { CompanyNameSection } from "./CompanyNameSection";
import { VariablesSection } from "./VariablesSection";
import { MessageSection } from "./MessageSection";

const SMS_TYPE_DESCRIPTIONS = {
  firstContact: "Sent before the first outbound call to notify the customer",
  missedFirstContact: "Sent when the first contact attempt was unsuccessful",
  redial:
    "Sent when attempting to reach the customer again after a missed call (applies to every redial attempt)",
  appointmentBooked: "Sent when an appointment is successfully booked",
  appointmentReminder:
    "Sent 5 minutes before a scheduled appointment as a reminder",
  missedAppointment: "Sent when a customer misses their scheduled appointment",
  missedInquiry:
    "Sent when a customer inquiry was received but couldn't be responded to immediately",
  INFORMATIONAL_FOLLOWUP:
    "Sent after a successful call to provide additional information or next steps",
};

interface SmsConfigProps {
  campaign: Campaign;
  pendingChanges: Partial<Campaign>;
  setPendingChanges: (changes: React.SetStateAction<Partial<Campaign>>) => void;
  hasDiscreteNumber: boolean;
  companyNameError: boolean;
  setCompanyNameError: (error: boolean) => void;
  isSaving: boolean;
  handleSave: () => void;
  hasInquiryCallback: boolean;
}

interface VariableAutocompleteProps {
  textareaId: string;
  onSelect: (variable: string) => void;
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

  // Add effect to reset state when opening
  React.useEffect(() => {
    if (open) {
      setSelectedIndex(0);
      setFilter("");
    }
  }, [open]);

  const VARIABLES = [
    { name: "firstname", description: "Customer's first name" },
    { name: "lastname", description: "Customer's last name" },
    { name: "appointmenttime", description: "Scheduled time" },
    { name: "appointmentdate", description: "Scheduled date" },
  ];

  const filteredVariables = React.useMemo(() => {
    if (!filter) return VARIABLES;
    const searchTerm = filter.toLowerCase().replace("{", "");
    return VARIABLES.filter(
      (v) =>
        v.name.toLowerCase().includes(searchTerm) ||
        v.description.toLowerCase().includes(searchTerm),
    );
  }, [filter]);

  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;

      const textarea = document.getElementById(
        textareaId,
      ) as HTMLTextAreaElement;
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
            onSelect(selectedVariable.name);
            onOpenChange(false);
          }
          break;
        case "Escape":
          e.preventDefault();
          onOpenChange(false);
          break;
        default:
          if (match) {
            setFilter(match[0]);
            setSelectedIndex(0);
          }
      }
    },
    [
      open,
      selectedIndex,
      filteredVariables,
      textareaId,
      onSelect,
      onOpenChange,
    ],
  );

  React.useEffect(() => {
    if (open) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [open, handleKeyDown]);

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
              onSelect(variable.name);
              onOpenChange(false);
            }}
            className={`cursor-pointer h-[32px] text-sm flex items-center px-3 ${
              index === selectedIndex ? "bg-gray-100" : "hover:bg-gray-50"
            }`}
          >
            {variable.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SmsConfig({
  campaign,
  pendingChanges,
  setPendingChanges,
  hasDiscreteNumber,
  companyNameError,
  setCompanyNameError,
  isSaving,
  handleSave: parentHandleSave,
  hasInquiryCallback,
}: SmsConfigProps) {
  const [showVariables, setShowVariables] = React.useState(false);
  const [activeTextareaId, setActiveTextareaId] = React.useState<string | null>(
    null,
  );
  const [cursorPosition, setCursorPosition] = React.useState<number | null>(
    null,
  );

  const getDefaultSmsTypes = React.useCallback(() => {
    const types = {
      redial: false,
      firstContact: false,
      appointmentBooked: false,
      missedAppointment: false,
      missedFirstContact: false,
      appointmentReminder: false,
      INFORMATIONAL_FOLLOWUP: false,
    } as SmsTypes;

    if (hasInquiryCallback) {
      types.missedInquiry = false;
    }

    return types;
  }, [hasInquiryCallback]);

  const currentSmsContent = React.useMemo(() => {
    const content = pendingChanges.smsContent ?? campaign?.smsContent ?? {};
    return Object.entries(content).reduce((acc, [key, value]) => {
      acc[key as keyof SmsContent] = value
        ? transformToFrontendFormat(value)
        : "";
      return acc;
    }, {} as SmsContent);
  }, [pendingChanges.smsContent, campaign?.smsContent]);

  const currentSmsTypes =
    pendingChanges.smsTypes ?? campaign?.smsTypes ?? getDefaultSmsTypes();

  const isApprovalCampaign =
    campaign.type === "WELCOME_CALL" || campaign.type === "APPROVAL_CALL";

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

  const handleTextareaChange = (key: keyof SmsContent, value: string) => {
    const companyName =
      pendingChanges.smsCompanyName ?? campaign?.smsCompanyName;
    const companyNameLength = (companyName?.length || 0) + 1;
    const stopText = " Reply STOP to opt-out.";
    const maxMainLength = 160 - stopText.length - companyNameLength;

    const textWithoutBrackets = value.replace(/{|}/g, "");
    if (textWithoutBrackets.length <= maxMainLength) {
      setPendingChanges((prev) => ({
        ...prev,
        smsContent: {
          ...currentSmsContent,
          [key]: value || "",
        },
      }));
    }
  };

  const handleTextareaClick = (
    e: React.MouseEvent<HTMLTextAreaElement>,
    key: keyof SmsContent,
  ) => {
    const textarea = e.currentTarget;
    setCursorPosition(textarea.selectionStart);
    setActiveTextareaId(`smsContent-${key}`);
  };

  const handleVariableSelect = (variable: string) => {
    if (!activeTextareaId || cursorPosition === null) return;

    const key = activeTextareaId.replace("smsContent-", "") as keyof SmsContent;
    const content = currentSmsContent[key] || "";
    const textBeforeCursor = content.slice(0, cursorPosition);
    const lastOpenBrace = textBeforeCursor.lastIndexOf("{");

    if (lastOpenBrace !== -1) {
      const newContent =
        content.slice(0, lastOpenBrace) +
        `{${variable}}` +
        content.slice(cursorPosition);

      setPendingChanges((prev) => ({
        ...prev,
        smsContent: {
          ...currentSmsContent,
          [key]: newContent,
        },
      }));

      const textarea = document.getElementById(
        activeTextareaId,
      ) as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
        const newPosition = lastOpenBrace + variable.length + 2;
        textarea.setSelectionRange(newPosition, newPosition);
        setCursorPosition(newPosition);
      }
    }

    setShowVariables(false);
  };

  const handleTypeChange = (key: keyof SmsTypes, checked: boolean) => {
    const companyName =
      pendingChanges.smsCompanyName ?? campaign?.smsCompanyName;
    if (!companyName && checked) {
      setCompanyNameError(true);
      return;
    }
    setPendingChanges((prev) => ({
      ...prev,
      smsTypes: {
        ...currentSmsTypes,
        [key]: checked,
      },
    }));
  };

  const handleSave = async () => {
    try {
      await parentHandleSave();
      setPendingChanges({});
    } catch (error) {
      console.error("Error saving SMS configuration:", error);
    }
  };

  if (!hasDiscreteNumber) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-lg text-gray-600">
            Please contact careCycle to get an SMS number registered
          </p>
          <Button variant="outline">Contact Support</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-6 h-16 flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">
            SMS Configuration
          </h2>
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

      <div className="max-w-screen-xl mx-auto px-6 py-8">
        <div className="grid grid-cols-[2fr,1fr] gap-8">
          {/* Main Content */}
          <div className="space-y-6">
            <CompanyNameSection
              campaign={campaign}
              pendingChanges={pendingChanges}
              setPendingChanges={setPendingChanges}
              companyNameError={companyNameError}
              setCompanyNameError={setCompanyNameError}
              getDefaultSmsTypes={getDefaultSmsTypes}
            />

            <div className="space-y-6">
              <MessageSection
                title="First Contact"
                messageKeys={["firstContact", "missedFirstContact", "redial"]}
                types={currentSmsTypes}
                content={currentSmsContent}
                companyName={
                  pendingChanges.smsCompanyName ??
                  campaign?.smsCompanyName ??
                  ""
                }
                onTypeChange={handleTypeChange}
                onContentChange={handleTextareaChange}
                onTextareaFocus={setActiveTextareaId}
                onTextareaBlur={() => setActiveTextareaId(null)}
                onTextareaClick={handleTextareaClick}
                onTextareaKeyDown={handleTextareaKeyDown}
                descriptions={SMS_TYPE_DESCRIPTIONS}
                showVariables={showVariables}
                activeTextareaId={activeTextareaId}
                VariableAutocomplete={VariableAutocomplete}
                setShowVariables={setShowVariables}
              />

              <MessageSection
                title="Appointment SMS"
                messageKeys={[
                  "appointmentBooked",
                  "appointmentReminder",
                  "missedAppointment",
                  ...(hasInquiryCallback
                    ? ["missedInquiry" as keyof SmsTypes]
                    : []),
                ]}
                types={currentSmsTypes}
                content={currentSmsContent}
                companyName={
                  pendingChanges.smsCompanyName ??
                  campaign?.smsCompanyName ??
                  ""
                }
                onTypeChange={handleTypeChange}
                onContentChange={handleTextareaChange}
                onTextareaFocus={setActiveTextareaId}
                onTextareaBlur={() => setActiveTextareaId(null)}
                onTextareaClick={handleTextareaClick}
                onTextareaKeyDown={handleTextareaKeyDown}
                descriptions={SMS_TYPE_DESCRIPTIONS}
                showVariables={showVariables}
                activeTextareaId={activeTextareaId}
                VariableAutocomplete={VariableAutocomplete}
                setShowVariables={setShowVariables}
              />

              {isApprovalCampaign && (
                <MessageSection
                  title="Informational Follow-up"
                  messageKeys={["INFORMATIONAL_FOLLOWUP" as keyof SmsTypes]}
                  types={currentSmsTypes}
                  content={currentSmsContent}
                  companyName={
                    pendingChanges.smsCompanyName ??
                    campaign?.smsCompanyName ??
                    ""
                  }
                  onTypeChange={handleTypeChange}
                  onContentChange={handleTextareaChange}
                  onTextareaFocus={setActiveTextareaId}
                  onTextareaBlur={() => setActiveTextareaId(null)}
                  onTextareaClick={handleTextareaClick}
                  onTextareaKeyDown={handleTextareaKeyDown}
                  descriptions={SMS_TYPE_DESCRIPTIONS}
                  showVariables={showVariables}
                  activeTextareaId={activeTextareaId}
                  VariableAutocomplete={VariableAutocomplete}
                  setShowVariables={setShowVariables}
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <VariablesSection
              onVariableClick={handleVariableSelect}
              activeTextareaId={activeTextareaId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
