"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import {
  parseAuthCallbackParams,
  passwordSetupKindForAuth,
} from "@/lib/auth/email-callback";
import { PASSWORD_SETUP_COOKIE } from "@/lib/auth/paths";
import { ErrorBanner } from "@/components/shared/error-banner";
import { createClient } from "@/lib/supabase/client";

function markPasswordSetupCookie(kind: "invite" | "recovery") {
  document.cookie = `${PASSWORD_SETUP_COOKIE}=${kind}; Path=/; Max-Age=3600; SameSite=Lax`;
}

export function EstablishEmailSession({
  kind,
  children,
}: {
  kind: "invite" | "recovery";
  children: ReactNode;
}) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function establish() {
      const params = parseAuthCallbackParams(
        window.location.search,
        window.location.hash,
      );

      if (params.code) {
        const search = new URLSearchParams(window.location.search);
        if (!search.get("next")) {
          search.set(
            "next",
            kind === "recovery" ? "/auth/reset-password" : "/auth/invite",
          );
        }
        window.location.replace(`/auth/callback?${search.toString()}`);
        return;
      }

      if (params.tokenHash && params.type) {
        const search = new URLSearchParams(window.location.search);
        if (!search.get("next")) {
          search.set(
            "next",
            kind === "recovery" ? "/auth/reset-password" : "/auth/invite",
          );
        }
        window.location.replace(`/auth/confirm?${search.toString()}`);
        return;
      }

      const queryError = params.errorDescription || params.error;
      const supabase = createClient();

      if (params.accessToken && params.refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: params.accessToken,
          refresh_token: params.refreshToken,
        });
        if (sessionError) {
          if (!cancelled) {
            setError(sessionError.message);
            setStatus("error");
          }
          return;
        }
        window.history.replaceState(
          {},
          "",
          `${window.location.pathname}${window.location.search}`,
        );
      } else if (queryError && !params.code && !params.tokenHash) {
        if (!cancelled) {
          setError(queryError.replace(/\+/g, " "));
          setStatus("error");
        }
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) {
          setError(
            kind === "invite"
              ? "This invitation link is missing or has expired. Ask your club to send a new invite."
              : "This password reset link is missing or has expired. Request a new link from the sign-in page.",
          );
          setStatus("error");
        }
        return;
      }

      const setupKind =
        passwordSetupKindForAuth({
          type: params.type,
          nextPath:
            kind === "recovery" ? "/auth/reset-password" : "/auth/invite",
        }) ?? kind;
      markPasswordSetupCookie(setupKind);

      if (!cancelled) setStatus("ready");
    }

    void establish();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  if (status === "loading") {
    return <p className="text-muted-foreground text-sm">Checking your link…</p>;
  }

  if (status === "error") {
    return (
      <div className="space-y-4">
        <ErrorBanner message={error ?? "Could not verify this link."} />
        <p className="text-center text-sm">
          <Link
            href="/login"
            className="text-primary underline-offset-4 hover:underline"
          >
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return children;
}
