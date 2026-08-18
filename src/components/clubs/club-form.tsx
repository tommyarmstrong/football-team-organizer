"use client";

import { useActionState, useState } from "react";
import { INITIAL_ACTION_STATE } from "@/lib/action-state";
import { updateClubAction } from "@/lib/clubs/actions";
import { clubIconSrc } from "@/lib/clubs/branding";
import type { Club } from "@/lib/supabase/database.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorBanner } from "@/components/shared/error-banner";
import { FormActions } from "@/components/shared/form-actions";

const DEFAULT_PICKER_COLOUR = "#1B4D3E";

export function ClubForm({ club }: { club: Club }) {
  const [state, formAction, pending] = useActionState(
    updateClubAction,
    INITIAL_ACTION_STATE,
  );
  const [previewSrc, setPreviewSrc] = useState(clubIconSrc(club.icon_url));
  const [colourEnabled, setColourEnabled] = useState(Boolean(club.colour));
  const [colour, setColour] = useState(club.colour ?? DEFAULT_PICKER_COLOUR);
  const [clearIcon, setClearIcon] = useState(false);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="id" value={club.id} />
      <input type="hidden" name="clear_icon" value={clearIcon ? "true" : ""} />
      <input type="hidden" name="colour" value={colourEnabled ? colour : ""} />
      <input
        type="hidden"
        name="clear_colour"
        value={colourEnabled ? "" : "true"}
      />

      <div className="space-y-2">
        <Label htmlFor="club-name">
          Club name <span className="text-muted-foreground">(required)</span>
        </Label>
        <Input
          id="club-name"
          name="name"
          required
          aria-required="true"
          defaultValue={club.name}
          disabled={pending}
          autoComplete="organization"
          data-1p-ignore
          data-lpignore="true"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="club-established">Established</Label>
        <Input
          id="club-established"
          name="established"
          type="number"
          inputMode="numeric"
          min={1800}
          max={2100}
          placeholder="e.g. 2022"
          defaultValue={club.established ?? ""}
          disabled={pending}
          className="sm:max-w-36"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="club-icon">Club icon</Label>
        <div className="flex flex-wrap items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={clearIcon ? clubIconSrc(null) : previewSrc}
            alt=""
            width={48}
            height={48}
            className="size-12 rounded-lg object-cover shadow-sm ring-1 ring-black/10"
          />
          <div className="min-w-0 flex-1 space-y-2">
            <Input
              id="club-icon"
              name="icon"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
              disabled={pending}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                setClearIcon(false);
                const url = URL.createObjectURL(file);
                setPreviewSrc(url);
              }}
            />
            <p className="text-muted-foreground text-xs">
              PNG, JPEG, WebP, GIF, or SVG. Max 512 KB. Defaults to a football
              when empty.
            </p>
            {club.icon_url ? (
              <label className="text-muted-foreground flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={clearIcon}
                  disabled={pending}
                  onChange={(event) => {
                    setClearIcon(event.target.checked);
                    if (event.target.checked) {
                      setPreviewSrc(clubIconSrc(null));
                    } else {
                      setPreviewSrc(clubIconSrc(club.icon_url));
                    }
                  }}
                />
                Remove uploaded icon
              </label>
            ) : null}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="club-colour">Club colours</Label>
        <div className="flex flex-wrap items-center gap-3">
          <input
            id="club-colour"
            type="color"
            value={colour}
            disabled={pending}
            onChange={(event) => {
              setColourEnabled(true);
              setColour(event.target.value.toUpperCase());
            }}
            className="border-input h-9 w-12 cursor-pointer rounded-md border bg-transparent p-1"
            aria-label="Club colour pipette"
          />
          <Input
            aria-label="Club colour hex"
            value={colourEnabled ? colour : ""}
            placeholder="#1B4D3E"
            disabled={pending}
            onChange={(event) => {
              const next = event.target.value.trim().toUpperCase();
              if (next === "") {
                setColourEnabled(false);
                return;
              }
              const normalised = next.startsWith("#") ? next : `#${next}`;
              if (/^#[0-9A-F]{0,6}$/.test(normalised)) {
                setColour(normalised);
                if (/^#[0-9A-F]{6}$/.test(normalised)) {
                  setColourEnabled(true);
                }
              }
            }}
            className="font-mono uppercase sm:max-w-36"
            maxLength={7}
          />
          {colourEnabled ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => setColourEnabled(false)}
            >
              Clear colour
            </Button>
          ) : null}
        </div>
        <p className="text-muted-foreground text-xs">
          Used for the header tint and brighter borders around cards and
          sections.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="club-website">Website</Label>
          <Input
            id="club-website"
            name="website"
            type="text"
            inputMode="url"
            placeholder="https://"
            defaultValue={club.website ?? ""}
            disabled={pending}
            autoComplete="url"
            data-1p-ignore
            data-lpignore="true"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="club-email">Email</Label>
          <Input
            id="club-email"
            name="email"
            type="email"
            defaultValue={club.email ?? ""}
            disabled={pending}
            autoComplete="email"
            data-1p-ignore
            data-lpignore="true"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="club-phone">Phone</Label>
          <Input
            id="club-phone"
            name="phone"
            type="tel"
            defaultValue={club.phone ?? ""}
            disabled={pending}
            autoComplete="tel"
            data-1p-ignore
            data-lpignore="true"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="club-about">About / philosophy</Label>
        <Textarea
          id="club-about"
          name="about"
          rows={6}
          defaultValue={club.about ?? ""}
          disabled={pending}
          placeholder="Describe the club's philosophy and approach…"
        />
      </div>

      {state.error ? <ErrorBanner message={state.error} /> : null}

      <FormActions pending={pending} cancelHref="/club" />
    </form>
  );
}
