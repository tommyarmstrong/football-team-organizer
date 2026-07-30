import {
  COACH_OBJECTIVE_STATUSES,
  COACH_OBJECTIVE_TYPES,
  PLAYER_OBJECTIVE_STATUSES,
  PLAYER_OBJECTIVE_TYPES,
} from "@/lib/constants";
import { str } from "@/lib/form-parse";
import type {
  CoachObjectiveStatus,
  CoachObjectiveType,
  PlayerObjectiveStatus,
  PlayerObjectiveType,
} from "@/lib/supabase/database.types";

function isCoachObjectiveType(value: string): value is CoachObjectiveType {
  return (COACH_OBJECTIVE_TYPES as readonly string[]).includes(value);
}

function isCoachObjectiveStatus(value: string): value is CoachObjectiveStatus {
  return (COACH_OBJECTIVE_STATUSES as readonly string[]).includes(value);
}

function isPlayerObjectiveType(value: string): value is PlayerObjectiveType {
  return (PLAYER_OBJECTIVE_TYPES as readonly string[]).includes(value);
}

function isPlayerObjectiveStatus(
  value: string,
): value is PlayerObjectiveStatus {
  return (PLAYER_OBJECTIVE_STATUSES as readonly string[]).includes(value);
}

function parseOptionalDate(raw: string): string | null | { error: string } {
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    return { error: "Target date must be a valid date." };
  }
  return raw;
}

export function parseCoachObjectiveForm(formData: FormData):
  | {
      body: string;
      objective_type: CoachObjectiveType;
      target_date: string | null;
      status: CoachObjectiveStatus;
    }
  | { error: string } {
  const body = str(formData, "body");
  if (!body) return { error: "Objective text is required." };

  const objective_type = str(formData, "objective_type");
  if (!isCoachObjectiveType(objective_type)) {
    return { error: "Select a valid objective type." };
  }

  const status = str(formData, "status");
  if (!isCoachObjectiveStatus(status)) {
    return { error: "Select a valid status." };
  }

  const target_date = parseOptionalDate(str(formData, "target_date"));
  if (
    target_date &&
    typeof target_date === "object" &&
    "error" in target_date
  ) {
    return target_date;
  }

  return {
    body,
    objective_type,
    target_date,
    status,
  };
}

export function parsePlayerObjectiveForm(formData: FormData):
  | {
      body: string;
      objective_type: PlayerObjectiveType;
      status: PlayerObjectiveStatus;
    }
  | { error: string } {
  const body = str(formData, "body");
  if (!body) return { error: "Objective text is required." };

  const objective_type = str(formData, "objective_type");
  if (!isPlayerObjectiveType(objective_type)) {
    return { error: "Select a valid objective type." };
  }

  const status = str(formData, "status");
  if (!isPlayerObjectiveStatus(status)) {
    return { error: "Select a valid status." };
  }

  return { body, objective_type, status };
}
