import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createBackup,
  parseBackup,
  mergeBackup,
  maxBackupBytes,
} from "../src/backup.ts";
const ids = new Set(["met-1", "met-2"]);
const encode = (entries) =>
  JSON.stringify(createBackup(entries, new Date("2026-10-01T00:00:00Z")));
test("backups round-trip only user data, including independent flags and empty records", () => {
  const library = {
    "met-1": { favorite: true, liked: false, notes: "安静" },
    "met-2": { favorite: false, liked: true, notes: "" },
  };
  assert.deepEqual(parseBackup(encode(library), ids).entries, library);
  assert.deepEqual(parseBackup(encode({}), ids).entries, {});
  assert.deepEqual(Object.keys(createBackup(library)), [
    "app",
    "schemaVersion",
    "exportedAt",
    "entries",
  ]);
});
test("invalid JSON, foreign files, old/future versions and invalid fields fail atomically", () => {
  const backup = createBackup({ "met-1": { favorite: true } });
  for (const value of [
    "{broken",
    "{}",
    JSON.stringify({ ...backup, app: "other" }),
    JSON.stringify({ ...backup, schemaVersion: 0 }),
    JSON.stringify({ ...backup, schemaVersion: 2 }),
    JSON.stringify({ ...backup, exportedAt: "unknown" }),
    JSON.stringify({ ...backup, entries: [] }),
    encode({
      "met-1": { favorite: true },
      "met-2": { notes: "x".repeat(5001) },
    }),
  ])
    assert.throws(() => parseBackup(value, ids));
  for (const bad of [
    null,
    [],
    { liked: "true" },
    { favorite: 1 },
    { notes: 123 },
  ])
    assert.throws(() =>
      parseBackup(
        JSON.stringify({
          ...backup,
          entries: { "met-1": { favorite: true }, "met-2": bad },
        }),
        ids,
      ),
    );
  assert.throws(() => parseBackup(" ".repeat(maxBackupBytes + 1), ids));
});
test("unknown artworks and fields are ignored without prototype pollution", () => {
  const text =
    '{"app":"personal-art-gallery","schemaVersion":1,"exportedAt":"2026-10-01","extra":true,"entries":{"met-1":{"liked":true,"admin":true},"__proto__":{"favorite":true},"removed":{"notes":"旧画"}}}';
  const parsed = parseBackup(text, ids);
  assert.deepEqual(parsed.entries, { "met-1": { liked: true } });
  assert.equal(parsed.skipped, 2);
  assert.equal({}.favorite, undefined);
});
test("merge keeps current selections and notes, restores blank records and does not mutate", () => {
  const current = {
    "met-1": { favorite: true, liked: false, notes: "现在的备注" },
    "met-2": { notes: "" },
  };
  const imported = {
    "met-1": { favorite: false, liked: true, notes: "旧备注" },
    "met-2": { favorite: true, notes: "补入" },
  };
  const original = structuredClone(current);
  assert.deepEqual(mergeBackup(current, imported), {
    "met-1": { favorite: true, liked: true, notes: "现在的备注" },
    "met-2": { favorite: true, notes: "补入" },
  });
  assert.deepEqual(current, original);
});
