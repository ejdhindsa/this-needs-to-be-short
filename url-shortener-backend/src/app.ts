import Fastify from "fastify";
import { pingRoutes } from "./routes/ping.js";

export const app = Fastify({
  logger: {
    transport: {
      target: "pino-pretty",
    },
  },
});

app.register(pingRoutes);
