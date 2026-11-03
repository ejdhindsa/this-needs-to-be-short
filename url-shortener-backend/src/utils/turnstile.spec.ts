import { describe, it, expect, vi, beforeEach } from "vitest";
import { verifyTurnstile } from "./turnstile.js";

describe("Turnstile verification utility", () => {
  const TEST_SECRET_KEY = "1x0000000000000000000000000000000AA";

  beforeEach(() => {
    process.env.TURNSTILE_SECRET_KEY = TEST_SECRET_KEY;
  });

  it("should return true when verification is successful", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });

    const result = await verifyTurnstile(
      "test-token",
      "127.0.0.1",
      mockFetch as unknown as typeof fetch,
    );

    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: TEST_SECRET_KEY,
          response: "test-token",
          remoteip: "127.0.0.1",
        }),
      }),
    );
  });

  it("should return false when verification fails", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: false,
        "error-codes": ["invalid-input-response"],
      }),
    });

    const result = await verifyTurnstile(
      "invalid-token",
      undefined,
      mockFetch as unknown as typeof fetch,
    );

    expect(result).toBe(false);
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({
        body: JSON.stringify({
          secret: TEST_SECRET_KEY,
          response: "invalid-token",
        }),
      }),
    );
  });

  it("should throw an error when TURNSTILE_SECRET_KEY is missing", async () => {
    delete process.env.TURNSTILE_SECRET_KEY;

    await expect(verifyTurnstile("test-token")).rejects.toThrow(
      "Missing Turnstile Secret Key",
    );
  });

  it("should throw an error when upstream returns non-200 status", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    await expect(
      verifyTurnstile(
        "test-token",
        undefined,
        mockFetch as unknown as typeof fetch,
      ),
    ).rejects.toThrow("Turnstile verification failed with status: 500");
  });

  it("should throw an error when fetch times out or is aborted", async () => {
    const mockFetch = vi
      .fn()
      .mockRejectedValue(
        new DOMException("The operation was aborted", "TimeoutError"),
      );

    await expect(
      verifyTurnstile(
        "test-token",
        undefined,
        mockFetch as unknown as typeof fetch,
      ),
    ).rejects.toThrow("The operation was aborted");
  });
});
