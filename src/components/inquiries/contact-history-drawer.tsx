import { useState, useEffect } from "react";
import { X, Phone, MessageSquare, Clock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatPhoneNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ContactHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber?: string;
  customerName?: string;
  callsData?: CallRecord[];
  smsData?: SmsRecord[];
  isLoading?: boolean;
  onCallSelect?: (callId: string) => void;
  hasCallSelected?: boolean;
  selectedCallId?: string | null;
}

interface CallRecord {
  id: string;
  createdAt: string;
  disposition?: string;
  durationMs?: number;
  direction?: string;
  type: "call";
}

interface SmsRecord {
  id: string;
  createdAt: string;
  content?: string;
  direction?: string;
  type: "sms";
}

type ContactRecord = CallRecord | SmsRecord;

export function ContactHistoryDrawer({
  isOpen,
  onClose,
  phoneNumber,
  customerName,
  callsData = [],
  smsData = [],
  isLoading = false,
  onCallSelect,
  hasCallSelected = false,
  selectedCallId,
}: ContactHistoryDrawerProps) {
  const [contactHistory, setContactHistory] = useState<ContactRecord[]>([]);

  // Combine and sort contact history
  useEffect(() => {
    const combined = [...callsData, ...smsData].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    setContactHistory(combined);
  }, [callsData, smsData]);

  const formatDuration = (ms?: number) => {
    if (!ms) return "0:00";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const getDispositionColor = (disposition?: string) => {
    if (!disposition) return "text-gray-500";

    const lowerDisposition = disposition.toLowerCase();
    if (
      lowerDisposition.includes("success") ||
      lowerDisposition.includes("complete")
    ) {
      return "text-green-600";
    }
    if (
      lowerDisposition.includes("fail") ||
      lowerDisposition.includes("error")
    ) {
      return "text-red-600";
    }
    if (lowerDisposition.includes("voicemail")) {
      return "text-yellow-600";
    }
    return "text-gray-600";
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => {
            if (hasCallSelected && onCallSelect) {
              // If a call is selected, close the call details first
              onCallSelect("");
            } else {
              // Otherwise close the contact history
              onClose();
            }
          }}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 h-full bg-white z-50 transform transition-all duration-300",
          hasCallSelected
            ? "w-80 right-[480px] shadow-l"
            : "w-96 right-0 shadow-xl",
          isOpen
            ? "translate-x-0"
            : hasCallSelected
              ? "translate-x-full"
              : "translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div
            className={cn(
              "flex items-center justify-between p-4 border-b",
              hasCallSelected ? "border-r border-gray-200" : "",
            )}
          >
            <div>
              <h2 className="text-lg font-semibold">Contact History</h2>
              {customerName && (
                <p className="text-sm text-gray-500">{customerName}</p>
              )}
              {phoneNumber && (
                <p className="text-xs text-gray-500">
                  {formatPhoneNumber(phoneNumber)}
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div
            className={cn(
              "flex-1 overflow-y-auto p-4",
              hasCallSelected ? "border-r border-gray-200" : "",
            )}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm text-gray-500">
                  Loading contact history...
                </p>
              </div>
            ) : contactHistory.length === 0 ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm text-gray-500">
                  No contact history found
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {contactHistory.map((record) => (
                  <div
                    key={record.id}
                    className={cn(
                      "p-3 rounded-lg border transition-all duration-200",
                      record.type === "call" && onCallSelect
                        ? "hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm cursor-pointer group"
                        : "",
                      selectedCallId === record.id && record.type === "call"
                        ? "bg-blue-50 border-blue-200 shadow-sm"
                        : "",
                    )}
                    onClick={() => {
                      if (record.type === "call" && onCallSelect) {
                        onCallSelect(record.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          "mt-1 transition-colors",
                          selectedCallId === record.id && record.type === "call"
                            ? "text-blue-500"
                            : "text-gray-400",
                        )}
                      >
                        {record.type === "call" ? (
                          <Phone className="h-4 w-4" />
                        ) : (
                          <MessageSquare className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">
                            {record.type === "call"
                              ? "Phone Call"
                              : "Text Message"}
                          </span>
                          <span className="text-xs text-gray-500">
                            {record.direction === "inbound"
                              ? "Inbound"
                              : "Outbound"}
                          </span>
                        </div>

                        {record.type === "call" && (
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className={getDispositionColor(
                                (record as CallRecord).disposition,
                              )}
                            >
                              {(record as CallRecord).disposition ||
                                "No disposition"}
                            </span>
                            {(record as CallRecord).durationMs !==
                              undefined && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-gray-500">
                                  {formatDuration(
                                    (record as CallRecord).durationMs,
                                  )}
                                </span>
                              </>
                            )}
                          </div>
                        )}

                        {record.type === "sms" &&
                          (record as SmsRecord).content && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {(record as SmsRecord).content}
                            </p>
                          )}

                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-500">
                            {formatDate(record.createdAt)}
                          </span>
                        </div>
                      </div>
                      {record.type === "call" && onCallSelect && (
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 mt-1 flex-shrink-0 transition-all",
                            selectedCallId === record.id
                              ? "text-blue-500 translate-x-1"
                              : "text-gray-400 group-hover:translate-x-1",
                          )}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
