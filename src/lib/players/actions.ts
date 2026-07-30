"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import {
  addPlayerToTeam,
  createPlayer,
  deletePlayer,
  removePlayerFromTeam,
  updatePlayer,
  updateRosterEntry,
  upsertPlayerContact,
} from "@/lib/data/players";
import { resolveStaffClubId } from "@/lib/data/clubs";
import { getActiveTeam } from "@/lib/data/team";
import { parseShirtNumber, str } from "@/lib/form-parse";

export async function createPlayerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const activeTeam = await getActiveTeam();
  const clubId = await resolveStaffClubId(activeTeam?.club_id);
  if (!clubId) return { error: "No club found for your account." };

  const first_name = str(formData, "first_name");
  const last_name = str(formData, "last_name");
  const position = str(formData, "position") || null;
  const school = str(formData, "school") || null;
  const date_of_birth = str(formData, "date_of_birth") || null;

  if (!first_name || !last_name) {
    return { error: "First and last name are required." };
  }

  const { data, error } = await createPlayer({
    club_id: clubId,
    first_name,
    last_name,
    position,
    school,
    date_of_birth,
  });

  if (error) return { error };
  if (!data) return { error: "Could not create player." };

  revalidatePath("/club");
  redirect(`/players/${data.id}`);
}

export async function updatePlayerAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const first_name = str(formData, "first_name");
  const last_name = str(formData, "last_name");
  const position = str(formData, "position") || null;
  const school = str(formData, "school") || null;
  const date_of_birth = str(formData, "date_of_birth") || null;

  if (!first_name || !last_name) {
    return { error: "First and last name are required." };
  }

  const { error } = await updatePlayer(id, {
    first_name,
    last_name,
    position,
    school,
    date_of_birth,
  });
  if (error) return { error };

  revalidatePath("/club");
  revalidatePath(`/players/${id}`);
  return { success: "Player saved." };
}

export async function deletePlayerAction(id: string): Promise<ActionState> {
  const { error } = await deletePlayer(id);
  if (error) return { error };

  revalidatePath("/club");
  redirect("/club");
}

export async function savePlayerContactAction(
  playerId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { error } = await upsertPlayerContact(playerId, {
    phone: str(formData, "phone") || null,
    email: str(formData, "email") || null,
    address: str(formData, "address") || null,
    emergency_guardian_id: str(formData, "emergency_guardian_id") || null,
    medical_notes: str(formData, "medical_notes") || null,
  });

  if (error) return { error };

  revalidatePath(`/players/${playerId}`);
  return { success: "Contact details saved." };
}

export async function addPlayerToTeamAction(
  playerId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const teamId = str(formData, "team_id");
  if (!teamId) return { error: "Select a team." };

  const shirt = parseShirtNumber(str(formData, "shirt_number"));
  if (shirt && typeof shirt === "object" && "error" in shirt) {
    return { error: shirt.error };
  }

  const { error } = await addPlayerToTeam(
    teamId,
    playerId,
    shirt as number | null,
  );
  if (error) return { error };

  revalidatePath(`/players/${playerId}`);
  revalidatePath("/club");
  revalidatePath("/team");
  return { success: "Player added to team." };
}

export async function addRosterPlayerAction(
  teamId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const playerId = str(formData, "player_id");
  if (!playerId) return { error: "Select a player." };

  const shirt = parseShirtNumber(str(formData, "shirt_number"));
  if (shirt && typeof shirt === "object" && "error" in shirt) {
    return { error: shirt.error };
  }

  const { error } = await addPlayerToTeam(
    teamId,
    playerId,
    shirt as number | null,
  );
  if (error) return { error };

  revalidatePath("/team");
  revalidatePath("/club");
  revalidatePath(`/players/${playerId}`);
  return { success: "Player added to squad." };
}

/** Create a club player and assign them to this team's squad in one step. */
export async function createRosterPlayerAction(
  teamId: string,
  clubId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const resolvedClubId = await resolveStaffClubId(clubId);
  if (!resolvedClubId) return { error: "No club found for your account." };

  const first_name = str(formData, "first_name");
  const last_name = str(formData, "last_name");
  const position = str(formData, "position") || null;

  if (!first_name || !last_name) {
    return { error: "First and last name are required." };
  }

  const shirt = parseShirtNumber(str(formData, "shirt_number"));
  if (shirt && typeof shirt === "object" && "error" in shirt) {
    return { error: shirt.error };
  }

  const { data, error } = await createPlayer({
    club_id: resolvedClubId,
    first_name,
    last_name,
    position,
  });
  if (error) return { error };
  if (!data) return { error: "Could not create player." };

  const { error: rosterError } = await addPlayerToTeam(
    teamId,
    data.id,
    shirt as number | null,
  );
  if (rosterError) return { error: rosterError };

  revalidatePath("/team");
  revalidatePath("/club");
  revalidatePath(`/players/${data.id}`);
  return { success: "Player added to squad." };
}

export async function updateRosterEntryAction(
  teamPlayerId: string,
  playerId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const shirt = parseShirtNumber(str(formData, "shirt_number"));
  if (shirt && typeof shirt === "object" && "error" in shirt) {
    return { error: shirt.error };
  }
  const active = str(formData, "active") === "true";

  const { error } = await updateRosterEntry(teamPlayerId, {
    shirt_number: shirt as number | null,
    active,
  });
  if (error) return { error };

  revalidatePath(`/players/${playerId}`);
  revalidatePath("/club");
  revalidatePath("/team");
  return { success: "Squad details saved." };
}

export async function removePlayerFromTeamAction(
  teamPlayerId: string,
  playerId: string,
): Promise<ActionState> {
  const { error } = await removePlayerFromTeam(teamPlayerId);
  if (error) return { error };

  revalidatePath(`/players/${playerId}`);
  revalidatePath("/club");
  revalidatePath("/team");
  return { success: "Player removed from team." };
}
