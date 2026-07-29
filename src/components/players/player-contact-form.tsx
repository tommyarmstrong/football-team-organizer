"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { savePlayerContactAction } from "@/lib/players/actions";
import type { PlayerContact } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorBanner } from "@/components/shared/error-banner";

export function PlayerContactForm({
  playerId,
  contact,
  canEdit,
}: {
  playerId: string;
  contact: PlayerContact | null;
  canEdit: boolean;
}) {
  const bound = savePlayerContactAction.bind(null, playerId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );

  if (!canEdit) {
    return (
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <ReadOnly label="Phone" value={contact?.phone} />
        <ReadOnly label="Email" value={contact?.email} />
        <ReadOnly label="Address" value={contact?.address} />
        <ReadOnly
          label="Emergency contact"
          value={contact?.emergency_contact_name}
        />
        <ReadOnly
          label="Emergency phone"
          value={contact?.emergency_contact_phone}
        />
        <ReadOnly label="Medical notes" value={contact?.medical_notes} />
      </dl>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={contact?.phone ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={contact?.email ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            name="address"
            defaultValue={contact?.address ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergency_contact_name">Emergency contact</Label>
          <Input
            id="emergency_contact_name"
            name="emergency_contact_name"
            defaultValue={contact?.emergency_contact_name ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergency_contact_phone">Emergency phone</Label>
          <Input
            id="emergency_contact_phone"
            name="emergency_contact_phone"
            type="tel"
            defaultValue={contact?.emergency_contact_phone ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="medical_notes">Medical notes</Label>
          <Textarea
            id="medical_notes"
            name="medical_notes"
            rows={3}
            defaultValue={contact?.medical_notes ?? ""}
            disabled={pending}
          />
        </div>
      </div>

      {state.error ? <ErrorBanner message={state.error} /> : null}
      {state.success ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save contact details"}
      </Button>
    </form>
  );
}

function ReadOnly({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium">{value?.trim() ? value : "—"}</dd>
    </div>
  );
}
