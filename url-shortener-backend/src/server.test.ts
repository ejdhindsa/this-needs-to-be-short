import { describe, it, expect } from "vitest";
import { app } from "./app.js";

describe("Test server() file", () => {
  it("should return status 200 when pinged", async () => {
    const response = await app.inject({ method: "GET", url: "/ping" });

    expect(response.statusCode).toEqual(200);
    expect(response.json()).toEqual({ status: "ok" });
  });
});
