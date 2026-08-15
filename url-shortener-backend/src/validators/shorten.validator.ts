import * as z from "zod";

export const LinkType = {
  Normal: "normal",
  Custom: "custom",
} as const;

export type LinkTypeValues = (typeof LinkType)[keyof typeof LinkType];

export const ShortenSchema = z.object({
  url: z
    .url({ error: "Invalid URL format" })
    .max(512)
    .refine(
      (val: string) => val.startsWith("http://") || val.startsWith("https://"),
      {
        message: "URL must use HTTP or HTTPS protocol",
      },
    ),
  customCode: z
    .string()
    .min(3, "Custom code must be at least 3 characters long")
    .max(32, "Custom code must be at most 32 characters long")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Custom code can only comtain letters, numbers, underscoresm, and hyphens",
    )
    .optional(),
  linkType: z.enum([LinkType.Normal, LinkType.Custom]).default(LinkType.Normal),
});

export type Shorten = z.infer<typeof ShortenSchema>;
