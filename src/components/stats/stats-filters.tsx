"use client";

import { useState } from "react";
import { SlidersHorizontalIcon, XIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  ALL_COMPETITIONS,
  NO_COMPETITION,
  type CompetitionFilterOption,
} from "@/lib/stats/competition-filters";
import { toggleGoalsPositionFilter } from "@/lib/stats/goals-view";
import {
  clearStatsFilterChip,
  defaultStatsFilters,
  STATS_COMPETITION_TYPE_OPTIONS,
  STATS_POSITION_OPTIONS,
  statsFilterChips,
  statsFiltersAreCustom,
  type StatsFilterSelection,
} from "@/lib/stats/stats-page-filters";

const FILTER_HELP =
  "Competition filters apply to every statistic. Position applies to player statistics.";

function filterTriggerClassName(className?: string) {
  return cn(
    buttonVariants({ variant: "outline" }),
    "relative h-11 gap-1.5 px-3",
    className,
  );
}

function FiltersButtonLabel({ active }: { active: boolean }) {
  return (
    <>
      <SlidersHorizontalIcon />
      Filters
      {active ? (
        <span
          aria-hidden
          className="bg-primary absolute top-1.5 right-1.5 size-2 rounded-full"
        />
      ) : null}
    </>
  );
}

function FilterChoice({
  label,
  pressed,
  onClick,
}: {
  label: string;
  pressed: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant={pressed ? "default" : "outline"}
      className="h-11 w-full"
      aria-pressed={pressed}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

export function StatsFilterFields({
  idPrefix,
  competitions,
  value,
  onChange,
}: {
  idPrefix: string;
  competitions: readonly CompetitionFilterOption[];
  value: StatsFilterSelection;
  onChange: (next: StatsFilterSelection) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-competition`}>Competition</Label>
        <NativeSelect
          id={`${idPrefix}-competition`}
          className="h-11"
          value={value.competitionId}
          onChange={(event) =>
            onChange({ ...value, competitionId: event.target.value })
          }
        >
          <option value={ALL_COMPETITIONS}>All matches</option>
          <option value={NO_COMPETITION}>Unknown competitions</option>
          {competitions.map((competition) => (
            <option key={competition.id} value={competition.id}>
              {competition.name}
            </option>
          ))}
        </NativeSelect>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Competition type</legend>
        <div className="grid gap-2">
          {STATS_COMPETITION_TYPE_OPTIONS.map((option) => (
            <FilterChoice
              key={option.value}
              label={option.label}
              pressed={value.competitionKind === option.value}
              onClick={() =>
                onChange({ ...value, competitionKind: option.value })
              }
            />
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Position</legend>
        <div className="grid grid-cols-3 gap-2">
          {STATS_POSITION_OPTIONS.map((option) => (
            <FilterChoice
              key={option.value}
              label={option.label}
              pressed={value.positions.includes(option.value)}
              onClick={() =>
                onChange({
                  ...value,
                  positions: toggleGoalsPositionFilter(
                    value.positions,
                    option.value,
                  ),
                })
              }
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}

function FilterActions({
  onReset,
  onApply,
}: {
  onReset: () => void;
  onApply: () => void;
}) {
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        className="h-11 flex-1"
        onClick={onReset}
      >
        Reset
      </Button>
      <Button type="button" className="h-11 flex-1" onClick={onApply}>
        Apply
      </Button>
    </div>
  );
}

export function StatsFilterChips({
  competitions,
  value,
  onChange,
}: {
  competitions: readonly CompetitionFilterOption[];
  value: StatsFilterSelection;
  onChange: (next: StatsFilterSelection) => void;
}) {
  const chips = statsFilterChips(value, competitions);
  if (chips.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2" aria-label="Active filters">
      {chips.map((chip) => (
        <li key={chip.id}>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-full px-3"
            aria-label={`Remove ${chip.label} filter`}
            onClick={() => onChange(clearStatsFilterChip(value, chip.id))}
          >
            {chip.label}
            <XIcon />
          </Button>
        </li>
      ))}
    </ul>
  );
}

export function StatsFiltersButton({
  competitions,
  value,
  onChange,
}: {
  competitions: readonly CompetitionFilterOption[];
  value: StatsFilterSelection;
  onChange: (next: StatsFilterSelection) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [syncedValue, setSyncedValue] = useState(value);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(false);
  const active = statsFiltersAreCustom(value, competitions);
  const label = active ? "Filters, active" : "Filters";

  if (value !== syncedValue) {
    setSyncedValue(value);
    setDraft(value);
  }

  function resetDraft() {
    setDraft(defaultStatsFilters());
  }

  function applyDraft(close: () => void) {
    onChange(draft);
    close();
  }

  return (
    <>
      <div className="md:hidden">
        <Drawer
          open={mobileOpen}
          onOpenChange={(open) => {
            if (open) setDraft(value);
            setMobileOpen(open);
          }}
        >
          <DrawerTrigger
            type="button"
            aria-label={label}
            className={filterTriggerClassName()}
          >
            <FiltersButtonLabel active={active} />
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <div className="min-w-0 space-y-1">
                <DrawerTitle>Filters</DrawerTitle>
                <DrawerDescription>{FILTER_HELP}</DrawerDescription>
              </div>
              <DrawerClose
                aria-label="Close filters"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "size-11",
                )}
              >
                <XIcon />
              </DrawerClose>
            </DrawerHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
              <StatsFilterFields
                idPrefix="stats-filters-mobile"
                competitions={competitions}
                value={draft}
                onChange={setDraft}
              />
            </div>
            <DrawerFooter>
              <FilterActions
                onReset={resetDraft}
                onApply={() => applyDraft(() => setMobileOpen(false))}
              />
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>

      <div className="hidden md:block">
        <Popover
          open={desktopOpen}
          onOpenChange={(open) => {
            if (open) setDraft(value);
            setDesktopOpen(open);
          }}
        >
          <PopoverTrigger
            render={
              <button
                type="button"
                aria-label={label}
                className={filterTriggerClassName()}
              />
            }
          >
            <FiltersButtonLabel active={active} />
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className="w-80 gap-0 overflow-hidden p-0"
          >
            <div className="flex max-h-[min(32rem,70vh)] flex-col">
              <PopoverHeader className="border-b px-4 py-3">
                <PopoverTitle>Filters</PopoverTitle>
                <PopoverDescription>{FILTER_HELP}</PopoverDescription>
              </PopoverHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                <StatsFilterFields
                  idPrefix="stats-filters-desktop"
                  competitions={competitions}
                  value={draft}
                  onChange={setDraft}
                />
              </div>
              <div className="shrink-0 border-t p-3">
                <FilterActions
                  onReset={resetDraft}
                  onApply={() => applyDraft(() => setDesktopOpen(false))}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
