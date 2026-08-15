import Fastify from "fastify";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyCors from "@fastify/cors";
import { pingRoutes } from "./routes/ping.route.js";
import { shortenRoutes } from "./routes/shorten.route.js";
import { redirectRoutes } from "./routes/redirect.route.js";
import { analyticsRoute } from "./routes/analytics.route.js";

const isProduction = process.env.NODE_ENV === "production";
const port = Number(process.env.PORT) || 3000;

export const app = Fastify({
  trustProxy: true,
  logger: isProduction
    ? true
    : {
        transport: {
          target: "pino-pretty",
          options: {
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
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
    reply.code(404).send({ error: "Route not found" });
  },
);

await app.register(fastifyCors, {
  origin: [
    "https://shortener.unwreck.dev",
    ...(isProduction ? [] : ["http://localhost:5173"]),
  ],
});

app.register(pingRoutes);
app.register(shortenRoutes);
app.register(redirectRoutes);
app.register(analyticsRoute);
