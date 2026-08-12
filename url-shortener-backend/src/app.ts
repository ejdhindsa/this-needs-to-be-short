import Fastify from "fastify";
import fastifyRateLimit from "@fastify/rate-limit";
import { pingRoutes } from "./routes/ping.route.js";
import { shortenRoutes } from "./routes/shorten.route.js";
import { redirectRoutes } from "./routes/redirect.route.js";

const isProduction = process.env.NODE_ENV === "production";

export const app = Fastify({
  logger: isProduction
    ? true
    : {
        transport: {
          target: "pino-pretty",
          options: {
            translateTime: "HH:M:ss Z",
            ignore: "oid,hostname",
          },
        },
      },
});

await app.register(fastifyRateLimit, {
  global: true,
  max: 50,
  timeWindow: "1 minute",
  exponentialBackoff: true,
});

app.setNotFoundHandler(
  {
    preHandler: app.rateLimit(),
  },
  function (_request, reply) {
    reply.code(404).send({ error: "Too many requests, not found!" });
  },
);

app.register(pingRoutes);
app.register(shortenRoutes);
app.register(redirectRoutes);
