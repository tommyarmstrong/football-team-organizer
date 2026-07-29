"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { ActionState } from "@/lib/action-state";
import { canManageClub, getViewerContext } from "@/lib/authz/context";
import {
  createCompetition,
  deleteCompetition,
  updateCompetition,
} from "@/lib/data/competitions";
import {
  ACTIVE_TEAM_COOKIE,
  createTeam,
  getActiveTeam,
  updateTeam,
} from "@/lib/data/team";
import { getPrimaryClub } from "@/lib/data/clubs";
import type {
  CompetitionKind,
  TeamGender,
} from "@/lib/supabase/database.types";
import { COMPETITION_KINDS, TEAM_GENDERS } from "@/lib/constants";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function setActiveTeamAction(teamId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TEAM_COOKIE, teamId, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");
}

export async function updateTeamAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const team = await getActiveTeam();
  if (!team) return { error: "No team selected." };

  const name = str(formData, "name");
  const age_group = str(formData, "age_group");
  const gender = str(formData, "gender") as TeamGender;
  const home_ground = str(formData, "home_ground");
  const head_coach_name = str(formData, "head_coach_name");
  const season_label = str(formData, "season_label");

  if (
    !name ||
    !age_group ||
    !home_ground ||
    !head_coach_name ||
    !season_label
  ) {
    return { error: "All team fields are required." };
  }
  if (!TEAM_GENDERS.includes(gender)) {
    return { error: "Invalid gender." };
  }

  const { error } = await updateTeam(team.id, {
    name,
    age_group,
    gender,
    home_ground,
    head_coach_name,
    season_label,
  });

  if (error) return { error };

  revalidatePath("/team");
  revalidatePath("/dashboard");
  return { success: "Team profile saved." };
}

export async function createTeamAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const [club, activeTeam] = await Promise.all([
    getPrimaryClub(),
    getActiveTeam(),
  ]);
  const clubId =
    (club && canManageClub(ctx, club.id) ? club.id : null) ??
    (activeTeam && canManageClub(ctx, activeTeam.club_id)
      ? activeTeam.club_id
      : null) ??
    ctx.managementClubIds[0] ??
    null;

  if (!clubId || !canManageClub(ctx, clubId)) {
    return { error: "No club found for your account." };
  }

  const name = str(formData, "name");
  const age_group = str(formData, "age_group");
  const gender = str(formData, "gender") as TeamGender;
  const home_ground = str(formData, "home_ground");
  const head_coach_name = str(formData, "head_coach_name");
  const season_label = str(formData, "season_label");

  if (
    !name ||
    !age_group ||
    !home_ground ||
    !head_coach_name ||
    !season_label
  ) {
    return { error: "All team fields are required." };
  }
  if (!TEAM_GENDERS.includes(gender)) {
    return { error: "Invalid gender." };
  }

  const { data, error } = await createTeam({
    club_id: clubId,
    name,
    age_group,
    gender,
    home_ground,
    head_coach_name,
    season_label,
  });

  if (error) return { error };
  if (!data) return { error: "Could not create team." };

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_TEAM_COOKIE, data.id, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  redirect("/team");
}

export async function createCompetitionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = str(formData, "name");
  const kindRaw = str(formData, "kind");
  const kind =
    kindRaw && COMPETITION_KINDS.includes(kindRaw as CompetitionKind)
      ? (kindRaw as CompetitionKind)
      : null;

  if (!name) return { error: "Competition name is required." };

  const { error } = await createCompetition({ name, kind });
  if (error) return { error };

  revalidatePath("/team");
  revalidatePath("/matches");
  return { success: "Competition added." };
}

export async function updateCompetitionAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = str(formData, "name");
  const kindRaw = str(formData, "kind");
  const kind =
    kindRaw && COMPETITION_KINDS.includes(kindRaw as CompetitionKind)
      ? (kindRaw as CompetitionKind)
      : null;

  if (!name) return { error: "Competition name is required." };

  const { error } = await updateCompetition(id, { name, kind });
  if (error) return { error };

  revalidatePath("/team");
  revalidatePath("/matches");
  return { success: "Competition updated." };
}

export async function deleteCompetitionAction(
  id: string,
): Promise<ActionState> {
  const { error } = await deleteCompetition(id);
  if (error) return { error };

  revalidatePath("/team");
  revalidatePath("/matches");
  return { success: "Competition deleted." };
}
