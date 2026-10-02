import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { validateArtists } from "../scripts/validate-artists.ts";
const profiles = JSON.parse(await readFile(new URL("../src/data/artists.json", import.meta.url), "utf8"));
const artworks = JSON.parse(await readFile(new URL("../src/data/artworks.json", import.meta.url), "utf8"));

test("every collected artist has a concise independent sourced archive", () => {
  assert.doesNotThrow(() => validateArtists(profiles, artworks));
  assert.equal(profiles.length, new Set(artworks.map((a) => a.artistSlug)).size);
  assert.equal(profiles.find((p) => p.artistSlug === "alfred-sisley").birthYear, 1839);
  assert.equal(profiles.find((p) => p.artistSlug === "pieter-de-hooch").deathYear, null);
  for (const slug of ["grant-wood", "johannes-vermeer", "pieter-de-hooch", "jacob-van-ruisdael", "meindert-hobbema", "jan-van-eyck", "francisco-de-zurbaran"])
    assert.equal(profiles.find((p) => p.artistSlug === slug).portraitUrl, "", "uncertain identity must not become a confirmed portrait");
});

test("portrait derivatives preserve a fixed ratio, mobile sizes and byte budgets", async () => {
  for (const p of profiles.filter((p) => p.portraitUrl))
    for (const width of [320, 640]) {
      const buffer = await readFile(new URL(`../public/${p.portraitUrl.replace("-320.webp", `-${width}.webp`)}`, import.meta.url));
      assert.equal(buffer.toString("ascii", 8, 12), "WEBP");
      const extended = buffer.toString("ascii", 12, 16) === "VP8X";
      assert.ok(extended || buffer.toString("ascii", 12, 16) === "VP8 ");
      assert.equal(extended ? buffer.readUIntLE(24, 3) + 1 : buffer.readUInt16LE(26) & 0x3fff, width);
      assert.equal(extended ? buffer.readUIntLE(27, 3) + 1 : buffer.readUInt16LE(28) & 0x3fff, width * 1.25);
      assert.ok(buffer.length <= (width === 320 ? 48 : 200) * 1024, p.artistSlug);
    }
});

test("artist additions reject duplicates, missing provenance, false names and unsafe sources", () => {
  const p = profiles[0], a = artworks.filter((a) => a.artistSlug === p.artistSlug);
  for (const patch of [{ nameZh: "wrong name" }, { portraitRights: "Unknown" }, { portraitSourceUrl: "javascript:alert(1)" }, { biographySources: [] }, { biography: "too short" }, { description: "长".repeat(36) }, { deathYear: 1800 }, { portraitUrl: "images/a-work-400.webp" }, { portraitUrl: "", portraitSourceUrl: "", portraitRights: "", portraitMissingReason: "" }])
    assert.throws(() => validateArtists([{ ...p, ...patch }], a));
  assert.throws(() => validateArtists([p, p], a));
  assert.throws(() => validateArtists([], a));
});
