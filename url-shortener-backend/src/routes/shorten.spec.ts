import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { app } from "../app.js";
import { db } from "../db/index.js";
import { link } from "../db/schema/link.js";
import { clicks } from "../db/schema/clicks.js";
import randomCodeGenerator from "../utils/randomCodeGenerator.js";
import { LinkType } from "../validators/shorten.validator.js";
import { verifyTurnstile } from "../utils/turnstile.js";

vi.mock("../utils/randomCodeGenerator.js", () => ({
  default: vi.fn(),
}));

vi.mock("../utils/turnstile.js", () => ({
  verifyTurnstile: vi.fn().mockResolvedValue(true),
}));

afterEach(() => {
  vi.clearAllMocks();
});

describe("Test shorten route", () => {
  beforeEach(async () => {
    try {
      await db.delete(clicks);
      await db.delete(link);
    } catch {
      // In test environments without Postgres, DB cleanup is skipped
    }
    vi.clearAllMocks();
    process.env.TURNSTILE_SECRET_KEY = "1x0000000000000000000000000000000AA";
    vi.mocked(verifyTurnstile).mockResolvedValue(true);
  });

  it("should be successful with all required parameters", async () => {
    vi.mocked(randomCodeGenerator).mockReturnValue("Default123");

    const response = await app.inject({
      method: "POST",
      url: "/api/shorten",
      payload: {
        url: "https://www.google.com",
        turnstileToken: "valid-token",
      },
    });
    const body = response.json();

    expect(response.statusCode).toEqual(201);
    expect(body).toHaveProperty("shortCode");
    expect(body.originalURL).toEqual("https://www.google.com");
    expect(body).not.toHaveProperty("sid");
    expect(body).toHaveProperty("linkType");
    expect(body).toHaveProperty("createdAt");
  });

  it("should be unsuccessful with illegal parameters", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/shorten",
      payload: { url: "not-a-url" },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: "Validation failed",
      issues: expect.any(Array),
    });
  });

  it("should retry and succeed if the shortcode generated is not unique", async () => {
    const duplicateCode = `dup_${crypto.randomUUID().slice(0, 8)}`;
    const successCode = `succ_${crypto.randomUUID().slice(0, 8)}`;

    await db.insert(link).values({
      shortCode: duplicateCode,
      originalURL: "https://www.google.com",
    });

    vi.mocked(randomCodeGenerator)
      .mockReturnValueOnce(duplicateCode)
      .mockReturnValueOnce(successCode);

    const response = await app.inject({
      method: "POST",
      url: "/api/shorten",
      payload: {
        url: "https://www.google.com",
        turnstileToken: "valid-token",
      },
    });

    const body = response.json();

    expect(response.statusCode).toEqual(201);
    expect(body.shortCode).toEqual(successCode);
  });

  it("should return 500 when max retries are exhausted", async () => {
    const duplicateCode = `always_${crypto.randomUUID().slice(0, 8)}`;

    await db.insert(link).values({
      shortCode: duplicateCode,
      originalURL: "https://www.google.com",
    });

    vi.mocked(randomCodeGenerator).mockReturnValue(duplicateCode);

    const response = await app.inject({
      method: "POST",
      url: "/api/shorten",
      payload: {
        url: "https://www.google.com",
        turnstileToken: "valid-token",
      },
    });

    const body = response.json();

    expect(response.statusCode).toEqual(500);
    expect(body).toEqual({ error: "Unable to generate unique shortcode" });
  });

  it("should create a link with custom code", async () => {
    const customCode = `forRogalDorn_${crypto.randomUUID().slice(0, 5)}`;

    const response = await app.inject({
      method: "POST",
      url: "/api/shorten",
      payload: {
        url: "https://www.ekamjot.me",
        customCode,
        turnstileToken: "valid-token",
      },
    });

    expect(response.statusCode).toEqual(201);
    const body = response.json();
    expect(body.shortCode).toEqual(customCode);
    expect(body.linkType).toEqual(LinkType.Custom);
  });

  it("should return 409 for duplicate custom code", async () => {
    const customCode = `forTheEmperor01xxxx23`;

    await app.inject({
      method: "POST",
      url: "/api/shorten",
      payload: {
        url: "https://www.google.com",
        customCode,
        turnstileToken: "valid-token",
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/shorten",
      payload: {
        url: "https://www.google.com",
        customCode,
        turnstileToken: "valid-token",
      },
    });

    expect(response.statusCode).toEqual(409);
    expect(response.json()).toEqual({
      error: "The requested shortcode already exists in the database",
    });
  });

  it("should return 500 when the database server fails for normal codes", async () => {
    const spy = vi.spyOn(db, "insert");

    spy.mockImplementationOnce(() => {
      throw new Error("Database Internal Failure");
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/shorten",
      payload: {
        url: "https://ekamjot.me",
        turnstileToken: "valid-token",
      },
    });

    expect(response.statusCode).toBe(500);

    const body = response.json();
    expect(body).toEqual({ error: "Internal Server Error" });
  });

  it("should return 500 when the database fails for custom codes", async () => {
    const customCode = `forTheEmperor01xxxx24`;
    const spy = vi.spyOn(db, "insert");

    spy.mockImplementationOnce(() => {
      throw new Error("Database Internal Failure");
    });

    const response = await app.inject({
      method: "POST",
      url: "/api/shorten",
      payload: {
        url: "https://ekamjot.me",
        customCode,
        turnstileToken: "valid-token",
      },
    });

    expect(response.statusCode).toBe(500);

    const body = response.json();
    expect(body).toEqual({ error: "Internal Server Error" });
  });

  it("should not accept links that do not start with http or https", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/shorten",
      payload: {
        url: "www.ekamjot.me",
        turnstileToken: "valid-token",
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("should reject custom shortcode links that do not start with http or https", async () => {
    const customCode = `forTheEmperor01xxxx25`;

    const response = await app.inject({
      method: "POST",
      url: "/api/shorten",
      payload: {
        url: "ekamjot.me",
        customCode,
        turnstileToken: "valid-token",
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("should not accept links longer than 2048 characters", async () => {
    const longUrl =
      "https://" +
      Array.from({ length: 2048 }, () =>
        Math.random().toString(36).charAt(2),
      ).join("");

    const response = await app.inject({
      method: "POST",
      url: "/api/shorten",
      payload: {
        url: longUrl,
        turnstileToken: "valid-token",
      },
    });

    expect(response.statusCode).toBe(400);
  });

  it("should reject reserved aliases case-insensitively", async () => {
    const reservedSamples = [
      "api",
      "API",
      "Ping",
      "ADMIN",
      "health",
      "static",
      "assets",
      "shorten",
    ];

    for (const alias of reservedSamples) {
      const response = await app.inject({
        method: "POST",
        url: "/api/shorten",
        payload: {
          url: "https://example.com",
          customCode: alias,
          turnstileToken: "valid-token",
        },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error).toBe("Validation failed");
      expect(body.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: "This alias is reserved",
          }),
        ]),
      );
    }
  });

  it("should never return raw row with sid in response DTO", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/shorten",
      payload: {
        url: "https://example.com",
        turnstileToken: "valid-token",
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body).toHaveProperty("shortCode");
    expect(body).toHaveProperty("originalURL");
    expect(body).toHaveProperty("linkType");
    expect(body).toHaveProperty("createdAt");
    expect(body).not.toHaveProperty("sid");
  });

  it("should reject URLs pointing to s.unwreck.dev or shortener.unwreck.dev with 400", async () => {
    const disallowedUrls = [
      "https://s.unwreck.dev/abc",
      "https://shortener.unwreck.dev/dashboard",
    ];

    for (const url of disallowedUrls) {
      const response = await app.inject({
        method: "POST",
        url: "/api/shorten",
        payload: {
          url,
          turnstileToken: "valid-token",
        },
      });

      expect(response.statusCode).toBe(400);
      const body = response.json();
      expect(body.error).toBe("Validation failed");
      expect(body.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: "Cannot shorten URLs pointing to this service",
          }),
        ]),
      );
    }
  });

  it("should return 422 when URL is flagged as unsafe by Safe Browsing", async () => {
    const originalKey = process.env.SAFE_BROWSING_API_KEY;
    process.env.SAFE_BROWSING_API_KEY = "test-api-key";

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        matches: [{ threatType: "MALWARE", platformType: "ANY_PLATFORM" }],
      }),
    } as unknown as Response);

    const response = await app.inject({
      method: "POST",
      url: "/api/shorten",
      payload: {
        url: "https://malware.testing.google.test",
        turnstileToken: "valid-token",
      },
    });

    expect(response.statusCode).toBe(422);
    expect(response.json()).toEqual({
      error: "This URL is flagged as unsafe",
    });
    expect(fetchSpy).toHaveBeenCalled();

    if (originalKey !== undefined) {
      process.env.SAFE_BROWSING_API_KEY = originalKey;
    } else {
      delete process.env.SAFE_BROWSING_API_KEY;
    }
  });

  it("should return 503 when Safe Browsing check fails or times out (fail-closed)", async () => {
    const originalKey = process.env.SAFE_BROWSING_API_KEY;
    process.env.SAFE_BROWSING_API_KEY = "test-api-key";

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new DOMException("The operation was aborted", "TimeoutError"),
    );

    const response = await app.inject({
      method: "POST",
      url: "/api/shorten",
      payload: {
        url: "https://example.com",
        turnstileToken: "valid-token",
      },
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      error: "Safety check unavailable, try again shortly",
    });
    expect(fetchSpy).toHaveBeenCalled();

    if (originalKey !== undefined) {
      process.env.SAFE_BROWSING_API_KEY = originalKey;
    } else {
      delete process.env.SAFE_BROWSING_API_KEY;
    }
  });

  it("should reject with 400 when turnstileToken is missing", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/api/shorten",
      payload: { url: "https://example.com" },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.error).toBe("Validation failed");
    expect(body.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: expect.arrayContaining(["turnstileToken"]),
        }),
      ]),
    );
  });

  it("should return 403 when captcha verification fails", async () => {
    vi.mocked(verifyTurnstile).mockResolvedValueOnce(false);

    const response = await app.inject({
      method: "POST",
      url: "/api/shorten",
      payload: {
        url: "https://example.com",
        turnstileToken: "invalid-token",
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({
      error: "Captcha verification failed",
    });
  });

  it("should return 403 when captcha verification throws an error", async () => {
    vi.mocked(verifyTurnstile).mockRejectedValueOnce(
      new Error("Network timeout"),
    );

    const response = await app.inject({
      method: "POST",
      url: "/api/shorten",
      payload: {
        url: "https://example.com",
        turnstileToken: "some-token",
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toEqual({
      error: "Captcha verification failed",
    });
  });

  it("should verify Turnstile before running Safe Browsing", async () => {
    vi.mocked(verifyTurnstile).mockResolvedValueOnce(false);
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const response = await app.inject({
      method: "POST",
      url: "/api/shorten",
      payload: {
        url: "https://example.com",
        turnstileToken: "invalid-token",
      },
    });

    expect(response.statusCode).toBe(403);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

