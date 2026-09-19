"use client";

import { useState, type ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function InlineFormDialog({
  trigger,
  title,
  description,
  size = "default",
  children,
}: {
  trigger: (open: () => void) => ReactNode;
  title: string;
  description: string;
  size?: "default" | "lg";
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      {trigger(() => setOpen(true))}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            "overflow-y-auto",
            size === "lg"
              ? "max-h-[min(90dvh,52rem)] sm:max-w-2xl"
              : "max-h-[min(90dvh,40rem)] sm:max-w-lg",
          )}
          showCloseButton
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {open ? children(close) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
