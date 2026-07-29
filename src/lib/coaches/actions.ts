"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import {
  addCoachToTeam,
  createCoach,
  deleteCoach,
  removeCoachFromTeam,
  updateCoach,
} from "@/lib/data/coaches";
import { resolveStaffClubId } from "@/lib/data/clubs";
import { getActiveTeam } from "@/lib/data/team";
import { parseCoachForm } from "@/lib/coaches/parse";
import { str } from "@/lib/form-parse";

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

  revalidatePath("/coaches");
  redirect(`/coaches/${data.id}`);
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

  revalidatePath("/coaches");
  revalidatePath(`/coaches/${id}`);
  return { success: "Coach saved." };
}

export async function deleteCoachAction(id: string): Promise<ActionState> {
  const { error } = await deleteCoach(id);
  if (error) return { error };

  revalidatePath("/coaches");
  redirect("/coaches");
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

  revalidatePath(`/coaches/${coachId}`);
  revalidatePath("/coaches");
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

  revalidatePath(`/coaches/${data.id}`);
  revalidatePath("/coaches");
  revalidatePath("/team");
  return { success: "Coach added to team." };
}

export async function removeCoachFromTeamAction(
  teamCoachId: string,
  coachId: string,
): Promise<ActionState> {
  const { error } = await removeCoachFromTeam(teamCoachId);
  if (error) return { error };

  revalidatePath(`/coaches/${coachId}`);
  revalidatePath("/coaches");
  revalidatePath("/team");
  return { success: "Coach removed from team." };
}
