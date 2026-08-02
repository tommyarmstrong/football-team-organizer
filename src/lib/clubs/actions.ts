"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { canManageClub, getViewerContext } from "@/lib/authz/context";
import { createClub, getClub, updateClub } from "@/lib/data/clubs";
import {
  CLUB_ICON_MAX_BYTES,
  CLUB_ICON_MIME_TYPES,
  clubIconExtension,
  parseClubColour,
} from "@/lib/clubs/branding";
import { CLUB_ICONS_BUCKET } from "@/lib/constants";
import { parseOptionalInt, str } from "@/lib/form-parse";
import { createClient } from "@/lib/supabase/server";

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

async function uploadClubIcon(
  clubId: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  if (!CLUB_ICON_MIME_TYPES.has(file.type)) {
    return {
      error: "Icon must be a PNG, JPEG, WebP, GIF, or SVG image.",
    };
  }
  if (file.size > CLUB_ICON_MAX_BYTES) {
    return { error: "Icon must be 512 KB or smaller." };
  }

  const ext = clubIconExtension(file.type);
  if (!ext) return { error: "Unsupported icon file type." };

  const supabase = await createClient();
  const path = `${clubId}/${crypto.randomUUID()}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(CLUB_ICONS_BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage.from(CLUB_ICONS_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl };
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
  const about = str(formData, "about") || null;
  const clearIcon = str(formData, "clear_icon") === "true";
  const clearColour = str(formData, "clear_colour") === "true";

  if (!id) return { error: "Club is required." };
  if (!name) return { error: "Club name is required." };
  if (!canManageClub(ctx, id)) {
    return { error: "Only club management can edit the club." };
  }

  const establishedRaw = str(formData, "established");
  const establishedParsed = parseOptionalInt(
    establishedRaw,
    "Established year",
  );
  if (
    establishedParsed &&
    typeof establishedParsed === "object" &&
    "error" in establishedParsed
  ) {
    return { error: establishedParsed.error };
  }
  if (
    establishedParsed != null &&
    (establishedParsed < 1800 || establishedParsed > 2100)
  ) {
    return { error: "Established year must be between 1800 and 2100." };
  }
  const established = establishedParsed;

  const { data: existing, error: loadError } = await getClub(id);
  if (loadError) return { error: loadError };
  if (!existing) return { error: "Club not found." };

  let colour = existing.colour;
  if (clearColour) {
    colour = null;
  } else {
    const parsed = parseClubColour(str(formData, "colour"));
    if (parsed && typeof parsed === "object" && "error" in parsed) {
      return { error: parsed.error };
    }
    colour = parsed;
  }

  let iconUrl = existing.icon_url;
  if (clearIcon) {
    iconUrl = null;
  }

  const iconEntry = formData.get("icon");
  if (iconEntry instanceof File && iconEntry.size > 0) {
    const uploaded = await uploadClubIcon(id, iconEntry);
    if ("error" in uploaded) return { error: uploaded.error };
    iconUrl = uploaded.url;
  }

  const { error } = await updateClub(id, {
    name,
    website,
    email,
    phone,
    icon_url: iconUrl,
    colour,
    established,
    about,
  });
  if (error) return { error };

  revalidatePath("/club");
  revalidatePath("/club/edit");
  revalidatePath("/", "layout");
  return { success: "Club saved." };
}
