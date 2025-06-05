import { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Phone,
  Clock,
  Calendar,
  User,
  DollarSign,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  formatDate,
  formatPhoneNumber,
  getBestRecordingUrl,
} from "@/lib/utils";
import { AudioPlayer } from "@/components/audio/audio-player";
import { toast } from "sonner";
import { useRedaction } from "@/hooks/use-redaction";
import { cn } from "@/lib/utils";

interface CallData {
  id: string;
  callerId: string;
  createdAt: string;
  disposition?: string;
  durationMs?: number;
  assistantType?: string;
  summary?: string;
  transcript?: string;
  recordingUrl?: string;
  direction?: string;
  cost?: number;
  successEvaluation?: string;
  // Call system identification (vapiUuid is NOT exposed to frontend for security)
  twilioSid?: string;
  // Additional recording URLs (filtered to exclude vapi URLs)
  nodableRecordingUrl?: string;
  stereoRecordingUrl?: string;
}

interface CompactCallDetailsProps {
  call: CallData;
}

export function CompactCallDetails({ call }: CompactCallDetailsProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const { isRedacted } = useRedaction();

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [call.id]);

  const formatDuration = (ms?: number) => {
    if (!ms) return "0:00";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const copyCallId = async () => {
    try {
      // First try the modern Clipboard API
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(call.id);
        setHasCopied(true);
        toast.success("Call ID copied");
        setTimeout(() => setHasCopied(false), 2000);
        return;
      }

      // Fallback method for older browsers or non-secure contexts
      const textArea = document.createElement("textarea");
      textArea.value = call.id;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);

      if (successful) {
        setHasCopied(true);
        toast.success("Call ID copied");
        setTimeout(() => setHasCopied(false), 2000);
      } else {
        throw new Error("Copy command failed");
      }
    } catch (err) {
      console.error("Copy failed:", err);
      toast.error(`Copy failed. Call ID: ${call.id}`);
    }
  };

  const renderPhoneNumber = (phone?: string) => {
    if (!phone) return "N/A";
    if (isRedacted) return "*".repeat(phone.length);
    return formatPhoneNumber(phone);
  };

  const getDispositionColor = (disposition?: string) => {
    if (!disposition) return "bg-gray-100 text-gray-800";

    const lowerDisposition = disposition.toLowerCase();
    if (
      lowerDisposition.includes("success") ||
      lowerDisposition.includes("complete")
    ) {
      return "bg-green-100 text-green-800";
    }
    if (
      lowerDisposition.includes("fail") ||
      lowerDisposition.includes("error")
    ) {
      return "bg-red-100 text-red-800";
    }
    if (lowerDisposition.includes("voicemail")) {
      return "bg-yellow-100 text-yellow-800";
    }
    return "bg-gray-100 text-gray-800";
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Call ID */}
      <div className="flex items-center justify-between text-xs flex-shrink-0">
        <span className="text-gray-500">Call ID</span>
        <button
          onClick={copyCallId}
          className="font-mono text-xs hover:text-gray-900 flex items-center gap-1"
        >
          {call.id.slice(0, 8)}...
          {hasCopied ? (
            <Check className="h-3 w-3 text-green-500" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* Audio Player */}
      {call.recordingUrl && (
        <div className="mb-4">
          <AudioPlayer
            url={getBestRecordingUrl(call) || ""}
            className="w-full"
          />
        </div>
      )}

      {/* Call Info Grid */}
      <div className="grid grid-cols-2 gap-2 mt-3 flex-shrink-0">
        <div className="p-2 rounded-lg bg-gray-50">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <Phone className="h-3 w-3" />
            Caller
          </div>
          <p className="text-xs font-medium">
            {renderPhoneNumber(call.callerId)}
          </p>
        </div>

        <div className="p-2 rounded-lg bg-gray-50">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <Clock className="h-3 w-3" />
            Duration
          </div>
          <p className="text-xs font-medium">
            {formatDuration(call.durationMs)}
          </p>
        </div>

        <div className="p-2 rounded-lg bg-gray-50">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <Calendar className="h-3 w-3" />
            Date
          </div>
          <p className="text-xs font-medium">{formatDate(call.createdAt)}</p>
        </div>

        <div className="p-2 rounded-lg bg-gray-50">
          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
            <Phone className="h-3 w-3" />
            Type
          </div>
          <p className="text-xs font-medium">
            {call.direction === "inbound" ? "Inbound" : "Outbound"}
          </p>
        </div>
      </div>

      {/* Disposition inline */}
      {call.disposition && (
        <div className="flex items-center gap-2 mt-3 flex-shrink-0">
          <p className="text-xs text-gray-500">Disposition</p>
          <span
            className={cn(
              "inline-block px-2 py-1 rounded-full text-xs font-medium",
              getDispositionColor(call.disposition),
            )}
          >
            {call.disposition}
          </span>
        </div>
      )}

      {/* Accordion for details - flex-1 to take remaining space */}
      <Accordion
        type="single"
        collapsible
        className="w-full flex-1 mt-3 flex flex-col"
        defaultValue="transcript"
      >
        {call.summary && (
          <AccordionItem value="summary" className="border-b-0">
            <AccordionTrigger className="py-2 text-xs hover:no-underline">
              Summary
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <p className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                {call.summary}
              </p>
            </AccordionContent>
          </AccordionItem>
        )}

        {call.transcript && (
          <AccordionItem
            value="transcript"
            className="border-b-0 flex-1 flex flex-col"
          >
            <AccordionTrigger className="py-2 text-xs hover:no-underline">
              Transcript
            </AccordionTrigger>
            <AccordionContent className="pt-2 pb-0 flex-1 overflow-hidden">
              <div className="text-xs text-gray-700 leading-relaxed h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400 pr-2">
                {call.transcript
                  .split("\n")
                  .map((line: string, index: number) => {
                    const parts = line.match(
                      /^(AI|User|System|Tool|Human):\s*(.*)$/i,
                    );
                    if (parts) {
                      return (
                        <div
                          key={index}
                          className={`mb-1.5 break-words ${
                            parts[1].toLowerCase() === "user" ||
                            parts[1].toLowerCase() === "human"
                              ? "text-blue-700"
                              : "text-gray-800"
                          }`}
                        >
                          <strong className="inline">{parts[1]}:</strong>{" "}
                          <span className="whitespace-pre-wrap break-words inline">
                            {parts[2]}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div
                        key={index}
                        className="mb-1.5 text-gray-800 whitespace-pre-wrap break-words"
                      >
                        {line}
                      </div>
                    );
                  })}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
