import type { FastifyInstance } from "fastify";

export async function pingRoutes(fastify: FastifyInstance) {
  fastify.get("/ping", async (_request, _reply) => {
    return {
      status: "ok",
      version: process.env.GIT_SHA ?? "dev",
    };
  });
}
