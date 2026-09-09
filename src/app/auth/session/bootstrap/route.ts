import { NextResponse } from "next/server";
import {
  resolveSignedInClubColourHint,
  verifySignedInPersonAccess,
} from "@/lib/auth/session-access";
import {
  CLUB_COLOUR_HINT_COOKIE,
  CLUB_COLOUR_HINT_MAX_AGE_SECONDS,
} from "@/lib/clubs/colour-hint";

export async function POST() {
  const access = await verifySignedInPersonAccess();
  if (access.error) {
    return NextResponse.json(access, { status: 403 });
  }

  const colourHint = await resolveSignedInClubColourHint();
  const response = NextResponse.json({ error: null }, { status: 200 });
  response.headers.set("Cache-Control", "no-store");

  if (colourHint) {
    response.cookies.set(CLUB_COLOUR_HINT_COOKIE, colourHint, {
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

  return response;
}
