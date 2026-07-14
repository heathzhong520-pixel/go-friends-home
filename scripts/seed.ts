import { eq } from "drizzle-orm";
import { getDb, getPool } from "../db";
import { products, productVersions } from "../db/schema";

const seedProducts = [
  { slug: "nexus-desk", name: "NEXUS / Desk", description: "把零散工作流收进安静、可扩展的桌面工作台。", priceCents: 32900, subscriptionMonths: 12, versions: [{ version: "2.4.1", platform: "windows" as const, changelog: "改进工作区性能、文件拖放与离线可靠性。" }, { version: "2.4.1", platform: "macos" as const, changelog: "改进工作区性能、文件拖放与离线可靠性。" }] },
  { slug: "clarity", name: "Clarity", description: "一款只做一件事的专注计时器。", priceCents: 15900, subscriptionMonths: 12, versions: [{ version: "1.8.0", platform: "macos" as const, changelog: "新增专注历史与更安静的提醒方式。" }] },
  { slug: "sitefoundry", name: "SiteFoundry", description: "从内容模型到可部署页面，为个人项目缩短发布路径。", priceCents: 32900, subscriptionMonths: 12, versions: [{ version: "0.9.6", platform: "web" as const, changelog: "更新发布流程、内容校验与部署预览。" }] },
  { slug: "lighthouse", name: "Lighthouse", description: "集中管理作品链接、版本、状态与公开说明。", priceCents: 57900, subscriptionMonths: 12, versions: [{ version: "1.2.0", platform: "web" as const, changelog: "新增团队审核与批量发布能力。" }] },
];

const db = getDb();
for (const product of seedProducts) {
  let [row] = await db.select().from(products).where(eq(products.slug, product.slug)).limit(1);
  const now = new Date();
  if (!row) {
    const id = crypto.randomUUID();
    await db.insert(products).values({ id, slug: product.slug, name: product.name, description: product.description, priceCents: product.priceCents, subscriptionMonths: product.subscriptionMonths, status: "active", isFree: false, createdAt: now, updatedAt: now });
    [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
  }
  for (const version of product.versions) {
    try { await db.insert(productVersions).values({ id: crypto.randomUUID(), productId: row.id, version: version.version, platform: version.platform, changelog: version.changelog, isActive: true, publishedAt: now }); } catch { /* idempotent seed */ }
  }
}
await getPool().end();
console.log("GoFriends products seeded");
