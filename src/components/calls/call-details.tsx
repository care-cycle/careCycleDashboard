import { useState, useEffect, useRef, useCallback, memo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserRole } from "@/hooks/use-auth";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  X,
  User,
  Clock,
  PhoneCall,
  CheckCircle2,
  Copy,
  Check,
} from "lucide-react";
import { AudioPlayer } from "@/components/audio/audio-player";
import { Call } from "@/types/calls";
import { toast } from "sonner";
import {
  formatPhoneNumber,
  getBestRecordingUrl,
  getStereoRecordingUrl,
} from "@/lib/utils";
import { FeedbackModule } from "./feedback-module";

interface CallDetailsProps {
  call: Call;
  onClose: () => void;
  preloadedAudio?: HTMLAudioElement;
}

export const CallDetails = memo(function CallDetails({
  call,
  onClose,
  preloadedAudio,
}: CallDetailsProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const [hasCopied, setHasCopied] = useState({
    id: false,
    callerId: false,
  });
  const { isAdmin } = useUserRole();

  // Add cleanup effect for audio
  useEffect(() => {
    const audio = audioRef.current;
    // Cleanup function that runs when component unmounts OR when call changes
    return () => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    };
  }, [call.id]); // Add dependency on call.id to cleanup when call changes

  // Use callback to prevent recreation of handler
  const handleClose = useCallback(() => {
    setIsClosing(true);
    // Small delay for animation
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      onClose();
    }, 150);
  }, [onClose]);

  // Add escape key handler
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [handleClose]);

  // Add copy function
  const copyText = useCallback(
    async (text: string, type: "id" | "callerId") => {
      try {
        // First try the modern Clipboard API
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          setHasCopied((prev) => ({ ...prev, [type]: true }));
          toast.success(
            `${type === "id" ? "Call ID" : "Caller ID"} copied to clipboard`,
          );
          setTimeout(() => {
            setHasCopied((prev) => ({ ...prev, [type]: false }));
          }, 2000);
          return;
        }

        // Fallback method for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (successful) {
          setHasCopied((prev) => ({ ...prev, [type]: true }));
          toast.success(
            `${type === "id" ? "Call ID" : "Caller ID"} copied to clipboard`,
          );
          setTimeout(() => {
            setHasCopied((prev) => ({ ...prev, [type]: false }));
          }, 2000);
        } else {
          throw new Error("Copy command failed");
        }
      } catch (err) {
        console.error("Copy failed:", err);
        toast.error(
          `Copy failed. ${type === "id" ? "Call ID" : "Caller ID"}: ${text}`,
        );
      }
    },
    [],
  );

  // Add feedback handler
  const handleFeedbackSubmit = useCallback(
    (feedback: { type: string; severity: string; comment: string }) => {
      // Handle the feedback submission here
      console.log("Feedback submitted:", feedback);
      // TODO: Add API call to submit feedback
    },
    [],
  );

  const callDetails = [
    { icon: User, label: "Assistant Type", value: call.assistantType },
    { icon: Clock, label: "Duration", value: call.duration },
    { icon: PhoneCall, label: "Direction", value: call.direction },
    { icon: CheckCircle2, label: "Disposition", value: call.disposition },
  ];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-end pointer-events-none transition-opacity duration-150 ${
        isClosing ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/20 backdrop-blur-sm pointer-events-auto"
        onClick={handleClose}
      />

      {/* Details Panel */}
      <div className="h-full w-[480px] bg-white/95 backdrop-blur-xl shadow-2xl border-l pointer-events-auto">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Call Details</h2>
              <button
                onClick={() => copyText(call.id, "id")}
                className="text-sm text-gray-500 flex items-center gap-1.5 hover:text-gray-900 transition-colors group"
              >
                ID: <span className="font-mono">{call.id}</span>
                {hasCopied.id ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
              <button
                onClick={() => copyText(call.callerId, "callerId")}
                className="text-sm text-gray-500 flex items-center gap-1.5 hover:text-gray-900 transition-colors group"
              >
                Caller ID:{" "}
                <span className="font-mono">
                  {formatPhoneNumber(call.callerId)}
                </span>
                {hasCopied.callerId ? (
                  <Check className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </button>
            </div>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1 overflow-auto p-4 space-y-6">
            {call.recordingUrl && (
              <div className="glass-panel p-0 rounded-lg">
                {(() => {
                  // Determine if this is a Mobius call with stereo capabilities
                  const isMobiusCall = !!call.twilioSid;
                  const stereoUrl = getStereoRecordingUrl(call);
                  const enableStereoMode = isMobiusCall && !!stereoUrl;

                  // Debug logging
                  console.log("Call Details Audio Debug:", {
                    callId: call.id,
                    hasTwilioSid: !!call.twilioSid,
                    twilioSid: call.twilioSid,
                    hasRawStereoUrl: !!call.stereoRecordingUrl,
                    rawStereoUrl: call.stereoRecordingUrl,
                    processedStereoUrl: stereoUrl,
                    isMobiusCall,
                    enableStereoMode,
                    recordingUrl: call.recordingUrl,
                    nodableRecordingUrl: call.nodableRecordingUrl,
                  });

                  return (
                    <div className="relative">
                      {/* Temporary debug panel */}
                      <div className="absolute top-2 left-2 z-10">
                        <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-sm">
                          <div>Mobius: {isMobiusCall ? "Yes" : "No"}</div>
                          <div>Stereo: {enableStereoMode ? "Yes" : "No"}</div>
                          <div>
                            twilioSid: {call.twilioSid ? "Present" : "Missing"}
                          </div>
                          <div>
                            stereoUrl:{" "}
                            {call.stereoRecordingUrl ? "Present" : "Missing"}
                          </div>
                        </div>
                      </div>

                      {enableStereoMode && (
                        <div className="absolute top-2 right-2 z-10">
                          <div className="bg-gradient-to-r from-green-500 to-red-500 text-white text-xs px-2 py-1 rounded-full shadow-sm">
                            Stereo View
                          </div>
                        </div>
                      )}
                      <AudioPlayer
                        url={getBestRecordingUrl(call) || ""}
                        preloadedAudio={preloadedAudio}
                        ref={audioRef}
                        isStereo={enableStereoMode}
                        stereoUrl={stereoUrl}
                        leftChannelLabel="AI Assistant"
                        rightChannelLabel="Customer"
                      />
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {callDetails.map((detail, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <detail.icon className="h-4 w-4 text-gray-500" />
                    <div className="text-sm font-medium text-gray-500">
                      {detail.label}
                    </div>
                  </div>
                  <div className="text-sm font-semibold">{detail.value}</div>
                </Card>
              ))}
            </div>

            <Accordion type="single" collapsible>
              <AccordionItem value="summary">
                <AccordionTrigger>Call Summary</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600">{call.summary}</p>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="transcript">
                <AccordionTrigger>Transcript</AccordionTrigger>
                <AccordionContent>
                  <div className="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed">
                    {call.transcript?.split("\n").map((line, index) => {
                      if (line.startsWith("AI:")) {
                        return (
                          <div key={index} className="mb-2">
                            <strong>AI:</strong>
                            {line.substring(3)}
                          </div>
                        );
                      }
                      if (line.startsWith("User:")) {
                        return (
                          <div key={index} className="mb-2">
                            <strong>User:</strong>
                            {line.substring(5)}
                          </div>
                        );
                      }
                      return (
                        <div key={index} className="mb-2">
                          {line}
                        </div>
                      );
                    }) || "No transcript available"}
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="evaluation">
                <AccordionTrigger>Evaluation</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm text-gray-600">
                    {call.successEvaluation}
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div className="border-t p-4 bg-gray-50/50">
            <FeedbackModule callId={call.id} onSubmit={handleFeedbackSubmit} />
          </div>
        </div>
      </div>
    </div>
  );
});
