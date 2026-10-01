import { test, expect } from "@playwright/test";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
const base = "/personal-art-gallery/";

test("manifest, icons, scoped worker and standalone installation guidance work", async ({
  page,
}, info) => {
  const originals: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/original/")) originals.push(request.url());
  });
  await page.goto(base);
  const result = await page.evaluate(async () => {
    const link = document.querySelector<HTMLLinkElement>(
      'link[rel="manifest"]',
    )!;
    const manifest = await (await fetch(link.href)).json();
    const reg = await navigator.serviceWorker.ready;
    const iconResults = await Promise.all(
      manifest.icons.map(async (icon: { src: string }) => {
        const response = await fetch(icon.src);
        return {
          path: icon.src,
          status: response.status,
          type: response.headers.get("content-type"),
        };
      }),
    );
    return {
      manifest,
      scope: new URL(reg.scope).pathname,
      worker: new URL(reg.active!.scriptURL).pathname,
      icons: iconResults,
      shellKeys: (
        await Promise.all(
          (await caches.keys()).map(async (name) =>
            (await (await caches.open(name)).keys()).map(
              (request) => request.url,
            ),
          ),
        )
      ).flat(),
    };
  });
  expect(result.manifest.display).toBe("standalone");
  expect(result.manifest.name).toBe("私人美术馆");
  for (const field of ["id", "start_url", "scope"])
    expect(result.manifest[field]).toBe(base);
  expect(
    result.manifest.icons.map((icon: { sizes: string }) => icon.sizes),
  ).toEqual(["192x192", "512x512"]);
  expect(result.scope).toBe(base);
  expect(result.worker).toBe(`${base}sw.js`);
  expect(
    result.icons.every(
      (icon: { status: number; type: string }) =>
        icon.status === 200 && icon.type.includes("image/png"),
    ),
  ).toBe(true);
  expect(result.shellKeys.some((url: string) => url.endsWith(base))).toBe(true);
  expect(
    result.shellKeys.some((url: string) =>
      /\/images\/|\/original\/|photoswipe\.esm/.test(url),
    ),
  ).toBe(false);
  expect(originals).toHaveLength(0);
  if (info.project.name === "desktop-chromium") {
    const cdp = await page.context().newCDPSession(page);
    const manifest = await cdp.send("Page.getAppManifest");
    expect(manifest.errors).toEqual([]);
    const installability = await cdp.send("Page.getInstallabilityErrors");
    expect(
      installability.installabilityErrors.filter(
        (error) => error.errorId !== "in-incognito",
      ),
    ).toEqual([]);
  }
  await page.goto(`${base}#/my-gallery`);
  if (info.project.name.includes("390"))
    await expect(page.getByText(/在 Safari 中打开/)).toBeVisible();
  // Exercise native prompt lifecycle without claiming a physical home-screen installation.
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(event, {
      prompt: async () => {
        document.documentElement.dataset.prompted = "yes";
      },
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    dispatchEvent(event);
  });
  await page.getByRole("button", { name: "添加到主屏幕", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-prompted", "yes");
  await page.evaluate(() => dispatchEvent(new Event("appinstalled")));
  await expect(page.getByText(/你正在以独立应用方式观看/)).toBeVisible();
});

test("worker updates wait for approval, clear old caches and retain personal data offline", async ({
  page,
  context,
}) => {
  let version = 1;
  let offline = false;
  const worker = await readFile("dist/sw.js", "utf8");
  const types: Record<string, string> = {
    ".js": "text/javascript",
    ".css": "text/css",
    ".html": "text/html",
    ".webmanifest": "application/manifest+json",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".webp": "image/webp",
  };
  const server = createServer(async (req, res) => {
    if (offline) {
      res.destroy();
      return;
    }
    try {
      const pathname = new URL(req.url!, "http://localhost").pathname;
      if (!pathname.startsWith(base)) {
        res.writeHead(404).end();
        return;
      }
      const file = pathname.slice(base.length) || "index.html";
      const data =
        file === "sw.js"
          ? worker.replace(
              /const VERSION = "[^"]+";/,
              `const VERSION = "test-version-${version}";`,
            )
          : await readFile(path.join("dist", file));
      res.writeHead(200, {
        "content-type": types[path.extname(file)] || "application/octet-stream",
        "cache-control": "no-store",
      });
      res.end(data);
    } catch {
      res.writeHead(404).end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as import("node:net").AddressInfo;
  const url = `http://127.0.0.1:${address.port}${base}`;
  try {
    await page.goto(`${url}#/artwork/moonlight-strandgade`);
    await page.getByRole("button", { name: "收藏", exact: true }).click();
    await page.getByRole("textbox", { name: /我的备注/ }).fill("更新也要留下");
    await page.getByRole("button", { name: "保存备注" }).click();
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller)
        await new Promise<void>((resolve) =>
          navigator.serviceWorker.addEventListener(
            "controllerchange",
            () => resolve(),
            { once: true },
          ),
        );
    });
    const names = await page.evaluate(() => caches.keys());
    expect(names).toContain("personal-art-gallery-shell-test-version-1");
    version = 2;
    await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      await reg!.update();
    });
    await expect(page.getByRole("button", { name: "刷新更新" })).toBeVisible();
    expect(
      await page.evaluate(
        async () =>
          !!(await navigator.serviceWorker.getRegistration())!.waiting,
      ),
    ).toBe(true);
    // Unfinished edits stay in place while the worker waits.
    await page.getByRole("textbox", { name: /我的备注/ }).fill("还没有保存");
    await expect(page.getByRole("textbox", { name: /我的备注/ })).toHaveValue(
      "还没有保存",
    );
    await page.getByRole("button", { name: "保存备注" }).click();
    await page.getByRole("button", { name: "刷新更新" }).click();
    await expect(page.getByRole("button", { name: "已收藏" })).toBeVisible();
    await expect(page.getByRole("textbox", { name: /我的备注/ })).toHaveValue(
      "还没有保存",
    );
    await expect
      .poll(() => page.evaluate(() => caches.keys()))
      .toContain("personal-art-gallery-shell-test-version-2");
    expect(await page.evaluate(() => caches.keys())).not.toContain(
      "personal-art-gallery-shell-test-version-1",
    );
    // Backup tools are part of the small shell, so first use also works offline.
    const cached = await page.evaluate(async () =>
      (
        await Promise.all(
          (await caches.keys()).map(async (name) =>
            (await (await caches.open(name)).keys()).map(
              (request) => request.url,
            ),
          ),
        )
      ).flat(),
    );
    expect(cached.some((value) => /\/images\/|\/original\//.test(value))).toBe(
      false,
    );
    // Simulate a real origin outage; browser offline emulation does not consistently cover worker networking.
    offline = true;
    await page.addInitScript(() =>
      Object.defineProperty(navigator, "onLine", { get: () => false }),
    );
    await page.reload();
    await page.goto(`${url}#/my-gallery`);
    await expect(page.getByText(/目前离线/)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /导出我的美术馆数据/ }),
    ).toBeVisible();
    await page.goto(`${url}#/artwork/moonlight-strandgade`);
    await expect(page.getByRole("button", { name: "已收藏" })).toBeVisible();
    await page.getByRole("button", { name: "喜欢", exact: true }).click();
    await page.reload();
    await expect(page.getByRole("button", { name: "已喜欢" })).toBeVisible();
    await page.getByRole("button", { name: /高清查看/ }).click();
    await expect(page.getByText(/高清查看暂时不可用/)).toBeVisible();
    await page.getByRole("button", { name: "返回作品", exact: true }).click();
    await expect(page).not.toHaveURL(/view=1/);
  } finally {
    await context.setOffline(false);
    server.closeAllConnections();
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
