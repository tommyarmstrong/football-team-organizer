"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ErrorBanner } from "@/components/shared/error-banner";
import { createClient } from "@/lib/supabase/client";
import { validateNewPassword } from "@/lib/auth/password";
import { acceptInvitationWithPassword } from "@/lib/people/onboarding-actions";

export function AcceptInvitationForm({
  token,
  email,
  firstName,
}: {
  token: string;
  email: string;
  firstName: string;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onPasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const passwordError = validateNewPassword(password, confirm);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    setPending(true);
    const result = await acceptInvitationWithPassword({
      token,
      password,
    });
    setPending(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    router.replace("/onboarding/complete");
    router.refresh();
  }

  async function onGoogle() {
    setError(null);
    setPending(true);
    const supabase = createClient();
    const origin = window.location.origin;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?invite_token=${encodeURIComponent(token)}&next=${encodeURIComponent("/onboarding/complete")}`,
      },
    });
    setPending(false);
    if (oauthError) setError(oauthError.message);
  }

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground text-sm">
        Welcome{firstName ? `, ${firstName}` : ""}. Create a password for{" "}
        <span className="text-foreground font-medium">{email}</span>, or
        continue with Google using the same email.
      </p>

      <form onSubmit={onPasswordSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={pending}
          />
        </div>

        {error ? <ErrorBanner message={error} /> : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <div className="relative py-2 text-center text-sm">
        <span className="text-muted-foreground bg-card relative z-10 px-2">
          or
        </span>
        <div className="border-border absolute inset-x-0 top-1/2 border-t" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={pending}
        onClick={onGoogle}
      >
        Continue with Google
      </Button>
    </div>
  );
}

export function LoginFormWithGoogle() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/dashboard";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(urlError);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setPending(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.replace(nextPath.startsWith("/") ? nextPath : "/dashboard");
    router.refresh();
  }

  async function onGoogle() {
    setError(null);
    setPending(true);
    const supabase = createClient();
    const origin = window.location.origin;
    const next = nextPath.startsWith("/") ? nextPath : "/dashboard";
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setPending(false);
    if (oauthError) setError(oauthError.message);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-required="true"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            aria-required="true"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
          />
        </div>

        {error ? <ErrorBanner message={error} /> : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>

        <p className="text-center text-sm">
          <Link
            href="/auth/forgot-password"
            className="text-primary underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
        </p>
      </form>

      <div className="relative py-2 text-center text-sm">
        <span className="text-muted-foreground bg-card relative z-10 px-2">
          or
        </span>
        <div className="border-border absolute inset-x-0 top-1/2 border-t" />
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={pending}
        onClick={onGoogle}
      >
        Sign in with Google
      </Button>
    </div>
  );
}
