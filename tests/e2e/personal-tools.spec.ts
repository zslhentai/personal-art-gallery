import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const base = "/personal-art-gallery/";
const id = "met-441933";
const key = "personal-art-gallery:library:v1";
const backup = (entries: object, extra = {}) =>
  JSON.stringify({
    app: "personal-art-gallery",
    schemaVersion: 1,
    exportedAt: "2026-10-01T00:00:00Z",
    entries,
    ...extra,
  });
const upload = async (
  page: import("@playwright/test").Page,
  content: string,
) => {
  await page
    .getByLabel("选择美术馆 JSON 备份")
    .setInputFiles({
      name: "backup.json",
      mimeType: "application/json",
      buffer: Buffer.from(content),
    });
};

test("backup exports real user data and restores only after a reviewed merge", async ({
  page,
}) => {
  await page.goto(`${base}#/artwork/moonlight-strandgade`);
  await page.getByRole("button", { name: "喜欢", exact: true }).click();
  await page.getByRole("button", { name: "收藏", exact: true }).click();
  await page.getByRole("textbox", { name: /我的备注/ }).fill("现在的备注");
  await page.getByRole("button", { name: "保存备注" }).click();
  await page.getByRole("link", { name: "备份与安装 →", exact: true }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: /导出我的美术馆数据/ }).click();
  const downloaded = await pending;
  expect(downloaded.suggestedFilename()).toMatch(
    /^personal-art-gallery-backup-\d{4}-\d{2}-\d{2}\.json$/,
  );
  const data = JSON.parse(await readFile((await downloaded.path())!, "utf8"));
  expect(data.entries[id]).toEqual({
    liked: true,
    favorite: true,
    notes: "现在的备注",
  });
  expect(data.schemaVersion).toBe(1);
  expect(data.app).toBe("personal-art-gallery");
  expect(data.entries[id].imageUrl).toBeUndefined();
  await upload(
    page,
    backup({
      [id]: { liked: false, favorite: false, notes: "旧备注", ignored: 1 },
      "met-436535": { favorite: true, notes: "补入" },
      removed: { favorite: true },
    }),
  );
  await expect(page.getByText(/跳过 1 件未在当前馆藏/)).toBeVisible();
  expect(
    await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), key),
  ).toEqual(data.entries);
  await page.getByRole("button", { name: "确认合并导入" }).click();
  await expect(page.getByRole("status")).toContainText("已合并 2 件作品");
  const merged = await page.evaluate(
    (k) => JSON.parse(localStorage.getItem(k)!),
    key,
  );
  expect(merged[id]).toEqual(data.entries[id]);
  expect(merged["met-436535"].notes).toBe("补入");
  expect(merged.removed).toBeUndefined();
  // A clean browser library can restore both flags and notes exactly.
  await page.evaluate((k) => localStorage.removeItem(k), key);
  await page.reload();
  await upload(page, JSON.stringify(data));
  await page.getByRole("button", { name: "确认合并导入" }).click();
  await page.goto(`${base}#/artwork/moonlight-strandgade`);
  await page.reload();
  await expect(page.getByRole("button", { name: "已收藏" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: "已喜欢" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("textbox", { name: /我的备注/ })).toHaveValue(
    "现在的备注",
  );
});

test("empty, damaged, foreign and unsupported backups never destroy current records", async ({
  page,
}) => {
  await page.goto(`${base}#/my-gallery`);
  await page.evaluate(
    ({ key, id }) =>
      localStorage.setItem(
        key,
        JSON.stringify({ [id]: { favorite: true, notes: "留下" } }),
      ),
    { key, id },
  );
  await page.reload();
  for (const [text, message] of [
    ["{broken", /JSON/],
    ["{}", /不是私人美术馆/],
    [backup({}, { schemaVersion: 0 }), /备份版本/],
    [backup({}, { schemaVersion: 99 }), /备份版本/],
    [backup({ [id]: { liked: "true" } }), /格式错误/],
  ]) {
    await upload(page, text as string);
    await expect(page.getByRole("status")).toContainText(message as RegExp);
    await expect(
      page.getByRole("button", { name: "确认合并导入" }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(
        (k) => JSON.parse(localStorage.getItem(k)!)["met-441933"].notes,
        key,
      ),
    ).toBe("留下");
  }
  await upload(page, backup({}));
  await expect(page.getByText(/可合并 0 件作品/)).toBeVisible();
  await page.getByRole("button", { name: "确认合并导入" }).click();
  expect(
    await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), key),
  ).toEqual({ [id]: { favorite: true, notes: "留下" } });
  await page.evaluate((k) => localStorage.removeItem(k), key);
  await page.reload();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: /导出我的美术馆数据/ }).click();
  expect(
    JSON.parse(await readFile((await (await pending).path())!, "utf8")).entries,
  ).toEqual({});
  await upload(page, backup({ [id]: { favorite: true } }));
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Storage unavailable", "QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: "确认合并导入" }).click();
  await expect(page.getByRole("status")).toContainText("未导入任何记录");
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBeNull();
});

test("save uses the original from detail and the currently viewed work", async ({
  page,
}, info) => {
  await page.goto(`${base}#/artwork/moonlight-strandgade`);
  if (info.project.name.includes("390")) {
    const popup = page.waitForEvent("popup");
    await page.getByRole("button", { name: "保存作品", exact: true }).click();
    const original = await popup;
    await original.waitForURL(/DP273105\.jpg/);
    await original.close();
    await expect(
      page.getByRole("status").filter({ hasText: "已打开高清原图" }),
    ).toContainText("长按图片保存");
  } else {
    await page.route("**/original/DP273105.jpg", async (route) =>
      route.fulfill({
        body: await readFile("public/icons/icon-512.png"),
        headers: {
          "access-control-allow-origin": "*",
          "content-type": "image/png",
        },
      }),
    );
    const pending = page.waitForEvent("download");
    await page.getByRole("button", { name: "保存作品", exact: true }).click();
    const download = await pending;
    expect(download.suggestedFilename()).toBe(
      "Vilhelm Hammershøi - Moonlight, Strandgade 30 - 1900–1906.png",
    );
    expect((await readFile((await download.path())!)).length).toBeGreaterThan(
      100,
    );
  }
  await page.getByRole("button", { name: /高清查看/ }).click();
  await expect(
    page.locator(".pswp__item").nth(1).locator("img"),
  ).not.toHaveJSProperty("naturalWidth", 0, { timeout: 45000 });
  await page.keyboard.press("ArrowRight");
  await expect(page.locator(".pswp__counter")).toHaveText("3 / 10");
  const save = page.getByRole("button", { name: /^保存作品《/ });
  await expect(save).toHaveAttribute("aria-label", "保存作品《玫瑰》");
  if (info.project.name.includes("390")) {
    const popup = page.waitForEvent("popup");
    await save.click();
    const original = await popup;
    await original.waitForURL(/DP346475\.jpg/);
    await original.close();
  } else {
    const pending = new Promise<
      import("@playwright/test").Download | import("@playwright/test").Page
    >((resolve) => {
      page.once("download", resolve);
      page.once("popup", resolve);
    });
    await save.click();
    const result = await pending;
    if ("suggestedFilename" in result)
      expect(result.suggestedFilename()).toContain("Roses - 1890.jpg");
    else {
      await result.waitForURL(/DP346475\.jpg/);
      await result.close();
    }
  }
  await page.keyboard.press("Escape");
  await expect(page.locator(".pswp")).toHaveCount(0);
});

test("restricted artwork hides saving in both detail and viewer", async ({
  page,
}) => {
  await page.route("**/assets/index-*.js", async (route) => {
    const response = await route.fetch();
    const body = await response.text();
    expect(/"downloadable":true/.test(body)).toBe(true);
    await route.fulfill({
      response,
      body: body.replace(/"downloadable":true/g, '"downloadable":false'),
    });
  });
  await page.goto(`${base}#/artwork/moonlight-strandgade`);
  await expect(
    page.getByRole("button", { name: "保存作品", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: /高清查看/ }).click();
  await expect(page.locator(".pswp")).toBeVisible();
  await expect(page.getByRole("button", { name: /^保存作品《/ })).toHaveCount(
    0,
  );
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("button", { name: /^保存作品《/ })).toHaveCount(
    0,
  );
  await page.keyboard.press("Escape");
});

test("request failure or a blocked popup leaves a usable source link", async ({
  page,
}) => {
  await page.goto(`${base}#/artwork/moonlight-strandgade`);
  await page.route("**/original/**", (route) =>
    route.request().resourceType() === "fetch"
      ? route.abort()
      : route.continue(),
  );
  await page.evaluate(() => {
    window.open = () => null;
  });
  await page.getByRole("button", { name: "保存作品", exact: true }).click();
  await expect(
    page.getByRole("link", { name: "打开高清原图 ↗", exact: true }),
  ).toHaveAttribute("href", /DP273105\.jpg/);
  await expect(
    page.getByRole("status").filter({ hasText: "高清原图" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "保存作品", exact: true }),
  ).toBeEnabled();
});
