import { describe, expect, it } from "vitest";
import { one } from "@/lib/supabase/relations";

describe("one", () => {
  it("returns an object relation unchanged", () => {
    expect(one({ id: "a" })).toEqual({ id: "a" });
  });

  it("returns the first row of an array relation", () => {
    expect(one([{ id: "a" }, { id: "b" }])).toEqual({ id: "a" });
  });

  it("returns null for missing or empty relations", () => {
    expect(one(null)).toBeNull();
    expect(one(undefined)).toBeNull();
    expect(one([])).toBeNull();
  });
});
