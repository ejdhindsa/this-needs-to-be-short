import { type FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { ShortenSchema } from "../validators/shorten.validator.js";
import { link } from "../db/schema/link.js";
import randomCodeGenerator from "../utils/randomCodeGenerator.js";
import { LinkType } from "../validators/shorten.validator.js";
import { toLinkResponse } from "../dto/link.dto.js";
import { isUniqueViolation } from "../db/errors.js";

const MaxRetries = {
  maxRetries: 5,
} as const;

export async function shortenRoutes(fastify: FastifyInstance) {
  fastify.post("/shorten", async (request, reply) => {
    const result = ShortenSchema.safeParse(request.body);
    if (!result.success) {
      return reply.status(400).send({
        error: "Validation failed",
        issues: result.error.issues,
      });
    }

    if (result.data.customCode) {
      try {
        const queryString = result.data.customCode;

        const [insertedLink] = await db
          .insert(link)
          .values({
            shortCode: queryString,
            originalURL: result.data.url,
            linkType: LinkType.Custom,
          })
          .returning();

        if (!insertedLink) {
          return reply.status(500).send({ error: "Internal Server Error" });
        }

        return reply.status(201).send(toLinkResponse(insertedLink));
      } catch (err: unknown) {
        if (isUniqueViolation(err)) {
          request.log.warn(err);
          return reply.status(409).send({
            error: "The requested shortcode already exists in the database",
          });
        }
        request.log.error(err);
        return reply.status(500).send({ error: "Internal Server Error" });
      }
    } else {
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
              linkType: LinkType.Normal,
            })
            .returning();

          if (!insertedLink) {
            continue;
          }

          return reply.status(201).send(toLinkResponse(insertedLink));
        } catch (err: unknown) {
          if (isUniqueViolation(err)) {
            continue;
          }
          request.log.error(err);
          return reply.status(500).send({ error: "Internal Server Error" });
        }
      }
    }

    return reply
      .status(500)
      .send({ error: "Unable to generate unique shortcode" });
  });
}
