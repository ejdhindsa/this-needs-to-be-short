import * as p from "drizzle-orm/pg-core";
import { link } from "./link.js";

export const clicks = p.pgTable(
  "clicks",
  {
    clickId: p
      .uuid("click_id")
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey()
      .notNull(),
    linkId: p
      .uuid("link_id")
      .references(() => link.sid, { onDelete: "cascade" })
      .notNull(),
    referrer: p.varchar(),
    clickedAt: p.timestamp("clicked_at").defaultNow().notNull(),
  },
  (table) => [p.index("link_idx").on(table.linkId)],
);
