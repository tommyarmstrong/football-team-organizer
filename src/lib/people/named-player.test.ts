import { describe, expect, it } from "vitest";
import { mapPlayerNameEmbed } from "@/lib/people/named-player";

describe("mapPlayerNameEmbed", () => {
  it("returns null for missing rows", () => {
    expect(mapPlayerNameEmbed(null)).toBeNull();
    expect(mapPlayerNameEmbed(undefined)).toBeNull();
  });

  it("maps a single embedded person", () => {
    expect(
      mapPlayerNameEmbed({
        id: "player-1",
        person_id: "person-1",
        person: { first_name: "Ada", last_name: "Lovelace" },
      }),
    ).toEqual({
      id: "player-1",
      person_id: "person-1",
      first_name: "Ada",
      last_name: "Lovelace",
    });
  });

  it("unwraps array embeds and defaults missing name fields", () => {
    expect(
      mapPlayerNameEmbed({
        id: "player-2",
        person: [{ first_name: "Alan", last_name: "Turing" }],
      }),
    ).toEqual({
      id: "player-2",
      person_id: "",
      first_name: "Alan",
      last_name: "Turing",
    });

    expect(
      mapPlayerNameEmbed({
        id: "player-3",
        person_id: "person-3",
        person: null,
      }),
    ).toEqual({
      id: "player-3",
      person_id: "person-3",
      first_name: "",
      last_name: "",
    });
  });
});
