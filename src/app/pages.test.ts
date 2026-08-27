import { beforeEach, describe, expect, it, vi } from "vitest";
import { teamFixture, viewerFixture } from "@/test/fixtures";

const {
  redirectMock,
  getCurrentTeamMock,
  getActiveTeamMock,
  canEditActiveMatchDayMock,
  canEditActiveTeamMock,
  getViewerContextMock,
  getPrimaryClubMock,
  listPeopleMock,
  listMatchesMock,
  listCompetitionsMock,
  getNextFixtureMock,
  getLastResultMock,
  getTopScorersMock,
  getTopAssistsMock,
  getTopPlayersOfTheMatchMock,
  listPlayerOfTheMonthMock,
  getResultsOverTimeMock,
  getGoalsByPlayerStatsMock,
  getAssistsByPlayerStatsMock,
  getPlayerOfTheMatchByPlayerStatsMock,
  getMatchesPlayedByPlayerStatsMock,
  canAccessClubAndPeopleMock,
} = vi.hoisted(() => ({
  redirectMock: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
  getCurrentTeamMock: vi.fn(),
  getActiveTeamMock: vi.fn(),
  canEditActiveMatchDayMock: vi.fn(),
  canEditActiveTeamMock: vi.fn(),
  getViewerContextMock: vi.fn(),
  getPrimaryClubMock: vi.fn(),
  listPeopleMock: vi.fn(),
  listMatchesMock: vi.fn(),
  listCompetitionsMock: vi.fn(),
  getNextFixtureMock: vi.fn(),
  getLastResultMock: vi.fn(),
  getTopScorersMock: vi.fn(),
  getTopAssistsMock: vi.fn(),
  getTopPlayersOfTheMatchMock: vi.fn(),
  listPlayerOfTheMonthMock: vi.fn(),
  getResultsOverTimeMock: vi.fn(),
  getGoalsByPlayerStatsMock: vi.fn(),
  getAssistsByPlayerStatsMock: vi.fn(),
  getPlayerOfTheMatchByPlayerStatsMock: vi.fn(),
  getMatchesPlayedByPlayerStatsMock: vi.fn(),
  canAccessClubAndPeopleMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: redirectMock }));
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: unknown; href: string }) => ({
    type: "a",
    props: { href, children },
  }),
}));

vi.mock("@/lib/data/team", () => ({
  getCurrentTeam: getCurrentTeamMock,
  getActiveTeam: getActiveTeamMock,
  canEditActiveMatchDay: canEditActiveMatchDayMock,
  canEditActiveTeam: canEditActiveTeamMock,
}));
vi.mock("@/lib/data/matches", () => ({
  listMatches: listMatchesMock,
  getNextFixture: getNextFixtureMock,
  getLastResult: getLastResultMock,
}));
vi.mock("@/lib/data/competitions", () => ({
  listCompetitions: listCompetitionsMock,
}));
vi.mock("@/lib/data/stats", () => ({
  getTopScorers: getTopScorersMock,
  getTopAssists: getTopAssistsMock,
  getTopPlayersOfTheMatch: getTopPlayersOfTheMatchMock,
  getResultsOverTime: getResultsOverTimeMock,
  getGoalsByPlayerStats: getGoalsByPlayerStatsMock,
  getAssistsByPlayerStats: getAssistsByPlayerStatsMock,
  getPlayerOfTheMatchByPlayerStats: getPlayerOfTheMatchByPlayerStatsMock,
  getMatchesPlayedByPlayerStats: getMatchesPlayedByPlayerStatsMock,
}));
vi.mock("@/lib/data/player-of-the-month", () => ({
  listPlayerOfTheMonth: listPlayerOfTheMonthMock,
}));
vi.mock("@/lib/data/clubs", () => ({ getPrimaryClub: getPrimaryClubMock }));
vi.mock("@/lib/data/people", () => ({
  listPeople: listPeopleMock,
  listPreviousMembers: vi.fn().mockResolvedValue({ data: [], error: null }),
}));
vi.mock("@/lib/authz/context", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/authz/context")>();
  return {
    ...actual,
    getViewerContext: getViewerContextMock,
    canAccessClubAndPeople: canAccessClubAndPeopleMock,
  };
});

vi.mock("@/components/brand/auth-shell", () => ({
  AuthShell: ({ children, title }: { children: unknown; title: string }) => ({
    type: "AuthShell",
    props: { title, children },
  }),
}));
vi.mock("@/components/auth/login-auth-redirect", () => ({
  LoginAuthRedirect: () => ({ type: "LoginAuthRedirect" }),
}));
vi.mock("@/components/auth/login-form", () => ({
  LoginFormWithGoogle: () => ({ type: "LoginForm" }),
}));
vi.mock("@/components/shared/page-header", () => ({
  PageHeader: (props: { title: string }) => ({
    type: "PageHeader",
    props,
  }),
}));
vi.mock("@/components/shared/error-banner", () => ({
  ErrorBanner: (props: { message: string }) => ({
    type: "ErrorBanner",
    props,
  }),
}));
vi.mock("@/components/shared/empty-state", () => ({
  EmptyState: (props: { title: string }) => ({
    type: "EmptyState",
    props,
  }),
}));
vi.mock("@/components/stats/stats-page-content", () => ({
  StatsPageContent: (props: Record<string, unknown>) => ({
    type: "StatsPageContent",
    props,
  }),
}));
vi.mock("@/components/matches/matches-directory-list", () => ({
  MatchesDirectoryList: (props: Record<string, unknown>) => ({
    type: "MatchesDirectoryList",
    props,
  }),
}));
vi.mock("@/components/people/people-directory-list", () => ({
  PeopleDirectoryList: (props: Record<string, unknown>) => ({
    type: "PeopleDirectoryList",
    props,
  }),
}));
vi.mock("@/components/brand/pitch-graphic", () => ({
  PitchGraphic: () => null,
}));
vi.mock("@/components/shared/section", () => ({
  Section: ({ children }: { children: unknown }) => children,
}));
vi.mock("@/components/shared/rank-badge", () => ({ RankBadge: () => null }));
vi.mock("@/components/shared/initials-avatar", () => ({
  InitialsAvatar: () => null,
}));
vi.mock("@/components/shared/object-list", () => ({
  objectListClassName: "",
  objectListRowClassName: "",
}));
vi.mock("@/components/matches/match-scoreboard", () => ({
  MatchScoreboard: () => null,
}));
vi.mock("@/components/team/competitions-section", () => ({
  CompetitionsSection: () => null,
}));
vi.mock("@/components/stats/form-strip", () => ({ FormStrip: () => null }));
vi.mock("@/components/ui/button", () => ({
  buttonVariants: () => "btn",
}));

import HomePage from "@/app/page";
import LoginPage from "@/app/login/page";
import StatsPage from "@/app/(app)/stats/page";
import MatchesPage from "@/app/(app)/matches/page";
import PeoplePage from "@/app/(app)/people/page";
import DashboardPage from "@/app/(app)/dashboard/page";

function emptyStats() {
  return { data: [], error: null };
}

function emptyResults() {
  return { data: [], error: null, form: [] as Array<"W" | "D" | "L"> };
}

describe("app pages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getCurrentTeamMock.mockResolvedValue(teamFixture());
    getActiveTeamMock.mockResolvedValue(teamFixture());
    canEditActiveMatchDayMock.mockResolvedValue(true);
    canEditActiveTeamMock.mockResolvedValue(true);
    listCompetitionsMock.mockResolvedValue({ data: [], error: null });
    listMatchesMock.mockResolvedValue({ data: [], error: null });
    getNextFixtureMock.mockResolvedValue({ data: null, error: null });
    getLastResultMock.mockResolvedValue({ data: null, error: null });
    getTopScorersMock.mockResolvedValue(emptyStats());
    getTopAssistsMock.mockResolvedValue(emptyStats());
    getTopPlayersOfTheMatchMock.mockResolvedValue(emptyStats());
    listPlayerOfTheMonthMock.mockResolvedValue({ data: [], error: null });
    getResultsOverTimeMock.mockResolvedValue(emptyResults());
    getGoalsByPlayerStatsMock.mockResolvedValue(emptyStats());
    getAssistsByPlayerStatsMock.mockResolvedValue(emptyStats());
    getPlayerOfTheMatchByPlayerStatsMock.mockResolvedValue(emptyStats());
    getMatchesPlayedByPlayerStatsMock.mockResolvedValue(emptyStats());
    getViewerContextMock.mockResolvedValue(viewerFixture());
    canAccessClubAndPeopleMock.mockReturnValue(true);
    getPrimaryClubMock.mockResolvedValue({ id: "club-1", name: "Example FC" });
    listPeopleMock.mockResolvedValue({ data: [], error: null });
  });

  it("home page redirects to dashboard", () => {
    expect(() => HomePage()).toThrow("redirect:/dashboard");
  });

  it("login page renders the auth shell title", () => {
    const tree = LoginPage() as { props: { title: string } };
    expect(tree.props.title).toBe("Sign in");
  });

  it("stats page shows a no-team error", async () => {
    getCurrentTeamMock.mockResolvedValue(null);
    const tree = await StatsPage();
    expect(JSON.stringify(tree)).toContain("No team found for your account.");
  });

  it("stats page composes competition options", async () => {
    listCompetitionsMock.mockResolvedValue({
      data: [{ id: "c1", name: "League", kind: "league" }],
      error: null,
    });
    const tree = await StatsPage();
    expect(JSON.stringify(tree)).toContain('"name":"League"');
    expect(JSON.stringify(tree)).toContain("goalsByPlayer");
  });

  it("matches page renders empty state", async () => {
    const tree = await MatchesPage();
    expect(JSON.stringify(tree)).toContain("No matches");
  });

  it("matches page shows list errors", async () => {
    listMatchesMock.mockResolvedValue({ data: [], error: "boom" });
    const tree = await MatchesPage();
    expect(JSON.stringify(tree)).toContain("boom");
  });

  it("people page redirects when access is denied", async () => {
    canAccessClubAndPeopleMock.mockReturnValue(false);
    await expect(PeoplePage()).rejects.toThrow("redirect:/dashboard");
  });

  it("people page shows no-club empty state", async () => {
    getPrimaryClubMock.mockResolvedValue(null);
    const tree = await PeoplePage();
    expect(JSON.stringify(tree)).toContain("No club found");
  });

  it("dashboard page shows no-team error", async () => {
    getCurrentTeamMock.mockResolvedValue(null);
    const tree = await DashboardPage();
    expect(JSON.stringify(tree)).toContain("No team found for your account.");
  });

  it("dashboard page renders for a selected team", async () => {
    const tree = await DashboardPage();
    expect(JSON.stringify(tree)).toContain("Dashboard");
    expect(JSON.stringify(tree)).toContain("U12 Blues");
  });
});
