import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { validateArtworks } from "../scripts/validate-artworks.ts";
const artworks = JSON.parse(
  await readFile(new URL("../src/data/artworks.json", import.meta.url), "utf8"),
);
test("curated collection has stable unique identifiers and complete source metadata", () => {
  assert.ok(artworks.length >= 8);
  validateArtworks(artworks);
  assert.equal(new Set(artworks.map((a) => a.id)).size, artworks.length);
  assert.equal(new Set(artworks.map((a) => a.slug)).size, artworks.length);
  for (const a of artworks) {
    for (const key of [
      "id",
      "slug",
      "titleZh",
      "titleOriginal",
      "artist",
      "artistSlug",
      "year",
      "movement",
      "medium",
      "dimensions",
      "museum",
      "museumUrl",
      "imageUrl",
      "thumbnailUrl",
      "sourceUrl",
      "imageSourceUrl",
      "rights",
      "alt",
    ])
      assert.ok(a[key], `${a.id}: missing ${key}`);
    assert.match(a.slug, /^[a-z0-9-]+$/);
    assert.ok(a.yearStart <= a.yearEnd);
    assert.ok(a.width > 1200 && a.height > 1200);
    assert.ok(Math.abs(a.aspectRatio - a.width / a.height) < 0.0001);
    assert.ok(a.tags.length > 0);
    assert.equal(typeof a.downloadable, "boolean");
    assert.equal(new URL(a.imageUrl).protocol, "https:");
    assert.equal(new URL(a.sourceUrl).protocol, "https:");
    assert.equal(a.notes, "", "do not invent the owner’s personal notes");
  }
  assert.ok(artworks.some((a) => a.aspectRatio < 0.85));
  assert.ok(artworks.some((a) => a.aspectRatio > 1.45));
});
test("every responsive preview exists, is WebP, and the total stays below 5 MB", async () => {
  let total = 0;
  for (const a of artworks)
    for (const width of [400, 800, 1200]) {
      const url = new URL(
        `../public/images/${a.slug}-${width}.webp`,
        import.meta.url,
      );
      const buffer = await readFile(url);
      assert.equal(buffer.toString("ascii", 8, 12), "WEBP");
      total += (await stat(url)).size;
    }
  assert.ok(total < 5 * 1024 * 1024, `${total} bytes`);
});
test("GitHub Pages entry uses the repository base path and static hash routes", async () => {
  const { default: config } = await import("../vite.config.ts");
  assert.equal(config.base, "/personal-art-gallery/");
  const workflow = await readFile(
    new URL("../.github/workflows/pages.yml", import.meta.url),
    "utf8",
  );
  assert.match(workflow, /actions\/deploy-pages@v4/);
});

test("artwork additions fail on missing rights/download flag, duplicate ids and invalid ratios", () => {
  for (const patch of [
    { downloadable: undefined },
    { rights: "" },
    { downloadable: true, rights: "Unknown" },
    { aspectRatio: 2 },
    { yearStart: 3000 },
    { sourceUrl: "javascript:alert(1)" },
    { tags: [null] },
  ])
    assert.throws(() => validateArtworks([{ ...artworks[0], ...patch }]));
  assert.throws(() => validateArtworks([artworks[0], artworks[0]]));
  assert.doesNotThrow(() =>
    validateArtworks([
      {
        ...artworks[0],
        downloadable: false,
        rights: "Unknown / permission required",
      },
    ]),
  );
});
