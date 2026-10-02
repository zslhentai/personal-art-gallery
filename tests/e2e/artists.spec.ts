import { test, expect } from "@playwright/test";
import profiles from "../../src/data/artists.json" with { type: "json" };
const base = "/personal-art-gallery/";

test("artist archive opens from both entrances, refreshes and returns to the directory", async ({ page }) => {
  const requests: string[] = [];
  const errors: string[] = [];
  page.on("request", (r) => requests.push(r.url()));
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}#/artists`);
  await expect(page.locator(".artist-portrait")).toHaveCount(profiles.length);
  expect(requests.some((url) => url.includes("/images/"))).toBe(false);
  await page.getByRole("link", { name: /^文森特·梵高 ·/ }).click();
  await expect(page).toHaveURL(/#\/artist\/vincent-van-gogh$/);
  await expect(page.getByRole("heading", { name: "文森特·梵高", exact: true })).toBeVisible();
  await expect(page.locator(".artist-hero img")).not.toHaveJSProperty("naturalWidth", 0);
  await expect(page.locator(".artist-lifespan")).toHaveText("1853–1890");
  await expect(page.locator(".artist-biography")).toContainText("提奥");
  await expect(page.locator(".artist-biography")).toContainText("阿尔勒");
  await expect(page.locator(".artist-biography")).toContainText("圣雷米");
  await expect(page.locator(".artist-biography")).toContainText("奥维尔");
  await expect(page.locator(".artwork-card")).toHaveCount(14);
  await expect(page.locator(".gallery-intro")).toHaveCount(0);
  await expect(page.locator(".main-nav").getByRole("link", { name: "画家", exact: true })).toHaveAttribute("aria-current", "page");
  await expect(page).toHaveTitle("文森特·梵高 · 私人美术馆");
  await page.reload();
  await expect(page.locator(".artwork-card")).toHaveCount(14);
  await page.getByText("资料与肖像来源", { exact: true }).click();
  await expect(page.locator(".artist-sources")).toContainText("Public domain");
  await expect(page.locator(".artist-sources a")).toHaveCount(profiles.find((p) => p.artistSlug === "vincent-van-gogh")!.biographySources.length + 1);
  await page.getByRole("link", { name: "← 画家名录" }).click();
  await page.getByRole("link", { name: /^约翰内斯·维米尔 ·/ }).click();
  await expect(page.locator(".artist-hero .portrait-unavailable")).toHaveText("肖像待考");
  await expect(page.locator(".artwork-card")).toHaveCount(4);
  await page.goBack();
  await expect(page.getByRole("heading", { name: "循着画家的目光" })).toBeVisible();
  await page.goto(`${base}#/artwork/starry-night`);
  await page.locator(".artist-link").click();
  await expect(page).toHaveURL(/#\/artist\/vincent-van-gogh$/);
  await page.goBack();
  await expect(page).toHaveURL(/#\/artwork\/starry-night$/);
  expect(errors).toEqual([]);
});

test("artist pages and compact heroes remain readable at narrow and wide widths", async ({ page }) => {
  for (const width of [375, 390, 430, 1280]) {
    await page.setViewportSize({ width, height: width > 600 ? 900 : 664 });
    for (const path of ["", "favorites", "artists", "tags"]) {
      await page.goto(`${base}#/${path}`);
      const hero = page.locator(".gallery-intro,.section-heading");
      const metrics = await hero.boundingBox();
      expect(metrics!.height).toBeLessThan(width > 600 ? (path ? 190 : 260) : (path ? 135 : 195));
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    }
    for (const slug of ["vincent-van-gogh", "auguste-renoir", "jean-baptiste-simeon-chardin", "johannes-vermeer"]) {
      await page.goto(`${base}#/artist/${slug}`);
      await expect(page.locator(".artist-hero h1")).toBeVisible();
      await expect(page.locator(".artist-biography > p")).toHaveCount(2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const portrait = await page.locator(".artist-hero .artist-portrait").boundingBox();
      expect(portrait!.width / portrait!.height).toBeCloseTo(0.8);
    }
  }
  await page.getByRole("button", { name: "切换深色模式" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.goto(`${base}#/artist/not-a-collected-artist`);
  await expect(page.getByRole("heading", { name: "这位画家尚未入馆" })).toBeVisible();
});

test("failed portrait requests retain an accessible fixed-size fallback", async ({ page }) => {
  await page.route("**/portraits/vincent-van-gogh-*.webp", (route) => route.abort());
  await page.goto(`${base}#/artist/vincent-van-gogh`);
  await expect(page.locator(".artist-hero .portrait-unavailable")).toBeVisible();
  await expect(page.getByRole("img", { name: /文森特·梵高：肖像暂未加载/ })).toBeVisible();
  await expect(page.locator(".artwork-card")).toHaveCount(14);
});
