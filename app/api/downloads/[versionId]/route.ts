import { and, eq, gt } from "drizzle-orm";
import { getDb } from "../../../../db";
import { downloads, licenses, products, productVersions } from "../../../../db/schema";
import { getUserFromRequest } from "../../../../lib/auth";
import { errorResponse, json } from "../../../../lib/http";
import { signedDownloadUrl } from "../../../../lib/oss";
import { hashedRequestIp } from "../../../../lib/security";

export async function GET(request: Request, context: { params: Promise<{ versionId: string }> }) {
  try {
    const { versionId } = await context.params;
    const db = getDb();
    const [item] = await db.select({ version: productVersions, product: products }).from(productVersions).innerJoin(products, eq(products.id, productVersions.productId)).where(and(eq(productVersions.id, versionId), eq(productVersions.isActive, true))).limit(1);
    if (!item || !item.version.ossObjectKey) return json({ error: "安装包尚未上传" }, { status: 404 });
    const user = await getUserFromRequest(request);
    let licenseId: string | null = null;
    if (!item.product.isFree) {
      if (!user) return json({ error: "请先登录" }, { status: 401 });
      const [license] = await db.select({ id: licenses.id }).from(licenses).where(and(eq(licenses.userId, user.id), eq(licenses.productId, item.product.id), eq(licenses.status, "active"), gt(licenses.expiresAt, new Date()))).limit(1);
      if (!license) return json({ error: "你还没有有效授权" }, { status: 403 });
      licenseId = license.id;
    }
    await db.insert(downloads).values({ id: crypto.randomUUID(), userId: user?.id ?? null, productVersionId: item.version.id, licenseId, ipHash: hashedRequestIp(request), createdAt: new Date() });
    const extension = item.version.ossObjectKey.split(".").pop() ?? "bin";
    return Response.redirect(signedDownloadUrl(item.version.ossObjectKey, `${item.product.slug}-${item.version.version}-${item.version.platform}.${extension}`));
  } catch (error) { return errorResponse(error); }
}
