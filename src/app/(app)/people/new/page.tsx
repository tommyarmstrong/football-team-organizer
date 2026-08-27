import { redirect } from "next/navigation";
import { canManageClub, getViewerContext } from "@/lib/authz/context";
import { getPrimaryClub } from "@/lib/data/clubs";
import { PageHeader } from "@/components/shared/page-header";
import { PersonForm } from "@/components/people/person-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewPersonPage() {
  const ctx = await getViewerContext();
  if (!ctx?.isManagement) redirect("/dashboard");

  const club = await getPrimaryClub();
  if (!club || !canManageClub(ctx, club.id)) redirect("/dashboard");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Add person"
        description="Create a shared identity record. Players do not receive a login by default."
      />

      <Card>
        <CardHeader>
          <CardTitle>Person details</CardTitle>
          <CardDescription>
            Enter known details and optionally assign club roles in one step.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PersonForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
