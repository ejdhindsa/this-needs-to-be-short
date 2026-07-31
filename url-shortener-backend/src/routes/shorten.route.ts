import { type FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import crypto from "node:crypto";
import { ShortenSchema } from "../validators/shorten.validator.js";
import { link } from "../db/schema/link.js";

export async function shortenRoutes(fastify: FastifyInstance) {
  fastify.post("/shorten", async (request, reply) => {
    const result = ShortenSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send(result.error.issues);
    }

    const queryString = crypto.randomBytes(4).toString("hex");

    // inserting the generated query url to the database
    const [insertedLink] = await db
      .insert(link)
      .values({
        shortCode: queryString,
        originalURL: result.data.url,
        linkType: result.data.linkType,
      })
      .returning();

    return reply.status(201).send(insertedLink);
  });
}
