"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import {
  addCoachToTeam,
  createCoach,
  deleteCoach,
  getCoach,
  removeCoachFromTeam,
  updateCoach,
  updateCoachText,
} from "@/lib/data/coaches";
import {
  createCoachObjective,
  deleteCoachObjective,
  updateCoachObjective,
} from "@/lib/data/coach-objectives";
import { resolveStaffClubId } from "@/lib/data/clubs";
import { getActiveTeam } from "@/lib/data/team";
import { parseCoachForm } from "@/lib/coaches/parse";
import { parseCoachObjectiveForm } from "@/lib/objectives/parse";
import { str } from "@/lib/form-parse";

async function revalidatePersonForCoach(coachId: string) {
  const coach = await getCoach(coachId);
  const personId = coach.data?.person_id ?? null;
  revalidatePath("/people");
  revalidatePath("/club");
  if (personId) revalidatePath(`/people/${personId}`);
  return personId;
}

export async function createCoachAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const activeTeam = await getActiveTeam();
  const clubId = await resolveStaffClubId(activeTeam?.club_id);
  if (!clubId) return { error: "No club found for your account." };

  const parsed = parseCoachForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { data, error } = await createCoach({ club_id: clubId, ...parsed });

  if (error) return { error };
  if (!data) return { error: "Could not create coach." };

  revalidatePath("/people");
  revalidatePath("/club");
  redirect(`/people/${data.person_id}`);
}

export async function updateCoachAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseCoachForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await updateCoach(id, parsed);
  if (error) return { error };

  const personId = await revalidatePersonForCoach(id);
  if (personId) redirect(`/people/${personId}`);
  redirect("/people");
}

export async function updateCoachTextAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const biography = str(formData, "biography") || null;
  const philosophy = str(formData, "philosophy") || null;

  const { error } = await updateCoachText(id, { biography, philosophy });
  if (error) return { error };

  const personId = await revalidatePersonForCoach(id);
  if (personId) {
    revalidatePath(`/people/${personId}/edit`);
  }
  return { success: "Coach profile saved." };
}

export async function deleteCoachAction(id: string): Promise<ActionState> {
  const existing = await getCoach(id);
  const personId = existing.data?.person_id ?? null;
  const { error } = await deleteCoach(id);
  if (error) return { error };

  revalidatePath("/people");
  revalidatePath("/club");
  if (personId) {
    revalidatePath(`/people/${personId}`);
    redirect(`/people/${personId}`);
  }
  redirect("/people");
}

export async function addCoachToTeamAction(
  coachId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const teamId = str(formData, "team_id");
  const role = str(formData, "role") || null;
  if (!teamId) return { error: "Select a team." };

  const { error } = await addCoachToTeam(teamId, coachId, role);
  if (error) return { error };

  await revalidatePersonForCoach(coachId);
  revalidatePath("/team");
  return { success: "Coach assigned to team." };
}

/** Create a club coach and assign them to this team in one step. */
export async function createTeamCoachAction(
  teamId: string,
  clubId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const resolvedClubId = await resolveStaffClubId(clubId);
  if (!resolvedClubId) return { error: "No club found for your account." };

  const parsed = parseCoachForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const role = str(formData, "role") || null;

  const { data, error } = await createCoach({
    club_id: resolvedClubId,
    ...parsed,
  });
  if (error) return { error };
  if (!data) return { error: "Could not create coach." };

  const { error: assignError } = await addCoachToTeam(teamId, data.id, role);
  if (assignError) return { error: assignError };

  revalidatePath("/people");
  revalidatePath(`/people/${data.person_id}`);
  revalidatePath("/club");
  revalidatePath("/team");
  return { success: "Coach added to team." };
}

export async function removeCoachFromTeamAction(
  teamCoachId: string,
  coachId: string,
): Promise<ActionState> {
  const { error } = await removeCoachFromTeam(teamCoachId);
  if (error) return { error };

  await revalidatePersonForCoach(coachId);
  revalidatePath("/team");
  return { success: "Coach removed from team." };
}

export async function addCoachObjectiveAction(
  coachId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseCoachObjectiveForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { data, error } = await createCoachObjective({
    coach_id: coachId,
    ...parsed,
    sort_order: 0,
  });
  if (error) return { error };
  if (!data) return { error: "Could not create objective." };

  const personId = await revalidatePersonForCoach(coachId);
  if (personId) redirect(`/people/${personId}`);
  redirect("/people");
}

export async function updateCoachObjectiveAction(
  coachId: string,
  objectiveId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseCoachObjectiveForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await updateCoachObjective(objectiveId, parsed);
  if (error) return { error };

  const personId = await revalidatePersonForCoach(coachId);
  if (personId) {
    revalidatePath(`/people/${personId}/coach-objectives/${objectiveId}`);
    redirect(`/people/${personId}`);
  }
  redirect("/people");
}

export async function deleteCoachObjectiveAction(
  coachId: string,
  objectiveId: string,
): Promise<ActionState> {
  const { error } = await deleteCoachObjective(objectiveId);
  if (error) return { error };

  const personId = await revalidatePersonForCoach(coachId);
  if (personId) {
    revalidatePath(`/people/${personId}/coach-objectives/${objectiveId}`);
  }
  return { success: "Objective removed." };
}

export async function deleteCoachObjectiveAndReturnAction(
  coachId: string,
  objectiveId: string,
): Promise<ActionState> {
  const result = await deleteCoachObjectiveAction(coachId, objectiveId);
  if (result.error) return result;
  const personId = await revalidatePersonForCoach(coachId);
  if (personId) redirect(`/people/${personId}`);
  redirect("/people");
}
