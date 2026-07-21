import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

function envValue(name) {
  const value = process.env[name];
  if (!value || value.length < 2) return value;
  const first = value[0];
  const last = value[value.length - 1];
  return (first === '"' && last === '"') || (first === "'" && last === "'") ? value.slice(1, -1) : value;
}

const databaseUrl = envValue("DATABASE_URL") || (
  envValue("DB_HOST") && envValue("DB_USER") && envValue("DB_PASSWORD") !== undefined
    ? `mysql://${encodeURIComponent(envValue("DB_USER"))}:${encodeURIComponent(envValue("DB_PASSWORD"))}@${envValue("DB_HOST")}:${envValue("DB_PORT") || "3306"}/${encodeURIComponent(envValue("DB_NAME") || "gofriends-home")}`
    : ""
);
if (!databaseUrl) throw new Error("DATABASE_URL or DB_HOST/DB_USER/DB_PASSWORD is not configured");

const pool = mysql.createPool({ uri: databaseUrl, connectionLimit: 5, enableKeepAlive: true, timezone: "Z" });

const products = [
  { slug: "nexus-desk", name: "NEXUS / Desk", description: "把零散工作流收进安静、可扩展的桌面工作台。", descriptionEn: "A calm, extensible desktop workspace for scattered workflows.", price: 32900, months: 12, versions: [["2.4.1", "windows", "改进工作区性能、文件拖放与离线可靠性。", "Improved workspace performance, file drag-and-drop, and offline reliability."], ["2.4.1", "macos", "改进工作区性能、文件拖放与离线可靠性。", "Improved workspace performance, file drag-and-drop, and offline reliability."]] },
  { slug: "clarity", name: "Clarity", description: "一款只做一件事的专注计时器。", descriptionEn: "A focused timer designed to do one thing well.", price: 15900, months: 12, versions: [["1.8.0", "macos", "新增专注历史与更安静的提醒方式。", "Added focus history and quieter notification options."]] },
  { slug: "sitefoundry", name: "SiteFoundry", description: "从内容模型到可部署页面，为个人项目缩短发布路径。", descriptionEn: "A shorter path from content model to deployable personal site.", price: 32900, months: 12, versions: [["0.9.6", "web", "更新发布流程、内容校验与部署预览。", "Updated publishing, content validation, and deployment previews."]] },
  { slug: "lighthouse", name: "Lighthouse", description: "集中管理作品链接、版本、状态与公开说明。", descriptionEn: "Manage project links, releases, status, and public notes in one place.", price: 57900, months: 12, versions: [["1.2.0", "web", "新增团队审核与批量发布能力。", "Added team reviews and batch publishing."]] },
];

try {
  if (process.env.AUTO_MIGRATE !== "false") {
    await migrate(drizzle(pool), { migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)) });
  }

  const now = new Date();
  for (const product of products) {
    await pool.execute(
      `INSERT INTO products (id, slug, name, description, description_en, price_cents, subscription_months, is_free, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, false, 'active', ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), description_en = VALUES(description_en), price_cents = VALUES(price_cents), subscription_months = VALUES(subscription_months), status = 'active', updated_at = VALUES(updated_at)`,
      [randomUUID(), product.slug, product.name, product.description, product.descriptionEn, product.price, product.months, now, now],
    );
    const [rows] = await pool.execute("SELECT id FROM products WHERE slug = ? LIMIT 1", [product.slug]);
    const productId = rows[0].id;
    for (const [version, platform, changelog, changelogEn] of product.versions) {
      await pool.execute(
        `INSERT INTO product_versions (id, product_id, version, platform, changelog, changelog_en, is_active, published_at)
         VALUES (?, ?, ?, ?, ?, ?, true, ?)
         ON DUPLICATE KEY UPDATE changelog = VALUES(changelog), changelog_en = VALUES(changelog_en), is_active = true`,
        [randomUUID(), productId, version, platform, changelog, changelogEn, now],
      );
    }
  }
  console.log("Database migrations and product seed completed");
} finally {
  await pool.end();
}
