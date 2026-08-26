import { AuthShell } from "@/components/brand/auth-shell";
import { EstablishEmailSession } from "@/components/auth/establish-email-session";
import { SetPasswordForm } from "@/components/auth/set-password-form";

export default async function InviteAuthPage({
  searchParams,
}: {
  searchParams: Promise<{ invite_token?: string; error?: string }>;
}) {
  const { invite_token: inviteToken } = await searchParams;

  return (
    <AuthShell
      title="Set your password"
      description="Create a password to finish joining your team."
    >
      <EstablishEmailSession kind="invite">
        <SetPasswordForm
          inviteToken={inviteToken}
          submitLabel="Save password and continue"
          pendingLabel="Saving…"
          nextPath="/onboarding/complete"
        />
      </EstablishEmailSession>
    </AuthShell>
  );
}
