"use client";

import { useActionState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { PLAYER_POSITIONS } from "@/lib/constants";
import { createPlayerAction, updatePlayerAction } from "@/lib/players/actions";
import type { Player } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { ErrorBanner } from "@/components/shared/error-banner";

export function PlayerForm({
  player,
  mode,
}: {
  player?: Player;
  mode: "create" | "edit";
}) {
  const action =
    mode === "create"
      ? createPlayerAction
      : updatePlayerAction.bind(null, player!.id);

  const [state, formAction, pending] = useActionState(
    action,
    INITIAL_ACTION_STATE,
  );

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first_name">
            First name <span className="text-muted-foreground">(required)</span>
          </Label>
          <Input
            id="first_name"
            name="first_name"
            required
            aria-required="true"
            defaultValue={player?.first_name}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">
            Last name <span className="text-muted-foreground">(required)</span>
          </Label>
          <Input
            id="last_name"
            name="last_name"
            required
            aria-required="true"
            defaultValue={player?.last_name}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="shirt_number">Shirt number</Label>
          <Input
            id="shirt_number"
            name="shirt_number"
            type="number"
            min={1}
            defaultValue={player?.shirt_number ?? ""}
            disabled={pending}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="position">Position</Label>
          <NativeSelect
            id="position"
            name="position"
            defaultValue={player?.position ?? ""}
            disabled={pending}
          >
            <option value="">Optional</option>
            {PLAYER_POSITIONS.map((pos) => (
              <option key={pos} value={pos}>
                {pos}
              </option>
            ))}
          </NativeSelect>
        </div>
        {mode === "edit" ? (
          <div className="space-y-2">
            <Label htmlFor="active">Status</Label>
            <NativeSelect
              id="active"
              name="active"
              defaultValue={player?.active ? "true" : "false"}
              disabled={pending}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </NativeSelect>
          </div>
        ) : null}
      </div>

      {state.error ? <ErrorBanner message={state.error} /> : null}
      {state.success ? (
        <p className="text-muted-foreground text-sm" role="status">
          {state.success}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : mode === "create" ? "Add player" : "Save player"}
      </Button>
    </form>
  );
}
