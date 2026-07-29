import Link from "next/link";
import { notFound } from "next/navigation";
import { getManager } from "@/lib/data/managers";
import { canManageClub, getViewerContext } from "@/lib/authz/context";
import { managerDisplayName } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { ManagerForm } from "@/components/managers/manager-form";
import { DeleteManagerButton } from "@/components/managers/delete-manager-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function ManagerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getViewerContext();
  const { data: manager, error } = await getManager(id);

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Manager" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!manager || !ctx) {
    notFound();
  }

  const canEdit = canManageClub(ctx, manager.club_id);

  return (
    <div className="space-y-8">
      <PageHeader
        title={managerDisplayName(manager)}
        description={manager.email ?? manager.phone ?? "Manager"}
        actions={
          <Button variant="outline" size="sm" render={<Link href="/club" />}>
            Back to club
          </Button>
        }
      />

      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit manager</CardTitle>
            <CardDescription>
              Update name, contact details, and notes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ManagerForm mode="edit" manager={manager} />
            <DeleteManagerButton managerId={manager.id} />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="space-y-1">
                <dt className="text-muted-foreground">Phone</dt>
                <dd className="font-medium">{manager.phone ?? "—"}</dd>
              </div>
              <div className="space-y-1">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-medium">{manager.email ?? "—"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
