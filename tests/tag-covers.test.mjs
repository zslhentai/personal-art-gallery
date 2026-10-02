import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { selectTagCovers } from "../src/tagCovers.ts";
const records = JSON.parse(await readFile(new URL("../src/data/artworks.json", import.meta.url), "utf8"));
const overrides = JSON.parse(await readFile(new URL("../src/data/tag-covers.json", import.meta.url), "utf8"));
const tags = [...new Set(records.flatMap((a) => a.tags))].sort((a, b) => a.localeCompare(b, "zh-CN"));

test("expanded tag covers are valid, distinct, stable and independent of data append order", () => {
  const first = selectTagCovers(records, tags, overrides);
  assert.equal(first.size, tags.length);
  assert.equal(new Set([...first.values()].map((a) => a.id)).size, tags.length);
  assert.deepEqual([...selectTagCovers([...records].reverse(), tags, overrides)], [...first]);
  assert.deepEqual([...selectTagCovers(records, tags, overrides)], [...first]);
  for (const entry of overrides) {
    assert.equal(first.get(entry.tag).id, entry.coverArtworkId);
    assert.ok(first.get(entry.tag).tags.includes(entry.tag));
  }
  const common = ["风景", "光影", "明亮", "夜景", "水面", "室内", "孤独", "梦幻"];
  assert.equal(new Set(common.map((tag) => first.get(tag).id)).size, common.length);
  for (const tag of tags) assert.ok(first.get(tag).tags.includes(tag));
  const automatic = selectTagCovers(records, tags);
  assert.equal(new Set([...automatic.values()].map((a) => a.id)).size, tags.length);
});

test("invalid overrides fall back; scarce tags get priority and tiny collections degrade safely", () => {
  const a = { ...records[0], id: "a", tags: ["shared", "scarce"], curationOrder: 1 };
  const b = { ...records[1], id: "b", tags: ["shared"], curationOrder: 2 };
  assert.equal(selectTagCovers([a, b], ["shared", "scarce"]).get("shared").id, "b");
  const covers = selectTagCovers([a, b], ["shared", "scarce"], [{ tag: "shared", coverArtworkId: "missing" }]);
  assert.equal(covers.get("shared").id, "b");
  assert.equal(selectTagCovers([a, b], ["scarce"], [{ tag: "scarce", coverArtworkId: "b" }]).get("scarce").id, "a");
  assert.equal(selectTagCovers([], ["absent"]).size, 0);
  assert.equal(selectTagCovers([a], ["shared", "scarce"]).size, 2);
  const manual = selectTagCovers([a, b], ["shared", "scarce"], [{ tag: "shared", coverArtworkId: "a" }]);
  assert.equal(manual.get("shared").id, "a", "intentional editorial override wins even if reuse is unavoidable");
});
