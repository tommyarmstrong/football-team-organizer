export type StoryInput = {
  goalsFor: number;
  goalsAgainst: number;
};

export function postcardStory(input: StoryInput): string {
  const { goalsFor, goalsAgainst } = input;
  const win = goalsFor > goalsAgainst;
  const draw = goalsFor === goalsAgainst;

  if (goalsFor === 0 && goalsAgainst === 0) {
    return "Tough watch today";
  }

  if (win && goalsFor - goalsAgainst >= 3) {
    return "Huge win today!";
  }

  if (win) {
    return "Great win!";
  }

  if (draw && goalsFor >= 3) {
    return "Great game!";
  }

  if (draw) {
    return "Shared the points.";
  }

  if (goalsAgainst - goalsFor <= 2) {
    return "Frustrating loss.";
  }

  return "Lads, we were Spurs";
}
