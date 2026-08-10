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
import { parseOptionalInt, parseYesNo, str as formStr } from "@/lib/form-parse";
import { createClient } from "@/lib/supabase/server";
import {
  TEAM_PHOTO_MAX_BYTES,
  TEAM_PHOTO_MIME_TYPES,
  TEAM_PHOTOS_BUCKET,
} from "@/lib/constants";
import type {
  CompetitionGender,
  CompetitionKind,
  CompetitionPeriods,
  CompetitionResult,
  TablesUpdate,
  TeamGender,
} from "@/lib/supabase/database.types";
import {
  AGE_GROUPS,
  COMPETITION_GENDERS,
  COMPETITION_KINDS,
  COMPETITION_PERIODS,
  COMPETITION_RESULTS,
  DEFAULT_COMPETITION_PERIODS,
  DEFAULT_COMPETITION_RESULT,
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
      home_venue_id: string | null;
      training_venue_id: string | null;
      training_days: TrainingDay[];
      season_label: string;
      head_coach_id: string | null;
    }
  | { ok: false; error: string } {
  const name = str(formData, "name");
  const age_group = str(formData, "age_group");
  const gender = str(formData, "gender") as TeamGender;
  const home_venue_id = str(formData, "home_venue_id") || null;
  const training_venue_id = str(formData, "training_venue_id") || null;
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
    home_venue_id,
    training_venue_id,
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

  const clearPhoto = str(formData, "clear_photo") === "true";
  let photoUrl = team.photo_url;
  if (clearPhoto) {
    photoUrl = null;
  }

  const photoEntry = formData.get("photo");
  if (photoEntry instanceof File && photoEntry.size > 0) {
    const uploaded = await uploadTeamPhoto(team.id, photoEntry);
    if ("error" in uploaded) return { error: uploaded.error };
    photoUrl = uploaded.url;
  }

  const { error } = await updateTeam(team.id, {
    name: parsed.name,
    age_group: parsed.age_group,
    gender: parsed.gender,
    home_venue_id: parsed.home_venue_id,
    training_venue_id: parsed.training_venue_id,
    training_days: parsed.training_days,
    season_label: parsed.season_label,
    photo_url: photoUrl,
  });
  if (error) return { error };

  const headError = await setTeamHeadCoach(team.id, parsed.head_coach_id);
  if (headError.error) return { error: headError.error };

  revalidatePath("/team");
  revalidatePath("/team/edit");
  revalidatePath("/dashboard");
  revalidatePath("/people");
  revalidatePath("/venues");
  redirect("/team");
}

async function uploadTeamPhoto(
  teamId: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  if (!TEAM_PHOTO_MIME_TYPES.has(file.type)) {
    return { error: "Photo must be a PNG, JPEG, WebP, or GIF image." };
  }
  if (file.size > TEAM_PHOTO_MAX_BYTES) {
    return { error: "Photo must be 5 MB or smaller." };
  }

  const ext =
    file.type === "image/png"
      ? "png"
      : file.type === "image/jpeg"
        ? "jpg"
        : file.type === "image/webp"
          ? "webp"
          : file.type === "image/gif"
            ? "gif"
            : null;
  if (!ext) return { error: "Unsupported photo file type." };

  const supabase = await createClient();
  const path = `${teamId}/${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(TEAM_PHOTOS_BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from(TEAM_PHOTOS_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
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
    home_venue_id: parsed.home_venue_id,
    training_venue_id: parsed.training_venue_id,
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
  revalidatePath("/club");
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
  revalidatePath("/dashboard");
  revalidatePath("/matches");
  return { success: "Competition added." };
}

function parseCompetitionUpdate(
  formData: FormData,
): TablesUpdate<"competitions"> | { error: string } {
  const name = str(formData, "name");
  if (!name) return { error: "Competition name is required." };

  const kindRaw = str(formData, "kind");
  const kind =
    kindRaw && COMPETITION_KINDS.includes(kindRaw as CompetitionKind)
      ? (kindRaw as CompetitionKind)
      : "league";

  const season = str(formData, "season") || null;
  const knockout = parseYesNo(formData, "knockout", false);

  const ageGroupRaw = str(formData, "age_group");
  let age_group: string | null = null;
  if (ageGroupRaw) {
    if (!(AGE_GROUPS as readonly string[]).includes(ageGroupRaw)) {
      return { error: "Invalid age group." };
    }
    age_group = ageGroupRaw;
  }

  const genderRaw = str(formData, "gender");
  let gender: CompetitionGender | null = null;
  if (genderRaw) {
    if (!COMPETITION_GENDERS.includes(genderRaw as CompetitionGender)) {
      return { error: "Invalid gender." };
    }
    gender = genderRaw as CompetitionGender;
  }

  const playersPerTeam = parseOptionalInt(
    formStr(formData, "players_per_team"),
    "Players per team",
  );
  if (typeof playersPerTeam === "object" && playersPerTeam !== null) {
    return playersPerTeam;
  }

  const periodsRaw = str(formData, "periods");
  const periods: CompetitionPeriods =
    periodsRaw && COMPETITION_PERIODS.includes(periodsRaw as CompetitionPeriods)
      ? (periodsRaw as CompetitionPeriods)
      : DEFAULT_COMPETITION_PERIODS;

  const minutesPerPeriod = parseOptionalInt(
    formStr(formData, "minutes_per_period"),
    "Minutes per period",
  );
  if (typeof minutesPerPeriod === "object" && minutesPerPeriod !== null) {
    return minutesPerPeriod;
  }

  const notes = str(formData, "notes") || null;

  const resultRaw = str(formData, "result");
  const result: CompetitionResult =
    resultRaw && COMPETITION_RESULTS.includes(resultRaw as CompetitionResult)
      ? (resultRaw as CompetitionResult)
      : DEFAULT_COMPETITION_RESULT;

  return {
    name,
    kind,
    season,
    knockout,
    age_group,
    gender,
    players_per_team: playersPerTeam,
    periods,
    minutes_per_period: minutesPerPeriod,
    notes,
    result,
  };
}

function revalidateCompetitionPaths(id: string) {
  revalidatePath("/team");
  revalidatePath("/dashboard");
  revalidatePath("/matches");
  revalidatePath(`/competitions/${id}`);
  revalidatePath(`/competitions/${id}/edit`);
}

export async function updateCompetitionAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseCompetitionUpdate(formData);
  if ("error" in parsed) return parsed;

  const { error } = await updateCompetition(id, parsed);
  if (error) return { error };

  revalidateCompetitionPaths(id);
  return { success: "Competition updated." };
}

/** Saves competition fields and returns to the competition detail page. */
export async function saveCompetitionAndReturnAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseCompetitionUpdate(formData);
  if ("error" in parsed) return parsed;

  const { error } = await updateCompetition(id, parsed);
  if (error) return { error };

  revalidateCompetitionPaths(id);
  redirect(`/competitions/${id}`);
}

/** @deprecated Prefer saveCompetitionAndReturnAction */
export async function saveCompetitionAndReturnToTeamAction(
  id: string,
  prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  return saveCompetitionAndReturnAction(id, prev, formData);
}

export async function deleteCompetitionAction(
  id: string,
): Promise<ActionState> {
  const { error } = await deleteCompetition(id);
  if (error) return { error };

  revalidatePath("/team");
  revalidatePath("/dashboard");
  revalidatePath("/matches");
  redirect("/dashboard");
}
