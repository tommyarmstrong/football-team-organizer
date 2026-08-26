"use client";

import { useEffect } from "react";
import {
  loginRedirectForAuthParams,
  parseAuthCallbackParams,
} from "@/lib/auth/email-callback";

/** Moves invite/recovery tokens off /login onto the dedicated Auth pages. */
export function LoginAuthRedirect() {
  useEffect(() => {
    const params = parseAuthCallbackParams(
      window.location.search,
      window.location.hash,
    );
    const target = loginRedirectForAuthParams(params);
    if (!target) return;
    const url = target.preserveHash
      ? `${target.pathname}${window.location.hash}`
      : target.pathname;
    window.location.replace(url);
  }, []);

  return null;
}
