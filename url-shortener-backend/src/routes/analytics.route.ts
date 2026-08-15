import type { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { clicks } from "../db/schema/clicks.js";
import { link } from "../db/schema/link.js";
import { eq, count, desc } from "drizzle-orm";

interface AnalyticsRouteType {
  Params: { shortCode: string };
  Querystring: { page?: string; limit?: string };
}

export async function analyticsRoute(fastify: FastifyInstance) {
  fastify.get<AnalyticsRouteType>(
    "/analytics/:shortCode",
    async (request, reply) => {
      const { shortCode } = request.params;
      const page = Math.max(Number(request.query?.page) || 1, 1);
      const limit = Math.min(
        Math.max(Number(request.query?.limit) || 50, 1),
        100,
      );
      const offset = (page - 1) * limit;

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

        const [countResult] = await db
          .select({
            totalClicks: count(),
          })
          .from(clicks)
          .where(eq(clicks.linkId, targetLink.sid));

        const totalClicks = countResult?.totalClicks ?? 0;
        const totalPages = Math.ceil(totalClicks / limit) || 1;

        const clickRecords = await db
          .select({
            clickId: clicks.clickId,
            referrer: clicks.referrer,
            clickedAt: clicks.clickedAt,
          })
          .from(clicks)
          .where(eq(clicks.linkId, targetLink.sid))
          .orderBy(desc(clicks.clickedAt))
          .limit(limit)
          .offset(offset);

        return reply.code(200).send({
          shortCode: targetLink.shortCode,
          originalURL: targetLink.originalURL,
          linkType: targetLink.linkType,
          totalClicks,
          page,
          limit,
          totalPages,
          clicks: clickRecords,
        });
      } catch (error) {
        request.log.error(error);
        return reply.code(500).send({ error: "Error processing the request" });
      }
    },
  );
}
