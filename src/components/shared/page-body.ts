import { cn } from "@/lib/utils";

/** Left-aligned phone-width column on desktop. App header stays full width. */
export function pageBodyClassName(className?: string): string {
  return cn("w-full max-w-lg", className);
}
