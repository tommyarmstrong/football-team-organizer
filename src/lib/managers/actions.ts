"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { canManageClub, getViewerContext } from "@/lib/authz/context";
import {
  createManager,
  deleteManager,
  getManager,
  updateManager,
} from "@/lib/data/managers";
import { deletePerson } from "@/lib/data/people";
import { getPrimaryClub } from "@/lib/data/clubs";
import { parseManagerForm } from "@/lib/managers/parse";

function revalidateManager(managerId?: string) {
  revalidatePath("/club");
  if (managerId) revalidatePath(`/managers/${managerId}`);
  revalidatePath("/", "layout");
}

export async function createManagerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const club = await getPrimaryClub();
  if (!club || !canManageClub(ctx, club.id)) {
    return { error: "Only club management can add managers." };
  }

  const parsed = parseManagerForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { data, error } = await createManager({
    club_id: club.id,
    ...parsed,
  });
  if (error) return { error };
  if (!data) return { error: "Could not create manager." };

  revalidateManager(data.id);
  redirect(`/managers/${data.id}`);
}

export async function updateManagerAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const { data: existing, error: loadError } = await getManager(id);
  if (loadError) return { error: loadError };
  if (!existing) return { error: "Manager not found." };
  if (!canManageClub(ctx, existing.club_id)) {
    return { error: "Only club management can edit managers." };
  }

  const parsed = parseManagerForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await updateManager(id, parsed);
  if (error) return { error };

  revalidateManager(id);
  redirect(`/managers/${id}`);
}

export async function deleteManagerAction(id: string): Promise<ActionState> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const { data: existing, error: loadError } = await getManager(id);
  if (loadError) return { error: loadError };
  if (!existing) return { error: "Manager not found." };
  if (!canManageClub(ctx, existing.club_id)) {
    return { error: "Only club management can delete managers." };
  }
  if (existing.user_id && existing.user_id === ctx.userId) {
    return { error: "You cannot delete your own manager record." };
  }

  // Soft-delete the person (account_status=disabled), same as deleting a guardian.
  if (existing.person_id) {
    const { error } = await deletePerson(existing.person_id);
    if (error) return { error };
  } else {
    const { error } = await deleteManager(id);
    if (error) return { error };
  }

  revalidateManager();
  revalidatePath("/people");
  redirect("/people");
}
