import { NextResponse } from "next/server";
import { verifySignedInPersonAccess } from "@/lib/auth/session-access";

export async function POST() {
  const result = await verifySignedInPersonAccess();
  return NextResponse.json(result, {
    status: result.error ? 403 : 200,
  });
}
