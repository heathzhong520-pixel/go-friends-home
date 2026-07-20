import { defineConfig } from "drizzle-kit";
import { resolveDatabaseUrl } from "./lib/database-url";

export default defineConfig({
  out: "./drizzle",
  schema: "./db/schema.ts",
  dialect: "mysql",
  dbCredentials: {
    url: resolveDatabaseUrl(process.env, "mysql://gofriends:gofriends@127.0.0.1:3306/gofriends-home"),
  },
});
