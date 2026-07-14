import { and, eq } from "drizzle-orm";
import { getDb } from "../db";
import { licenses, orderItems, orders, paymentEvents, products, subscriptions, users } from "../db/schema";
import { randomToken } from "./security";
import { sendMail } from "./mail";

export function orderNumber() {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `GF${date}${randomToken(7).replaceAll(/[-_]/g, "").slice(0, 10).toUpperCase()}`;
}

export async function fulfillOrder(input: { orderNo: string; provider: "alipay" | "wechat" | "test"; eventId: string; providerTradeNo: string; payload: unknown }) {
  const db = getDb();
  const now = new Date();
  const eventRecord = { id: crypto.randomUUID(), provider: input.provider, eventId: input.eventId, payload: input.payload as Record<string, unknown>, createdAt: now } as const;
  try { await db.insert(paymentEvents).values(eventRecord); } catch { return { duplicate: true }; }

  try {
    const [order] = await db.select().from(orders).where(eq(orders.orderNo, input.orderNo)).limit(1);
    if (!order) throw new Error("Order not found");
    if (order.status === "paid") return { duplicate: true, orderId: order.id };
    const [item] = await db.select({ item: orderItems, product: products }).from(orderItems).innerJoin(products, eq(products.id, orderItems.productId)).where(eq(orderItems.orderId, order.id)).limit(1);
    if (!item) throw new Error("Order item not found");
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + item.product.subscriptionMonths);
    const licenseKey = `GF-${randomToken(18).replaceAll(/[-_]/g, "").slice(0, 24).toUpperCase()}`;

    await db.transaction(async (tx) => {
      await tx.update(orders).set({ status: "paid", providerTradeNo: input.providerTradeNo, paidAt: now, updatedAt: now }).where(and(eq(orders.id, order.id), eq(orders.status, "pending")));
      await tx.insert(subscriptions).values({ id: crypto.randomUUID(), userId: order.userId, productId: item.product.id, orderId: order.id, status: "active", currentPeriodStart: now, currentPeriodEnd: periodEnd, createdAt: now, updatedAt: now });
      await tx.insert(licenses).values({ id: crypto.randomUUID(), userId: order.userId, productId: item.product.id, orderId: order.id, licenseKey, status: "active", expiresAt: periodEnd, createdAt: now, updatedAt: now });
      await tx.update(paymentEvents).set({ status: "processed", processedAt: now }).where(and(eq(paymentEvents.provider, input.provider), eq(paymentEvents.eventId, input.eventId)));
    });

    const [user] = await db.select({ email: users.email, name: users.name }).from(users).where(eq(users.id, order.userId)).limit(1);
    if (user) await sendMail({ to: user.email, subject: `GoFriends 订单 ${order.orderNo} 已支付`, text: `你好 ${user.name}，你的 ${item.product.name} 已开通。授权码：${licenseKey}`, html: `<p>你好 ${user.name}，你的 <strong>${item.product.name}</strong> 已开通。</p><p>授权码：<code>${licenseKey}</code></p><p>请登录用户中心下载。</p>` });
    return { orderId: order.id, licenseKey };
  } catch (error) {
    await db.update(paymentEvents).set({ status: "rejected", error: error instanceof Error ? error.message : "Unknown error", processedAt: new Date() }).where(and(eq(paymentEvents.provider, input.provider), eq(paymentEvents.eventId, input.eventId)));
    throw error;
  }
}
