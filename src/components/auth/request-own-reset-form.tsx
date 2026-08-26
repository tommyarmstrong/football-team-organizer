"use client";

import { useState } from "react";
import { requestPasswordResetEmail } from "@/lib/auth/request-password-reset";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/shared/error-banner";

export function RequestOwnResetForm({ email }: { email: string }) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onClick() {
    setError(null);
    setSuccess(null);
    setPending(true);
    const result = await requestPasswordResetEmail(email);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(result.success ?? "Check your email for a reset link.");
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        We will send a reset link to{" "}
        <span className="text-foreground font-medium">{email}</span>. Use that
        link to choose a new password.
      </p>
      {error ? <ErrorBanner message={error} /> : null}
      {success ? (
        <p
          role="status"
          className="border-primary/30 bg-primary/10 text-foreground rounded-xl border px-3 py-2 text-sm"
        >
          {success}
        </p>
      ) : null}
      <Button type="button" onClick={onClick} disabled={pending}>
        {pending ? "Sending…" : "Email me a reset link"}
      </Button>
    </div>
  );
}
