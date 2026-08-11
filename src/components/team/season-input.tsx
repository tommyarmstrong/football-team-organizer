"use client";

import {
  DEFAULT_SEASON,
  SEASON_FORMAT_HINT,
  SEASON_OPTIONS,
} from "@/lib/team/season";
import { Input } from "@/components/ui/input";

type SeasonInputProps = {
  id: string;
  name: string;
  defaultValue?: string | null;
  required?: boolean;
  disabled?: boolean;
  /** When true and no defaultValue, leave the field empty instead of DEFAULT_SEASON. */
  allowEmpty?: boolean;
};

/**
 * Season field with preset suggestions (datalist) and free-text entry for any
 * valid YYYY/YY season.
 */
export function SeasonInput({
  id,
  name,
  defaultValue,
  required = false,
  disabled = false,
  allowEmpty = false,
}: SeasonInputProps) {
  const listId = `${id}-options`;
  const resolvedDefault =
    defaultValue && defaultValue.trim()
      ? defaultValue
      : allowEmpty
        ? ""
        : DEFAULT_SEASON;

  return (
    <>
      <Input
        id={id}
        name={name}
        list={listId}
        required={required}
        disabled={disabled}
        defaultValue={resolvedDefault}
        placeholder="e.g. 2026/27"
        autoComplete="off"
        title={SEASON_FORMAT_HINT}
      />
      <datalist id={listId}>
        {SEASON_OPTIONS.map((season) => (
          <option key={season} value={season} />
        ))}
      </datalist>
    </>
  );
}
