"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import {
  createPlayer,
  deactivatePlayer,
  updatePlayer,
} from "@/lib/data/players";

function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

function parseShirtNumber(raw: string): number | null | { error: string } {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    return { error: "Shirt number must be a positive whole number." };
  }
  return n;
}

export async function createPlayerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const first_name = str(formData, "first_name");
  const last_name = str(formData, "last_name");
  const position = str(formData, "position") || null;
  const shirt = parseShirtNumber(str(formData, "shirt_number"));

  if (!first_name || !last_name) {
    return { error: "First and last name are required." };
  }
  if (shirt && typeof shirt === "object" && "error" in shirt) {
    return { error: shirt.error };
  }

  const { data, error } = await createPlayer({
    first_name,
    last_name,
    position,
    shirt_number: shirt as number | null,
    active: true,
  });

  if (error) return { error };
  if (!data) return { error: "Could not create player." };

  revalidatePath("/players");
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  redirect(`/players/${data.id}`);
}

export async function updatePlayerAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const first_name = str(formData, "first_name");
  const last_name = str(formData, "last_name");
  const position = str(formData, "position") || null;
  const shirt = parseShirtNumber(str(formData, "shirt_number"));
  const active = str(formData, "active") === "true";

  if (!first_name || !last_name) {
    return { error: "First and last name are required." };
  }
  if (shirt && typeof shirt === "object" && "error" in shirt) {
    return { error: shirt.error };
  }

  const { error } = await updatePlayer(id, {
    first_name,
    last_name,
    position,
    shirt_number: shirt as number | null,
    active,
  });

  if (error) return { error };

  revalidatePath("/players");
  revalidatePath(`/players/${id}`);
  revalidatePath("/dashboard");
  revalidatePath("/stats");
  return { success: "Player saved." };
}

export async function deactivatePlayerAction(id: string): Promise<ActionState> {
  const { error } = await deactivatePlayer(id);
  if (error) return { error };

  revalidatePath("/players");
  revalidatePath(`/players/${id}`);
  revalidatePath("/dashboard");
  return { success: "Player deactivated." };
}
