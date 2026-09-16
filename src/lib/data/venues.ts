import { unstable_cache } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  TablesInsert,
  TablesUpdate,
  Venue,
} from "@/lib/supabase/database.types";

export type { Venue };

/**
 * List venues, optionally scoped to a club.
 *
 * §5.6: when a `clubId` is provided the result is cross-request cached for up
 * to one hour and tagged `venues:<clubId>` so venue mutations can invalidate it
 * with `revalidateTag`. The unscoped (all-clubs) path remains uncached because
 * it combines every club the user can see and is not safe to share across users.
 */
export async function listVenues(
  clubId?: string,
): Promise<{ data: Venue[]; error: string | null }> {
  if (clubId) {
    return unstable_cache(
      async (cId: string) => {
        const supabase = createAdminClient();
        const { data, error } = await supabase
          .from("venues")
          .select("*")
          .eq("club_id", cId)
          .order("name", { ascending: true });
        if (error) return { data: [] as Venue[], error: error.message };
        return { data: (data ?? []) as Venue[], error: null };
      },
      ["venues", clubId],
      { tags: [`venues:${clubId}`], revalidate: 3600 },
    )(clubId);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .order("name", { ascending: true });
  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export async function getVenue(
  id: string,
): Promise<{ data: Venue | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function createVenue(
  input: TablesInsert<"venues">,
): Promise<{ data: Venue | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .insert(input)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updateVenue(
  id: string,
  input: TablesUpdate<"venues">,
): Promise<{ data: Venue | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function deleteVenue(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("venues").delete().eq("id", id);
  return { error: error?.message ?? null };
}
