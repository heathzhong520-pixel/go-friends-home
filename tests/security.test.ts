import assert from "node:assert/strict";
import test from "node:test";
import { hashPassword, sha256, verifyPassword } from "../lib/security";

test("password hashing uses a random salt and verifies safely", async () => {
  const first = await hashPassword("correct horse battery staple");
  const second = await hashPassword("correct horse battery staple");
  assert.notEqual(first, second);
  assert.equal(await verifyPassword("correct horse battery staple", first), true);
  assert.equal(await verifyPassword("wrong password", first), false);
  assert.equal(sha256("x").length, 64);
});
