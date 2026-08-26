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

function stripAuthParamsFromUrl() {
  const url = new URL(window.location.href);
  for (const key of [
    "code",
    "token_hash",
    "type",
    "error",
    "error_description",
    "error_code",
  ]) {
    url.searchParams.delete(key);
  }
  window.history.replaceState(
    {},
    "",
    `${url.pathname}${url.search}${url.hash}`,
  );
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

      const supabase = createClient();

      // Exchange PKCE codes in the browser so the code verifier cookie written
      // by resetPasswordForEmail / signIn is available in the same storage.
      if (params.code) {
        const { error: exchangeError } =
          await supabase.auth.exchangeCodeForSession(params.code);
        if (exchangeError) {
          if (!cancelled) {
            const message = /code verifier/i.test(exchangeError.message)
              ? kind === "recovery"
                ? "This reset link needs a fresh request. Use Forgot password? again, then open the newest email in this browser."
                : "This invitation link could not be completed in this browser. Open the newest invite email on the device where you can finish setup, or ask your club to resend it."
              : exchangeError.message;
            setError(message);
            setStatus("error");
          }
          return;
        }
        stripAuthParamsFromUrl();
      } else if (params.tokenHash && params.type) {
        const search = new URLSearchParams(window.location.search);
        if (!search.get("next")) {
          search.set(
            "next",
            kind === "recovery" ? "/auth/reset-password" : "/auth/invite",
          );
        }
        window.location.replace(`/auth/confirm?${search.toString()}`);
        return;
      } else if (params.accessToken && params.refreshToken) {
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
      } else {
        const queryError = params.errorDescription || params.error;
        if (queryError) {
          if (!cancelled) {
            setError(queryError.replace(/\+/g, " "));
            setStatus("error");
          }
          return;
        }
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
