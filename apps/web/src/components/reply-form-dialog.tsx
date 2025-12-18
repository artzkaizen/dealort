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
import { Textarea } from "@/components/ui/textarea";

interface ReplyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (content: string) => Promise<void>;
  replyingTo?: {
    username: string;
    name?: string;
  };
  isLoading?: boolean;
  placeholder?: string;
  title?: string;
}

/**
 * Reusable reply form dialog component for replying to comments
 */
export function ReplyFormDialog({
  open,
  onOpenChange,
  onSubmit,
  replyingTo,
  isLoading = false,
  placeholder = "Add a reply...",
  title = "Reply",
}: ReplyFormDialogProps) {
  const [content, setContent] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    await onSubmit(content.trim());
    // Reset form on success
    setContent("");
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!(newOpen || isLoading)) {
      // Reset form when closing
      setContent("");
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {replyingTo
              ? `Replying to @${replyingTo.username}`
              : "Write your reply"}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Textarea
                className="min-h-[120px] resize-none"
                disabled={isLoading}
                onChange={(e) => setContent(e.target.value)}
                placeholder={placeholder}
                required
                value={content}
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
            <Button disabled={!content.trim() || isLoading} type="submit">
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              {replyingTo ? "Reply" : "Submit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
