import { boolFromCheckbox, str } from "@/lib/form-parse";

export type CoachFormFields = {
  first_name: string;
  second_name: string;
  joined_date: string;
  date_of_birth: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  biography: string | null;
  philosophy: string | null;
  dbs_checked: boolean;
  fa_level_1: boolean;
  fa_level_2: boolean;
};

export type CoachFormParseResult = CoachFormFields | { error: string };

export function parseCoachForm(formData: FormData): CoachFormParseResult {
  const first_name = str(formData, "first_name");
  const second_name = str(formData, "second_name");
  const joined_date = str(formData, "joined_date");
  const date_of_birth = str(formData, "date_of_birth") || null;
  const phone = str(formData, "phone") || null;
  const email = str(formData, "email") || null;
  const notes = str(formData, "notes") || null;
  const biography = str(formData, "biography") || null;
  const philosophy = str(formData, "philosophy") || null;
  const dbs_checked = boolFromCheckbox(formData, "dbs_checked");
  const fa_level_1 = boolFromCheckbox(formData, "fa_level_1");
  const fa_level_2 = boolFromCheckbox(formData, "fa_level_2");

  if (!first_name || !second_name) {
    return { error: "First and second name are required." };
  }
  if (!joined_date) {
    return { error: "Joined date is required." };
  }

  return {
    first_name,
    second_name,
    joined_date,
    date_of_birth,
    phone,
    email,
    notes,
    biography,
    philosophy,
    dbs_checked,
    fa_level_1,
    fa_level_2,
  };
}
