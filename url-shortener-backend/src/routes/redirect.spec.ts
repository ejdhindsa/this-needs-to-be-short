import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { app } from "../app.js";
import { db } from "../db/index.js";
import { link } from "../db/schema/link.js";
import { eq } from "drizzle-orm";
import { clicks } from "../db/schema/clicks.js";

let testId: string;

beforeAll(async () => {
  const [insertedLink] = await db
    .insert(link)
    .values({
      shortCode: "test-code",
      originalURL: "https://ekamjot.me",
    })
    .returning();

  if (insertedLink) {
    testId = insertedLink.sid;
  }
});

afterAll(async () => {
  if (testId) {
    await db.delete(clicks).where(eq(clicks.linkId, testId));
    await db.delete(link).where(eq(link.sid, testId));
  }
});

describe("Test redirect() file", () => {
  it("should return 404 when no row exists", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/redirect/this-doesnt-exist",
    });

    expect(response.statusCode).toEqual(404);
  });

  it("should redirect to the original link when the short code exists", async () => {
    const response = await app.inject({
      method: "GET",
      url: "/redirect/test-code",
    });

    expect(response.statusCode).toEqual(302);
    expect(response.headers.location).toEqual("https://ekamjot.me");
  });

  it("should record the clicks in the clicks database", async () => {
    const recordedClicks = await db
      .select()
      .from(clicks)
      .where(eq(clicks.linkId, testId));

    expect(recordedClicks.length).toEqual(1);
  });
});
