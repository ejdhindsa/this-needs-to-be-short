import * as p from "drizzle-orm/pg-core";

export const link = p.pgTable("link", {
  sid: p
    .uuid("sid")
    .$defaultFn(() => crypto.randomUUID())
    .primaryKey()
    .notNull(),
  shortCode: p.varchar("short_code", { length: 32 }).notNull().unique(),
  originalURL: p.varchar("original_url").notNull(),
  linkType: p.varchar("link_type"),
  createdAt: p.timestamp("created_at").defaultNow().notNull(),
});
