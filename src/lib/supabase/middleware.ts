import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  isMembershipExemptPath,
  isPasswordSetupPath,
  isPublicPath,
  PASSWORD_SETUP_COOKIE,
  passwordSetupDestination,
  type PasswordSetupKind,
} from "@/lib/auth/paths";
import type { Database } from "@/lib/supabase/database.types";

function parsePasswordSetupKind(
  value: string | undefined,
): PasswordSetupKind | null {
  if (value === "invite" || value === "recovery") return value;
  return null;
}

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

  // Refresh the auth session; do not remove this call.
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    const hasTeam = await userHasAppAccess(supabase);

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
