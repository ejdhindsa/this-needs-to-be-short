import * as p from "drizzle-orm/pg-core";
import { link } from "./link.js";

export const clicks = p.pgTable("clicks", {
  clickId: p
    .uuid("click_id")
    .$defaultFn(() => crypto.randomUUID())
    .primaryKey()
    .notNull(),
  linkId: p
    .uuid("link_id")
    .references(() => link.sid)
    .notNull(),
  referrer: p.varchar(),
  clickedAt: p.timestamp("clicked_at").defaultNow().notNull(),
});
