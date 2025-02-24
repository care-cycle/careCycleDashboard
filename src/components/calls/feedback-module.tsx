import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogClose,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CALL_FEEDBACK_TYPES,
  CALL_SEVERITY_LEVELS,
} from "@/constants/feedback";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";

interface FeedbackModuleProps {
  callId: string;
  onSubmit?: (feedback: {
    type: string;
    severity: string;
    comment: string;
  }) => void;
}

export function FeedbackModule({ callId, onSubmit }: FeedbackModuleProps) {
  const [feedbackType, setFeedbackType] = useState<string>("");
  const [severity, setSeverity] = useState<
    keyof typeof CALL_SEVERITY_LEVELS | ""
  >("");
  const [comment, setComment] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!callId || !feedbackType || !severity || !comment.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await apiClient.post("/portal/client/feedback", {
        type: feedbackType,
        severity: CALL_SEVERITY_LEVELS[severity],
        feedback: comment.trim(),
        pageUrl: window.location.href,
        callId,
      });

      if (response.data?.success) {
        toast.success("Feedback submitted successfully");
        setIsOpen(false);
        setFeedbackType("");
        setSeverity("");
        setComment("");
        onSubmit?.({
          type: feedbackType,
          severity: CALL_SEVERITY_LEVELS[severity],
          comment: comment.trim(),
        });
      } else {
        throw new Error("Failed to submit feedback");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit feedback",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = feedbackType && severity && comment.trim().length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-medium">Call Feedback</h3>
        <div className="flex gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[180px] bg-white font-normal",
                  !feedbackType && "font-bold",
                  "border-2 border-[#74E0BB]",
                )}
              >
                {feedbackType
                  ? feedbackType
                      .split("_")
                      .map(
                        (word) =>
                          word.charAt(0).toUpperCase() +
                          word.slice(1).toLowerCase(),
                      )
                      .join(" ")
                  : "Select Feedback Type"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[900px] max-h-[80vh] p-0 [&>button]:hidden">
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                  <DialogTitle className="text-lg font-semibold">
                    Select Feedback Type
                  </DialogTitle>
                  <DialogDescription className="sr-only">
                    Choose a feedback type for this call
                  </DialogDescription>
                  <DialogClose asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 rounded-md"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </DialogClose>
                </div>
                <div className="grid grid-cols-3 gap-8">
                  {Object.entries(CALL_FEEDBACK_TYPES).map(
                    ([category, items]) => (
                      <div key={category} className="space-y-3">
                        <h4 className="text-base font-medium text-gray-700 border-b pb-2">
                          {category}
                        </h4>
                        <div className="space-y-2">
                          {Object.entries(items as Record<string, string>).map(
                            ([key, value]) => (
                              <Button
                                key={value}
                                variant={
                                  feedbackType === value ? "default" : "ghost"
                                }
                                className="w-full justify-start text-sm h-9"
                                onClick={() => {
                                  setFeedbackType(value);
                                  setIsOpen(false);
                                }}
                              >
                                {key
                                  .split("_")
                                  .map(
                                    (word) =>
                                      word.charAt(0) +
                                      word.slice(1).toLowerCase(),
                                  )
                                  .join(" ")}
                              </Button>
                            ),
                          )}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Select
            value={severity}
            onValueChange={(value: keyof typeof CALL_SEVERITY_LEVELS) =>
              setSeverity(value)
            }
          >
            <SelectTrigger
              className={cn("w-[140px] bg-white", "border-2 border-[#74E0BB]")}
            >
              <SelectValue
                placeholder={<span className="font-bold">Severity</span>}
              />
            </SelectTrigger>
            <SelectContent align="end" className="w-[240px] bg-white">
              {Object.entries(CALL_SEVERITY_LEVELS).map(([key]) => (
                <SelectItem key={key} value={key}>
                  {key.charAt(0) + key.slice(1).toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Textarea
        placeholder="Add feedback about this call..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="resize-none"
        rows={3}
      />
      <Button
        onClick={handleSubmit}
        disabled={!isFormValid || isSubmitting}
        className={cn(
          "w-full",
          isFormValid
            ? "bg-[#74E0BB] hover:bg-[#74E0BB]/90"
            : "bg-gray-200 text-gray-500 cursor-not-allowed hover:bg-gray-200",
        )}
      >
        {isSubmitting ? "Submitting..." : "Submit Feedback"}
      </Button>
    </div>
  );
}
