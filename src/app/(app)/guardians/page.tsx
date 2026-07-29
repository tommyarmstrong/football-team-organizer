import Link from "next/link";
import { listGuardians } from "@/lib/data/guardians";
import { getPrimaryClub } from "@/lib/data/clubs";
import { getViewerContext } from "@/lib/authz/context";
import { guardianDisplayName } from "@/lib/format";
import { GUARDIAN_RELATIONSHIP_LABELS } from "@/lib/constants";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorBanner } from "@/components/shared/error-banner";
import { GuardianForm } from "@/components/guardians/guardian-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function GuardiansPage() {
  const [ctx, club, { data: guardians, error }] = await Promise.all([
    getViewerContext(),
    getPrimaryClub(),
    listGuardians(),
  ]);

  const canManage = Boolean(ctx?.isManagement);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Guardians"
        description={
          club ? `Guardians at ${club.name}` : "Guardians for your club"
        }
      />

      {error ? <ErrorBanner message={error} /> : null}

      {canManage ? (
        <Card>
          <CardHeader>
            <CardTitle>Add guardian</CardTitle>
            <CardDescription>
              Record contact details, then link zero or more players from the
              guardian&apos;s page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GuardianForm mode="create" />
          </CardContent>
        </Card>
      ) : null}

      <section className="space-y-3" aria-labelledby="guardians-list-heading">
        <h2 id="guardians-list-heading" className="text-lg font-medium">
          All guardians
        </h2>
        {!error && guardians.length === 0 ? (
          <EmptyState
            title="No guardians yet"
            description={
              canManage
                ? "Add your first guardian to keep contact details in one place."
                : "Guardians will appear here when club management adds them."
            }
          />
        ) : null}
        {!error && guardians.length > 0 ? (
          <ul className="divide-border border-border divide-y rounded-xl border">
            {guardians.map((guardian) => (
              <li key={guardian.id}>
                <Link
                  href={`/guardians/${guardian.id}`}
                  className="hover:bg-muted/50 focus-visible:ring-ring flex min-h-12 items-center justify-between gap-3 px-4 py-3 transition-colors focus-visible:ring-2 focus-visible:outline-none"
                >
                  <div className="min-w-0">
                    <p className="font-medium">
                      {guardianDisplayName(guardian)}
                    </p>
                    <p className="text-muted-foreground truncate text-sm">
                      {guardian.email ?? guardian.phone ?? "No contact details"}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-1">
                    {guardian.players.length === 0 ? (
                      <span className="text-muted-foreground text-xs">
                        No players
                      </span>
                    ) : (
                      guardian.players.map((link) => (
                        <span
                          key={link.player_guardian_id}
                          className="border-border text-muted-foreground rounded-md border px-2 py-0.5 text-xs"
                        >
                          {link.player_first_name} {link.player_last_name}
                          {" · "}
                          {GUARDIAN_RELATIONSHIP_LABELS[link.relationship]}
                          {link.legal_guardian ? " · Legal" : ""}
                        </span>
                      ))
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
