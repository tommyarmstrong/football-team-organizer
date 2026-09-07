import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Team } from "@/lib/supabase/database.types";

/**
 * Single per-request teams SELECT. `getViewerContext` and `listVisibleTeams`
 * both go through this so React `cache()` dedupes them.
 */
export const loadVisibleTeams = cache(
  async (): Promise<{ data: Team[]; error: string | null }> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("teams")
      .select("*")
      .order("name", { ascending: true });

    if (error) return { data: [], error: error.message };
    return { data: (data ?? []) as Team[], error: null };
  },
);
