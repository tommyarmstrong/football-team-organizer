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
import { setTeamHeadCoach } from "@/lib/data/coaches";
import type {
  CompetitionKind,
  TeamGender,
} from "@/lib/supabase/database.types";
import {
  AGE_GROUPS,
  COMPETITION_KINDS,
  TEAM_GENDERS,
  TRAINING_DAYS,
  type AgeGroup,
  type TrainingDay,
} from "@/lib/constants";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function parseTrainingDays(formData: FormData): TrainingDay[] {
  return formData
    .getAll("training_days")
    .map((v) => String(v))
    .filter((d): d is TrainingDay =>
      (TRAINING_DAYS as readonly string[]).includes(d),
    );
}

function parseTeamFields(formData: FormData):
  | {
      ok: true;
      name: string;
      age_group: AgeGroup;
      gender: TeamGender;
      home_venue: string | null;
      training_venue: string | null;
      training_days: TrainingDay[];
      season_label: string;
      head_coach_id: string | null;
    }
  | { ok: false; error: string } {
  const name = str(formData, "name");
  const age_group = str(formData, "age_group");
  const gender = str(formData, "gender") as TeamGender;
  const home_venue = str(formData, "home_venue") || null;
  const training_venue = str(formData, "training_venue") || null;
  const training_days = parseTrainingDays(formData);
  const season_label = str(formData, "season_label");
  const head_coach_id = str(formData, "head_coach_id") || null;

  if (!name || !age_group || !season_label) {
    return { error: "Name, age group, and season are required.", ok: false };
  }
  if (!(AGE_GROUPS as readonly string[]).includes(age_group)) {
    return { error: "Select a valid age group.", ok: false };
  }
  if (!TEAM_GENDERS.includes(gender)) {
    return { error: "Invalid gender.", ok: false };
  }

  return {
    ok: true,
    name,
    age_group: age_group as AgeGroup,
    gender,
    home_venue,
    training_venue,
    training_days,
    season_label,
    head_coach_id,
  };
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

  const parsed = parseTeamFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  const { error } = await updateTeam(team.id, {
    name: parsed.name,
    age_group: parsed.age_group,
    gender: parsed.gender,
    home_venue: parsed.home_venue,
    training_venue: parsed.training_venue,
    training_days: parsed.training_days,
    season_label: parsed.season_label,
  });
  if (error) return { error };

  const headError = await setTeamHeadCoach(team.id, parsed.head_coach_id);
  if (headError.error) return { error: headError.error };

  revalidatePath("/team");
  revalidatePath("/dashboard");
  revalidatePath("/coaches");
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

  const parsed = parseTeamFields(formData);
  if (!parsed.ok) return { error: parsed.error };

  const { data, error } = await createTeam({
    club_id: clubId,
    name: parsed.name,
    age_group: parsed.age_group,
    gender: parsed.gender,
    home_venue: parsed.home_venue,
    training_venue: parsed.training_venue,
    training_days: parsed.training_days,
    season_label: parsed.season_label,
  });

  if (error) return { error };
  if (!data) return { error: "Could not create team." };

  if (parsed.head_coach_id) {
    const headError = await setTeamHeadCoach(data.id, parsed.head_coach_id);
    if (headError.error) return { error: headError.error };
  }

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
      : "league";

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
      : "league";

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
