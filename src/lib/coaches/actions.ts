"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { createCoach, deleteCoach, updateCoach } from "@/lib/data/coaches";
import { parseCoachForm } from "@/lib/coaches/parse";

export async function createCoachAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = parseCoachForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { data, error } = await createCoach(parsed);

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
