import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

export async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const client = postgres(databaseUrl, {
    max: 1,
  });

  const migrationDb = drizzle(client);

  try {
    console.log("Running migrations...");
    await migrate(migrationDb, {
      migrationsFolder: "./drizzle",
    });
    console.log("Migrations completed successfully.");
  } catch (error) {
    console.error("An error occurred during database migration:", error);
    throw error;
  } finally {
    await client.end();
  }
}

