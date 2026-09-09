import { NextResponse } from "next/server";
import {
  resolveSignedInClubColourHint,
  verifySignedInPersonAccess,
} from "@/lib/auth/session-access";
import {
  CLUB_COLOUR_HINT_COOKIE,
  CLUB_COLOUR_HINT_MAX_AGE_SECONDS,
} from "@/lib/clubs/colour-hint";

export const CLUB_COLOUR_LOOKUP_TIMEOUT_MS = 150;

export async function POST() {
  const access = await verifySignedInPersonAccess();
  if (access.error) {
    return NextResponse.json(access, { status: 403 });
  }

  const response = NextResponse.json({ error: null }, { status: 200 });
  response.headers.set("Cache-Control", "no-store");
  const colourLookup = await Promise.race([
    resolveSignedInClubColourHint()
      .then((colourHint) => ({ status: "ok" as const, colourHint }))
      .catch(() => ({ status: "error" as const })),
    new Promise<{ status: "timeout" }>((resolve) => {
      setTimeout(
        () => resolve({ status: "timeout" }),
        CLUB_COLOUR_LOOKUP_TIMEOUT_MS,
      );
    }),
  ]);

  if (colourLookup.status === "ok") {
    if (colourLookup.colourHint) {
      response.cookies.set(CLUB_COLOUR_HINT_COOKIE, colourLookup.colourHint, {
        path: "/",
        maxAge: CLUB_COLOUR_HINT_MAX_AGE_SECONDS,
        sameSite: "lax",
      });
    } else {
      response.cookies.set(CLUB_COLOUR_HINT_COOKIE, "", {
        path: "/",
        maxAge: 0,
        sameSite: "lax",
      });
    }
  }

  return response;
}
