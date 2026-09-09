import { isValidClubColour } from "@/lib/clubs/branding";

export const CLUB_COLOUR_HINT_COOKIE = "club_colour_hint";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function parseClubColourHint(
  value: string | null | undefined,
): string | null {
  if (!value) return null;
  const normalised = value.trim().toUpperCase();
  return isValidClubColour(normalised) ? normalised : null;
}

export function buildClubColourHintCookie(colour: string): string {
  return `${CLUB_COLOUR_HINT_COOKIE}=${colour}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
}

export function clearClubColourHintCookie(): string {
  return `${CLUB_COLOUR_HINT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
