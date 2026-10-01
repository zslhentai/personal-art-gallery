import data from "./data/artworks.json";
import type { Artwork, PersonalLibrary } from "./types";
export const artworks: Artwork[] = data;
export const libraryKey = "personal-art-gallery:library:v1";
export const themeKey = "personal-art-gallery:theme:v1";
export function readLibrary(): PersonalLibrary {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(libraryKey) || "{}");
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const clean: PersonalLibrary = {};
    for (const artwork of artworks) {
      const entry = (value as Record<string, unknown>)[artwork.id];
      if (!entry || typeof entry !== "object") continue;
      const fields = entry as Record<string, unknown>;
      clean[artwork.id] = {
        favorite:
          typeof fields.favorite === "boolean" ? fields.favorite : undefined,
        liked: typeof fields.liked === "boolean" ? fields.liked : undefined,
        notes:
          typeof fields.notes === "string"
            ? fields.notes.slice(0, 5000)
            : undefined,
      };
    }
    return clean;
  } catch {
    return {};
  }
}
export function imagePath(artwork: Artwork, width: number) {
  return `${import.meta.env.BASE_URL}images/${artwork.slug}-${width}.webp`;
}
export function imageSrcSet(artwork: Artwork) {
  return [400, 800, 1200]
    .map((width) => `${imagePath(artwork, width)} ${width}w`)
    .join(", ");
}
export function artworkLink(artwork: Artwork) {
  return `#/artwork/${artwork.slug}`;
}
export function galleryLink(field: string, value: string) {
  return `#/?${new URLSearchParams({ [field]: value })}`;
}
export function decade(artwork: Artwork) {
  return `${Math.floor(artwork.yearStart / 10) * 10}年代`;
}
export function filterArtworks(items: Artwork[], params: URLSearchParams) {
  return items.filter(
    (a) =>
      (!params.get("artist") || a.artistSlug === params.get("artist")) &&
      (!params.get("movement") || a.movement === params.get("movement")) &&
      (!params.get("decade") || decade(a) === params.get("decade")) &&
      (!params.get("tag") || a.tags.includes(params.get("tag")!)),
  );
}
