import { test, expect, type Page } from "@playwright/test";
async function start(page: Page) {
  await page.goto("/");
  await page.locator('[data-action="stage"]').first().click();
  await page.locator('[data-action="start-battle"]').click();
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForFunction(
    () => !!(window as any).rift?.game?.scene?.getScene("Battle")?.ink,
  );
}
async function read(page: Page, expression: string) {
  return page.evaluate((expr) => Function(`return (${expr})`)(), expression);
}
test("home → deck → battle → summon / drag / merge / research → result → persisted account", async ({
  page,
  isMobile,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "BEYOND THE RIFT." }),
  ).toBeVisible();
  await page.screenshot({ path: `artifacts/${info.project.name}-home.png` });
  await page.locator('[data-action="deck"]').first().click();
  await page.locator('[data-action="deck-recommended"]').click();
  expect(await read(page, "window.rift.save.data.deck.length")).toBe(5);
  await page.reload();
  expect(await read(page, "window.rift.save.data.deck.length")).toBe(5);
  await page.locator('[data-action="hero"]').last().click();
  await page.locator('[data-action="hero-upgrade"]').click();
  expect(await read(page, "window.rift.save.data.heroes.sera.level")).toBe(2);
  await page.locator('[data-action="stage"]').first().click();
  await page.locator('[data-action="start-battle"]').click();
  await expect(page.locator("canvas")).toBeVisible();
  await page.waitForFunction(
    () => !!(window as any).rift.game?.scene.getScene("Battle").ink,
  );
  for (let i = 0; i < 3; i++) {
    if (isMobile) await page.locator("#summon-btn").tap();
    else await page.locator("#summon-btn").click();
  }
  expect(await read(page, "window.rift.model.units.length")).toBe(3);
  expect(
    await read(page, 'window.rift.model.units.every(u=>u.heroId==="sera")'),
  ).toBe(true);
  // Clear the non-blocking training strip so both bottom and top slots are targetable.
  await page.locator('[data-action="tutorial-skip"]').click();
  const box = await page.locator("canvas").boundingBox();
  expect(box).not.toBeNull();
  const x = (v: number) => box!.x + (v / 1000) * box!.width,
    y = (v: number) => box!.y + (v / 580) * box!.height;
  if (isMobile) {
    await page.touchscreen.tap(x(580), y(208));
    await page.touchscreen.tap(x(740), y(385));
  } else {
    await page.mouse.move(x(580), y(198));
    await page.mouse.down();
    await page.mouse.move(x(740), y(375), { steps: 8 });
    await page.mouse.up();
  }
  expect(await read(page, "window.rift.model.units[2].slot")).toBe(7);
  await page.locator("#merge-btn").click();
  expect(await read(page, "window.rift.model.units.length")).toBe(1);
  expect(await read(page, "window.rift.model.units[0].star")).toBe(2);
  await page.locator("#research-select").selectOption("sera");
  await page.locator("#research-btn").click();
  expect(await read(page, "window.rift.model.research.sera")).toBe(1);
  await page.locator("#wave-start-btn").click();
  await page.locator('[data-action="pause"]').click();
  const pausedTime = await read(page, "window.rift.model.time");
  await page.waitForTimeout(250);
  expect(await read(page, "window.rift.model.time")).toBe(pausedTime);
  await page.locator('[data-action="resume"]').click();
  await page.waitForFunction(
    () => (window as any).rift.model.kills > 0,
    {},
    { timeout: 25000 },
  );
  await page.screenshot({ path: `artifacts/${info.project.name}-battle.png` });
  // Force only the elapsed simulation clock for reward UI coverage; combat itself was exercised above.
  await page.evaluate(() => {
    const app = (window as any).rift;
    app.model.pendingRewards.push("trait");
    app.model.openReward();
    app.updateHud(true);
  });
  await expect(page.getByRole("dialog", { name: "특성 선택" })).toBeVisible();
  await expect(page.locator('[data-action="choice"]')).toHaveCount(3);
  const beforeChoice = await read(page, "window.rift.model.time");
  await page.waitForTimeout(150);
  expect(await read(page, "window.rift.model.time")).toBe(beforeChoice);
  await page.screenshot({ path: `artifacts/${info.project.name}-traits.png` });
  await page.locator('[data-action="choice"]').first().click();
  expect(await read(page, "window.rift.model.chosenTraits.length")).toBe(1);
  const credits = await read(page, "window.rift.save.data.credits");
  await page.locator('[data-action="pause"]').click();
  await page.getByRole("button", { name: "작전 종료", exact: true }).click();
  await page.getByRole("button", { name: "작전 종료", exact: true }).click();
  await expect(page.getByRole("heading", { name: "DEFEAT" })).toBeVisible();
  expect(await read(page, "window.rift.save.data.credits")).toBeGreaterThan(
    credits,
  );
  await page.locator('[data-action="home"]').last().click();
  await page.reload();
  expect(await read(page, "window.rift.save.data.runs")).toBe(1);
  expect(await read(page, "window.rift.save.data.heroes.sera.level")).toBe(2);
  expect(errors).toEqual([]);
});
test("boss victory, reserve, save export/import and scene cleanup", async ({
  page,
}, info) => {
  await start(page);
  await page.locator('[data-action="tutorial-skip"]').click();
  await page.evaluate(() => {
    const a = (window as any).rift;
    const m = a.model;
    m.debug("gold");
    m.debug("all");
    m.debug("all");
    a.updateHud(true);
  });
  expect(
    await read(page, "window.rift.model.units.filter(u=>u.slot<0).length"),
  ).toBe(4);
  await expect(page.locator(".reserve-unit")).toHaveCount(4);
  await page.locator('[data-action="focus"]').click();
  await expect(page.getByRole("dialog", { name: "확정 소환" })).toBeVisible();
  await page.locator('[data-action="focus-pick"]').first().click();
  expect(await read(page, "window.rift.model.units.length")).toBe(21);
  await page.evaluate(() => {
    const a = (window as any).rift;
    const m = a.model;
    m.debug("stars");
    m.debug("boss");
    m.speed = 5;
  });
  await page.waitForFunction(() =>
    (window as any).rift.model.enemies.some(
      (e: any) => e.active && e.kind === "sovereign",
    ),
  );
  await page.screenshot({ path: `artifacts/${info.project.name}-boss.png` });
  await expect(page.getByRole("heading", { name: "VICTORY" })).toBeVisible({
    timeout: 45000,
  });
  expect(await read(page, "window.rift.save.data.cleared")).toBe(1);
  expect(await read(page, "window.rift.save.data.shards")).toBe(10);
  await page.screenshot({ path: `artifacts/${info.project.name}-victory.png` });
  await page.locator('[data-action="home"]').last().click();
  await page.locator('[data-action="settings"]').click();
  const downloadPromise = page.waitForEvent("download");
  await page.locator('[data-action="export"]').click();
  const download = await downloadPromise;
  await download.saveAs(`artifacts/${info.project.name}-save.json`);
  await page
    .locator("#save-file")
    .setInputFiles(`artifacts/${info.project.name}-save.json`);
  await expect(page.locator("#toast")).toContainText(
    "저장 파일을 가져왔습니다",
  );
  await page.locator('[data-action="home"]').first().click();
  await page.locator('[data-action="stage"]').first().click();
  await page.locator('[data-action="start-battle"]').click();
  await expect(page.locator("canvas")).toHaveCount(1);
  expect(await read(page, "window.rift.model.units.length")).toBe(0);
  expect(
    await read(page, "Object.keys(window.rift.model.research).length"),
  ).toBe(0);
});
test("portrait guard and no clipped primary battle controls", async ({
  page,
  isMobile,
}) => {
  await start(page);
  const ids = [
    "summon-btn",
    "merge-btn",
    "focus-btn",
    "wave-start-btn",
    "speed-btn",
  ];
  for (const id of ids) {
    const r = await page.locator(`#${id}`).boundingBox();
    expect(r).not.toBeNull();
    const viewport = page.viewportSize()!;
    expect(r!.x).toBeGreaterThanOrEqual(0);
    expect(r!.x + r!.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(r!.y + r!.height).toBeLessThanOrEqual(viewport.height + 1);
    expect(r!.height).toBeGreaterThanOrEqual(44);
  }
  if (isMobile) {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator("#rotate")).toBeVisible();
    expect(await read(page, "window.rift.model.paused")).toBe(true);
  }
});
test("returning from background during trait selection keeps pause recoverable", async ({
  page,
}) => {
  await start(page);
  await page.evaluate(() => {
    const a = (window as any).rift;
    a.model.pendingRewards.push("trait");
    a.model.openReward();
    a.updateHud(true);
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
    Object.defineProperty(document, "hidden", {
      configurable: true,
      get: () => false,
    });
  });
  await page.locator('[data-action="choice"]').first().click();
  await expect(
    page.getByRole("heading", { name: "작전 일시정지" }),
  ).toBeVisible();
  await page.locator('[data-action="resume"]').click();
  expect(await read(page, "window.rift.model.paused")).toBe(false);
});
