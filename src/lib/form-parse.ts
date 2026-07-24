export function str(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

export function boolFromCheckbox(formData: FormData, key: string): boolean {
  return formData.get(key) === "on" || formData.get(key) === "true";
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
