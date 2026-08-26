"use client";

import { useState, type FormEvent } from "react";
import { requestPasswordResetAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorBanner } from "@/components/shared/error-banner";

export function ForgotPasswordForm({
  defaultEmail = "",
}: {
  defaultEmail?: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setPending(true);
    const result = await requestPasswordResetAction({ email });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(result.success ?? "Check your email for a reset link.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending || Boolean(defaultEmail)}
        />
      </div>

      {error ? <ErrorBanner message={error} /> : null}
      {success ? (
        <p
          role="status"
          className="border-primary/30 bg-primary/10 text-foreground rounded-xl border px-3 py-2 text-sm"
        >
          {success}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Email reset link"}
      </Button>
    </form>
  );
}
