"use server";

import { revalidatePath } from "next/cache";
import type { ActionState } from "@/lib/action-state";
import { getGuardian } from "@/lib/data/guardians";
import { addTeamMember, removeTeamMember } from "@/lib/data/members";
import { TEAM_ROLES } from "@/lib/constants";
import type { TeamRole } from "@/lib/supabase/database.types";
import { str } from "@/lib/form-parse";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function addTeamMemberAction(
  teamId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = str(formData, "user_id");
  const role = str(formData, "role") as TeamRole;

  if (!UUID_RE.test(userId)) {
    return { error: "Enter a valid Auth user UUID." };
  }
  if (!TEAM_ROLES.includes(role)) {
    return { error: "Select a valid role." };
  }

  const { error } = await addTeamMember({
    team_id: teamId,
    user_id: userId,
    role,
  });
  if (error) return { error };

  revalidatePath("/team");
  return { success: "Member added." };
}

export async function removeTeamMemberAction(id: string): Promise<ActionState> {
  const { error } = await removeTeamMember(id);
  if (error) return { error };

  revalidatePath("/team");
  return { success: "Member removed." };
}

export async function addGuardianAssistantAction(
  teamId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const guardianId = str(formData, "guardian_id");
  if (!guardianId) return { error: "Select a guardian." };

  const { data: guardian, error: loadError } = await getGuardian(guardianId);
  if (loadError) return { error: loadError };
  if (!guardian) return { error: "Guardian not found." };
  if (!guardian.user_id) {
    return {
      error:
        "That guardian has no linked login. Link a user account on the guardian page first.",
    };
  }

  const { error } = await addTeamMember({
    team_id: teamId,
    user_id: guardian.user_id,
    role: "guardian_assistant",
  });
  if (error) return { error };

  revalidatePath("/team");
  return { success: "Guardian assistant added." };
}

export async function removeGuardianAssistantAction(
  teamMemberId: string,
): Promise<ActionState> {
  const { error } = await removeTeamMember(teamMemberId);
  if (error) return { error };

  revalidatePath("/team");
  return { success: "Guardian assistant removed." };
}
