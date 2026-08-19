import { redirect } from "next/navigation";
import { AuthShell } from "@/components/brand/auth-shell";
import { CompleteProfileForm } from "@/components/people/complete-profile-form";
import { ErrorBanner } from "@/components/shared/error-banner";
import { getViewerContext } from "@/lib/authz/context";
import { getPersonByAuthUserId } from "@/lib/data/people";

export default async function CompleteOnboardingPage() {
  const ctx = await getViewerContext();
  if (!ctx) redirect("/login");

  const { data: person, error } = await getPersonByAuthUserId(ctx.userId);
  if (error) {
    return (
      <AuthShell title="Could not load profile">
        <ErrorBanner message={error} />
      </AuthShell>
    );
  }
  if (!person) {
    redirect("/no-access");
  }

  return (
    <AuthShell
      title="Complete your profile"
      description="Confirm your details and add a phone number if it is missing."
    >
      <CompleteProfileForm person={person} />
    </AuthShell>
  );
}
