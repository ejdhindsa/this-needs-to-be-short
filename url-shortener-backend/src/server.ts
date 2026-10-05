import { app } from "./app.js";
import { runMigrations } from "./db/migrate.js";

const port = Number(process.env.PORT) || 3000;

const start = async () => {
  try {
    await runMigrations();
    await app.listen({ port, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
