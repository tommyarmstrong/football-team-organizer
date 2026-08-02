"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { canManageClub, getViewerContext } from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { createCoach, deleteCoach, getCoach } from "@/lib/data/coaches";
import {
  createGuardian,
  deleteGuardian,
  getGuardian,
} from "@/lib/data/guardians";
import { createManager, deleteManager, getManager } from "@/lib/data/managers";
import {
  createPerson,
  getPerson,
  linkRoleToPerson,
  updatePerson,
} from "@/lib/data/people";
import {
  createPlayer,
  deletePlayer,
  getPlayer,
  updatePlayer,
} from "@/lib/data/players";
import { sendPersonInvitation } from "@/lib/people/invitations";
import { parsePersonForm, parsePersonPlayerForm } from "@/lib/people/parse";
import { str } from "@/lib/form-parse";
import type { PersonRoleKind } from "@/lib/people/roles";

function revalidatePeople(personId?: string) {
  revalidatePath("/people");
  revalidatePath("/club");
  if (personId) revalidatePath(`/people/${personId}`);
}

export async function createPersonAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const club = await getPrimaryClub();
  if (!club || !canManageClub(ctx, club.id)) {
    return { error: "Only club management can create people." };
  }

  const parsed = parsePersonForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { data, error } = await createPerson({
    ...parsed,
    account_status: "none",
  });
  if (error) return { error };
  if (!data) return { error: "Could not create person." };

  revalidatePeople(data.id);
  redirect(`/people/${data.id}`);
}

export async function updatePersonAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const { data: existing, error: loadError } = await getPerson(id);
  if (loadError) return { error: loadError };
  if (!existing) return { error: "Person not found." };

  const club = await getPrimaryClub();
  const isSelf = existing.auth_user_id === ctx.userId;
  const isAdmin = club ? canManageClub(ctx, club.id) : false;
  if (!isSelf && !isAdmin) {
    return { error: "You cannot edit this person." };
  }

  const parsed = parsePersonForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await updatePerson(id, parsed);
  if (error) return { error };

  const playerFields = parsePersonPlayerForm(formData);
  if (playerFields && "error" in playerFields) {
    return { error: playerFields.error };
  }
  if (playerFields) {
    const belongsToPerson = existing.players.some(
      (row) => row.id === playerFields.player_id,
    );
    if (!belongsToPerson) {
      return { error: "Player role not found for this person." };
    }

    const player = await getPlayer(playerFields.player_id);
    if (player.error) return { error: player.error };
    if (!player.data || player.data.person_id !== id) {
      return { error: "Player role not found for this person." };
    }

    const { error: playerError } = await updatePlayer(playerFields.player_id, {
      first_name: parsed.first_name,
      last_name: parsed.last_name,
      date_of_birth: playerFields.date_of_birth,
      position: playerFields.position,
      school: playerFields.school,
    });
    if (playerError) return { error: playerError };
  }

  revalidatePeople(id);
  return { success: "Person saved." };
}

export async function linkRoleToPersonAction(
  personId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const club = await getPrimaryClub();
  if (!club || !canManageClub(ctx, club.id)) {
    return { error: "Only club management can assign roles." };
  }

  const role = str(formData, "role") as
    "manager" | "coach" | "guardian" | "player";
  const roleId = str(formData, "role_id");
  if (!["manager", "coach", "guardian", "player"].includes(role)) {
    return { error: "Select a valid role type." };
  }
  if (!roleId) return { error: "Select a role record." };

  const { error } = await linkRoleToPerson({ personId, role, roleId });
  if (error) return { error };

  revalidatePeople(personId);
  return { success: "Role linked to person." };
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function addClubRoleToPersonAction(
  personId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const club = await getPrimaryClub();
  if (!club || !canManageClub(ctx, club.id)) {
    return { error: "Only club management can assign roles." };
  }

  const role = str(formData, "role") as PersonRoleKind;
  if (!["manager", "coach", "guardian", "player"].includes(role)) {
    return { error: "Select a valid role type." };
  }

  const { data: person, error: loadError } = await getPerson(personId);
  if (loadError) return { error: loadError };
  if (!person) return { error: "Person not found." };

  const alreadyHasRole =
    role === "player"
      ? person.players.some((row) => row.club_id === club.id)
      : role === "coach"
        ? person.coaches.some((row) => row.club_id === club.id)
        : role === "guardian"
          ? person.guardians.some((row) => row.club_id === club.id)
          : person.managers.some((row) => row.club_id === club.id);

  if (alreadyHasRole) {
    return { error: `This person already has a ${role} role at this club.` };
  }

  if (role === "player") {
    const { error } = await createPlayer({
      club_id: club.id,
      person_id: person.id,
      first_name: person.first_name,
      last_name: person.last_name,
    });
    if (error) return { error };
  } else if (role === "coach") {
    const { error } = await createCoach({
      club_id: club.id,
      person_id: person.id,
      first_name: person.first_name,
      second_name: person.last_name,
      phone: person.phone,
      email: person.email,
      joined_date: todayIsoDate(),
      date_of_birth: null,
      notes: null,
      biography: null,
      philosophy: null,
      dbs_checked: false,
      fa_level_1: false,
      fa_level_2: false,
    });
    if (error) return { error };
  } else if (role === "guardian") {
    const { error } = await createGuardian({
      club_id: club.id,
      person_id: person.id,
      first_name: person.first_name,
      second_name: person.last_name,
      phone: person.phone,
      email: person.email,
      notes: null,
    });
    if (error) return { error };
  } else {
    const { error } = await createManager({
      club_id: club.id,
      person_id: person.id,
      first_name: person.first_name,
      second_name: person.last_name,
      phone: person.phone,
      email: person.email,
      notes: null,
    });
    if (error) return { error };
  }

  revalidatePeople(personId);
  revalidatePath("/club");
  revalidatePath("/coaches");
  return { success: "Club role added." };
}

export async function removeClubRoleFromPersonAction(
  personId: string,
  role: PersonRoleKind,
  roleId: string,
): Promise<ActionState> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const club = await getPrimaryClub();
  if (!club || !canManageClub(ctx, club.id)) {
    return { error: "Only club management can remove roles." };
  }

  if (role === "player") {
    const { data: existing, error: loadError } = await getPlayer(roleId);
    if (loadError) return { error: loadError };
    if (!existing || existing.person_id !== personId) {
      return { error: "Player role not found for this person." };
    }
    const { error } = await deletePlayer(roleId);
    if (error) return { error };
  } else if (role === "coach") {
    const { data: existing, error: loadError } = await getCoach(roleId);
    if (loadError) return { error: loadError };
    if (!existing || existing.person_id !== personId) {
      return { error: "Coach role not found for this person." };
    }
    const { error } = await deleteCoach(roleId);
    if (error) return { error };
  } else if (role === "guardian") {
    const { data: existing, error: loadError } = await getGuardian(roleId);
    if (loadError) return { error: loadError };
    if (!existing || existing.person_id !== personId) {
      return { error: "Guardian role not found for this person." };
    }
    const { error } = await deleteGuardian(roleId);
    if (error) return { error };
  } else if (role === "manager") {
    const { data: existing, error: loadError } = await getManager(roleId);
    if (loadError) return { error: loadError };
    if (!existing || existing.person_id !== personId) {
      return { error: "Manager role not found for this person." };
    }
    if (existing.user_id && existing.user_id === ctx.userId) {
      return { error: "You cannot remove your own manager role." };
    }
    const { error } = await deleteManager(roleId);
    if (error) return { error };
  } else {
    return { error: "Select a valid role type." };
  }

  revalidatePeople(personId);
  revalidatePath("/club");
  revalidatePath("/coaches");
  return { success: "Club role removed." };
}

export async function sendInvitationAction(
  personId: string,
): Promise<ActionState> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const club = await getPrimaryClub();
  if (!club || !canManageClub(ctx, club.id)) {
    return { error: "Only club management can send invitations." };
  }

  const { data: person, error: loadError } = await getPerson(personId);
  if (loadError) return { error: loadError };
  if (!person) return { error: "Person not found." };

  try {
    const result = await sendPersonInvitation({
      person,
      invitedBy: ctx.userId,
    });
    if (!result.ok) return { error: result.error };

    revalidatePeople(personId);
    if (result.emailSent) {
      return { success: "Invitation sent." };
    }

    const link = result.acceptUrl
      ? ` Share this accept link: ${result.acceptUrl}`
      : "";

    if (result.alreadyRegistered) {
      return {
        success: `Invitation created. An Auth account already exists for this email, so Supabase cannot send another invite email.${link}`,
      };
    }

    const reason = result.emailError
      ? ` Supabase reported: ${result.emailError}`
      : " Email delivery via Supabase may need configuration.";
    return {
      success: `Invitation created, but the email was not sent.${reason}${link}`,
    };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Could not send invitation (service role key required).",
    };
  }
}

export async function completePersonProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const personId = str(formData, "person_id");
  if (!personId) return { error: "Person is required." };

  const { data: existing, error: loadError } = await getPerson(personId);
  if (loadError) return { error: loadError };
  if (!existing) return { error: "Person not found." };
  if (existing.auth_user_id !== ctx.userId) {
    return { error: "You can only complete your own profile." };
  }

  const parsed = parsePersonForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await updatePerson(personId, {
    phone: parsed.phone,
    first_name: parsed.first_name,
    last_name: parsed.last_name,
  });
  if (error) return { error };

  revalidatePeople(personId);
  redirect("/dashboard");
}
