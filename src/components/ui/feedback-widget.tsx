import { useState, useEffect, useRef } from "react";
import { Button } from "./button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";
import { Textarea } from "./textarea";
import { Label } from "./label";
import { MessageSquarePlus, X } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { cn } from "@/lib/utils";
import {
  SITE_FEEDBACK_TYPES,
  SITE_SEVERITY_LEVELS,
} from "@/constants/feedback";
import { useUser } from "@clerk/clerk-react";

type FeedbackType = keyof typeof SITE_FEEDBACK_TYPES;
type SeverityLevel = keyof typeof SITE_SEVERITY_LEVELS;

export function FeedbackWidget() {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType | "">("");
  const [severity, setSeverity] = useState<SeverityLevel | "">("");
  const [feedback, setFeedback] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        target.closest('[role="listbox"]') ||
        target.closest("[data-radix-select-trigger]")
      ) {
        return;
      }

      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  const handleSubmit = async () => {
    if (!type || !severity || !feedback.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!user?.id || !user?.primaryEmailAddress?.emailAddress) {
      toast.error("User information not available");
      return;
    }

    try {
      const response = await apiClient.post("/portal/client/feedback", {
        type: SITE_FEEDBACK_TYPES[type],
        severity: SITE_SEVERITY_LEVELS[severity],
        feedback: feedback.trim(),
        pageUrl: window.location.href,
      });

      setOpen(false);
      setType("");
      setSeverity("");
      setFeedback("");

      toast.success("Thank you for your feedback!");
    } catch (error: any) {
      console.error("Failed to submit feedback:", error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Failed to submit feedback. Please try again.");
      }
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-8 h-12 w-12 rounded-full shadow-lg z-[9999]"
        onClick={() => setOpen(true)}
      >
        <MessageSquarePlus className="h-6 w-6" />
      </Button>

      <div
        ref={containerRef}
        className={cn(
          "fixed bottom-20 right-8 w-[480px] bg-white rounded-lg shadow-lg transition-all duration-200 z-[9999]",
          "border border-gray-200",
          open
            ? "translate-y-0 opacity-100"
            : "translate-y-4 opacity-0 pointer-events-none",
        )}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Share Your Feedback</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <div className="flex gap-4">
            <div className="flex-[2] space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={type}
                onValueChange={(value: FeedbackType) => setType(value)}
              >
                <SelectTrigger id="type" className="bg-white">
                  <SelectValue placeholder="Select feedback type" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={4}
                  align="start"
                  side="top"
                  className="z-[99999] w-[320px] bg-white"
                >
                  {Object.entries(SITE_FEEDBACK_TYPES).map(([key]) => (
                    <SelectItem key={key} value={key}>
                      {key
                        .split("_")
                        .map((word) => {
                          if (word === "UI") return "UI";
                          return word.charAt(0) + word.slice(1).toLowerCase();
                        })
                        .join(" ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={severity}
                onValueChange={(value: SeverityLevel) => setSeverity(value)}
              >
                <SelectTrigger id="severity" className="bg-white">
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent
                  position="popper"
                  sideOffset={4}
                  align="start"
                  side="top"
                  className="z-[99999] w-[160px] bg-white"
                >
                  {Object.entries(SITE_SEVERITY_LEVELS).map(([key]) => (
                    <SelectItem key={key} value={key}>
                      {key.charAt(0) + key.slice(1).toLowerCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Feedback</Label>
            <Textarea
              id="feedback"
              placeholder="Tell us what you think..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[120px] resize-none bg-white"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              className="px-4"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!type || !severity || !feedback.trim()}
              className={cn(
                "px-4",
                !type || !severity || !feedback.trim()
                  ? "bg-gray-200 text-gray-500 cursor-not-allowed hover:bg-gray-200"
                  : "bg-[#74E0BB] hover:bg-[#74E0BB]/90",
              )}
            >
              Submit
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
