import { str } from "@/lib/form-parse";

export type ManagerFormFields = {
  first_name: string;
  second_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
};

export type ManagerFormParseResult = ManagerFormFields | { error: string };

export function parseManagerForm(formData: FormData): ManagerFormParseResult {
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
