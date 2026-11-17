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

/**
 * Form in a dialog. Uncontrolled by default: `trigger` receives an `open`
 * callback. Pass `open` / `onOpenChange` to control it from outside, e.g. when
 * the opener lives in a menu that unmounts as it closes; `trigger` is then
 * optional.
 */
export function InlineFormDialog({
  trigger,
  open: controlledOpen,
  onOpenChange,
  title,
  description,
  size = "default",
  children,
}: {
  trigger?: (open: () => void) => ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description: string;
  size?: "default" | "lg";
  children: (close: () => void) => ReactNode;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = (next: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(next);
    onOpenChange?.(next);
  };
  const close = () => setOpen(false);

  return (
    <>
      {trigger?.(() => setOpen(true))}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            "min-w-0 overflow-y-auto",
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
