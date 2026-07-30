import { createClient } from "@/lib/supabase/server";
import type {
  Guardian,
  GuardianRelationship,
  TablesInsert,
  TablesUpdate,
} from "@/lib/supabase/database.types";

export type { Guardian };

export type GuardianPlayerLink = {
  player_guardian_id: string;
  player_id: string;
  player_first_name: string;
  player_last_name: string;
  relationship: GuardianRelationship;
  legal_guardian: boolean;
};

export type GuardianWithPlayers = Guardian & {
  players: GuardianPlayerLink[];
};

export async function listGuardians(): Promise<{
  data: GuardianWithPlayers[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guardians")
    .select(
      "*, player_guardians(id, player_id, relationship, legal_guardian, player:players(first_name, last_name))",
    )
    .order("second_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) return { data: [], error: error.message };

  const rows: GuardianWithPlayers[] = (data ?? []).map((row) => {
    const { player_guardians, ...guardian } = row as Guardian & {
      player_guardians: Array<{
        id: string;
        player_id: string;
        relationship: GuardianRelationship;
        legal_guardian: boolean;
        player:
          | { first_name: string; last_name: string }
          | { first_name: string; last_name: string }[]
          | null;
      }>;
    };
    const players: GuardianPlayerLink[] = (player_guardians ?? []).map((pg) => {
      const player = Array.isArray(pg.player) ? pg.player[0] : pg.player;
      return {
        player_guardian_id: pg.id,
        player_id: pg.player_id,
        player_first_name: player?.first_name ?? "",
        player_last_name: player?.last_name ?? "",
        relationship: pg.relationship,
        legal_guardian: pg.legal_guardian,
      };
    });
    return { ...(guardian as Guardian), players };
  });

  return { data: rows, error: null };
}

export async function getGuardian(
  id: string,
): Promise<{ data: Guardian | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guardians")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function getGuardianPlayers(
  guardianId: string,
): Promise<{ data: GuardianPlayerLink[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_guardians")
    .select(
      "id, player_id, relationship, legal_guardian, player:players(first_name, last_name)",
    )
    .eq("guardian_id", guardianId);

  if (error) return { data: [], error: error.message };

  const rows: GuardianPlayerLink[] = (data ?? []).map((pg) => {
    const player = Array.isArray(pg.player) ? pg.player[0] : pg.player;
    return {
      player_guardian_id: pg.id,
      player_id: pg.player_id,
      player_first_name: player?.first_name ?? "",
      player_last_name: player?.last_name ?? "",
      relationship: pg.relationship as GuardianRelationship,
      legal_guardian: pg.legal_guardian,
    };
  });

  return { data: rows, error: null };
}

export type PlayerGuardianLink = {
  player_guardian_id: string;
  guardian_id: string;
  first_name: string;
  second_name: string;
  phone: string | null;
  relationship: GuardianRelationship;
  legal_guardian: boolean;
};

export async function getPlayerGuardians(
  playerId: string,
): Promise<{ data: PlayerGuardianLink[]; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("player_guardians")
    .select(
      "id, guardian_id, relationship, legal_guardian, guardian:guardians(first_name, second_name, phone)",
    )
    .eq("player_id", playerId);

  if (error) return { data: [], error: error.message };

  const rows: PlayerGuardianLink[] = (data ?? []).map((pg) => {
    const guardian = Array.isArray(pg.guardian) ? pg.guardian[0] : pg.guardian;
    return {
      player_guardian_id: pg.id,
      guardian_id: pg.guardian_id,
      first_name: guardian?.first_name ?? "",
      second_name: guardian?.second_name ?? "",
      phone: guardian?.phone ?? null,
      relationship: pg.relationship as GuardianRelationship,
      legal_guardian: pg.legal_guardian,
    };
  });

  return { data: rows, error: null };
}

export async function createGuardian(
  input: TablesInsert<"guardians">,
): Promise<{ data: Guardian | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guardians")
    .insert(input)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function updateGuardian(
  id: string,
  input: TablesUpdate<"guardians">,
): Promise<{ data: Guardian | null; error: string | null }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guardians")
    .update(input)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return { data: null, error: error.message };
  return { data, error: null };
}

export async function deleteGuardian(
  id: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("guardians").delete().eq("id", id);
  return { error: error?.message ?? null };
}

export async function linkGuardianToPlayer(input: {
  guardian_id: string;
  player_id: string;
  relationship: GuardianRelationship;
  legal_guardian: boolean;
}): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase.from("player_guardians").insert(input);
  if (error?.message.includes("player_guardians_unique")) {
    return { error: "That player is already linked to this guardian." };
  }
  return { error: error?.message ?? null };
}

export async function updateGuardianPlayerLink(
  id: string,
  input: {
    relationship?: GuardianRelationship;
    legal_guardian?: boolean;
  },
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("player_guardians")
    .update(input)
    .eq("id", id);
  return { error: error?.message ?? null };
}

export async function unlinkGuardianFromPlayer(
  playerGuardianId: string,
): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("player_guardians")
    .delete()
    .eq("id", playerGuardianId);
  return { error: error?.message ?? null };
}
