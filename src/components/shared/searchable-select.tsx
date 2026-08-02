"use client";

import { useId } from "react";
import { Combobox } from "@base-ui/react/combobox";
import { CheckIcon, ChevronDownIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchableSelectOption = {
  value: string;
  label: string;
};

export function SearchableSelect({
  id,
  name,
  options,
  placeholder = "Search…",
  emptyMessage = "No matches",
  required = false,
  disabled = false,
  defaultValue,
  className,
  "aria-label": ariaLabel,
}: {
  id?: string;
  name: string;
  options: SearchableSelectOption[];
  placeholder?: string;
  emptyMessage?: string;
  required?: boolean;
  disabled?: boolean;
  defaultValue?: string;
  className?: string;
  "aria-label"?: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const defaultItem =
    defaultValue != null && defaultValue !== ""
      ? options.find((option) => option.value === defaultValue)
      : undefined;

  return (
    <div className={cn("min-w-0", className)}>
      <Combobox.Root<SearchableSelectOption>
        items={options}
        name={name}
        required={required}
        disabled={disabled}
        defaultValue={defaultItem}
        itemToStringLabel={(item) => item.label}
        itemToStringValue={(item) => item.value}
        isItemEqualToValue={(a, b) => a.value === b.value}
      >
        <Combobox.InputGroup className="border-input focus-within:border-ring focus-within:ring-ring/50 relative flex h-8 w-full min-w-0 items-center rounded-lg border bg-transparent transition-colors focus-within:ring-3 has-disabled:cursor-not-allowed has-disabled:opacity-50">
          <Combobox.Input
            id={inputId}
            placeholder={placeholder}
            aria-label={ariaLabel}
            disabled={disabled}
            className="placeholder:text-muted-foreground h-full w-full min-w-0 border-0 bg-transparent py-1 pr-14 pl-2.5 text-base outline-none md:text-sm"
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            <Combobox.Clear
              className="text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded-md outline-none disabled:pointer-events-none"
              aria-label="Clear selection"
            >
              <XIcon className="size-3.5" />
            </Combobox.Clear>
            <Combobox.Trigger
              className="text-muted-foreground hover:text-foreground flex size-7 items-center justify-center rounded-md outline-none disabled:pointer-events-none"
              aria-label="Open options"
              disabled={disabled}
            >
              <ChevronDownIcon className="size-4" />
            </Combobox.Trigger>
          </div>
        </Combobox.InputGroup>

        <Combobox.Portal>
          <Combobox.Positioner className="outline-none" sideOffset={4}>
            <Combobox.Popup className="bg-popover text-popover-foreground ring-foreground/10 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 relative z-50 w-(--anchor-width) max-w-(--available-width) origin-(--transform-origin) overflow-hidden rounded-lg shadow-md ring-1 duration-100">
              <Combobox.Empty className="text-muted-foreground px-3 py-4 text-sm">
                {emptyMessage}
              </Combobox.Empty>
              <Combobox.List className="max-h-[min(22.5rem,var(--available-height))] scroll-py-1 overflow-y-auto overscroll-contain p-1 outline-none data-empty:p-0">
                {(item: SearchableSelectOption) => (
                  <Combobox.Item
                    key={item.value}
                    value={item}
                    className="data-highlighted:bg-accent data-highlighted:text-accent-foreground relative flex cursor-default items-center gap-2 rounded-md py-1.5 pr-8 pl-2 text-sm outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50"
                  >
                    <span className="min-w-0 flex-1 truncate">
                      {item.label}
                    </span>
                    <Combobox.ItemIndicator className="absolute right-2 flex size-4 items-center justify-center">
                      <CheckIcon className="size-4" />
                    </Combobox.ItemIndicator>
                  </Combobox.Item>
                )}
              </Combobox.List>
            </Combobox.Popup>
          </Combobox.Positioner>
        </Combobox.Portal>
      </Combobox.Root>
    </div>
  );
}
