import type { FastifyInstance } from "fastify";

export async function pingRoutes(fastify: FastifyInstance) {
  fastify.get("/ping", async (request, reply) => {
    return { status: "ok" };
  });
}
