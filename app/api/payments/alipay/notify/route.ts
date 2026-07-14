import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { orders } from "../../../../../db/schema";
import { fulfillOrder } from "../../../../../lib/orders";
import { verifyAlipayNotification } from "../../../../../lib/payments";

export async function POST(request: Request) {
  const form = await request.formData();
  const payload = Object.fromEntries([...form.entries()].map(([key, value]) => [key, String(value)]));
  if (!verifyAlipayNotification(payload)) return new Response("failure", { status: 400 });
  if (!["TRADE_SUCCESS", "TRADE_FINISHED"].includes(payload.trade_status)) return new Response("success");
  const [order] = await getDb().select().from(orders).where(eq(orders.orderNo, payload.out_trade_no)).limit(1);
  if (!order || payload.app_id !== process.env.ALIPAY_APP_ID || Math.round(Number(payload.total_amount) * 100) !== order.totalCents) return new Response("failure", { status: 400 });
  await fulfillOrder({ orderNo: order.orderNo, provider: "alipay", eventId: payload.notify_id || payload.trade_no, providerTradeNo: payload.trade_no, payload });
  return new Response("success");
}
