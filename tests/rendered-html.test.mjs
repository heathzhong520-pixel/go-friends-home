import assert from "node:assert/strict";
import test from "node:test";

async function render(cookie = "") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html", ...(cookie ? { cookie } : {}) },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the GoFriends homepage", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>GoFriends — 做有用的数字工具<\/title>/i);
  assert.match(html, /做有用的/);
  assert.match(html, /数字工具。/);
  assert.match(html, /正在生长的作品库/);
  assert.match(html, /持续订阅，持续更新。/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/i);
});

test("server-renders the English homepage from the locale cookie", async () => {
  const response = await render("gofriends_locale=en");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<html lang="en"/i);
  assert.match(html, /<title>GoFriends — Useful digital tools<\/title>/i);
  assert.match(html, /Useful/);
  assert.match(html, /digital tools\./);
  assert.match(html, /A growing collection of work/);
  assert.match(html, /Subscribe\. Keep improving\./);
});
