import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompleteProfileForm } from "@/components/people/complete-profile-form";
import { ErrorBanner } from "@/components/shared/error-banner";
import { getViewerContext } from "@/lib/authz/context";
import { getPersonByAuthUserId } from "@/lib/data/people";
import { APP_NAME } from "@/lib/constants";

export default async function CompleteOnboardingPage() {
  const ctx = await getViewerContext();
  if (!ctx) redirect("/login");

  const { data: person, error } = await getPersonByAuthUserId(ctx.userId);
  if (error) {
    return (
      <div className="bg-background flex flex-1 items-center justify-center px-6 py-16">
        <ErrorBanner message={error} />
      </div>
    );
  }
  if (!person) {
    redirect("/no-access");
  }

  return (
    <div className="bg-background flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{APP_NAME}</CardTitle>
          <CardDescription>
            Confirm your details and add a phone number if it is missing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CompleteProfileForm person={person} />
        </CardContent>
      </Card>
    </div>
  );
}
