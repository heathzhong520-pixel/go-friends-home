#!/usr/bin/env node

import path from "node:path";

// vinext 0.0.50 builds its static-file cache from path.relative(). On
// Windows that produces backslashes, while request URLs always use slashes.
// Normalize only on Windows until the upstream production server does so.
if (process.platform === "win32") {
  const platformRelative = path.relative.bind(path);
  path.relative = (from, to) => platformRelative(from, to).split(path.sep).join("/");
}

const { startProdServer } = await import("vinext/server/prod-server");
const port = Number.parseInt(process.env.PORT ?? "3000", 10);
const host = process.env.HOST ?? "0.0.0.0";

await startProdServer({
  port,
  host,
  outDir: path.resolve("dist"),
});
