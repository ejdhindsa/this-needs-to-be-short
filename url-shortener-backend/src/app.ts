import Fastify from "fastify";
import { pingRoutes } from "./routes/ping.route.js";
import { shortenRoutes } from "./routes/shorten.route.js";
import { redirectRoutes } from "./routes/redirect.route.js";

export const app = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
    },
  },
});

app.register(pingRoutes);
app.register(shortenRoutes);
app.register(redirectRoutes);
