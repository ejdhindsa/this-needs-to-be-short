import type { link } from "../db/schema/link.js";

export interface LinkResponse {
  shortCode: string;
  originalURL: string;
  linkType: string;
  createdAt: Date;
}

export function toLinkResponse(row: typeof link.$inferSelect): LinkResponse {
  return {
    shortCode: row.shortCode,
    originalURL: row.originalURL,
    linkType: row.linkType,
    createdAt: row.createdAt,
  };
}
