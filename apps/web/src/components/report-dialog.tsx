"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { reportReasons } from "@/utils/constants";

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string, description?: string) => Promise<void>;
  reportableType: "comment" | "review";
  isLoading?: boolean;
}

/**
 * Reusable report dialog component for reporting comments, reviews, etc.
 */
export function ReportDialog({
  open,
  onOpenChange,
  onSubmit,
  reportableType,
  isLoading = false,
}: ReportDialogProps) {
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) return;

    await onSubmit(reason, description || undefined);
    // Reset form on success
    setReason("");
    setDescription("");
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!(newOpen || isLoading)) {
      // Reset form when closing
      setReason("");
      setDescription("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report {reportableType}</DialogTitle>
          <DialogDescription>
            Help us understand what's wrong with this {reportableType}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label
                className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="reason"
              >
                Reason
              </label>
              <Select
                disabled={isLoading}
                onValueChange={setReason}
                required
                value={reason}
              >
                <SelectTrigger className="w-full" id="reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {reportReasons.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label
                className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                htmlFor="description"
              >
                Description
              </label>
              <Textarea
                className="min-h-[100px] resize-none"
                disabled={isLoading}
                id="description"
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Why do you want to report this comment"
                value={description}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={isLoading}
              onClick={() => handleOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={!reason || isLoading} type="submit">
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Submit Report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
