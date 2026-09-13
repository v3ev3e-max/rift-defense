import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { chromium } from "@playwright/test";
const browser = await chromium.launch();
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  const page = await browser.newPage({ viewport });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(pathToFileURL(resolve("local-test/index.html")).href);
  await page.getByRole("heading", { name: "BEYOND THE RIFT." }).waitFor();
  await page.screenshot({
    path: `artifacts/portrait-${viewport.width}-home.png`,
  });
  await page.locator('[data-action="stage"]').first().click();
  await page.locator('[data-action="start-battle"]').click();
  await page.locator("canvas").waitFor();
  for (let i = 0; i < 3; i++) await page.locator("#summon-btn").click();
  await page.locator("#merge-btn").click();
  await page.locator("#unit-panel h3").filter({ hasText: "세라 ★★" }).waitFor();
  await page.locator('[data-action="tutorial-skip"]').click();
  await page.locator("#wave-start-btn").click();
  await page.screenshot({
    path: `artifacts/portrait-${viewport.width}-battle.png`,
  });
  for (const id of ["summon-btn", "merge-btn", "focus-btn"]) {
    const r = await page.locator("#" + id).boundingBox();
    if (
      r.x < 0 ||
      r.x + r.width > viewport.width + 1 ||
      r.y + r.height > viewport.height + 1
    )
      throw Error("Clipped " + id);
  }
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    viewport.width,
    "file:// home, canvas, summon, merge, controls PASS",
  );
  await page.close();
}
await browser.close();
