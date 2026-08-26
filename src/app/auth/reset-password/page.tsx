import { AuthShell } from "@/components/brand/auth-shell";
import { EstablishEmailSession } from "@/components/auth/establish-email-session";
import { SetPasswordForm } from "@/components/auth/set-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Choose a new password"
      description="This link came from a password reset email. Pick a new password to sign in."
    >
      <EstablishEmailSession kind="recovery">
        <SetPasswordForm
          submitLabel="Update password"
          pendingLabel="Updating…"
          nextPath="/dashboard"
        />
      </EstablishEmailSession>
    </AuthShell>
  );
}
