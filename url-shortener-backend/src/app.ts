import Fastify from "fastify";
import { pingRoutes } from "./routes/ping.route.js";
import { shortenRoutes } from "./routes/shorten.route.js";

const isProduction = process.env.NODE_ENV === 'production';

export const app = Fastify({
  logger: isProduction
  ? true
  : {
      transport: {
        target: "pino-pretty",
	options: {
	  translateTime: 'HH:M:ss Z',
	  ignore: 'oid,hostname',
	},
      },
    },
});

app.register(pingRoutes);
app.register(shortenRoutes);
