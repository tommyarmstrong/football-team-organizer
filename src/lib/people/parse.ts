import { str } from "@/lib/form-parse";
import { normalizeEmail } from "@/lib/people/person";

export type PersonFormFields = {
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
};

export type PersonFormParseResult = PersonFormFields | { error: string };

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

export function parseOptionalPersonProfile(
  formData: FormData,
): PersonFormParseResult {
  return parsePersonForm(formData);
}
