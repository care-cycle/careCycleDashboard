import { useEffect, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  FileText,
  DollarSign,
  Copy,
  Check,
  X,
} from "lucide-react";
import { formatDate, formatPhoneNumber, cn } from "@/lib/utils";
import apiClient from "@/lib/api-client";
import { useQuery } from "@tanstack/react-query";
import { AudioPlayer } from "@/components/audio/audio-player";
import { useState } from "react";
import { toast } from "sonner";
import { useRedaction } from "@/hooks/use-redaction";
import { CompactCallDetails } from "@/components/inquiries/compact-call-details";

interface CallDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  call?: CallData | null;
  isLoading?: boolean;
}

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
}

export function CallDetailsDrawer({
  isOpen,
  onClose,
  call,
  isLoading = false,
}: CallDetailsDrawerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [hasCopied, setHasCopied] = useState({ id: false, callerId: false });
  const { isRedacted } = useRedaction();

  // Fetch call details
  const { data: callDetails, isLoading: callDetailsLoading } = useQuery({
    queryKey: ["call", call?.id],
    queryFn: async () => {
      if (!call?.id) return null;

      // Get call details from the calls endpoint
      const result = await apiClient.get("/portal/client/calls", {
        params: { callId: call.id },
      });

      const calls = result.data?.data || [];
      return calls.find((c: CallData) => c.id === call.id) || null;
    },
    enabled: !!call?.id,
  });

  useEffect(() => {
    // Cleanup audio when drawer closes
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    };
  }, [call?.id]);

  const formatDuration = (ms?: number) => {
    if (!ms) return "0:00";
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const copyText = async (text: string, type: "id" | "callerId") => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setHasCopied((prev) => ({ ...prev, [type]: true }));
      toast.success(`${type === "id" ? "Call ID" : "Caller ID"} copied.`);
      setTimeout(
        () => setHasCopied((prev) => ({ ...prev, [type]: false })),
        2000,
      );
    } catch (err) {
      toast.error("Failed to copy.");
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
    <>
      {/* Backdrop for call details - only covers the left side */}
      {isOpen && (
        <div
          className="fixed inset-y-0 left-0 bg-transparent z-[50]"
          style={{ width: "calc(100% - 800px)" }} // Total width of both drawers (320px + 480px)
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-[480px] bg-white shadow-2xl z-[51] transform transition-transform duration-300",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-gray-50/50">
            <h2 className="text-lg font-semibold">Call Details</h2>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 bg-white">
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm text-gray-500">Loading call details...</p>
              </div>
            ) : call ? (
              <CompactCallDetails call={call} />
            ) : (
              <div className="flex items-center justify-center h-32">
                <p className="text-sm text-gray-500">
                  No call details available
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
