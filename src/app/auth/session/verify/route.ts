import { NextResponse } from "next/server";
import { verifySignedInPersonAccess } from "@/lib/auth/session-access";

/**
 * GET /auth/session/verify?next=<path>
 *
 * Server-side access check called after a successful `signInWithPassword` on
 * the client. Replaces the client-initiated POST to /auth/session/bootstrap,
 * removing one browser↔server round-trip from the login critical path (§1.1).
 *
 * The middleware already handles `has_app_access` (and caches it via the
 * fto_access cookie — §3.1) and the club colour cookie (§2.1). This route only
 * needs to verify the person-level account_status before redirecting the user
 * to their destination.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const next = searchParams.get("next") ?? "/dashboard";
  // Guard against open redirects — only allow same-origin relative paths.
  const safeNext = next.startsWith("/") ? next : "/dashboard";

  const access = await verifySignedInPersonAccess();
  if (access.error) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", access.error);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.redirect(new URL(safeNext, origin));
}
