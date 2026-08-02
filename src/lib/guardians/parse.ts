import { boolFromCheckbox, str } from "@/lib/form-parse";
import { GUARDIAN_RELATIONSHIPS } from "@/lib/constants";
import type { GuardianRelationship } from "@/lib/supabase/database.types";

export type GuardianFormFields = {
  first_name: string;
  second_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

export type GuardianFormParseResult = GuardianFormFields | { error: string };

export function parseGuardianForm(formData: FormData): GuardianFormParseResult {
  const first_name = str(formData, "first_name");
  const second_name = str(formData, "second_name");
  const phone = str(formData, "phone") || null;
  const email = str(formData, "email") || null;
  const notes = str(formData, "notes") || null;

  if (!first_name || !second_name) {
    return { error: "First and second name are required." };
  }

  return { first_name, second_name, phone, email, notes };
}

export function parseGuardianRelationship(
  formData: FormData,
): GuardianRelationship | { error: string } {
  const relationship = str(formData, "relationship") as GuardianRelationship;
  if (!GUARDIAN_RELATIONSHIPS.includes(relationship)) {
    return { error: "Select a relationship." };
  }
  return relationship;
}

export function parseLegalGuardian(formData: FormData): boolean {
  return boolFromCheckbox(formData, "legal_guardian");
}

export function parseEmergencyContact(formData: FormData): boolean {
  return boolFromCheckbox(formData, "emergency_contact");
}
