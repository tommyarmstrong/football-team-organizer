import { handleEmailAuthRequest } from "@/lib/auth/handle-email-auth";

export async function GET(request: Request) {
  return handleEmailAuthRequest(request);
}
