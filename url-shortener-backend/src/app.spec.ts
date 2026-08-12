import { describe, it, expect } from "vitest";
import { app } from "./app.js";

describe("Test 'app' file", () => {
  it("should rate limit when more then 50 requests have been sent in a miute globally", async () => {
    let response;
    const MAX_CALL_LIMIT = 50;

    for (let i = 0; i < MAX_CALL_LIMIT + 1; i++) {
      response = await app.inject({
        method: "GET",
        url: "/ping",
      });
    }

    expect(response?.statusCode).toBe(429);
  });
});
