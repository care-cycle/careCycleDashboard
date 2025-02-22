import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";

interface Source {
  id: string;
  sourceId: string;
  name: string;
  enabled: boolean;
}

interface SourceDialogProps {
  source?: Source;
  open: boolean;
  onClose: () => void;
}

export function SourceDialog({ source, open, onClose }: SourceDialogProps) {
  const [name, setName] = useState(source?.name || "");
  const [enabled, setEnabled] = useState(source?.enabled ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const handleSubmit = async () => {
    if (!name.trim() && !source) {
      toast.error("Please enter a source name");
      return;
    }

    setIsSubmitting(true);

    const promise = (async () => {
      try {
        if (source) {
          // Update existing source
          await apiClient.put(`/portal/client/sources/${source.id}`, {
            name: name.trim() || undefined,
            enabled,
          });
        } else {
          // Create new source
          await apiClient.post("/portal/client/sources", {
            name: name.trim(),
          });
        }

        await queryClient.invalidateQueries({ queryKey: ["sources"] });
        onClose();
      } finally {
        setIsSubmitting(false);
      }
    })();

    toast.promise(promise, {
      loading: source ? "Updating source..." : "Creating source...",
      success: source
        ? "Source updated successfully"
        : "Source created successfully",
      error: source ? "Failed to update source" : "Failed to create source",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{source ? "Edit Source" : "Create Source"}</DialogTitle>
          <DialogDescription>
            {source
              ? "Update the source details below."
              : "Create a new source for tracking calls."}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Source Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter source name"
            />
          </div>
          {source && (
            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">Enabled</Label>
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>
          )}
          {source && (
            <div className="grid gap-2">
              <Label>Source ID</Label>
              <div className="px-3 py-2 rounded-md bg-muted text-sm font-mono">
                {source.sourceId}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : source
                ? "Save Changes"
                : "Create Source"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
