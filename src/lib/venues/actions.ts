"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { getViewerContext } from "@/lib/authz/context";
import {
  createVenue,
  deleteVenue,
  getVenue,
  updateVenue,
} from "@/lib/data/venues";
import { getPrimaryClub } from "@/lib/data/clubs";
import { VENUE_PHOTOS_BUCKET } from "@/lib/constants";
import { str } from "@/lib/form-parse";
import { createClient } from "@/lib/supabase/server";
import { parseVenueForm } from "@/lib/venues/parse";
import { validateVenuePhoto, venuePhotoStoragePath } from "@/lib/venues/photo";
import { processVenuePhoto } from "@/lib/venues/process-photo";

function canEditVenues(
  ctx: NonNullable<Awaited<ReturnType<typeof getViewerContext>>>,
  clubId: string,
): boolean {
  return (
    ctx.managementClubIds.includes(clubId) ||
    ctx.visibleTeams.some(
      (team) => team.club_id === clubId && ctx.coachTeamIds.includes(team.id),
    )
  );
}

function revalidateVenue(venueId?: string, clubId?: string) {
  if (clubId) updateTag(`venues:${clubId}`);
  revalidatePath("/venues");
  if (venueId) {
    revalidatePath(`/venues/${venueId}`);
    revalidatePath(`/venues/${venueId}/edit`);
  }
  revalidatePath("/team");
  revalidatePath("/team/edit");
  revalidatePath("/teams/new");
}

async function uploadVenuePhoto(
  clubId: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  const invalid = validateVenuePhoto(file);
  if (invalid) return { error: invalid };

  // Resize, compress and strip all metadata (EXIF/GPS etc.) before storing.
  let processed: Awaited<ReturnType<typeof processVenuePhoto>>;
  try {
    processed = await processVenuePhoto(
      new Uint8Array(await file.arrayBuffer()),
    );
  } catch {
    return { error: "That file could not be read as an image." };
  }

  const supabase = await createClient();
  const path = `${clubId}/${crypto.randomUUID()}.${processed.extension}`;

  const { error: uploadError } = await supabase.storage
    .from(VENUE_PHOTOS_BUCKET)
    .upload(path, processed.bytes, {
      contentType: processed.contentType,
      upsert: false,
    });
  if (uploadError) return { error: uploadError.message };

  const { data } = supabase.storage
    .from(VENUE_PHOTOS_BUCKET)
    .getPublicUrl(path);
  return { url: data.publicUrl };
}

/** Best-effort removal of a replaced or cleared photo; never fails the save. */
async function removeVenuePhoto(photoUrl: string | null | undefined) {
  const path = venuePhotoStoragePath(photoUrl);
  if (!path) return;
  try {
    const supabase = await createClient();
    await supabase.storage.from(VENUE_PHOTOS_BUCKET).remove([path]);
  } catch {
    // An orphaned file is harmless; the venue save already succeeded.
  }
}

/**
 * Work out the `photo_url` to store from the form: a new upload replaces the
 * current photo, and `clear_photo=true` removes it.
 */
async function resolveVenuePhoto(
  clubId: string,
  currentUrl: string | null,
  formData: FormData,
): Promise<{ photoUrl: string | null } | { error: string }> {
  let photoUrl = currentUrl;
  if (str(formData, "clear_photo") === "true") photoUrl = null;

  const entry = formData.get("photo");
  if (entry instanceof File && entry.size > 0) {
    const uploaded = await uploadVenuePhoto(clubId, entry);
    if ("error" in uploaded) return { error: uploaded.error };
    photoUrl = uploaded.url;
  }
  return { photoUrl };
}

async function createVenueRecord(
  formData: FormData,
): Promise<{ error: string } | { id: string }> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const club = await getPrimaryClub();
  if (!club || !canEditVenues(ctx, club.id)) {
    return { error: "Only coaches and club management can add venues." };
  }

  const parsed = parseVenueForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const photo = await resolveVenuePhoto(club.id, null, formData);
  if ("error" in photo) return { error: photo.error };

  const { data, error } = await createVenue({
    club_id: club.id,
    ...parsed,
    photo_url: photo.photoUrl,
  });
  if (error) {
    await removeVenuePhoto(photo.photoUrl);
    return { error };
  }
  if (!data) {
    await removeVenuePhoto(photo.photoUrl);
    return { error: "Could not create venue." };
  }

  revalidateVenue(data.id, club.id);
  return { id: data.id };
}

export async function createVenueOnPageAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await createVenueRecord(formData);
  if ("error" in result) return result;
  return { success: "Venue added." };
}

export async function createVenueAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await createVenueRecord(formData);
  if ("error" in result) return result;
  redirect(`/venues/${result.id}`);
}

export async function updateVenueOnPageAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const { data: existing, error: loadError } = await getVenue(id);
  if (loadError) return { error: loadError };
  if (!existing) return { error: "Venue not found." };
  if (!canEditVenues(ctx, existing.club_id)) {
    return { error: "Only coaches and club management can edit venues." };
  }

  const parsed = parseVenueForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const photo = await resolveVenuePhoto(
    existing.club_id,
    existing.photo_url,
    formData,
  );
  if ("error" in photo) return { error: photo.error };

  const { error } = await updateVenue(id, {
    ...parsed,
    photo_url: photo.photoUrl,
  });
  if (error) {
    if (photo.photoUrl !== existing.photo_url) {
      await removeVenuePhoto(photo.photoUrl);
    }
    return { error };
  }
  if (photo.photoUrl !== existing.photo_url) {
    await removeVenuePhoto(existing.photo_url);
  }

  revalidateVenue(id, existing.club_id);
  return { success: "Venue saved." };
}

export async function updateVenueAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const result = await updateVenueOnPageAction(id, _prev, formData);
  if (result.error) return result;
  redirect(`/venues/${id}`);
}

export async function deleteVenueAction(id: string): Promise<ActionState> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const { data: existing, error: loadError } = await getVenue(id);
  if (loadError) return { error: loadError };
  if (!existing) return { error: "Venue not found." };
  if (!canEditVenues(ctx, existing.club_id)) {
    return { error: "Only coaches and club management can delete venues." };
  }

  const { error } = await deleteVenue(id);
  if (error) return { error };
  await removeVenuePhoto(existing.photo_url);

  revalidateVenue(undefined, existing.club_id);
  redirect("/venues");
}
