import { describe, it, expect } from "vitest";
import { app } from "../app.js";

describe("Test shorten route", () => {
  it("should be successful with all required parameters", async () => {
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
});
