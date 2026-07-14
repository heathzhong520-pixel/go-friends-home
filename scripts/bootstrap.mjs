import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import mysql from "mysql2/promise";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not configured");

const pool = mysql.createPool({ uri: databaseUrl, connectionLimit: 5, enableKeepAlive: true, timezone: "Z" });

const products = [
  { slug: "nexus-desk", name: "NEXUS / Desk", description: "把零散工作流收进安静、可扩展的桌面工作台。", price: 32900, months: 12, versions: [["2.4.1", "windows", "改进工作区性能、文件拖放与离线可靠性。"], ["2.4.1", "macos", "改进工作区性能、文件拖放与离线可靠性。"]] },
  { slug: "clarity", name: "Clarity", description: "一款只做一件事的专注计时器。", price: 15900, months: 12, versions: [["1.8.0", "macos", "新增专注历史与更安静的提醒方式。"]] },
  { slug: "sitefoundry", name: "SiteFoundry", description: "从内容模型到可部署页面，为个人项目缩短发布路径。", price: 32900, months: 12, versions: [["0.9.6", "web", "更新发布流程、内容校验与部署预览。"]] },
  { slug: "lighthouse", name: "Lighthouse", description: "集中管理作品链接、版本、状态与公开说明。", price: 57900, months: 12, versions: [["1.2.0", "web", "新增团队审核与批量发布能力。"]] },
];

try {
  if (process.env.AUTO_MIGRATE !== "false") {
    await migrate(drizzle(pool), { migrationsFolder: fileURLToPath(new URL("../drizzle", import.meta.url)) });
  }

  const now = new Date();
  for (const product of products) {
    await pool.execute(
      `INSERT INTO products (id, slug, name, description, price_cents, subscription_months, is_free, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, false, 'active', ?, ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), description = VALUES(description), price_cents = VALUES(price_cents), subscription_months = VALUES(subscription_months), status = 'active', updated_at = VALUES(updated_at)`,
      [randomUUID(), product.slug, product.name, product.description, product.price, product.months, now, now],
    );
    const [rows] = await pool.execute("SELECT id FROM products WHERE slug = ? LIMIT 1", [product.slug]);
    const productId = rows[0].id;
    for (const [version, platform, changelog] of product.versions) {
      await pool.execute(
        `INSERT INTO product_versions (id, product_id, version, platform, changelog, is_active, published_at)
         VALUES (?, ?, ?, ?, ?, true, ?)
         ON DUPLICATE KEY UPDATE changelog = VALUES(changelog), is_active = true`,
        [randomUUID(), productId, version, platform, changelog, now],
      );
    }
  }
  console.log("Database migrations and product seed completed");
} finally {
  await pool.end();
}
