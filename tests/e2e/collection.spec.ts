import { test, expect, type Download, type Page } from "@playwright/test";
import artworks from "../../src/data/artworks.json" with { type: "json" };
const base = "/personal-art-gallery/";

test("expanded artists and mood tags index the complete collection; random includes new works", async ({ page }) => {
  await page.goto(`${base}#/artists`);
  await page.getByRole("link", { name: /克洛德·莫奈/ }).click();
  await expect(page.locator(".artwork-card")).toHaveCount(15);
  await expect(page.locator(".artwork-card img").first()).not.toHaveJSProperty("naturalWidth", 0);
  await page.goto(`${base}#/tags`);
  await page.getByRole("link", { name: /^梦幻/ }).click();
  await expect(page.locator(".artwork-card")).toHaveCount(artworks.filter((a) => a.tags.includes("梦幻")).length);
  for (const index of [10, 24, artworks.length - 1]) {
    await page.goto(base);
    await page.evaluate((value) => { Math.random = () => value; }, (index + 0.5) / artworks.length);
    await page.getByRole("button", { name: "随机看一幅作品" }).click();
    await expect(page).toHaveURL(new RegExp(`/artwork/${artworks[index].slug}$`));
    await expect(page.getByRole("heading", { name: artworks[index].titleZh, exact: true })).toBeVisible();
  }
});

test("new licensed artwork retains license, favorites, on-demand viewer and original saving", async ({ page }) => {
  const art = artworks.find((a) => a.slug === "the-scream-1893")!;
  const originals: string[] = [];
  page.on("request", (request) => { if (request.url() === art.imageUrl) originals.push(request.url()); });
  await page.goto(`${base}#/artwork/${art.slug}`);
  await expect(page.getByText(/Børre Høstland/)).toBeVisible();
  expect(originals).toHaveLength(0);
  await page.getByRole("button", { name: "收藏", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "已收藏" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: /高清查看/ }).click();
  const image = page.locator(".pswp__item").nth(1).locator("img.pswp__img");
  await expect(image).not.toHaveJSProperty("naturalWidth", 0, { timeout: 45000 });
  await expect(image).toHaveJSProperty("naturalWidth", art.width);
  expect(originals.length).toBeGreaterThan(0);
  const pending = new Promise<Download | Page>((resolve) => {
    page.once("download", resolve);
    page.once("popup", resolve);
  });
  await page.getByRole("button", { name: /^保存作品《呐喊/ }).click();
  const result = await pending;
  if ("suggestedFilename" in result) expect(result.suggestedFilename()).toBe("Edvard Munch - The Scream - 1893.jpg");
  else {
    await result.waitForURL((url) => url.href === art.imageUrl, { waitUntil: "commit" });
    await result.close();
  }
  await page.goBack();
  await expect(page.locator(".pswp")).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/artwork/${art.slug}$`));
});
