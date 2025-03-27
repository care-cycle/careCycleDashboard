import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Campaign, SmsTypes, SmsContent } from "@/types/campaign";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { transformToFrontendFormat } from "@/utils/smsVariables";
import { DEFAULT_SMS_CONTENT } from "@/lib/sms-config";
import { SmsConfigPanel } from "./sms-config/SmsConfigPanel";

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
          // Allow typing to filter
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
              const textarea = document.getElementById(
                textareaId,
              ) as HTMLTextAreaElement;
              if (textarea) {
                const cursorPos = textarea.selectionStart;
                const textBeforeCursor = textarea.value.slice(0, cursorPos);
                const match = textBeforeCursor.match(/{[^}]*$/);
                if (match) {
                  onSelect(variable.name);
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
  missedInquiry:
    "Sent when a customer inquiry was received but couldn't be responded to immediately",
};

export function SmsConfig(props: SmsConfigProps) {
  return (
    <div className="px-6 pb-6">
      <SmsConfigPanel {...props} />
    </div>
  );
}
