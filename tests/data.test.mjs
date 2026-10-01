import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { validateArtworks } from "../scripts/validate-artworks.ts";
const artworks = JSON.parse(
  await readFile(new URL("../src/data/artworks.json", import.meta.url), "utf8"),
);
test("curated collection has stable unique identifiers and complete source metadata", () => {
  assert.ok(artworks.length >= 60);
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
test("every responsive preview has correct dimensions, preserves composition and a bounded byte budget", async () => {
  let total = 0;
  for (const a of artworks)
    for (const width of [400, 800, 1200]) {
      const url = new URL(
        `../public/images/${a.slug}-${width}.webp`,
        import.meta.url,
      );
      const buffer = await readFile(url);
      assert.equal(buffer.toString("ascii", 8, 12), "WEBP");
      const bytes = (await stat(url)).size;
      const limits = { 400: 96, 800: 320, 1200: 700 };
      assert.ok(bytes < limits[width] * 1024, `${a.slug}-${width}: oversized preview`);
      assert.equal(buffer.toString("ascii", 12, 16), "VP8 ");
      const actualWidth = buffer.readUInt16LE(26) & 0x3fff;
      const actualHeight = buffer.readUInt16LE(28) & 0x3fff;
      assert.equal(actualWidth, width);
      assert.ok(Math.abs(actualWidth / actualHeight - a.aspectRatio) < 0.015, `${a.slug}: preview crop/ratio`);
      total += bytes;
    }
  assert.ok(total < artworks.length * 512 * 1024, `${total} bytes`);
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
    { curationOrder: undefined },
    { curationOrder: 0 },
    { curationOrder: 1.5 },
    { rights: "" },
    { downloadable: true, rights: "Unknown" },
    { aspectRatio: 2 },
    { yearStart: 3000 },
    { sourceUrl: "javascript:alert(1)" },
    { tags: [null] },
    { tags: ["水面", "水面"] },
    { downloadable: true, rights: "Public domain / PD-US only" },
  ])
    assert.throws(() => validateArtworks([{ ...artworks[0], ...patch }]));
  assert.throws(() => validateArtworks([artworks[0], artworks[0]]));
  assert.throws(() => validateArtworks([
    artworks[0], { ...artworks[0], id: "duplicate-image", slug: "duplicate-image" },
  ]));
  assert.throws(() => validateArtworks([
    artworks[0], { ...artworks[2], artist: "V. van Gogh" },
  ]));
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

test("each artwork has reviewed provenance and unique verified source records", async () => {
  const rows = JSON.parse(await readFile(new URL("../docs/collection-sources.json", import.meta.url), "utf8"));
  assert.equal(rows.length, artworks.length);
  assert.equal(new Set(rows.map((r) => r.id)).size, rows.length);
  const entityIds = rows.filter((r) => r.wikidata).map((r) => r.wikidata);
  assert.equal(new Set(entityIds).size, entityIds.length, "duplicate museum artwork rather than a distinct series version");
  for (const a of artworks) {
    const r = rows.find((r) => r.id === a.id);
    assert.ok(r, `${a.id}: missing provenance`);
    assert.equal(r.imageUrl, a.imageUrl);
    assert.equal(r.sourceUrl, a.sourceUrl);
    assert.equal(r.verifiedImageWidth, a.width);
    assert.equal(r.verifiedImageHeight, a.height);
    assert.ok(r.checkedAt && r.license && r.metadataSource);
    if (a.id.startsWith("met-")) assert.equal(r.isPublicDomain, true);
  }
});
