import type { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { clicks } from "../db/schema/clicks.js";
import { link } from "../db/schema/link.js";
import { eq, desc } from "drizzle-orm";

interface AnalyticsRouteType {
  Params: { shortCode: string };
}

export async function analyticsRoute(fastify: FastifyInstance) {
  fastify.get<AnalyticsRouteType>(
    "/analytics/:shortCode",
    async (request, reply) => {
      const { shortCode } = request.params;

      try {
        const [targetLink] = await db
          .select()
          .from(link)
          .where(eq(link.shortCode, shortCode))
          .limit(1);

        if (!targetLink) {
          return reply
            .code(404)
            .send({ error: "Requested link does not exist." });
        }

        const clickRecords = await db
          .select({
            clickId: clicks.clickId,
            referrer: clicks.referrer,
            clickedAt: clicks.clickedAt,
          })
          .from(clicks)
          .where(eq(clicks.linkId, targetLink.sid))
          .orderBy(desc(clicks.clickedAt));

        return reply.code(200).send({
          shortCode: targetLink.shortCode,
          originalURL: targetLink.originalURL,
          linkType: targetLink.linkType,
          totalClicks: clickRecords.length,
          clicks: clickRecords,
        });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Error processing the request" });
      }
    },
  );
}
