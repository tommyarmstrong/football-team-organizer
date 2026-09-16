import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static assets, image URLs, and routes that exchange their own
  // session (§3.3). Dynamic image routes must not use a .png/.svg suffix or
  // they bypass session refresh (see match postcards).
  //
  // /auth/callback and /auth/confirm handle the Auth code exchange themselves.
  // Remaining /auth/* paths (invite, forgot-password, session/verify) still
  // need middleware for logged-in redirects and post-login cookies.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api(?:/|$)|auth/callback|auth/confirm|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
