import {
  boolean,
  char,
  datetime,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

const timestamps = {
  createdAt: datetime("created_at", { mode: "date" }).notNull(),
  updatedAt: datetime("updated_at", { mode: "date" }).notNull(),
};

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 }).primaryKey(),
  email: varchar("email", { length: 191 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["active", "disabled"]).notNull().default("active"),
  emailVerifiedAt: datetime("email_verified_at", { mode: "date" }),
  failedLoginAttempts: int("failed_login_attempts").notNull().default(0),
  lockedUntil: datetime("locked_until", { mode: "date" }),
  ...timestamps,
}, (table) => [uniqueIndex("users_email_uq").on(table.email)]);

export const sessions = mysqlTable("sessions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: char("token_hash", { length: 64 }).notNull(),
  expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
  ipHash: char("ip_hash", { length: 64 }),
  userAgent: varchar("user_agent", { length: 255 }),
  createdAt: datetime("created_at", { mode: "date" }).notNull(),
}, (table) => [uniqueIndex("sessions_token_uq").on(table.tokenHash), index("sessions_user_idx").on(table.userId)]);

export const authTokens = mysqlTable("auth_tokens", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: mysqlEnum("kind", ["verify_email", "reset_password"]).notNull(),
  tokenHash: char("token_hash", { length: 64 }).notNull(),
  expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
  usedAt: datetime("used_at", { mode: "date" }),
  createdAt: datetime("created_at", { mode: "date" }).notNull(),
}, (table) => [uniqueIndex("auth_tokens_hash_uq").on(table.tokenHash), index("auth_tokens_user_idx").on(table.userId)]);

export const products = mysqlTable("products", {
  id: varchar("id", { length: 36 }).primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description").notNull(),
  descriptionEn: text("description_en"),
  priceCents: int("price_cents").notNull().default(0),
  subscriptionMonths: int("subscription_months").notNull().default(12),
  isFree: boolean("is_free").notNull().default(false),
  status: mysqlEnum("status", ["draft", "active", "archived"]).notNull().default("draft"),
  ...timestamps,
}, (table) => [uniqueIndex("products_slug_uq").on(table.slug)]);

export const productVersions = mysqlTable("product_versions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  productId: varchar("product_id", { length: 36 }).notNull().references(() => products.id, { onDelete: "cascade" }),
  version: varchar("version", { length: 40 }).notNull(),
  platform: mysqlEnum("platform", ["windows", "macos", "linux", "web"]).notNull(),
  changelog: text("changelog").notNull(),
  changelogEn: text("changelog_en"),
  ossObjectKey: varchar("oss_object_key", { length: 512 }),
  checksumSha256: char("checksum_sha256", { length: 64 }),
  fileSizeBytes: int("file_size_bytes"),
  isActive: boolean("is_active").notNull().default(true),
  publishedAt: datetime("published_at", { mode: "date" }).notNull(),
}, (table) => [index("versions_product_idx").on(table.productId), uniqueIndex("versions_product_version_platform_uq").on(table.productId, table.version, table.platform)]);

export const orders = mysqlTable("orders", {
  id: varchar("id", { length: 36 }).primaryKey(),
  orderNo: varchar("order_no", { length: 32 }).notNull(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  status: mysqlEnum("status", ["pending", "paid", "cancelled", "refunded", "failed"]).notNull().default("pending"),
  currency: char("currency", { length: 3 }).notNull().default("CNY"),
  totalCents: int("total_cents").notNull(),
  paymentMethod: mysqlEnum("payment_method", ["alipay", "wechat", "test"]).notNull(),
  providerTradeNo: varchar("provider_trade_no", { length: 128 }),
  paidAt: datetime("paid_at", { mode: "date" }),
  expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("orders_no_uq").on(table.orderNo), index("orders_user_idx").on(table.userId)]);

export const orderItems = mysqlTable("order_items", {
  id: varchar("id", { length: 36 }).primaryKey(),
  orderId: varchar("order_id", { length: 36 }).notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: varchar("product_id", { length: 36 }).notNull().references(() => products.id),
  quantity: int("quantity").notNull().default(1),
  unitPriceCents: int("unit_price_cents").notNull(),
}, (table) => [index("order_items_order_idx").on(table.orderId)]);

export const subscriptions = mysqlTable("subscriptions", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  productId: varchar("product_id", { length: 36 }).notNull().references(() => products.id),
  orderId: varchar("order_id", { length: 36 }).notNull().references(() => orders.id),
  status: mysqlEnum("status", ["active", "cancelled", "expired", "refunded"]).notNull().default("active"),
  currentPeriodStart: datetime("current_period_start", { mode: "date" }).notNull(),
  currentPeriodEnd: datetime("current_period_end", { mode: "date" }).notNull(),
  ...timestamps,
}, (table) => [index("subscriptions_user_idx").on(table.userId), uniqueIndex("subscriptions_order_uq").on(table.orderId)]);

export const licenses = mysqlTable("licenses", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  productId: varchar("product_id", { length: 36 }).notNull().references(() => products.id),
  orderId: varchar("order_id", { length: 36 }).notNull().references(() => orders.id),
  licenseKey: varchar("license_key", { length: 64 }).notNull(),
  status: mysqlEnum("status", ["active", "revoked", "expired"]).notNull().default("active"),
  expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
  ...timestamps,
}, (table) => [uniqueIndex("licenses_key_uq").on(table.licenseKey), uniqueIndex("licenses_order_uq").on(table.orderId), index("licenses_user_idx").on(table.userId)]);

export const paymentEvents = mysqlTable("payment_events", {
  id: varchar("id", { length: 36 }).primaryKey(),
  provider: mysqlEnum("provider", ["alipay", "wechat", "test"]).notNull(),
  eventId: varchar("event_id", { length: 191 }).notNull(),
  payload: json("payload").notNull(),
  status: mysqlEnum("status", ["received", "processed", "rejected"]).notNull().default("received"),
  error: text("error"),
  createdAt: datetime("created_at", { mode: "date" }).notNull(),
  processedAt: datetime("processed_at", { mode: "date" }),
}, (table) => [uniqueIndex("payment_events_provider_event_uq").on(table.provider, table.eventId)]);

export const downloads = mysqlTable("downloads", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).references(() => users.id),
  productVersionId: varchar("product_version_id", { length: 36 }).notNull().references(() => productVersions.id),
  licenseId: varchar("license_id", { length: 36 }).references(() => licenses.id),
  ipHash: char("ip_hash", { length: 64 }),
  createdAt: datetime("created_at", { mode: "date" }).notNull(),
}, (table) => [index("downloads_user_idx").on(table.userId), index("downloads_version_idx").on(table.productVersionId)]);

export const legalAcceptances = mysqlTable("legal_acceptances", {
  id: varchar("id", { length: 36 }).primaryKey(),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  document: mysqlEnum("document", ["privacy", "terms", "refund"]).notNull(),
  version: varchar("version", { length: 20 }).notNull(),
  acceptedAt: datetime("accepted_at", { mode: "date" }).notNull(),
  ipHash: char("ip_hash", { length: 64 }),
}, (table) => [uniqueIndex("legal_user_doc_version_uq").on(table.userId, table.document, table.version)]);
