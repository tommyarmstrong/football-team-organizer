export function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export function boolFromCheckbox(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
}

export type GoalKindFlags = {
  is_penalty: boolean;
  is_freekick: boolean;
  from_setpiece: boolean;
};

/** Parse mutually exclusive goal kind from a radio/select named `goal_kind`. */
export function parseGoalKind(
  formData: FormData,
): GoalKindFlags | { error: string } {
  const raw = str(formData, "goal_kind");
  if (!raw || raw === "none") {
    return { is_penalty: false, is_freekick: false, from_setpiece: false };
  }
  if (raw === "penalty") {
    return { is_penalty: true, is_freekick: false, from_setpiece: false };
  }
  if (raw === "freekick") {
    return { is_penalty: false, is_freekick: true, from_setpiece: false };
  }
  if (raw === "setpiece") {
    return { is_penalty: false, is_freekick: false, from_setpiece: true };
  }
  return { error: "Invalid goal type." };
}

export function goalKindFromFlags(flags: GoalKindFlags): string {
  if (flags.is_penalty) return "penalty";
  if (flags.is_freekick) return "freekick";
  if (flags.from_setpiece) return "setpiece";
  return "none";
}

export function parseOptionalInt(
  raw: string,
  label: string,
): number | null | { error: string } {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) {
    return { error: `${label} must be zero or a positive whole number.` };
  }
  return n;
}

export function parseShirtNumber(
  raw: string,
): number | null | { error: string } {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1) {
    return { error: "Shirt number must be a positive whole number." };
  }
  return n;
}

export function parseOptionalMinute(
  raw: string,
): number | null | { error: string } {
  if (!raw) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > 120) {
    return { error: "Minute must be between 0 and 120." };
  }
  return n;
}

export function parseYesNo(
  formData: FormData,
  key: string,
  defaultValue = false,
): boolean {
  const raw = str(formData, key).toLowerCase();
  if (raw === "yes" || raw === "true") return true;
  if (raw === "no" || raw === "false") return false;
  return defaultValue;
}
