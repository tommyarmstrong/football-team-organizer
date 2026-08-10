"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { updateCoachTextAction } from "@/lib/coaches/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorBanner } from "@/components/shared/error-banner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function CoachTextCards({
  coachId,
  biography,
  philosophy,
}: {
  coachId: string;
  biography: string | null;
  philosophy: string | null;
}) {
  const action = updateCoachTextAction.bind(null, coachId);
  const [state, formAction, pending] = useActionState(
    action,
    INITIAL_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Biography</CardTitle>
          <CardDescription>
            Background, experience, and coaching style.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="biography" className="sr-only">
              Biography
            </Label>
            <Textarea
              id="biography"
              name="biography"
              rows={5}
              placeholder="Background, experience, and coaching style"
              defaultValue={biography ?? ""}
              disabled={pending}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Coaching Philosophy</CardTitle>
          <CardDescription>
            Playing style, principles, and approach to coaching.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="philosophy" className="sr-only">
              Coaching Philosophy
            </Label>
            <Textarea
              id="philosophy"
              name="philosophy"
              rows={5}
              placeholder="Playing style, principles, and approach to coaching"
              defaultValue={philosophy ?? ""}
              disabled={pending}
            />
          </div>
        </CardContent>
      </Card>

      {state.error ? <ErrorBanner message={state.error} /> : null}
      {state.success ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save coach profile"}
      </Button>
    </form>
  );
}
