import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { LanguageSwitcher } from "../../components/language-switcher";
import { getDb } from "../../db";
import { licenses, orders, products, subscriptions } from "../../db/schema";
import { getCurrentUser } from "../../lib/auth";
import { formatDate, getDictionary } from "../../lib/i18n";
import { getServerLocale } from "../../lib/i18n-server";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const locale = await getServerLocale();
  const dictionary = getDictionary(locale);
  const copy = dictionary.account;
  const user = await getCurrentUser();
  if (!user) redirect("/login?returnTo=/account");
  const db = getDb();
  const [userOrders, userLicenses, userSubscriptions] = await Promise.all([
    db.select().from(orders).where(eq(orders.userId, user.id)).orderBy(desc(orders.createdAt)).limit(20),
    db.select({ id: licenses.id, key: licenses.licenseKey, status: licenses.status, expiresAt: licenses.expiresAt, product: products.name }).from(licenses).innerJoin(products, eq(products.id, licenses.productId)).where(eq(licenses.userId, user.id)),
    db.select({ id: subscriptions.id, status: subscriptions.status, end: subscriptions.currentPeriodEnd, product: products.name }).from(subscriptions).innerJoin(products, eq(products.id, subscriptions.productId)).where(eq(subscriptions.userId, user.id)),
  ]);

  return <main className="account-page shell">
    <header className="account-header"><div><p className="section-index">{copy.eyebrow}</p><h1>{user.name}</h1><p>{user.email}{user.emailVerifiedAt ? ` · ${copy.verified}` : ` · ${copy.unverified}`}</p></div><div className="page-actions"><LanguageSwitcher /><Link className="button button-ghost" href="/">{dictionary.common.backHome}</Link></div></header>
    <section className="account-grid">
      <article><h2>{copy.subscriptions}</h2>{userSubscriptions.length ? userSubscriptions.map((item) => <div className="account-row" key={item.id}><strong>{item.product}</strong><span>{copy.statuses[item.status]} · {copy.until} {formatDate(item.end, locale)}</span></div>) : <p className="empty-state">{copy.noSubscriptions}</p>}</article>
      <article><h2>{copy.licenses}</h2>{userLicenses.length ? userLicenses.map((item) => <div className="account-row" key={item.id}><strong>{item.product}</strong><code>{item.key}</code><span>{copy.statuses[item.status]} · {copy.until} {formatDate(item.expiresAt, locale)}</span></div>) : <p className="empty-state">{copy.noLicenses}</p>}</article>
      <article className="account-orders"><h2>{copy.orders}</h2>{userOrders.length ? userOrders.map((order) => <div className="account-row" key={order.id}><strong>{order.orderNo}</strong><span>¥{(order.totalCents / 100).toFixed(2)} · {copy.statuses[order.status]} · {formatDate(order.createdAt, locale)}</span></div>) : <p className="empty-state">{copy.noOrders}</p>}</article>
    </section>
  </main>;
}
