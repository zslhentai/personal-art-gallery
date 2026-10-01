import type { PersonalLibrary, PersonalEntry } from "./types.ts";
export const backupApp = "personal-art-gallery";
export const schemaVersion = 1;
export const maxBackupBytes = 1024 * 1024;
export interface Backup {
  app: typeof backupApp;
  schemaVersion: number;
  exportedAt: string;
  entries: PersonalLibrary;
}
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === "object" && !Array.isArray(value);
export function createBackup(
  library: PersonalLibrary,
  now = new Date(),
): Backup {
  const entries: PersonalLibrary = {};
  for (const [id, entry] of Object.entries(library)) {
    const clean: PersonalEntry = {};
    if (typeof entry.favorite === "boolean") clean.favorite = entry.favorite;
    if (typeof entry.liked === "boolean") clean.liked = entry.liked;
    if (typeof entry.notes === "string") clean.notes = entry.notes;
    if (Object.keys(clean).length) entries[id] = clean;
  }
  return {
    app: backupApp,
    schemaVersion,
    exportedAt: now.toISOString(),
    entries,
  };
}
export function parseBackup(text: string, knownIds: ReadonlySet<string>) {
  if (new TextEncoder().encode(text).length > maxBackupBytes)
    throw new Error("备份文件超过 1 MB，请检查文件。");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new Error("无法读取 JSON，文件可能已损坏。");
  }
  if (!object(value) || value.app !== backupApp)
    throw new Error("这不是私人美术馆的备份文件。");
  if (value.schemaVersion !== schemaVersion)
    throw new Error(
      "暂不支持这个备份版本，请保留文件并使用对应版本的网站导出。",
    );
  if (
    typeof value.exportedAt !== "string" ||
    !Number.isFinite(Date.parse(value.exportedAt)) ||
    !object(value.entries)
  )
    throw new Error("备份结构不完整，现有数据未修改。");
  const entries: PersonalLibrary = {};
  let skipped = 0;
  for (const [id, entry] of Object.entries(value.entries)) {
    if (!object(entry))
      throw new Error("备份中有无效的作品记录，现有数据未修改。");
    const clean: PersonalEntry = {};
    for (const field of ["favorite", "liked"] as const) {
      if (Object.hasOwn(entry, field)) {
        if (typeof entry[field] !== "boolean")
          throw new Error("喜欢或收藏状态格式错误，现有数据未修改。");
        clean[field] = entry[field];
      }
    }
    if (Object.hasOwn(entry, "notes")) {
      if (typeof entry.notes !== "string" || entry.notes.length > 5000)
        throw new Error("备注格式错误或超过 5000 字，现有数据未修改。");
      clean.notes = entry.notes;
    }
    if (!knownIds.has(id)) {
      skipped++;
      continue;
    }
    if (Object.keys(clean).length) entries[id] = clean;
  }
  return { entries, skipped, exportedAt: value.exportedAt };
}
// Preserve current positive selections and non-empty notes; never silently overwrite them.
export function mergeBackup(
  current: PersonalLibrary,
  imported: PersonalLibrary,
): PersonalLibrary {
  const next = { ...current };
  for (const [id, entry] of Object.entries(imported)) {
    const existing = current[id] || {};
    const merged = { ...existing };
    for (const field of ["favorite", "liked"] as const) {
      if (entry[field] !== undefined)
        merged[field] = existing[field] === true || entry[field];
    }
    if (entry.notes !== undefined && !existing.notes?.trim())
      merged.notes = entry.notes;
    next[id] = merged;
  }
  return next;
}
