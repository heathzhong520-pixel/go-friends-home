import { expect, test } from "@playwright/test";

test("homepage exposes real account and product links", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /做有用的/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "登录" })).toHaveAttribute("href", "/login");
  await expect(page.getByRole("link", { name: "注册" })).toHaveAttribute("href", "/register");
  await expect(page.getByRole("link", { name: /详情/ }).first()).toHaveAttribute("href", /\/products\//);
});

test("auth and policy pages render", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByRole("heading", { name: "创建账号" })).toBeVisible();
  await expect(page.getByRole("link", { name: "隐私政策" })).toBeVisible();
  await page.goto("/legal/privacy");
  await expect(page.getByRole("heading", { name: "隐私政策" })).toBeVisible();
});
