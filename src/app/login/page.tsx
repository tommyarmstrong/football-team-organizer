import { Suspense } from "react";
import { AuthShell } from "@/components/brand/auth-shell";
import { LoginAuthRedirect } from "@/components/auth/login-auth-redirect";
import { LoginFormWithGoogle as LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <AuthShell
      title="Sign in"
      description="Use email and password, or continue with Google."
    >
      <LoginAuthRedirect />
      <Suspense
        fallback={<p className="text-muted-foreground text-sm">Loading…</p>}
      >
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
