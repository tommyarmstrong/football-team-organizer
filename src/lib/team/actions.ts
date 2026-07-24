"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import {
  createCompetition,
  deleteCompetition,
  updateCompetition,
} from "@/lib/data/competitions";
import { updateCurrentTeam } from "@/lib/data/team";
import type {
  CompetitionKind,
  TeamGender,
} from "@/lib/supabase/database.types";
import { COMPETITION_KINDS, TEAM_GENDERS } from "@/lib/constants";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export async function updateTeamAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const club = str(formData, "club");
  const name = str(formData, "name");
  const age_group = str(formData, "age_group");
  const gender = str(formData, "gender") as TeamGender;
  const home_ground = str(formData, "home_ground");
  const head_coach_name = str(formData, "head_coach_name");
  const season_label = str(formData, "season_label");

  if (
    !club ||
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

  const { error } = await updateCurrentTeam({
    club,
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

  if (!name) {
    return { error: "Competition name is required." };
  }

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

  if (!name) {
    return { error: "Competition name is required." };
  }

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
