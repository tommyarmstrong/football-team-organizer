"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { updatePasswordAndFinishAction } from "@/lib/auth/actions";
import {
  MIN_PASSWORD_LENGTH,
  PASSWORD_POLICY_HINT,
  validateNewPassword,
} from "@/lib/auth/password";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorBanner } from "@/components/shared/error-banner";

export function SetPasswordForm({
  inviteToken,
  submitLabel,
  pendingLabel,
  nextPath,
}: {
  inviteToken?: string | null;
  submitLabel: string;
  pendingLabel: string;
  nextPath: "/onboarding/complete" | "/dashboard";
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const validationError = validateNewPassword(password, confirm);
    if (validationError) {
      setError(validationError);
      return;
    }

    setPending(true);
    const result = await updatePasswordAndFinishAction({
      password,
      confirm,
      inviteToken,
    });
    if (result?.error) {
      setPending(false);
      setError(result.error);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="password">New password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={pending}
        />
        <p className="text-muted-foreground text-xs">{PASSWORD_POLICY_HINT}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm">Confirm password</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          disabled={pending}
        />
      </div>

      {error ? <ErrorBanner message={error} /> : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
