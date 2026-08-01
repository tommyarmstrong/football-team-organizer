"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/action-state";
import { canManageClub, getViewerContext } from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import {
  createPerson,
  getPerson,
  linkRoleToPerson,
  updatePerson,
} from "@/lib/data/people";
import { sendPersonInvitation } from "@/lib/people/invitations";
import { parsePersonForm } from "@/lib/people/parse";
import { str } from "@/lib/form-parse";

function revalidatePeople(personId?: string) {
  revalidatePath("/people");
  revalidatePath("/club");
  if (personId) revalidatePath(`/people/${personId}`);
}

export async function createPersonAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const club = await getPrimaryClub();
  if (!club || !canManageClub(ctx, club.id)) {
    return { error: "Only club management can create people." };
  }

  const parsed = parsePersonForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { data, error } = await createPerson({
    ...parsed,
    account_status: "none",
  });
  if (error) return { error };
  if (!data) return { error: "Could not create person." };

  revalidatePeople(data.id);
  redirect(`/people/${data.id}`);
}

export async function updatePersonAction(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const { data: existing, error: loadError } = await getPerson(id);
  if (loadError) return { error: loadError };
  if (!existing) return { error: "Person not found." };

  const club = await getPrimaryClub();
  const isSelf = existing.auth_user_id === ctx.userId;
  const isAdmin = club ? canManageClub(ctx, club.id) : false;
  if (!isSelf && !isAdmin) {
    return { error: "You cannot edit this person." };
  }

  const parsed = parsePersonForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await updatePerson(id, parsed);
  if (error) return { error };

  revalidatePeople(id);
  return { success: "Person saved." };
}

export async function linkRoleToPersonAction(
  personId: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const club = await getPrimaryClub();
  if (!club || !canManageClub(ctx, club.id)) {
    return { error: "Only club management can assign roles." };
  }

  const role = str(formData, "role") as
    "manager" | "coach" | "guardian" | "player";
  const roleId = str(formData, "role_id");
  if (!["manager", "coach", "guardian", "player"].includes(role)) {
    return { error: "Select a valid role type." };
  }
  if (!roleId) return { error: "Select a role record." };

  const { error } = await linkRoleToPerson({ personId, role, roleId });
  if (error) return { error };

  revalidatePeople(personId);
  return { success: "Role linked to person." };
}

export async function sendInvitationAction(
  personId: string,
): Promise<ActionState> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const club = await getPrimaryClub();
  if (!club || !canManageClub(ctx, club.id)) {
    return { error: "Only club management can send invitations." };
  }

  const { data: person, error: loadError } = await getPerson(personId);
  if (loadError) return { error: loadError };
  if (!person) return { error: "Person not found." };

  try {
    const result = await sendPersonInvitation({
      person,
      invitedBy: ctx.userId,
    });
    if (!result.ok) return { error: result.error };

    revalidatePeople(personId);
    if (result.emailSent) {
      return { success: "Invitation sent." };
    }

    const link = result.acceptUrl
      ? ` Share this accept link: ${result.acceptUrl}`
      : "";

    if (result.alreadyRegistered) {
      return {
        success: `Invitation created. An Auth account already exists for this email, so Supabase cannot send another invite email.${link}`,
      };
    }

    const reason = result.emailError
      ? ` Supabase reported: ${result.emailError}`
      : " Email delivery via Supabase may need configuration.";
    return {
      success: `Invitation created, but the email was not sent.${reason}${link}`,
    };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Could not send invitation (service role key required).",
    };
  }
}

export async function completePersonProfileAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const ctx = await getViewerContext();
  if (!ctx) return { error: "Not signed in." };

  const personId = str(formData, "person_id");
  if (!personId) return { error: "Person is required." };

  const { data: existing, error: loadError } = await getPerson(personId);
  if (loadError) return { error: loadError };
  if (!existing) return { error: "Person not found." };
  if (existing.auth_user_id !== ctx.userId) {
    return { error: "You can only complete your own profile." };
  }

  const parsed = parsePersonForm(formData);
  if ("error" in parsed) return { error: parsed.error };

  const { error } = await updatePerson(personId, {
    phone: parsed.phone,
    first_name: parsed.first_name,
    last_name: parsed.last_name,
  });
  if (error) return { error };

  revalidatePeople(personId);
  redirect("/dashboard");
}
