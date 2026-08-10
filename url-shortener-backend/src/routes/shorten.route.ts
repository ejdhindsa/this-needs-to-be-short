import { type FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { ShortenSchema } from "../validators/shorten.validator.js";
import { link } from "../db/schema/link.js";
import randomCodeGenerator from "../utils/randomCodeGenerator.js";

const MaxRetries = {
  maxRetries: 5,
} as const;

export async function shortenRoutes(fastify: FastifyInstance) {
  fastify.post("/shorten", async (request, reply) => {
    const result = ShortenSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send(result.error.issues);
    }

    // inserting the generated query url to the database
    // try inserted until a unique link is inserted or max retries are exhausted
    for (let i = 0; i < MaxRetries.maxRetries; i++) {
      try {
        const queryString = randomCodeGenerator();

        const [insertedLink] = await db
          .insert(link)
          .values({
            shortCode: queryString,
            originalURL: result.data.url,
            linkType: result.data.linkType,
          })
          .returning();

        return reply.status(201).send(insertedLink);
      } catch (err: any) {
        if (err?.code === "23505" || err?.cause?.code === "23505") {
          continue;
        }
        return reply.status(500).send(err);
      }
    }

    return reply
      .status(500)
      .send({ error: "Unable to generate unique shortcode" });
  });
}
