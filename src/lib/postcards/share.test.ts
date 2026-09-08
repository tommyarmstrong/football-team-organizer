import { describe, expect, it } from "vitest";
import {
  canSharePostcardFile,
  postcardFileFromBlob,
} from "@/lib/postcards/share";

describe("canSharePostcardFile", () => {
  it("is false in Node where navigator is missing", () => {
    const file = postcardFileFromBlob(
      new Blob(["png"], { type: "image/png" }),
      "card.png",
    );
    expect(canSharePostcardFile(file)).toBe(false);
  });
});

describe("postcardFileFromBlob", () => {
  it("names the file and keeps the PNG type", () => {
    const file = postcardFileFromBlob(
      new Blob(["png"], { type: "image/png" }),
      "u11-girls-2026-03-08-vs-riverside.png",
    );
    expect(file.name).toBe("u11-girls-2026-03-08-vs-riverside.png");
    expect(file.type).toBe("image/png");
  });
});
