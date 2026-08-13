import { describe, it, expect, vi, beforeEach } from "vitest";
import { app } from "../app.js";
import { db } from "../db/index.js";
import { link } from "../db/schema/link.js";
import { clicks } from "../db/schema/clicks.js";
import randomCodeGenerator from "../utils/randomCodeGenerator.js";
import { LinkType } from "../validators/shorten.validator.js";

vi.mock("../utils/randomCodeGenerator.js", () => ({
  default: vi.fn(),
}));

describe("Test shorten route", () => {
  beforeEach(async () => {
    await db.delete(clicks);
    await db.delete(link);
    vi.clearAllMocks();
  });

  it("should be successful with all required parameters", async () => {
    vi.mocked(randomCodeGenerator).mockReturnValue("Default123");

    const response = await app.inject({
      method: "POST",
      url: "/shorten",
      payload: { url: "https://www.google.com" },
    });
    const body = response.json();

    expect(response.statusCode).toEqual(201);
    expect(body).toHaveProperty("shortCode");
    expect(body.originalURL).toEqual("https://www.google.com");
  });

  it("should be unsuccessful with illegal parameters", async () => {
    const response = await app.inject({
      method: "POST",
      url: "/shorten",
      payload: { url: "not-a-url" },
    });

    expect(response.statusCode).toBe(400);
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
      url: "/shorten",
      payload: { url: "https://www.google.com" },
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
      url: "/shorten",
      payload: { url: "https://www.google.com" },
    });

    const body = response.json();

    expect(response.statusCode).toEqual(500);
    expect(body).toEqual({ error: "Unable to generate unique shortcode" });
  });

  it("should create a link with custom code", async () => {
    const customCode = `forRogalDorn_${crypto.randomUUID().slice(0, 5)}`;

    const response = await app.inject({
      method: "POST",
      url: "/shorten",
      payload: {
        url: "https://www.ekamjot.me",
        customCode,
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
      url: "/shorten",
      payload: {
        url: "https://www.google.com",
        customCode,
      },
    });

    const response = await app.inject({
      method: "POST",
      url: "/shorten",
      payload: {
        url: "https://www.google.com",
        customCode,
      },
    });

    expect(response.statusCode).toEqual(409);
    expect(response.json()).toEqual({
      error: "The requested shortcode already exists in the database",
    });
  });
});
