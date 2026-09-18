"use client";

import type { ReactNode } from "react";
import { Toast } from "@base-ui/react/toast";
import { XIcon } from "lucide-react";
import { toastManager } from "@/lib/toast";
import { cn } from "@/lib/utils";

export function Toaster({ children }: { children: ReactNode }) {
  return (
    <Toast.Provider toastManager={toastManager} timeout={4000}>
      {children}
      <Toast.Portal>
        <ToastList />
      </Toast.Portal>
    </Toast.Provider>
  );
}

function ToastList() {
  const { toasts } = Toast.useToastManager();

  return (
    <Toast.Viewport
      className={cn(
        "fixed right-4 z-50 mx-auto flex w-[min(calc(100%-2rem),24rem)] flex-col gap-2 outline-none",
        "bottom-[calc(5.75rem+env(safe-area-inset-bottom))] md:bottom-4",
      )}
    >
      {toasts.map((toast) => (
        <Toast.Root
          key={toast.id}
          toast={toast}
          swipeDirection="down"
          className={cn(
            "bg-card text-card-foreground ring-foreground/10 relative rounded-xl p-3 shadow-lg ring-1",
            "data-ending:translate-y-2 data-ending:opacity-0 data-starting:translate-y-2 data-starting:opacity-0",
            "transition-[opacity,translate] duration-100 motion-reduce:transition-none",
            toast.type === "success" && "border-win/30 border",
          )}
        >
          <Toast.Content className="pr-8">
            <Toast.Title className="text-sm font-medium" />
            {toast.description ? (
              <Toast.Description className="text-muted-foreground mt-1 text-sm" />
            ) : null}
          </Toast.Content>
          <Toast.Close
            className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-2 right-2 inline-flex size-8 items-center justify-center rounded-md"
            aria-label="Dismiss"
          >
            <XIcon className="size-4" />
          </Toast.Close>
        </Toast.Root>
      ))}
    </Toast.Viewport>
  );
}
