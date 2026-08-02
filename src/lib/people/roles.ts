export const PERSON_ROLE_ORDER = [
  "player",
  "guardian",
  "coach",
  "manager",
] as const;

export type PersonRoleKind = (typeof PERSON_ROLE_ORDER)[number];
