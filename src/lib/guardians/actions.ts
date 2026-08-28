"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import {
  canManageClub,
  canManageGuardianPlayerLinks,
  canUpdateGuardianPlayerLink,
  getViewerContext,
} from "@/lib/authz/context";
import {
  createGuardian,
  deleteGuardian,
  getGuardian,
  linkGuardianToPlayer,
  unlinkGuardianFromPlayer,
  updateGuardian,
  updateGuardianPlayerLink,
} from "@/lib/data/guardians";
import { deletePerson } from "@/lib/data/people";
import { getPlayer, getPlayerTeams } from "@/lib/data/players";
import { resolveStaffClubId } from "@/lib/data/clubs";
import { getActiveTeam } from "@/lib/data/team";
import {
  parseEmergencyContact,
  parseGuardianForm,
  parseGuardianRelationship,
  parseLegalGuardian,
} from "@/lib/guardians/parse";
import { str } from "@/lib/form-parse";

async function assertCanManageGuardianPlayerLinks(
  playerId: string,
): Promise<ActionState | null> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const [playerResult, teamsResult] = await Promise.all([
    getPlayer(playerId),
    getPlayerTeams(playerId),
  ]);
  if (playerResult.error) return { error: playerResult.error };
  if (!playerResult.data) return { error: "Player not found." };

  const playerTeamIds = teamsResult.data.map((team) => team.team_id);
  if (
    !canManageGuardianPlayerLinks(ctx, playerResult.data.club_id, playerTeamIds)
  ) {
    return { error: "Only club staff can manage guardian links." };
  }

  return null;
}

async function assertCanUpdateGuardianPlayerLink(
  guardianId: string,
  playerId: string,
): Promise<ActionState | null> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const [playerResult, teamsResult] = await Promise.all([
    getPlayer(playerId),
    getPlayerTeams(playerId),
  ]);
  if (playerResult.error) return { error: playerResult.error };
  if (!playerResult.data) return { error: "Player not found." };

  const playerTeamIds = teamsResult.data.map((team) => team.team_id);
  if (
    !canUpdateGuardianPlayerLink(
      ctx,
      playerId,
      guardianId,
      playerResult.data.club_id,
      playerTeamIds,
    )
  ) {
    return { error: "You cannot edit this guardian relationship." };
  }

  return null;
}

async function revalidateGuardian(guardianId: string, playerId?: string) {
  revalidatePath("/club");
  revalidatePath(`/guardians/${guardianId}`);
  revalidatePath("/people");

  const guardian = await getGuardian(guardianId);
  if (guardian.data?.person_id) {
    revalidatePath(`/people/${guardian.data.person_id}`);
  }

  if (playerId) {
    const player = await getPlayer(playerId);
    if (player.data?.person_id) {
      revalidatePath(`/people/${player.data.person_id}`);
    }
  }
}

export async function createGuardianAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const activeTeam = await getActiveTeam();
  const clubId = await resolveStaffClubId(activeTeam?.club_id);
  if (!clubId) return { error: "No club found for your account." };

  const parsed = parseGuardianForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { data, error } = await createGuardian({
    club_id: clubId,
    ...parsed,
  });
  if (error) return { error };
  if (!data) return { error: "Could not create guardian." };

  revalidatePath("/club");
  redirect(`/guardians/${data.id}`);
}

export async function updateGuardianAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseGuardianForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await updateGuardian(id, parsed);
  if (error) return { error };

  await revalidateGuardian(id);
  redirect(`/guardians/${id}`);
}

export async function deleteGuardianAction(id: string): Promise<ActionState> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const { data: existing, error: loadError } = await getGuardian(id);
  if (loadError) return { error: loadError };
  if (!existing) return { error: "Guardian not found." };

  if (!canManageClub(ctx, existing.club_id)) {
    return { error: "Only club management can delete guardians." };
  }
  if (existing.user_id && existing.user_id === ctx.userId) {
    return { error: "You cannot delete your own person record." };
  }

  if (existing.person_id) {
    const { error } = await deletePerson(existing.person_id);
    if (error) return { error };
  } else {
    const { error } = await deleteGuardian(id);
    if (error) return { error };
  }

  revalidatePath("/club");
  revalidatePath("/people");
  redirect("/club");
}

export async function linkGuardianToPlayerAction(
  guardianId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const playerId = str(formData, "player_id");
  if (!playerId) return { error: "Select a player." };

  const authError = await assertCanManageGuardianPlayerLinks(playerId);
  if (authError) return authError;

  const relationship = parseGuardianRelationship(formData);
  if (typeof relationship === "object") return relationship;

  const { error } = await linkGuardianToPlayer({
    guardian_id: guardianId,
    player_id: playerId,
    relationship,
    legal_guardian: parseLegalGuardian(formData),
    emergency_contact: parseEmergencyContact(formData),
  });
  if (error) return { error };

  await revalidateGuardian(guardianId, playerId);
  return { success: "Player linked." };
}

export async function linkPlayerToGuardianAction(
  playerId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guardianId = str(formData, "guardian_id");
  if (!guardianId) return { error: "Select a guardian." };

  const authError = await assertCanManageGuardianPlayerLinks(playerId);
  if (authError) return authError;

  const relationship = parseGuardianRelationship(formData);
  if (typeof relationship === "object") return relationship;

  const { error } = await linkGuardianToPlayer({
    guardian_id: guardianId,
    player_id: playerId,
    relationship,
    legal_guardian: parseLegalGuardian(formData),
    emergency_contact: parseEmergencyContact(formData),
  });
  if (error) return { error };

  await revalidateGuardian(guardianId, playerId);
  return { success: "Guardian linked." };
}

export async function updateGuardianPlayerLinkAction(
  linkId: string,
  guardianId: string,
  playerId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const authError = await assertCanUpdateGuardianPlayerLink(
    guardianId,
    playerId,
  );
  if (authError) return authError;

  const relationship = parseGuardianRelationship(formData);
  if (typeof relationship === "object") return relationship;

  const { error } = await updateGuardianPlayerLink(linkId, {
    relationship,
    legal_guardian: parseLegalGuardian(formData),
    emergency_contact: parseEmergencyContact(formData),
  });
  if (error) return { error };

  await revalidateGuardian(guardianId, playerId);
  return { success: "Link updated." };
}

export async function unlinkGuardianFromPlayerAction(
  linkId: string,
  guardianId: string,
  playerId: string,
): Promise<ActionState> {
  const authError = await assertCanManageGuardianPlayerLinks(playerId);
  if (authError) return authError;

  const { error } = await unlinkGuardianFromPlayer(linkId);
  if (error) return { error };

  await revalidateGuardian(guardianId, playerId);
  return { success: "Player unlinked." };
}
