import * as z from "zod";

const LinkType = {
  Normal: "normal",
  Sketchy: "sketchy",
  Chaos: "chaos",
} as const;

export const ShortenSchema = z.object({
  url: z.url(),
  linkType: z.enum(LinkType).catch(LinkType.Normal).optional(),
});

export type Shorten = z.infer<typeof ShortenSchema>;
