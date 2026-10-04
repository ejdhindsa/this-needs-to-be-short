import { configDotenv } from "dotenv";

const initialDatabaseUrl = process.env.DATABASE_URL;

configDotenv({
  path: ".env.test",
  override: true,
  quiet: true,
});

if (initialDatabaseUrl !== undefined) {
  process.env.DATABASE_URL = initialDatabaseUrl;
}

const connectionString = process.env.DATABASE_URL || "";
const connectionURL = new URL(connectionString);
const connectionPath = connectionURL.pathname;

if (!connectionPath.endsWith("_test")) {
  throw Error(
    `Cannot run tests against a non-test database: ${connectionPath}`,
  );
}
