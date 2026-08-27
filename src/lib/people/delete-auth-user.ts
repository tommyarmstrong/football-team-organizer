import { createAdminClient } from "@/lib/supabase/admin";

export async function deleteAuthUserById(
  authUserId: string,
): Promise<{ error: string | null }> {
  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(authUserId);
    return { error: error?.message ?? null };
  } catch (err) {
    return {
      error:
        err instanceof Error
          ? err.message
          : "Could not delete auth user (service role key required).",
    };
  }
}
