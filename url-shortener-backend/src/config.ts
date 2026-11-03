import "dotenv/config";
import * as z from "zod";

const optionalEnvString = z
  .string()
  .transform((val) => (val.trim() === "" ? undefined : val))
  .optional();

export const configSchema = z
  .object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
    PORT: z.coerce.number().default(3000),
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    SAFE_BROWSING_API_KEY: optionalEnvString,
    TURNSTILE_SECRET_KEY: optionalEnvString,
  })
  .superRefine((data, ctx) => {
    if (data.NODE_ENV === "production") {
      if (!data.SAFE_BROWSING_API_KEY) {
        ctx.addIssue({
          code: "custom",
          message: "SAFE_BROWSING_API_KEY is required in production",
          path: ["SAFE_BROWSING_API_KEY"],
        });
      }
      if (!data.TURNSTILE_SECRET_KEY) {
        ctx.addIssue({
          code: "custom",
          message: "TURNSTILE_SECRET_KEY is required in production",
          path: ["TURNSTILE_SECRET_KEY"],
        });
      }
    }
  });

export type Config = z.infer<typeof configSchema>;

export function parseConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = configSchema.safeParse(env);
  if (!result.success) {
    const formatted = JSON.stringify(result.error.format(), null, 2);
    console.error(`Configuration validation failed:\n${formatted}`);
    throw new Error(`Configuration validation failed: ${result.error.message}`);
  }

  const parsed = result.data;

  if (parsed.NODE_ENV !== "production") {
    if (!parsed.SAFE_BROWSING_API_KEY) {
      console.warn(
        "Warning: SAFE_BROWSING_API_KEY is not set. Safe browsing checks are disabled.",
      );
    }
    if (!parsed.TURNSTILE_SECRET_KEY) {
      console.warn(
        "Warning: TURNSTILE_SECRET_KEY is not set. Turnstile verification is disabled.",
      );
    }
  }

  return parsed;
}

export const config = parseConfig();
