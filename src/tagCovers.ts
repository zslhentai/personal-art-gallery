import type { Artwork } from "./types.ts";

export interface TagCover {
  tag: string;
  coverArtworkId: string;
}

// Explicit exhibition choices win. Automatic choices reserve scarce tags first,
// favor primary subject tags, and use curation order as a stable tie breaker.
export function selectTagCovers(
  items: Artwork[],
  tags: string[],
  overrides: TagCover[] = [],
): Map<string, Artwork> {
  const covers = new Map<string, Artwork>();
  const uses = new Map<string, number>();
  const manual = new Set<string>();
  const assign = (tag: string, artwork: Artwork) => {
    const previous = covers.get(tag);
    if (previous) uses.set(previous.id, (uses.get(previous.id) || 1) - 1);
    covers.set(tag, artwork);
    uses.set(artwork.id, (uses.get(artwork.id) || 0) + 1);
  };
  for (const entry of overrides) {
    const artwork = items.find((a) => a.id === entry.coverArtworkId && a.tags.includes(entry.tag));
    if (artwork && tags.includes(entry.tag)) {
      assign(entry.tag, artwork);
      manual.add(entry.tag);
    }
  }
  const candidates = new Map(tags.map((tag) => [tag, items.filter((a) => a.tags.includes(tag))]));
  const pending = tags.filter((tag) => !covers.has(tag)).sort((a, b) =>
    candidates.get(a)!.length - candidates.get(b)!.length || tags.indexOf(a) - tags.indexOf(b),
  );
  for (const tag of pending) {
    const choices = [...candidates.get(tag)!].sort((a, b) =>
      (uses.get(a.id) || 0) - (uses.get(b.id) || 0) ||
      a.tags.indexOf(tag) - b.tags.indexOf(tag) ||
      Number(a.aspectRatio < 0.65 || a.aspectRatio > 2.4) - Number(b.aspectRatio < 0.65 || b.aspectRatio > 2.4) ||
      a.curationOrder - b.curationOrder || a.id.localeCompare(b.id),
    );
    if (choices[0]) assign(tag, choices[0]);
  }
  // When a tiny collection forces reuse, still avoid adjacent duplicate covers
  // whenever there is another choice; manual editorial overrides remain intact.
  for (let i = 1; i < tags.length; i++) {
    const tag = tags[i];
    if (covers.get(tag)?.id !== covers.get(tags[i - 1])?.id || manual.has(tag)) continue;
    const alternative = candidates.get(tag)?.filter((a) => a.id !== covers.get(tags[i - 1])?.id).sort((a, b) =>
      (uses.get(a.id) || 0) - (uses.get(b.id) || 0) || a.curationOrder - b.curationOrder,
    )[0];
    if (alternative) assign(tag, alternative);
  }
  return covers;
}
