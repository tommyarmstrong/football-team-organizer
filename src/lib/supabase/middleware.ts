import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isMembershipExemptPath,
  isPasswordSetupPath,
  isPublicPath,
  parsePasswordSetupKind,
  PASSWORD_SETUP_COOKIE,
  passwordSetupDestination,
} from "@/lib/auth/paths";
import type { Database } from "@/lib/supabase/database.types";
import {
  CLUB_COLOUR_HINT_COOKIE,
  CLUB_COLOUR_HINT_MAX_AGE_SECONDS,
  parseClubColourHint,
} from "@/lib/clubs/colour-hint";

/**
 * Cookie that caches the result of `has_app_access` so we skip the Postgres
 * RPC on every request for known-good sessions (§3.1). It is what lets a
 * signed-in user through to the data tables.
 */
export const FTO_ACCESS_COOKIE = "fto_access";
/** 90 minutes. */
export const FTO_ACCESS_MAX_AGE = 90 * 60;

async function userHasAppAccess(
  supabase: ReturnType<typeof createServerClient<Database>>,
) {
  const { data, error } = await supabase.rpc("has_app_access");
  return !error && data === true;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Env missing — allow through so misconfig is visible in the UI/logs.
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // §3.1 — Check the cached access cookie before firing any network calls.
  const cachedAccess = request.cookies.get(FTO_ACCESS_COOKIE)?.value === "1";

  // §3.2 — getUser() and has_app_access are independent: both rely only on the
  // session cookies already present in the incoming request. Fire them
  // concurrently so their latencies overlap rather than stack sequentially.
  // When the access cookie is present (§3.1) the RPC is replaced with an
  // already-resolved promise, leaving only the mandatory getUser() call.
  const [
    {
      data: { user },
    },
    hasTeamFromRpc,
  ] = await Promise.all([
    supabase.auth.getUser(), // always required — do not remove this call
    cachedAccess ? Promise.resolve(true) : userHasAppAccess(supabase),
  ]);

  const { pathname } = request.nextUrl;
  const setupKind = parsePasswordSetupKind(
    request.cookies.get(PASSWORD_SETUP_COOKIE)?.value,
  );

  if (!user && !isPublicPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    if (pathname !== "/" && pathname !== "/no-access") {
      redirectUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (user && setupKind && !isPasswordSetupPath(pathname, setupKind)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = passwordSetupDestination(setupKind);
    redirectUrl.search = "";
    return NextResponse.redirect(redirectUrl);
  }

  if (user) {
    const hasTeam = cachedAccess || hasTeamFromRpc;

    if (!hasTeam && !isMembershipExemptPath(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/no-access";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (
      hasTeam &&
      !setupKind &&
      (pathname === "/login" ||
        pathname === "/" ||
        pathname === "/no-access" ||
        pathname === "/auth/invite" ||
        pathname === "/auth/forgot-password")
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      redirectUrl.search = "";
      const res = NextResponse.redirect(redirectUrl);
      // Carry the access cookie through the redirect so the next request is cached.
      if (!cachedAccess && hasTeam) {
        res.cookies.set(FTO_ACCESS_COOKIE, "1", {
          path: "/",
          maxAge: FTO_ACCESS_MAX_AGE,
          sameSite: "lax",
          httpOnly: true,
        });
      }
      return res;
    }

    if (!hasTeam && pathname === "/login") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/no-access";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    // Persist the access result on pass-through responses.
    if (!cachedAccess && hasTeam) {
      supabaseResponse.cookies.set(FTO_ACCESS_COOKIE, "1", {
        path: "/",
        maxAge: FTO_ACCESS_MAX_AGE,
        sameSite: "lax",
        httpOnly: true,
      });
    }

    // §2.1 — Set the club colour cookie in middleware so layout.tsx can apply
    // the correct colour on the very first byte of HTML, eliminating the flash
    // of default colour that occurred before ClubColourBinder hydrated.
    if (hasTeam) {
      const existingColour = request.cookies.get(
        CLUB_COLOUR_HINT_COOKIE,
      )?.value;
      if (!existingColour || !parseClubColourHint(existingColour)) {
        try {
          const { data: club } = await supabase
            .from("clubs")
            .select("colour")
            .order("name", { ascending: true })
            .limit(1)
            .maybeSingle();
          const colour = parseClubColourHint(club?.colour ?? null);
          if (colour) {
            supabaseResponse.cookies.set(CLUB_COLOUR_HINT_COOKIE, colour, {
              path: "/",
              maxAge: CLUB_COLOUR_HINT_MAX_AGE_SECONDS,
              sameSite: "lax",
            });
          }
        } catch {
          // Non-fatal — ClubColourBinder will set the cookie client-side on
          // the next render if the colour lookup fails here.
        }
      }
    }
  }

  return supabaseResponse;
}
