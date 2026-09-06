import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import assert from "node:assert/strict";

// Run after `npm run build` and `npm run preview -- --port 4173`.
const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 810 },
});
const page = await context.newPage();
const errors = [];
context.on("console", (message) => {
  if (message.type() === "error") console.log("BROWSER ERROR", message.text());
});
page.on("pageerror", (error) => errors.push(error.message));
page.on("requestfailed", (request) =>
  console.log("REQUEST FAILED", request.url(), request.failure()?.errorText),
);
try {
  await page.goto(process.argv[2] ?? "http://127.0.0.1:4173");
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const cache = await caches.open(names.find((n) => n.startsWith("rift-")));
    return (await cache.keys()).length;
  });
  assert(cached >= 29, "All runtime assets must be precached.");
  assert.equal(await page.evaluate(() => typeof window.rift), "undefined");
  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "BEYOND THE RIFT." }).waitFor();
  await page.locator('[data-action="stage"]').first().click();
  await page.locator('[data-action="start-battle"]').click();
  await page.locator("canvas").waitFor();
  for (let i = 0; i < 3; i++) await page.locator("#summon-btn").click();
  assert.equal(await page.locator("#merge-btn").isEnabled(), true);
  await page.locator("#merge-btn").click();
  await page.locator("#unit-panel h3").filter({ hasText: "세라 ★★" }).waitFor();
  await page.locator('[data-action="tutorial-skip"]').click();
  await page.locator("#wave-start-btn").click();
  assert.equal(await page.locator(".debug-panel").count(), 0);
  await page.waitForTimeout(1000);
  mkdirSync("artifacts", { recursive: true });
  await page.screenshot({ path: "artifacts/production-offline.png" });
  assert.deepEqual(errors, []);
  const report = {
    offlineReload: true,
    offlineLazyBattle: true,
    offlineSummonAndMerge: true,
    debugHidden: true,
    cachedFiles: cached,
    pageErrors: errors,
  };
  writeFileSync(
    "artifacts/production-check.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} catch (error) {
  console.error(
    "PRODUCTION DIAGNOSTIC",
    await page.locator("body").innerText(),
    errors,
  );
  await page.screenshot({ path: "artifacts/production-failure.png" });
  throw error;
} finally {
  await browser.close();
}
