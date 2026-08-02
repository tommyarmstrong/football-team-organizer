import { str } from "@/lib/form-parse";
import { normalizeEmail } from "@/lib/people/person";
import { PLAYER_POSITIONS } from "@/lib/constants";

export type PersonFormFields = {
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
};

export type PersonPlayerFormFields = {
  player_id: string;
  date_of_birth: string | null;
  position: string | null;
  school: string | null;
};

export type PersonFormParseResult = PersonFormFields | { error: string };

export type PersonPlayerFormParseResult =
  PersonPlayerFormFields | { error: string } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parsePersonForm(formData: FormData): PersonFormParseResult {
  const first_name = str(formData, "first_name");
  const last_name = str(formData, "last_name") || str(formData, "second_name");
  const phone = str(formData, "phone") || null;
  const rawEmail = str(formData, "email");
  const email = rawEmail ? normalizeEmail(rawEmail) : null;

  if (!first_name || !last_name) {
    return { error: "First and last name are required." };
  }
  if (email && !EMAIL_RE.test(email)) {
    return { error: "Enter a valid email address." };
  }

  return { first_name, last_name, email, phone };
}

export function parsePersonPlayerForm(
  formData: FormData,
): PersonPlayerFormParseResult {
  const player_id = str(formData, "player_id");
  if (!player_id) return null;

  const date_of_birth = str(formData, "date_of_birth") || null;
  const position = str(formData, "position") || null;
  const school = str(formData, "school") || null;

  if (position && !(PLAYER_POSITIONS as readonly string[]).includes(position)) {
    return { error: "Select a valid position." };
  }

  if (date_of_birth && !/^\d{4}-\d{2}-\d{2}$/.test(date_of_birth)) {
    return { error: "Enter a valid date of birth." };
  }

  return { player_id, date_of_birth, position, school };
}

export function parseOptionalPersonProfile(
  formData: FormData,
): PersonFormParseResult {
  return parsePersonForm(formData);
}
