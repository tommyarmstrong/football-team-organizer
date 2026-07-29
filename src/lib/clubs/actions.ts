"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { createClub } from "@/lib/data/clubs";
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
