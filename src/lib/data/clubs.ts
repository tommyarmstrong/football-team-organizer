import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import {
  getViewerContext,
  isClubStaff,
  type ViewerContext,
} from "@/lib/authz/context";
import type { Club } from "@/lib/supabase/database.types";

export type { Club };

/** Clubs the signed-in user can see (RLS-filtered). */
export const listVisibleClubs = cache(
  async (): Promise<{ data: Club[]; error: string | null }> => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("clubs")
      .select("*")
      .order("name", { ascending: true });

    if (error) return { data: [], error: error.message };
    return { data: data ?? [], error: null };
  },
);

export async function getClub(
  id: string,
): Promise<{ data: Club | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clubs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

function preferredClubIds(ctx: ViewerContext): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  const push = (id: string | null | undefined) => {
    if (!id || seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  };

  for (const id of ctx.managementClubIds) push(id);
  for (const team of ctx.visibleTeams) {
    if (ctx.managementClubIds.includes(team.club_id)) push(team.club_id);
  }
  for (const team of ctx.visibleTeams) push(team.club_id);
  return ids;
}

/** The club the user manages, or the club of their first visible team. */
export const getPrimaryClub = cache(async (): Promise<Club | null> => {
  const ctx = await getViewerContext();
  const { data: clubs } = await listVisibleClubs();

  if (ctx) {
    for (const clubId of preferredClubIds(ctx)) {
      const fromList = clubs.find((c) => c.id === clubId);
      if (fromList) return fromList;

      const { data: byId } = await getClub(clubId);
      if (byId) return byId;
    }
  }

  if (clubs.length > 0) return clubs[0];
  return null;
});

/**
 * Club id staff can write people into. Prefers getPrimaryClub, then active /
 * visible team club ids, then management membership — so create actions still
 * work when clubs SELECT is empty.
 */
export async function resolveStaffClubId(
  preferredClubId?: string | null,
): Promise<string | null> {
  const ctx = await getViewerContext();
  if (!ctx) return null;

  const club = await getPrimaryClub();
  const candidates = [
    preferredClubId,
    club?.id,
    ...preferredClubIds(ctx),
  ].filter((id): id is string => Boolean(id));

  for (const clubId of candidates) {
    if (isClubStaff(ctx, clubId)) return clubId;
  }
  return null;
}

export async function createClub(
  name: string,
): Promise<{ data: Club | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_club_with_management", {
    p_name: name,
  });

  if (error) return { data: null, error: error.message };
  return { data: (data as Club) ?? null, error: null };
}
