import { describe, it, expect, vi, beforeEach } from "vitest";
import { isUrlSafe } from "./safeBrowsing.js";

describe("Safe Browsing utility", () => {
  beforeEach(() => {
    process.env.SAFE_BROWSING_API_KEY = "test-api-key";
  });

  it("should return true when no threats are matched", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ matches: [] }),
    });

    const result = await isUrlSafe("https://example.com", mockFetch as unknown as typeof fetch);
    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it("should return false when threat matches are returned", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        matches: [{ threatType: "MALWARE", platformType: "ANY_PLATFORM" }],
      }),
    });

    const result = await isUrlSafe(
      "https://malware.testing.google.test",
      mockFetch as unknown as typeof fetch,
    );
    expect(result).toBe(false);
  });

  it("should throw an error when upstream returns non-200 status", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    await expect(
      isUrlSafe("https://example.com", mockFetch as unknown as typeof fetch),
    ).rejects.toThrow("Safe browsing error: 500");
  });

  it("should throw an error when fetch times out or is aborted", async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValue(new DOMException("The operation was aborted", "TimeoutError"));

    await expect(
      isUrlSafe("https://example.com", mockFetch as unknown as typeof fetch),
    ).rejects.toThrow("The operation was aborted");
  });
});
