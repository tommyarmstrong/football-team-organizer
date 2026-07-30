import { createClient } from "@/lib/supabase/server";
import type {
  Manager,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type { Manager };

export async function listManagers(
  clubId?: string,
): Promise<{ data: Manager[]; error: string | null }> {
  const supabase = await createClient();
  let query = supabase
    .from("managers")
    .select("*")
    .order("second_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (clubId) query = query.eq("club_id", clubId);

  const { data, error } = await query;
  if (error) return { data: [], error: error.message };
  return { data: data ?? [], error: null };
}

export async function getManager(
  id: string,
): Promise<{ data: Manager | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("managers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function createManager(
  input: TablesInsert<"managers">,
): Promise<{ data: Manager | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("managers")
    .insert(input)
    .select("*")
    .single();

  if (error) {
    if (error.message.includes("managers_club_user_unique")) {
      return {
        data: null,
        error: "That login is already linked to a manager at this club.",
      };
    }
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function updateManager(
  id: string,
  input: TablesUpdate<"managers">,
): Promise<{ data: Manager | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("managers")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    if (error.message.includes("managers_club_user_unique")) {
      return {
        data: null,
        error: "That login is already linked to a manager at this club.",
      };
    }
    return { data: null, error: error.message };
  }
  return { data, error: null };
}

export async function deleteManager(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("managers").delete().eq("id", id);
  return { error: error?.message ?? null };
}
