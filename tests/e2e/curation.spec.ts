import { test, expect } from "@playwright/test";
import records from "../../src/data/artworks.json" with { type: "json" };
import profiles from "../../src/data/artists.json" with { type: "json" };
const base = "/personal-art-gallery/";
const exhibition = [...records].sort((a, b) => a.curationOrder - b.curationOrder);

test("exhibition and filtered views keep curation order; old tag links remain meaningful", async ({ page }) => {
  await page.goto(base);
  const links = page.locator(".artwork-card .painting-link");
  expect(await links.evaluateAll((els) => els.map((a) => a.getAttribute("href")))).toEqual(exhibition.map((a) => `#/artwork/${a.slug}`));
  for (const [label, index] of [["first", 0], ["opening-middle", 9], ["opening-end", 19]] as const) {
    await page.locator(".artwork-card").nth(index).scrollIntoViewIfNeeded();
    await expect(page.locator(".artwork-card img").nth(index)).not.toHaveJSProperty("naturalWidth", 0);
    await expect(page.locator(".artwork-card img").nth(index)).toHaveCSS("opacity", "1");
    await page.screenshot({ path: `test-results/curation-${test.info().project.name}-${label}.png` });
  }
  await page.goto(`${base}#/?artist=claude-monet`);
  expect(await links.evaluateAll((els) => els.map((a) => a.getAttribute("href")))).toEqual(exhibition.filter((a) => a.artistSlug === "claude-monet").map((a) => `#/artwork/${a.slug}`));
  await page.goto(`${base}#/tags`);
  await expect(page.locator(".index-item")).toHaveCount(new Set(records.flatMap((a) => a.tags)).size);
  await expect(page.locator(".index-item").filter({ hasText: /孤独感|适合壁纸|自然/ })).toHaveCount(0);
  await page.getByRole("link", { name: /^孤独 ·/ }).click();
  await expect(page.locator(".artwork-card")).toHaveCount(records.filter((a) => a.tags.includes("孤独")).length);
  for (const [old, current] of [["孤独感", "孤独"], ["自然", "风景"]]) {
    await page.goto(`${base}#/?tag=${encodeURIComponent(old)}`);
    await expect(page.locator(".artwork-card")).toHaveCount(records.filter((a) => a.tags.includes(current)).length);
    await expect(page.getByLabel("标签", { exact: true })).toHaveValue(current);
  }
});

test("artist wall labels stay short, counted and usable on a narrow screen", async ({ page }) => {
  await page.goto(`${base}#/artists`);
  await expect(page.locator(".index-item")).toHaveCount(new Set(records.map((a) => a.artistSlug)).size);
  await expect(page.locator(".artist-wall-label")).toHaveCount(profiles.length);
  for (const profile of profiles) {
    const artist = records.find((a) => a.artistSlug === profile.artistSlug)!;
    const count = records.filter((a) => a.artistSlug === profile.artistSlug).length;
    const label = page.getByRole("link", { name: `${artist.artistZh} · ${count} 件作品`, exact: true });
    await expect(label).toContainText(artist.artist);
    await expect(label).toContainText(profile.lifespan);
    await expect(label).toContainText(profile.description);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const item of await page.locator(".index-item").all()) {
    await item.scrollIntoViewIfNeeded();
    if (await item.locator("img").count())
      await expect(item.locator("img")).not.toHaveJSProperty("naturalWidth", 0);
    else await expect(item.locator(".portrait-unavailable")).toHaveText("肖像待考");
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `test-results/curation-${test.info().project.name}-artists.png`, fullPage: await page.evaluate(() => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) * devicePixelRatio < 32767) });
  await page.getByRole("link", { name: /卡斯帕·大卫·弗里德里希/ }).click();
  await expect(page.locator(".artwork-card")).toHaveCount(3);
});

test("repeated encounters avoid the current artist and recent works across gallery navigation", async ({ page }) => {
  await page.goto(`${base}#/artwork/starry-night`);
  await page.evaluate(() => { Math.random = () => 0; });
  const seen: string[] = [];
  let last = records.find((a) => a.slug === "starry-night")!;
  for (let i = 0; i < 8; i++) {
    await page.getByRole("button", { name: "随机看一幅作品" }).click();
    await expect.poll(() => page.url()).not.toContain(`/artwork/${last.slug}`);
    const slug = new URL(page.url()).hash.split("/artwork/")[1];
    const next = records.find((a) => a.slug === slug)!;
    expect(next.artistSlug).not.toBe(last.artistSlug);
    expect(seen.slice(-5)).not.toContain(next.id);
    await expect(page.getByRole("heading", { name: next.titleZh, exact: true })).toBeVisible();
    seen.push(next.id);
    last = next;
    if (i === 3) {
      await page.locator(".main-nav").getByRole("link", { name: "画廊", exact: true }).click();
      await expect(page.locator(".artwork-card")).toHaveCount(records.length);
    }
  }
});

test("tag covers remain distinct and stable across refresh and dark mode", async ({ page }) => {
  await page.goto(`${base}#/tags`);
  const items = page.locator(".index-item");
  const images = items.locator("img");
  const sources = await images.evaluateAll((els) => els.map((el) => el.getAttribute("src")));
  expect(new Set(sources).size).toBe(sources.length);
  for (const item of await items.all()) {
    await item.scrollIntoViewIfNeeded();
    await expect(item.locator("img")).not.toHaveJSProperty("naturalWidth", 0);
  }
  await page.reload();
  expect(await images.evaluateAll((els) => els.map((el) => el.getAttribute("src")))).toEqual(sources);
  await page.getByRole("button", { name: "切换深色模式" }).click();
  expect(await images.evaluateAll((els) => els.map((el) => el.getAttribute("src")))).toEqual(sources);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: `test-results/tag-covers-${test.info().project.name}.png` });
});
