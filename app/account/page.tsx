import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDb } from "../../db";
import { licenses, orders, products, subscriptions } from "../../db/schema";
import { getCurrentUser } from "../../lib/auth";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnTo=/account");
  const db = getDb();
  const [userOrders, userLicenses, userSubscriptions] = await Promise.all([
    db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt)).limit(20),
    db.select({ id: licenses.id, key: licenses.licenseKey, status: licenses.status, expiresAt: licenses.expiresAt, product: products.name }).from(licenses).innerJoin(products, eq(products.id, licenses.productId)).where(eq(licenses.userId, user.id)),
    db.select({ id: subscriptions.id, status: subscriptions.status, end: subscriptions.currentPeriodEnd, product: products.name }).from(subscriptions).innerJoin(products, eq(products.id, subscriptions.productId)).where(eq(subscriptions.userId, user.id)),
  ]);

  return <main className="account-page shell">
    <header className="account-header"><div><p className="section-index">USER CENTER</p><h1>{user.name}</h1><p>{user.email}{user.emailVerifiedAt ? " · 邮箱已验证" : " · 邮箱待验证"}</p></div><Link className="button button-ghost" href="/">返回官网</Link></header>
    <section className="account-grid">
      <article><h2>我的订阅</h2>{userSubscriptions.length ? userSubscriptions.map((item) => <div className="account-row" key={item.id}><strong>{item.product}</strong><span>{item.status} · 至 {item.end.toLocaleDateString("zh-CN")}</span></div>) : <p className="empty-state">暂无订阅</p>}</article>
      <article><h2>软件授权</h2>{userLicenses.length ? userLicenses.map((item) => <div className="account-row" key={item.id}><strong>{item.product}</strong><code>{item.key}</code><span>{item.status} · 至 {item.expiresAt.toLocaleDateString("zh-CN")}</span></div>) : <p className="empty-state">暂无授权</p>}</article>
      <article className="account-orders"><h2>订单记录</h2>{userOrders.length ? userOrders.map((order) => <div className="account-row" key={order.id}><strong>{order.orderNo}</strong><span>¥{(order.totalCents / 100).toFixed(2)} · {order.status} · {order.createdAt.toLocaleDateString("zh-CN")}</span></div>) : <p className="empty-state">暂无订单</p>}</article>
    </section>
  </main>;
}
