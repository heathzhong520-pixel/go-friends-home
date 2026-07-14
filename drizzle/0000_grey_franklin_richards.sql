CREATE TABLE `auth_tokens` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`kind` enum('verify_email','reset_password') NOT NULL,
	`token_hash` char(64) NOT NULL,
	`expires_at` datetime NOT NULL,
	`used_at` datetime,
	`created_at` datetime NOT NULL,
	CONSTRAINT `auth_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `auth_tokens_hash_uq` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `downloads` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`product_version_id` varchar(36) NOT NULL,
	`license_id` varchar(36),
	`ip_hash` char(64),
	`created_at` datetime NOT NULL,
	CONSTRAINT `downloads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `legal_acceptances` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`document` enum('privacy','terms','refund') NOT NULL,
	`version` varchar(20) NOT NULL,
	`accepted_at` datetime NOT NULL,
	`ip_hash` char(64),
	CONSTRAINT `legal_acceptances_id` PRIMARY KEY(`id`),
	CONSTRAINT `legal_user_doc_version_uq` UNIQUE(`user_id`,`document`,`version`)
);
--> statement-breakpoint
CREATE TABLE `licenses` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`order_id` varchar(36) NOT NULL,
	`license_key` varchar(64) NOT NULL,
	`status` enum('active','revoked','expired') NOT NULL DEFAULT 'active',
	`expires_at` datetime NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `licenses_id` PRIMARY KEY(`id`),
	CONSTRAINT `licenses_key_uq` UNIQUE(`license_key`),
	CONSTRAINT `licenses_order_uq` UNIQUE(`order_id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` varchar(36) NOT NULL,
	`order_id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unit_price_cents` int NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` varchar(36) NOT NULL,
	`order_no` varchar(32) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`status` enum('pending','paid','cancelled','refunded','failed') NOT NULL DEFAULT 'pending',
	`currency` char(3) NOT NULL DEFAULT 'CNY',
	`total_cents` int NOT NULL,
	`payment_method` enum('alipay','wechat','test') NOT NULL,
	`provider_trade_no` varchar(128),
	`paid_at` datetime,
	`expires_at` datetime NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_no_uq` UNIQUE(`order_no`)
);
--> statement-breakpoint
CREATE TABLE `payment_events` (
	`id` varchar(36) NOT NULL,
	`provider` enum('alipay','wechat','test') NOT NULL,
	`event_id` varchar(191) NOT NULL,
	`payload` json NOT NULL,
	`status` enum('received','processed','rejected') NOT NULL DEFAULT 'received',
	`error` text,
	`created_at` datetime NOT NULL,
	`processed_at` datetime,
	CONSTRAINT `payment_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `payment_events_provider_event_uq` UNIQUE(`provider`,`event_id`)
);
--> statement-breakpoint
CREATE TABLE `product_versions` (
	`id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`version` varchar(40) NOT NULL,
	`platform` enum('windows','macos','linux','web') NOT NULL,
	`changelog` text NOT NULL,
	`oss_object_key` varchar(512),
	`checksum_sha256` char(64),
	`file_size_bytes` int,
	`is_active` boolean NOT NULL DEFAULT true,
	`published_at` datetime NOT NULL,
	CONSTRAINT `product_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `versions_product_version_platform_uq` UNIQUE(`product_id`,`version`,`platform`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` varchar(36) NOT NULL,
	`slug` varchar(80) NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text NOT NULL,
	`price_cents` int NOT NULL DEFAULT 0,
	`subscription_months` int NOT NULL DEFAULT 12,
	`is_free` boolean NOT NULL DEFAULT false,
	`status` enum('draft','active','archived') NOT NULL DEFAULT 'draft',
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_uq` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`token_hash` char(64) NOT NULL,
	`expires_at` datetime NOT NULL,
	`ip_hash` char(64),
	`user_agent` varchar(255),
	`created_at` datetime NOT NULL,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_token_uq` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`product_id` varchar(36) NOT NULL,
	`order_id` varchar(36) NOT NULL,
	`status` enum('active','cancelled','expired','refunded') NOT NULL DEFAULT 'active',
	`current_period_start` datetime NOT NULL,
	`current_period_end` datetime NOT NULL,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscriptions_order_uq` UNIQUE(`order_id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`email` varchar(191) NOT NULL,
	`name` varchar(100) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`status` enum('active','disabled') NOT NULL DEFAULT 'active',
	`email_verified_at` datetime,
	`failed_login_attempts` int NOT NULL DEFAULT 0,
	`locked_until` datetime,
	`created_at` datetime NOT NULL,
	`updated_at` datetime NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_uq` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `auth_tokens` ADD CONSTRAINT `auth_tokens_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `downloads` ADD CONSTRAINT `downloads_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `downloads` ADD CONSTRAINT `downloads_product_version_id_product_versions_id_fk` FOREIGN KEY (`product_version_id`) REFERENCES `product_versions`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `downloads` ADD CONSTRAINT `downloads_license_id_licenses_id_fk` FOREIGN KEY (`license_id`) REFERENCES `licenses`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `legal_acceptances` ADD CONSTRAINT `legal_acceptances_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `licenses` ADD CONSTRAINT `licenses_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `licenses` ADD CONSTRAINT `licenses_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `licenses` ADD CONSTRAINT `licenses_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_versions` ADD CONSTRAINT `product_versions_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `auth_tokens_user_idx` ON `auth_tokens` (`user_id`);--> statement-breakpoint
CREATE INDEX `downloads_user_idx` ON `downloads` (`user_id`);--> statement-breakpoint
CREATE INDEX `downloads_version_idx` ON `downloads` (`product_version_id`);--> statement-breakpoint
CREATE INDEX `licenses_user_idx` ON `licenses` (`user_id`);--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `orders_user_idx` ON `orders` (`user_id`);--> statement-breakpoint
CREATE INDEX `versions_product_idx` ON `product_versions` (`product_id`);--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_user_idx` ON `subscriptions` (`user_id`);