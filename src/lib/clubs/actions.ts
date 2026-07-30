"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { canManageClub, getViewerContext } from "@/lib/authz/context";
import { createClub, updateClub } from "@/lib/data/clubs";
import { str } from "@/lib/form-parse";

export async function createClubAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = str(formData, "name");
  if (!name) return { error: "Club name is required." };

  const { error } = await createClub(name);
  if (error) return { error };

  revalidatePath("/", "layout");
  redirect("/team");
}

export async function updateClubAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const id = str(formData, "id");
  const name = str(formData, "name");
  const website = str(formData, "website") || null;
  const email = str(formData, "email") || null;
  const phone = str(formData, "phone") || null;
  if (!id) return { error: "Club is required." };
  if (!name) return { error: "Club name is required." };
  if (!canManageClub(ctx, id)) {
    return { error: "Only club management can edit the club." };
  }

  const { error } = await updateClub(id, { name, website, email, phone });
  if (error) return { error };

  revalidatePath("/club");
  revalidatePath("/", "layout");
  return { success: "Club saved." };
}
