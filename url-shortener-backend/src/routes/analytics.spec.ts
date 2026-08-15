import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { app } from "../app.js";
import { db } from "../db/index.js";
import { link } from "../db/schema/link.js";
import { eq } from "drizzle-orm";
import { z } from "zod";

let testId: string;
let testCode: string;

beforeAll(async () => {
  testCode = `test_${crypto.randomUUID().slice(0, 8)}`;

  const [insertedLink] = await db
    .insert(link)
    .values({
      shortCode: testCode,
      originalURL: "https://ekamjot.me",
    })
    .returning();

  if (insertedLink) {
    testId = insertedLink.sid;
  }
});

afterAll(async () => {
  if (testId) {
    await db.delete(link).where(eq(link.sid, testId));
  }
});

describe("Test 'analytics' route", () => {
  it("should show an error if the link is not found", async () => {
    const response = await app.inject({
      method: "GET",
      url: "analytics/this-does-not-exist",
    });

    expect(response.statusCode).toEqual(404);
  });

  it("should return still return if there are no clicks on a link", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/analytics/${testCode}`,
    });

    expect(response.statusCode).toEqual(200);

    const body = response.json();
    expect(body.totalClicks).toEqual(0);
    expect(body.clicks).toEqual([]);
  });

  it("should return the number of total clicks accurately", async () => {
    await app.inject({
      method: "GET",
      url: `/redirect/${testCode}`,
    });

    const response = await app.inject({
      method: "GET",
      url: `/analytics/${testCode}`,
    });

    expect(response.statusCode).toEqual(200);

    const body = response.json();
    expect(body.totalClicks).toEqual(1);
    expect(body.clicks).not.toBe(null);
  });

  it("should preserve the shape of the returned json", async () => {
    const ResponseSchema = z.object({
      shortCode: z.string(),
      originalURL: z.string(),
      linkType: z.string(),
      totalClicks: z.number(),
      page: z.number(),
      limit: z.number(),
      totalPages: z.number(),
      clicks: z
        .array(
          z.object({
            clickId: z.string(),
            referrer: z.string().nullable(),
            clickedAt: z.coerce.date(),
          }),
        )
        .nullable(),
    });
    const response = await app.inject({
      method: "GET",
      url: `/analytics/${testCode}`,
    });

    const body = response.json();
    const result = ResponseSchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  it("should return correct pagination metadata with query parameters", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/analytics/${testCode}?page=1&limit=10`,
    });

    expect(response.statusCode).toEqual(200);
    const body = response.json();
    expect(body.page).toEqual(1);
    expect(body.limit).toEqual(10);
    expect(body.totalPages).toEqual(1);
    expect(Array.isArray(body.clicks)).toBe(true);
  });

  it("should floor negative or zero page to 1", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/analytics/${testCode}?page=-5`,
    });

    expect(response.statusCode).toEqual(200);
    const body = response.json();
    expect(body.page).toEqual(1);
  });

  it("should cap limit to 100 when exceeding maximum", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/analytics/${testCode}?limit=500`,
    });

    expect(response.statusCode).toEqual(200);
    const body = response.json();
    expect(body.limit).toEqual(100);
  });

  it("should clamp limit to minimum of 1 when negative", async () => {
    const response = await app.inject({
      method: "GET",
      url: `/analytics/${testCode}?limit=-10`,
    });

    expect(response.statusCode).toEqual(200);
    const body = response.json();
    expect(body.limit).toEqual(1);
  });
});
