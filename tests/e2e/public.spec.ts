import { expect, test } from "@playwright/test";
import mysql from "mysql2/promise";
import { resolveDatabaseUrl } from "../../lib/database-url";

test("homepage exposes real account and product links", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /做有用的/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "登录" })).toHaveAttribute("href", "/login");
  await expect(page.getByRole("link", { name: "注册" })).toHaveAttribute("href", "/register");
  await expect(page.getByRole("link", { name: /详情/ }).first()).toHaveAttribute("href", /\/products\//);
});

test("language switch persists across public, account, product, and legal pages", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "切换到英文" }).click();
  await expect(page.getByRole("heading", { name: /Useful/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Log in" })).toHaveAttribute("href", "/login");
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Privacy Policy" })).toBeVisible();
  await page.goto("/legal/privacy");
  await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
  await page.goto("/products");
  await expect(page.getByRole("heading", { name: "Products and licenses" })).toBeVisible();
  await expect(page.getByText("A calm, extensible desktop workspace for scattered workflows.")).toBeVisible();
});

test("registration, verification, login, test payment, license, and account history work", async ({ page, request }) => {
  const email = `codex-e2e-${Date.now()}@example.com`;
  const password = "GoFriends-test-2026!";
  let orderNo = "";

  try {
    await page.context().addCookies([{ name: "gofriends_locale", value: "en", url: process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000" }]);
    const registerResponse = await request.post("/api/auth/register", {
      headers: { "x-gofriends-locale": "en" },
      data: { name: "Codex Test", email, password, acceptPolicies: true },
    });
    expect(registerResponse.status()).toBe(201);
    const registration = await registerResponse.json() as { verificationUrl: string };
    expect(registration.verificationUrl).toBeTruthy();

    const verification = new URL(registration.verificationUrl);
    await page.goto(`${verification.pathname}${verification.search}`);
    await expect(page).toHaveURL(/\/login\?verified=1/);
    const switchToEnglish = page.getByRole("button", { name: "切换到英文" });
    if (await switchToEnglish.isVisible()) await switchToEnglish.click();

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/account/);
    await expect(page.getByText("Email verified")).toBeVisible();

    await page.goto("/products/nexus-desk");
    await page.getByRole("button", { name: "Test payment" }).click();
    await page.getByRole("button", { name: /Buy now/ }).click();
    await expect(page).toHaveURL(/\/account/);
    await expect(page.getByRole("heading", { name: "Software licenses" })).toBeVisible();
    await expect(page.locator("code")).toContainText("GF-");
    const orderText = await page.locator(".account-orders .account-row strong").first().textContent();
    orderNo = orderText ?? "";
    expect(orderNo).toMatch(/^GF/);
  } finally {
    const connection = await mysql.createConnection(resolveDatabaseUrl());
    try {
      const [userRows] = await connection.execute<mysql.RowDataPacket[]>("SELECT id FROM users WHERE email = ?", [email]);
      const userId = userRows[0]?.id as string | undefined;
      if (userId) {
        const [orderRows] = await connection.execute<mysql.RowDataPacket[]>("SELECT id, order_no FROM orders WHERE user_id = ?", [userId]);
        for (const row of orderRows) {
          await connection.execute("DELETE FROM downloads WHERE license_id IN (SELECT id FROM licenses WHERE order_id = ?)", [row.id]);
          await connection.execute("DELETE FROM licenses WHERE order_id = ?", [row.id]);
          await connection.execute("DELETE FROM subscriptions WHERE order_id = ?", [row.id]);
          await connection.execute("DELETE FROM order_items WHERE order_id = ?", [row.id]);
          await connection.execute("DELETE FROM payment_events WHERE event_id = ?", [`test-${row.order_no}`]);
          await connection.execute("DELETE FROM orders WHERE id = ?", [row.id]);
        }
        await connection.execute("DELETE FROM auth_tokens WHERE user_id = ?", [userId]);
        await connection.execute("DELETE FROM sessions WHERE user_id = ?", [userId]);
        await connection.execute("DELETE FROM legal_acceptances WHERE user_id = ?", [userId]);
        await connection.execute("DELETE FROM users WHERE id = ?", [userId]);
      }
    } finally {
      await connection.end();
    }
  }
});
