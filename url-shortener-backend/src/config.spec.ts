import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseConfig, configSchema } from "./config.js";

describe("Configuration validator", () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should parse valid configuration in development with defaults", () => {
    const parsed = parseConfig({
      DATABASE_URL: "postgresql://admin:password@localhost:5432/shortener_db",
    });

    expect(parsed.DATABASE_URL).toBe(
      "postgresql://admin:password@localhost:5432/shortener_db",
    );
    expect(parsed.PORT).toBe(3000);
    expect(parsed.NODE_ENV).toBe("development");
    expect(parsed.SAFE_BROWSING_API_KEY).toBeUndefined();
    expect(parsed.TURNSTILE_SECRET_KEY).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("SAFE_BROWSING_API_KEY is not set"),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("TURNSTILE_SECRET_KEY is not set"),
    );
  });

  it("should coerce string port to number", () => {
    const parsed = parseConfig({
      DATABASE_URL: "postgresql://localhost:5432/db",
      PORT: "8080",
    });

    expect(parsed.PORT).toBe(8080);
  });

  it("should treat empty string optional keys as undefined", () => {
    const parsed = parseConfig({
      DATABASE_URL: "postgresql://localhost:5432/db",
      SAFE_BROWSING_API_KEY: "   ",
      TURNSTILE_SECRET_KEY: "",
    });

    expect(parsed.SAFE_BROWSING_API_KEY).toBeUndefined();
    expect(parsed.TURNSTILE_SECRET_KEY).toBeUndefined();
  });

  it("should successfully parse valid production configuration", () => {
    const parsed = parseConfig({
      DATABASE_URL: "postgresql://admin:password@localhost:5432/shortener_prod",
      NODE_ENV: "production",
      SAFE_BROWSING_API_KEY: "real_safe_browsing_key",
      TURNSTILE_SECRET_KEY: "real_turnstile_key",
      PORT: "4000",
    });

    expect(parsed.NODE_ENV).toBe("production");
    expect(parsed.SAFE_BROWSING_API_KEY).toBe("real_safe_browsing_key");
    expect(parsed.TURNSTILE_SECRET_KEY).toBe("real_turnstile_key");
    expect(parsed.PORT).toBe(4000);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("should throw in production if SAFE_BROWSING_API_KEY is missing", () => {
    expect(() =>
      parseConfig({
        DATABASE_URL: "postgresql://localhost:5432/db",
        NODE_ENV: "production",
        TURNSTILE_SECRET_KEY: "real_turnstile_key",
      }),
    ).toThrow("Configuration validation failed");

    expect(errorSpy).toHaveBeenCalled();
  });

  it("should throw in production if TURNSTILE_SECRET_KEY is missing", () => {
    expect(() =>
      parseConfig({
        DATABASE_URL: "postgresql://localhost:5432/db",
        NODE_ENV: "production",
        SAFE_BROWSING_API_KEY: "real_safe_browsing_key",
      }),
    ).toThrow("Configuration validation failed");

    expect(errorSpy).toHaveBeenCalled();
  });

  it("should throw if DATABASE_URL is missing regardless of environment", () => {
    expect(() =>
      parseConfig({
        NODE_ENV: "development",
      }),
    ).toThrow("Configuration validation failed");

    expect(errorSpy).toHaveBeenCalled();
  });
});
