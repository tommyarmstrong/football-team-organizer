import { createClient } from "@/lib/supabase/server";
import type {
  TablesInsert,
  TablesUpdate,
  Venue,
} from "@/lib/supabase/database.types";

export type { Venue };

export async function listVenues(
  clubId?: string,
): Promise<{ data: Venue[]; error: string | null }> {
  const supabase = await createClient();
  let query = supabase
    .from("venues")
    .select("*")
    .order("name", { ascending: true });

  if (clubId) query = query.eq("club_id", clubId);

  const { data, error } = await query;
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
