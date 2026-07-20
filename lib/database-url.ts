type DatabaseEnv = Record<string, string | undefined>;

export function resolveDatabaseUrl(env: DatabaseEnv = process.env, fallback?: string) {
  if (env.DATABASE_URL) return env.DATABASE_URL;

  const host = env.DB_HOST;
  const user = env.DB_USER;
  const password = env.DB_PASSWORD;
  if (host && user && password !== undefined) {
    const port = env.DB_PORT || "3306";
    const database = env.DB_NAME || "gofriends-home";
    return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`;
  }

  if (fallback) return fallback;
  throw new Error("DATABASE_URL or DB_HOST/DB_USER/DB_PASSWORD is not configured");
}
