import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { formatDate } from "@/lib/utils"
import apiClient from "@/lib/api-client"
import { useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Inquiry {
  id: string;
  customerCampaignId: string;
  callId: string;
  inquiry: string;
  response?: string;
  status: 'new' | 'pending_resolution' | 'unresolved' | 'resolved' | 'appointment_scheduled';
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
  carrierName?: string;
  planName?: string;
  agentName?: string;
}

interface InquiryResponseDialogProps {
  inquiry: Inquiry | null;
  onClose: () => void;
}

export function InquiryResponseDialog({ inquiry, onClose }: InquiryResponseDialogProps) {
  const [response, setResponse] = useState(inquiry?.response || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const hasResponse = response.trim().length > 0;

  const handleSubmit = async () => {
    if (!inquiry || !response.trim()) return;

    setIsSubmitting(true);
    
    const promise = (async () => {
      try {
        const result = await apiClient.put(`/portal/client/inquiries/${inquiry.id}`, {
          response: response.trim(),
        });

        if (!result.data?.success) {
          throw new Error(result.data?.error || 'Failed to submit response');
        }

        await queryClient.invalidateQueries({ queryKey: ['inquiries'] });
        onClose();
      } finally {
        setIsSubmitting(false);
      }
    })();

    toast.promise(promise, {
      loading: 'Submitting response...',
      success: 'Response submitted successfully',
      error: 'Failed to submit response. Please try again.',
    });
  };

  if (!inquiry) return null;

  return (
    <Dialog open={!!inquiry} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden">
        <DialogHeader className="px-8 pt-6">
          <DialogTitle className="text-xl">Respond to Inquiry</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Created {formatDate(inquiry.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="px-8 py-6">
          <div className="space-y-6">
            <div>
              <div className="text-sm text-muted-foreground">Carrier</div>
              <div className="text-lg">{inquiry.carrierName}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Plan</div>
              <div className="text-lg">{inquiry.planName}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Agent</div>
              <div className="text-lg">{inquiry.agentName}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-2">Original Inquiry</div>
              <div className="p-4 rounded-lg bg-muted/50 text-lg">
                {inquiry.inquiry}
              </div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground mb-2">Your Response</div>
              <Textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Type your response here..."
                className={cn(
                  "min-h-[150px] resize-none text-lg transition-colors",
                  hasResponse ? "border-emerald-500 focus-visible:ring-emerald-500" : "text-muted-foreground"
                )}
                disabled={isSubmitting}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="px-8 py-6 bg-muted/50">
          <div className="flex justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-8"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!hasResponse || isSubmitting}
              className={cn(
                "px-8 transition-colors",
                hasResponse ? "bg-emerald-500 hover:bg-emerald-600" : "bg-muted-foreground/20"
              )}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Response'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 