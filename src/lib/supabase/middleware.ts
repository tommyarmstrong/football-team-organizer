import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

const PUBLIC_PATHS = new Set(["/login"]);
const MEMBERSHIP_EXEMPT_PATHS = new Set(["/login", "/no-access"]);

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.has(pathname);
}

function isMembershipExemptPath(pathname: string) {
  return MEMBERSHIP_EXEMPT_PATHS.has(pathname);
}

async function userHasTeamMembership(
  supabase: ReturnType<typeof createServerClient<Database>>,
  userId: string,
) {
  const { count, error } = await supabase
    .from("team_members")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return !error && (count ?? 0) > 0;
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

  // Refresh the auth session; do not remove this call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && !isPublicPath(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    if (pathname !== "/" && pathname !== "/no-access") {
      redirectUrl.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (user) {
    const hasTeam = await userHasTeamMembership(supabase, user.id);

    if (!hasTeam && !isMembershipExemptPath(pathname)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/no-access";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (
      hasTeam &&
      (pathname === "/login" || pathname === "/" || pathname === "/no-access")
    ) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/dashboard";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }

    if (!hasTeam && pathname === "/login") {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = "/no-access";
      redirectUrl.search = "";
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}
