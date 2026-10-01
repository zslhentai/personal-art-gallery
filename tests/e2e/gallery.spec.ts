import { test, expect } from "@playwright/test";
const base = "/personal-art-gallery/";
test("gallery has complete images, responsive layout, valid navigation and no browser errors", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto(base);
  await expect(
    page.getByRole("heading", { name: /为喜欢的画，\s*留一间房。/ }),
  ).toBeVisible();
  await expect(page.locator(".artwork-card")).toHaveCount(10);
  for (const card of await page.locator(".artwork-card").all()) {
    await card.scrollIntoViewIfNeeded();
    await expect(card.locator("img")).toHaveJSProperty("complete", true);
    await expect(card.locator("img")).not.toHaveJSProperty("naturalWidth", 0);
    const metrics = await card
      .locator("img")
      .evaluate((img) => ({
        ratio:
          img.getBoundingClientRect().width /
          img.getBoundingClientRect().height,
        original: img.naturalWidth / img.naturalHeight,
      }));
    expect(Math.abs(metrics.ratio - metrics.original)).toBeLessThan(0.02);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  if (testInfo.project.name.includes("390")) {
    expect(page.viewportSize()?.width).toBe(390);
    expect(
      await page
        .locator(".artwork-card")
        .first()
        .evaluate((el) => el.getBoundingClientRect().width),
    ).toBeGreaterThan(340);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-gallery.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "切换深色模式" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-dark.png`,
  });
  expect(errors).toEqual([]);
});
test("filters combine, clear, survive refresh, and indices open the correct works", async ({
  page,
}, testInfo) => {
  await page.goto(base);
  if (testInfo.project.name.includes("390"))
    await page.getByRole("button", { name: "筛选作品" }).click();
  await page
    .getByLabel("画家", { exact: true })
    .selectOption("vincent-van-gogh");
  await expect(page.locator(".artwork-card")).toHaveCount(3);
  await page.getByLabel("标签", { exact: true }).selectOption("肖像");
  await expect(page.locator(".artwork-card")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".artwork-card")).toHaveCount(1);
  if (testInfo.project.name.includes("390"))
    await page.getByRole("button", { name: /筛选作品/ }).click();
  await page.getByRole("link", { name: "清除筛选", exact: true }).click();
  await expect(page.locator(".artwork-card")).toHaveCount(10);
  await page
    .getByLabel("流派 / 风格", { exact: true })
    .selectOption("新古典主义");
  await page.getByLabel("年代", { exact: true }).selectOption("1900年代");
  await expect(
    page.getByRole("heading", { name: "暂时没有匹配的作品" }),
  ).toBeVisible();
  await page
    .locator(".main-nav")
    .getByRole("link", { name: "画家", exact: true })
    .click();
  await page.getByRole("link", { name: /文森特·梵高/ }).click();
  await expect(page.locator(".artwork-card")).toHaveCount(3);
  await page
    .locator(".main-nav")
    .getByRole("link", { name: "标签", exact: true })
    .click();
  await page.getByRole("link", { name: /^水面/ }).click();
  await expect(page.locator(".artwork-card")).toHaveCount(1);
});
test("artwork metadata, independent likes and favorites, and notes persist locally", async ({
  page,
}) => {
  await page.goto(`${base}#/artwork/moonlight-strandgade`);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "月光，斯特兰街30号", exact: true }),
  ).toBeVisible();
  for (const label of [
    "Artist / 画家",
    "Year / 年份",
    "Style / 流派",
    "Medium / 媒材",
    "Dimensions / 尺寸",
    "Collection / 馆藏",
    "Original Source / 原始来源",
    "Image Source / 图片来源",
  ])
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "喜欢", exact: true }).click();
  await page.getByRole("button", { name: "收藏", exact: true }).click();
  await page
    .getByRole("textbox", { name: /我的备注/ })
    .fill("窗格里的月光，很安静。");
  await page.getByRole("button", { name: "保存备注" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "已收藏" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("textbox", { name: /我的备注/ })).toHaveValue(
    "窗格里的月光，很安静。",
  );
  await page
    .locator(".main-nav")
    .getByRole("link", { name: "收藏", exact: true })
    .click();
  await expect(page.locator(".artwork-card")).toHaveCount(1);
  await page.getByRole("link", { name: "喜欢的作品" }).click();
  await expect(page.locator(".artwork-card")).toHaveCount(1);
  await page.getByRole("link", { name: "查看《月光，斯特兰街30号》" }).click();
  await page.getByRole("button", { name: "已收藏" }).click();
  await page
    .locator(".main-nav")
    .getByRole("link", { name: "收藏", exact: true })
    .click();
  await expect(page.locator(".artwork-card")).toHaveCount(0);
  await page.getByRole("link", { name: "喜欢的作品" }).click();
  await expect(page.locator(".artwork-card")).toHaveCount(1);
});
test("random opens another artwork, viewer supports keyboard navigation, zoom, ESC and browser back", async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(`${base}#/artwork/moonlight-strandgade`);
  await page.locator(".random-header").click();
  await expect(page).not.toHaveURL(/moonlight-strandgade/);
  await page.getByRole("button", { name: /高清查看/ }).click();
  await expect(page.locator(".pswp")).toBeVisible();
  const currentImage = page.locator(".pswp__item").nth(1).locator("img.pswp__img");
  await expect(currentImage).toHaveJSProperty("complete", true, {
    timeout: 45000,
  });
  await expect(currentImage).not.toHaveJSProperty("naturalWidth", 0);
  await expect(currentImage).toBeVisible();
  const first = await page.locator(".pswp__counter").textContent();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".pswp__counter")).not.toHaveText(first!);
  await page.getByRole("button", { name: "缩放作品" }).click();
  await expect(page.locator(".pswp")).toHaveClass(/pswp--zoomed-in/);
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-viewer.png`,
  });
  await page.keyboard.press("Escape");
  await expect(page.locator(".pswp")).toHaveCount(0);
  await expect(page).not.toHaveURL(/view=1/);
  await page.getByRole("button", { name: /高清查看/ }).click();
  await expect(page.locator(".pswp")).toBeVisible();
  await page.goBack();
  await expect(page.locator(".pswp")).toHaveCount(0);
  if (testInfo.project.name.includes("390")) {
    await page.setViewportSize({ width: 844, height: 390 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(errors).toEqual([]);
});
test("direct viewer link closes into the artwork, invalid routes and corrupt storage recover", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "personal-art-gallery:library:v1",
      '{"met-441933":{"favorite":"bad","notes":123}}',
    ),
  );
  await page.goto(`${base}#/artwork/moonlight-strandgade?view=1`);
  await expect(page.locator(".pswp")).toBeVisible();
  await page.getByRole("button", { name: "关闭大图" }).click();
  await expect(page).toHaveURL(/#\/artwork\/moonlight-strandgade$/);
  await expect(
    page.getByRole("button", { name: "收藏", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.goto(`${base}#/artwork/unknown`);
  await expect(
    page.getByRole("heading", { name: "这件作品还未入馆" }),
  ).toBeVisible();
});
