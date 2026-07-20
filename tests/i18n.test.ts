import assert from "node:assert/strict";
import test from "node:test";
import { resolveDatabaseUrl } from "../lib/database-url";
import { getDictionary, getRequestLocale, localeFromCookieHeader } from "../lib/i18n";

test("locale selection prefers explicit header, then cookie, then browser language", () => {
  assert.equal(localeFromCookieHeader("session=x; gofriends_locale=en"), "en");
  assert.equal(getRequestLocale(new Request("https://example.com", { headers: { cookie: "gofriends_locale=en", "accept-language": "zh-CN" } })), "en");
  assert.equal(getRequestLocale(new Request("https://example.com", { headers: { "x-gofriends-locale": "zh", "accept-language": "en-US" } })), "zh");
  assert.equal(getDictionary("en").auth.modes.register.title, "Create an account");
});

test("database URL can be built from split environment values", () => {
  assert.equal(
    resolveDatabaseUrl({ DB_HOST: "db.example", DB_PORT: "3307", DB_NAME: "gofriends-home", DB_USER: "site user", DB_PASSWORD: "p@ss" }),
    "mysql://site%20user:p%40ss@db.example:3307/gofriends-home",
  );
});
