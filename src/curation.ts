import type { Artwork } from "./types.ts";

export function canonicalTag(tag: string): string {
  return tag === "自然" ? "风景" : tag === "孤独感" ? "孤独" : tag;
}

// Keep the JSON's stable record order; exhibition order is explicit and editable.
export function curateArtworks(items: Artwork[]): Artwork[] {
  return [...items].sort((a, b) => a.curationOrder - b.curationOrder);
}

export function randomArtwork(
  items: Artwork[],
  recentIds: string[],
  current?: Artwork,
  random: () => number = Math.random,
): Artwork | undefined {
  const last = current ?? items.find((a) => a.id === recentIds.at(-1));
  const available = items.filter((a) => a.id !== last?.id);
  const fresh = available.filter((a) => !recentIds.includes(a.id));
  const differentArtist = fresh.filter((a) => a.artistSlug !== last?.artistSlug);
  // Small or filtered collections must never strand the random entrance.
  const choices = differentArtist.length
    ? differentArtist
    : fresh.length ? fresh : available;
  if (!choices.length) return items[0];
  return choices[Math.floor(random() * choices.length)];
}
