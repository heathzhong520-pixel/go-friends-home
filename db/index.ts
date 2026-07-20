import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { resolveDatabaseUrl } from "../lib/database-url";
import * as schema from "./schema";

declare global {
  var __gofriendsMysqlPool: mysql.Pool | undefined;
}

export function getPool() {
  const databaseUrl = resolveDatabaseUrl();

  globalThis.__gofriendsMysqlPool ??= mysql.createPool({
    uri: databaseUrl,
    connectionLimit: 10,
    enableKeepAlive: true,
    timezone: "Z",
  });
  return globalThis.__gofriendsMysqlPool;
}

export function getDb() {
  return drizzle(getPool(), { schema, mode: "default" });
}
