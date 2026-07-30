"use server";

import { revalidatePath } from "next/cache";
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
import { parseVenueForm } from "@/lib/venues/parse";

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

function revalidateVenue(venueId?: string) {
  revalidatePath("/venues");
  if (venueId) {
    revalidatePath(`/venues/${venueId}`);
    revalidatePath(`/venues/${venueId}/edit`);
  }
  revalidatePath("/team");
  revalidatePath("/team/edit");
  revalidatePath("/teams/new");
}

export async function createVenueAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const club = await getPrimaryClub();
  if (!club || !canEditVenues(ctx, club.id)) {
    return { error: "Only coaches and club management can add venues." };
  }

  const parsed = parseVenueForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { data, error } = await createVenue({
    club_id: club.id,
    ...parsed,
  });
  if (error) return { error };
  if (!data) return { error: "Could not create venue." };

  revalidateVenue(data.id);
  redirect(`/venues/${data.id}`);
}

export async function updateVenueAction(
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

  const { error } = await updateVenue(id, parsed);
  if (error) return { error };

  revalidateVenue(id);
  return { success: "Venue saved." };
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

  revalidateVenue();
  redirect("/venues");
}
