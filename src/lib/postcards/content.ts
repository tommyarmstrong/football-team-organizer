import type { GoalWithPlayers } from "@/lib/data/goals";
import type { RosterPlayer } from "@/lib/data/players";
import { formatScore, playerDisplayName } from "@/lib/format";
import type { TeamGender } from "@/lib/supabase/database.types";
import type { PostcardGoalList } from "@/lib/postcards/types";

const FULL_GOAL_MAX = 6;
const COMPACT_GOAL_MAX = 10;
const SUMMARY_TOP_SCORERS = 4;

export type PostcardPlayerLabelInput = {
  firstName: string;
  lastName: string;
  shirtNumber?: number | null;
};

export function postcardShowsSurname(gender: TeamGender): boolean {
  return gender === "men" || gender === "women";
}

export function postcardPlayerLabel(
  player: PostcardPlayerLabelInput,
  options: { gender: TeamGender },
): string {
  const firstName = player.firstName.trim() || "Player";
  const shirt = player.shirtNumber ?? null;
  if (postcardShowsSurname(options.gender)) {
    return playerDisplayName(
      { first_name: firstName, last_name: player.lastName },
      shirt != null ? { shirtNumber: shirt } : undefined,
    );
  }
  if (shirt != null) return `${firstName} ${shirt}`;
  return firstName;
}

export function slugPostcardPart(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return slug || "team";
}

export function postcardFileName(input: {
  teamName: string;
  date: string;
  opponentName: string;
}): string {
  const team = slugPostcardPart(input.teamName);
  const opponent = slugPostcardPart(input.opponentName);
  return `${team}-${input.date}-vs-${opponent}.png`;
}

function shirtByPlayer(roster: RosterPlayer[]): Map<string, number | null> {
  return new Map(roster.map((player) => [player.id, player.shirt_number]));
}

export function playerFromRoster(
  roster: RosterPlayer[],
  playerId: string | null,
): PostcardPlayerLabelInput | null {
  if (!playerId) return null;
  const player = roster.find((row) => row.id === playerId);
  if (!player) return null;
  return {
    firstName: player.first_name,
    lastName: player.last_name,
    shirtNumber: player.shirt_number,
  };
}

export function nameOnlyLabelFor(
  player: PostcardPlayerLabelInput | null,
  gender: TeamGender,
): string | null {
  if (!player) return null;
  return postcardPlayerLabel({ ...player, shirtNumber: null }, { gender });
}

export function postcardSquadLines(
  roster: RosterPlayer[],
  selectedPlayerIds: string[],
): string[] {
  const selected = new Set(selectedPlayerIds);
  const squad = roster
    .filter((player) => selected.has(player.id))
    .sort(
      (a, b) =>
        (a.shirt_number ?? Number.MAX_SAFE_INTEGER) -
          (b.shirt_number ?? Number.MAX_SAFE_INTEGER) ||
        a.first_name.localeCompare(b.first_name),
    )
    .map((player) =>
      player.shirt_number == null
        ? player.first_name
        : `${player.shirt_number} ${player.first_name}`,
    );
  const lines: string[] = [];
  for (const player of squad) {
    const current = lines.at(-1);
    if (!current || `${current}, ${player}`.length > 55) {
      lines.push(player);
    } else {
      lines[lines.length - 1] = `${current}, ${player}`;
    }
  }
  return lines;
}

function ourNamedGoals(goals: GoalWithPlayers[]): GoalWithPlayers[] {
  return goals.filter((goal) => !goal.is_opposition && !goal.is_own_goal);
}

export function buildPostcardGoalList(
  goals: GoalWithPlayers[],
  options: {
    gender: TeamGender;
    roster: RosterPlayer[];
  },
): PostcardGoalList {
  const shirts = shirtByPlayer(options.roster);
  const ours = ourNamedGoals(goals);
  if (ours.length === 0) return { kind: "none" };

  const labeled = ours.map((goal) => {
    const scorer: PostcardPlayerLabelInput | null = goal.scorer
      ? {
          firstName: goal.scorer.first_name,
          lastName: goal.scorer.last_name,
          shirtNumber: shirts.get(goal.scorer.id) ?? null,
        }
      : null;
    const assist: PostcardPlayerLabelInput | null = goal.assist
      ? {
          firstName: goal.assist.first_name,
          lastName: goal.assist.last_name,
          shirtNumber: shirts.get(goal.assist.id) ?? null,
        }
      : null;
    return {
      label: nameOnlyLabelFor(scorer, options.gender) ?? "Player",
      isPenalty: goal.is_penalty,
      assistLabel: nameOnlyLabelFor(assist, options.gender),
      playerId: goal.player_id,
    };
  });

  if (ours.length <= FULL_GOAL_MAX) {
    return {
      kind: "full",
      rows: labeled.map((row) => ({
        label: row.label,
        isPenalty: row.isPenalty,
        assistLabel: row.assistLabel,
      })),
    };
  }

  if (ours.length <= COMPACT_GOAL_MAX) {
    return {
      kind: "compact",
      rows: labeled.map((row) => ({
        label: row.label,
        isPenalty: row.isPenalty,
        assistLabel: row.assistLabel,
      })),
    };
  }

  const counts = new Map<string, { label: string; count: number }>();
  for (const row of labeled) {
    const key = row.playerId ?? row.label;
    const current = counts.get(key);
    if (current) current.count += 1;
    else counts.set(key, { label: row.label, count: 1 });
  }
  const ranked = [...counts.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label),
  );
  const top = ranked.slice(0, SUMMARY_TOP_SCORERS);
  const extraCount = ranked.length - top.length;
  return {
    kind: "summary",
    text: top.map((entry) => `${entry.label} ${entry.count}`).join(", "),
    extra: extraCount > 0 ? `+${extraCount} more` : null,
  };
}

function captionGoalLine(
  goal: GoalWithPlayers,
  gender: TeamGender,
  roster: RosterPlayer[],
): string {
  const shirts = shirtByPlayer(roster);
  const scorer: PostcardPlayerLabelInput | null = goal.scorer
    ? {
        firstName: goal.scorer.first_name,
        lastName: goal.scorer.last_name,
        shirtNumber: shirts.get(goal.scorer.id) ?? null,
      }
    : null;
  const assist: PostcardPlayerLabelInput | null = goal.assist
    ? {
        firstName: goal.assist.first_name,
        lastName: goal.assist.last_name,
        shirtNumber: shirts.get(goal.assist.id) ?? null,
      }
    : null;
  const scorerLabel = `${nameOnlyLabelFor(scorer, gender) ?? "Player"}${
    goal.is_penalty ? " (P)" : ""
  }`;
  const parts = [`⚽ ${scorerLabel}`];
  const assistLabel = nameOnlyLabelFor(assist, gender);
  if (assistLabel) parts.push(`🤝 ${assistLabel}`);
  return parts.join(" ");
}

export function postcardPotmLine(
  name: string,
  kind: "coach" | "players",
): string {
  const award =
    kind === "coach"
      ? "Coach's Player of the Match"
      : "Players' Player of the Match";
  return `🏆 ${name} · ${award}`;
}

export function postcardCaption(input: {
  teamName: string;
  opponentName: string;
  goalsFor: number;
  goalsAgainst: number;
  story: string;
  goals: GoalWithPlayers[];
  gender: TeamGender;
  roster: RosterPlayer[];
  coachPotmLabel: string | null;
  playersPotmLabel: string | null;
}): string {
  const lines = [
    `${input.teamName} ${formatScore(input.goalsFor, input.goalsAgainst)} ${input.opponentName}`,
    input.story,
  ];

  const ours = ourNamedGoals(input.goals);
  if (ours.length > 0) {
    lines.push("");
    for (const goal of ours) {
      lines.push(captionGoalLine(goal, input.gender, input.roster));
    }
  }

  const potm: string[] = [];
  if (input.coachPotmLabel) {
    potm.push(postcardPotmLine(input.coachPotmLabel, "coach"));
  }
  if (input.playersPotmLabel) {
    potm.push(postcardPotmLine(input.playersPotmLabel, "players"));
  }
  if (potm.length > 0) {
    lines.push("");
    lines.push(...potm);
  }

  return lines.join("\n");
}
