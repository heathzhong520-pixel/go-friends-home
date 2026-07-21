type DatabaseEnv = Record<string, string | undefined>;

function normalizeEnvValue(value: string | undefined) {
  if (!value || value.length < 2) return value;
  const first = value[0];
  const last = value[value.length - 1];
  return (first === '"' && last === '"') || (first === "'" && last === "'") ? value.slice(1, -1) : value;
}

export function resolveDatabaseUrl(env: DatabaseEnv = process.env, fallback?: string) {
  const configuredUrl = normalizeEnvValue(env.DATABASE_URL);
  if (configuredUrl) return configuredUrl;

  const host = normalizeEnvValue(env.DB_HOST);
  const user = normalizeEnvValue(env.DB_USER);
  const password = normalizeEnvValue(env.DB_PASSWORD);
  if (host && user && password !== undefined) {
    const port = normalizeEnvValue(env.DB_PORT) || "3306";
    const database = normalizeEnvValue(env.DB_NAME) || "gofriends-home";
    return `mysql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@${host}:${port}/${encodeURIComponent(database)}`;
  }

  if (fallback) return fallback;
  throw new Error("DATABASE_URL or DB_HOST/DB_USER/DB_PASSWORD is not configured");
}
