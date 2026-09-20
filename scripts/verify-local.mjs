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
  await page.locator('[data-action="campaign-select"][data-id="1-1"]').first().click();
  await page.locator('[data-action="campaign-deploy"]').first().click();
  await page.locator("canvas").waitFor();
  await page.screenshot({
    path: `artifacts/portrait-${viewport.width}-battle.png`,
  });
  for (const selector of ["#phaser-container", "#campaign-start-btn", "#campaign-auto-advance-btn"]) {
    const r = await page.locator(selector).boundingBox();
    if(!r)throw Error("Missing "+selector);
    if (
      r.x < 0 ||
      r.x + r.width > viewport.width + 1 ||
      r.y < 0
    )
      throw Error("Clipped " + selector);
  }
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    viewport.width,
    "file:// home, campaign canvas and controls PASS",
  );
  await page.close();
}
await browser.close();
