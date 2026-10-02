import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { canonicalTag, curateArtworks, randomArtwork } from "../src/curation.ts";
import { validateArtworks } from "../scripts/validate-artworks.ts";
const records = JSON.parse(await readFile(new URL("../src/data/artworks.json", import.meta.url), "utf8"));
const exhibition = curateArtworks(records);

test("exhibition preserves every stable record and separates artists and repeated pond views", () => {
  const original = records.map((a) => a.id);
  assert.notDeepEqual(exhibition.map((a) => a.id), original);
  assert.deepEqual(records.map((a) => a.id), original);
  assert.deepEqual(new Set(exhibition.map((a) => a.id)), new Set(original));
  for (let i = 0; i < exhibition.length; i++) {
    assert.notEqual(exhibition[i].artistSlug, exhibition[(i + 1) % exhibition.length].artistSlug);
  }
  for (const artist of ["claude-monet", "vincent-van-gogh"])
    assert.ok(exhibition.slice(0, 20).filter((a) => a.artistSlug === artist).length <= 6);
  const pond = ["reflections-of-clouds-water-lily-pond", "japanese-footbridge", "water-lily-pond-london", "water-lilies-chicago"].map((slug) => exhibition.findIndex((a) => a.slug === slug)).sort((a, b) => a - b);
  for (let i = 1; i < pond.length; i++) assert.ok(pond[i] - pond[i - 1] >= 3);
  assert.ok(exhibition.slice(0, 20).some((a) => a.aspectRatio < 0.85));
  assert.ok(exhibition.slice(0, 20).some((a) => a.aspectRatio > 1.5));
  assert.throws(() => validateArtworks([{ ...records[0], curationOrder: records[1].curationOrder }, records[1]]), /curationOrder/);
});

test("random encounters avoid the current artist and last five picks across a long session", () => {
  let current = exhibition[0];
  let recent = [];
  const seen = new Set();
  for (let i = 0; i < 300; i++) {
    const next = randomArtwork(exhibition, recent, current, () => (i * 0.371) % 1);
    assert.notEqual(next.artistSlug, current.artistSlug);
    assert.ok(!recent.includes(next.id));
    seen.add(next.id);
    recent = [...recent, next.id].slice(-5);
    current = next;
  }
  assert.ok(seen.size > 40);
  const reachable = new Set();
  for (const from of exhibition.slice(0, 2))
    for (let i = 0; i < exhibition.length; i++)
      reachable.add(randomArtwork(exhibition, [], from, () => (i + 0.5) / exhibition.length).id);
  assert.equal(reachable.size, exhibition.length, "exclusions are temporary; every work remains reachable");
});

test("random can use session history without a detail and degrades safely for tiny collections", () => {
  const a = exhibition[0], b = exhibition[1];
  assert.notEqual(randomArtwork(exhibition, [a.id], undefined, () => 0).artistSlug, a.artistSlug);
  assert.equal(randomArtwork([], [], undefined), undefined);
  assert.equal(randomArtwork([a], [a.id], a), a);
  assert.equal(randomArtwork([a, b], [a.id, b.id], a), b);
  assert.equal(randomArtwork([a, { ...b, artistSlug: a.artistSlug }], [], a, () => 0).id, b.id);
});

test("public tags and movement names are concise and consistent", () => {
  assert.equal(canonicalTag("孤独感"), "孤独");
  assert.equal(canonicalTag("自然"), "风景");
  assert.equal(canonicalTag("constructor"), "constructor");
  for (const a of exhibition) {
    assert.ok(a.tags.length >= 2 && a.tags.length <= 5);
    assert.ok(a.tags.every((tag) => !["自然", "孤独感", "适合壁纸"].includes(tag)));
    assert.notEqual(a.movement, "写实主义");
  }
});

test("short artist wall labels reference existing canonical artists", async () => {
  const profiles = JSON.parse(await readFile(new URL("../src/data/artists.json", import.meta.url), "utf8"));
  assert.ok(profiles.length >= 7);
  assert.ok(new Set(records.flatMap((a) => a.tags)).size <= 36);
  assert.equal(new Set(profiles.map((p) => p.artistSlug)).size, profiles.length);
  for (const p of profiles) {
    assert.ok(records.some((a) => a.artistSlug === p.artistSlug));
    assert.match(p.lifespan, /^\d{4}–\d{4}$/);
    assert.ok(p.description.length < 45);
    assert.equal(new URL(p.sourceUrl).protocol, "https:");
  }
});
