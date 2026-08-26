import { handleEmailAuthRequest } from "@/lib/auth/handle-email-auth";

/** PKCE email links (token_hash + type) as documented by Supabase Auth. */
export async function GET(request: Request) {
  return handleEmailAuthRequest(request, { requireToken: true });
}
