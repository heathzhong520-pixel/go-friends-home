import { and, eq } from "drizzle-orm";
import QRCode from "qrcode";
import { z } from "zod";
import { getDb } from "../../../db";
import { orderItems, orders, products } from "../../../db/schema";
import { requireUserFromRequest } from "../../../lib/auth";
import { errorResponse, json, readJson } from "../../../lib/http";
import { fulfillOrder, orderNumber } from "../../../lib/orders";
import { createAlipayUrl, createWechatNativeOrder } from "../../../lib/payments";
import { assertSameOrigin } from "../../../lib/security";

const schema = z.object({ productId: z.string().uuid(), paymentMethod: z.enum(["alipay", "wechat", "test"]) });

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUserFromRequest(request);
    const input = schema.parse(await readJson(request));
    if (input.paymentMethod === "test" && process.env.PAYMENT_TEST_MODE !== "true") return json({ error: "测试支付未启用" }, { status: 403 });
    const db = getDb();
    const [product] = await db.select().from(products).where(and(eq(products.id, input.productId), eq(products.status, "active"))).limit(1);
    if (!product) return json({ error: "产品不存在或未上架" }, { status: 404 });
    const now = new Date();
    const order = { id: crypto.randomUUID(), orderNo: orderNumber(), userId: user.id, totalCents: product.priceCents, paymentMethod: input.paymentMethod, expiresAt: new Date(now.getTime() + 30 * 60_000), createdAt: now, updatedAt: now } as const;
    await db.transaction(async (tx) => {
      await tx.insert(orders).values(order);
      await tx.insert(orderItems).values({ id: crypto.randomUUID(), orderId: order.id, productId: product.id, unitPriceCents: product.priceCents, quantity: 1 });
    });
    if (input.paymentMethod === "test") {
      await fulfillOrder({ orderNo: order.orderNo, provider: "test", eventId: `test-${order.orderNo}`, providerTradeNo: `TEST-${order.orderNo}`, payload: { test: true } });
      return json({ ok: true, paid: true, orderNo: order.orderNo, redirectUrl: "/account" });
    }
    if (input.paymentMethod === "alipay") return json({ ok: true, orderNo: order.orderNo, paymentUrl: createAlipayUrl({ orderNo: order.orderNo, subject: product.name, amountCents: product.priceCents }) });
    const codeUrl = await createWechatNativeOrder({ orderNo: order.orderNo, subject: product.name, amountCents: product.priceCents });
    return json({ ok: true, orderNo: order.orderNo, codeUrl, qrCode: await QRCode.toDataURL(codeUrl, { width: 320, margin: 1 }) });
  } catch (error) { return errorResponse(error); }
}
