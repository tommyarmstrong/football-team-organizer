import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * SERVER-ONLY — Supabase client with the service role key.
 *
 * NEVER import this module from a Client Component, `"use client"` file,
 * `src/lib/supabase/client.ts`, or any other browser bundle. The service
 * role key bypasses Row Level Security and is a full-project secret.
 *
 * Allowed: Server Components, Route Handlers, Server Actions, and other
 * server modules. CI fails the build if this module (or the key) appears
 * in `.next/static`.
 *
 * Env: `SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_` prefix).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SERVER-ONLY: SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required for admin operations.",
    );
  }

  return createSupabaseClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
