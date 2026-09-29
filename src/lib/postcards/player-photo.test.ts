import { readFile } from "node:fs/promises";
import { afterEach, describe, expect, it, vi } from "vitest";
import { playerPhotoPlaceholderDataUrl } from "@/lib/postcards/player-photo";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
}));

const readFileMock = vi.mocked(readFile);

describe("playerPhotoPlaceholderDataUrl", () => {
  afterEach(() => {
    readFileMock.mockReset();
  });

  it("inlines the placeholder from disk", async () => {
    readFileMock.mockResolvedValue(Buffer.from([1, 2, 3]));
    const url = await playerPhotoPlaceholderDataUrl();
    expect(readFileMock).toHaveBeenCalledWith(
      expect.stringMatching(/public[/\\]player-card-photo\.jpg$/),
    );
    expect(url).toBe("data:image/jpeg;base64,AQID");
  });

  it("returns null when the placeholder cannot be read", async () => {
    readFileMock.mockRejectedValue(new Error("ENOENT"));
    expect(await playerPhotoPlaceholderDataUrl()).toBeNull();
  });
});
