import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { orders } from "../../../../../db/schema";
import { fulfillOrder } from "../../../../../lib/orders";
import { decryptWechatResource, verifyWechatNotification } from "../../../../../lib/payments";

export async function POST(request: Request) {
  const body = await request.text();
  if (!verifyWechatNotification(request.headers, body)) return Response.json({ code: "FAIL", message: "invalid signature" }, { status: 401 });
  const notice = JSON.parse(body) as { id: string; resource: { associated_data: string; nonce: string; ciphertext: string } };
  const transaction = decryptWechatResource(notice.resource);
  const [order] = await getDb().select().from(orders).where(eq(orders.orderNo, transaction.out_trade_no)).limit(1);
  if (!order || transaction.trade_state !== "SUCCESS" || transaction.amount.total !== order.totalCents) return Response.json({ code: "FAIL", message: "invalid order" }, { status: 400 });
  await fulfillOrder({ orderNo: order.orderNo, provider: "wechat", eventId: notice.id, providerTradeNo: transaction.transaction_id, payload: transaction });
  return Response.json({ code: "SUCCESS", message: "成功" });
}
