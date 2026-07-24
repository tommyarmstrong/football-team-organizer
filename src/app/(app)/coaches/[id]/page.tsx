import Link from "next/link";
import { notFound } from "next/navigation";
import { getCoach } from "@/lib/data/coaches";
import { coachDisplayName, formatShortDate } from "@/lib/format";
import { PageHeader } from "@/components/shared/page-header";
import { ErrorBanner } from "@/components/shared/error-banner";
import { CoachForm } from "@/components/coaches/coach-form";
import { DeleteCoachButton } from "@/components/coaches/delete-coach-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CoachDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { data: coach, error } = await getCoach(id);

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Coach" />
        <ErrorBanner message={error} />
      </div>
    );
  }

  if (!coach) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={coachDisplayName(coach)}
        description={`Joined ${formatShortDate(coach.joined_date)}`}
        actions={
          <Button variant="outline" size="sm" render={<Link href="/coaches" />}>
            Back to coaches
          </Button>
        }
      />

      {coach.biography ? (
        <Card>
          <CardHeader>
            <CardTitle>Biography</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{coach.biography}</p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Edit coach</CardTitle>
          <CardDescription>
            Update contact details, biography, and qualifications.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <CoachForm mode="edit" coach={coach} />
          <DeleteCoachButton coachId={coach.id} />
        </CardContent>
      </Card>
    </div>
  );
}
