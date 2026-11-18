"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { CompetitionFilterOption } from "@/lib/stats/competition-filters";
import {
  defaultStatsFilters,
  readStoredStatsFilters,
  sanitizeStatsFilters,
  STATS_FILTERS_STORAGE_KEY,
  writeStoredStatsFilters,
  type StatsFilterSelection,
} from "@/lib/stats/stats-page-filters";

const serverFilters = defaultStatsFilters();
const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function emitStatsFilters() {
  for (const listener of listeners) listener();
}

function getServerFilters() {
  return serverFilters;
}

/**
 * One cached selection per storage string and team. `useSyncExternalStore`
 * must see the same object until the saved filters change.
 */
let cachedSignature = "";
let cachedFilters: StatsFilterSelection = serverFilters;

function clientFilters(
  teamId: string,
  competitions: readonly CompetitionFilterOption[],
): StatsFilterSelection {
  const raw = window.sessionStorage.getItem(STATS_FILTERS_STORAGE_KEY) ?? "";
  const signature = `${teamId}\0${competitions.map((competition) => competition.id).join("\0")}\0${raw}`;
  if (signature === cachedSignature) return cachedFilters;
  cachedSignature = signature;
  cachedFilters = readStoredStatsFilters(
    window.sessionStorage,
    teamId,
    competitions,
  );
  return cachedFilters;
}

/**
 * Applied Stats filters for one team. Navigating away and back restores them.
 * Changing team or season reads that team's saved filters, and a competition
 * that team does not have is dropped.
 */
export function usePersistentStatsFilters(
  teamId: string,
  competitions: readonly CompetitionFilterOption[],
) {
  const filters = useSyncExternalStore(
    subscribe,
    () => clientFilters(teamId, competitions),
    getServerFilters,
  );

  const updateFilters = useCallback(
    (next: StatsFilterSelection) => {
      const sanitized = sanitizeStatsFilters(next, competitions);
      writeStoredStatsFilters(window.sessionStorage, teamId, sanitized);
      emitStatsFilters();
    },
    [competitions, teamId],
  );

  return { filters, updateFilters };
}
