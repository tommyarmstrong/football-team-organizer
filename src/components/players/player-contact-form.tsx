"use client";

import { useActionState, useMemo, useState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { savePlayerContactAction } from "@/lib/players/actions";
import type { PlayerContact } from "@/lib/supabase/database.types";
import type { PlayerGuardianLink } from "@/lib/data/guardians";
import { guardianDisplayName } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { ErrorBanner } from "@/components/shared/error-banner";

export function PlayerContactForm({
  playerId,
  contact,
  guardians,
  canEdit,
}: {
  playerId: string;
  contact: PlayerContact | null;
  guardians: PlayerGuardianLink[];
  canEdit: boolean;
}) {
  const bound = savePlayerContactAction.bind(null, playerId);
  const [state, formAction, pending] = useActionState(
    bound,
    INITIAL_ACTION_STATE,
  );
  const [selectedGuardianId, setSelectedGuardianId] = useState(
    contact?.emergency_guardian_id ?? "",
  );

  const phoneByGuardian = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const g of guardians) map.set(g.guardian_id, g.phone);
    return map;
  }, [guardians]);

  const emergencyGuardian = guardians.find(
    (g) => g.guardian_id === (contact?.emergency_guardian_id ?? ""),
  );
  const selectedPhone = phoneByGuardian.get(selectedGuardianId) ?? null;

  if (!canEdit) {
    return (
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <ReadOnly label="Phone" value={contact?.phone} />
        <ReadOnly label="Email" value={contact?.email} />
        <ReadOnly label="Address" value={contact?.address} />
        <ReadOnly
          label="Emergency contact"
          value={
            emergencyGuardian ? guardianDisplayName(emergencyGuardian) : null
          }
        />
        <ReadOnly
          label="Emergency phone"
          value={emergencyGuardian?.phone ?? null}
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
          <Label htmlFor="emergency_guardian_id">Emergency contact</Label>
          <NativeSelect
            id="emergency_guardian_id"
            name="emergency_guardian_id"
            value={selectedGuardianId}
            onChange={(e) => setSelectedGuardianId(e.target.value)}
            disabled={pending || guardians.length === 0}
          >
            <option value="">
              {guardians.length === 0
                ? "Link a guardian first"
                : "Select a guardian"}
            </option>
            {guardians.map((guardian) => (
              <option key={guardian.guardian_id} value={guardian.guardian_id}>
                {guardianDisplayName(guardian)}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergency_phone_display">Emergency phone</Label>
          <Input
            id="emergency_phone_display"
            readOnly
            value={selectedPhone?.trim() ? selectedPhone : "—"}
            disabled
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
