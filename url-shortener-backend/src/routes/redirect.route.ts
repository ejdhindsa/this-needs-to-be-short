import { type FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { link } from "../db/schema/link.js";
import { clicks } from "../db/schema/clicks.js";
import { eq } from "drizzle-orm";

interface RedirectRouteType {
  Params: { shortCode: string };
}

export async function redirectRoutes(fastify: FastifyInstance) {
  fastify.get<RedirectRouteType>(
    "/redirect/:shortCode",
    async (request, reply) => {
      const { shortCode } = request.params;

      const redirectRow = await db
        .select()
        .from(link)
        .where(eq(link.shortCode, shortCode));

      const targetLink = redirectRow[0];

      if (!targetLink) {
        return reply.code(404).send({ error: "Item not found! " });
      }

      await db.insert(clicks).values({ linkId: targetLink.sid }).returning();

      return reply.code(302).redirect(targetLink.originalURL);
    },
  );
}
