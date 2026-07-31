import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AcceptInvitationForm } from "@/components/auth/login-form";
import { ErrorBanner } from "@/components/shared/error-banner";
import { loadInvitationByToken } from "@/lib/people/invitations";
import { APP_NAME } from "@/lib/constants";

async function AcceptInvitationContent({ token }: { token: string }) {
  let personEmail: string | null = null;
  let firstName = "";
  let loadError: string | null = null;

  try {
    const { person, invitation, error } = await loadInvitationByToken(token);
    if (error || !person || !invitation) {
      loadError = error ?? "This invitation is not valid.";
    } else {
      personEmail = invitation.email;
      firstName = person.first_name;
    }
  } catch (err) {
    loadError =
      err instanceof Error
        ? err.message
        : "Could not load invitation (service role key required).";
  }

  if (loadError || !personEmail) {
    return (
      <ErrorBanner message={loadError ?? "This invitation is not valid."} />
    );
  }

  return (
    <AcceptInvitationForm
      token={token}
      email={personEmail}
      firstName={firstName}
    />
  );
}

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <div className="bg-background flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{APP_NAME}</CardTitle>
          <CardDescription>Accept your invitation</CardDescription>
        </CardHeader>
        <CardContent>
          {!token ? (
            <ErrorBanner message="Missing invitation token." />
          ) : (
            <Suspense
              fallback={
                <p className="text-muted-foreground text-sm">Loading…</p>
              }
            >
              <AcceptInvitationContent token={token} />
            </Suspense>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
