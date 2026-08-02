"use client";

import { ChevronDownIcon } from "lucide-react";
import { useId, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function CollapsibleCard({
  title,
  children,
  defaultOpen = false,
  contentClassName,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  contentClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <Card>
      <CardHeader className="py-0">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls={panelId}
          className="hover:bg-muted/40 -mx-(--card-spacing) flex w-[calc(100%+2*var(--card-spacing))] items-center justify-between gap-3 px-(--card-spacing) py-1 text-left transition-colors"
        >
          <CardTitle>{title}</CardTitle>
          <ChevronDownIcon
            className={cn(
              "text-muted-foreground size-4 shrink-0 transition-transform duration-200",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>
      </CardHeader>
      {open ? (
        <CardContent id={panelId} className={cn("space-y-4", contentClassName)}>
          {children}
        </CardContent>
      ) : (
        <div id={panelId} hidden />
      )}
    </Card>
  );
}
