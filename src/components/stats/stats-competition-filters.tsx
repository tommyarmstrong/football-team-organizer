"use client";

import { NativeSelect } from "@/components/ui/native-select";
import { Label } from "@/components/ui/label";
import { labelCompetitionKind } from "@/lib/format";
import {
  ALL_COMPETITION_KINDS,
  ALL_COMPETITIONS,
  COMPETITION_KIND_FILTER_OPTIONS,
  NO_COMPETITION,
  type CompetitionFilterOption,
} from "@/lib/stats/competition-filters";

export type { CompetitionFilterOption };

export function StatsCompetitionFilters({
  competitions,
  competitionId,
  competitionKind,
  onCompetitionIdChange,
  onCompetitionKindChange,
  idPrefix,
}: {
  competitions: CompetitionFilterOption[];
  competitionId: string;
  competitionKind: string;
  onCompetitionIdChange: (value: string) => void;
  onCompetitionKindChange: (value: string) => void;
  idPrefix: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-competition`}>Competition</Label>
        <NativeSelect
          id={`${idPrefix}-competition`}
          value={competitionId}
          onChange={(event) => onCompetitionIdChange(event.target.value)}
        >
          <option value={ALL_COMPETITIONS}>All competitions</option>
          <option value={NO_COMPETITION}>No competition</option>
          {competitions.map((competition) => (
            <option key={competition.id} value={competition.id}>
              {competition.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-competition-kind`}>Competition type</Label>
        <NativeSelect
          id={`${idPrefix}-competition-kind`}
          value={competitionKind}
          onChange={(event) => onCompetitionKindChange(event.target.value)}
        >
          <option value={ALL_COMPETITION_KINDS}>All types</option>
          {COMPETITION_KIND_FILTER_OPTIONS.map((kind) => (
            <option key={kind} value={kind}>
              {labelCompetitionKind(kind)}
            </option>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}
