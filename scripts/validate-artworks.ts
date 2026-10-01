export function validateArtworks(value: unknown): void {
  if (!Array.isArray(value) || !value.length)
    throw new Error("Artwork collection must be a non-empty array");
  const ids = new Set();
  const slugs = new Set();
  const images = new Set();
  const orders = new Set();
  const artists = new Map();
  for (const artwork of value) {
    if (!artwork || typeof artwork !== "object")
      throw new Error("Invalid artwork");
    for (const key of [
      "id",
      "slug",
      "titleZh",
      "titleOriginal",
      "artist",
      "artistZh",
      "artistSlug",
      "year",
      "movement",
      "medium",
      "dimensions",
      "museum",
      "rights",
      "alt",
    ]) {
      if (typeof artwork[key] !== "string" || !artwork[key].trim())
        throw new Error(`${artwork.id || "Artwork"}: missing ${key}`);
    }
    if (
      !/^[a-z0-9-]+$/.test(artwork.slug) ||
      !/^[a-z0-9-]+$/.test(artwork.artistSlug)
    )
      throw new Error(`${artwork.id}: invalid slug`);
    if (ids.has(artwork.id) || slugs.has(artwork.slug))
      throw new Error(`${artwork.id}: duplicate id or slug`);
    ids.add(artwork.id);
    slugs.add(artwork.slug);
    if (
      !Number.isSafeInteger(artwork.curationOrder) ||
      artwork.curationOrder <= 0 ||
      orders.has(artwork.curationOrder)
    )
      throw new Error(`${artwork.id}: curationOrder must be a unique positive integer`);
    orders.add(artwork.curationOrder);
    const artistName = `${artwork.artist}|${artwork.artistZh}`;
    if (artists.has(artwork.artistSlug) && artists.get(artwork.artistSlug) !== artistName)
      throw new Error(`${artwork.id}: inconsistent artist names`);
    artists.set(artwork.artistSlug, artistName);
    if (images.has(artwork.imageUrl))
      throw new Error(`${artwork.id}: duplicate artwork image`);
    images.add(artwork.imageUrl);
    for (const key of [
      "imageUrl",
      "sourceUrl",
      "imageSourceUrl",
      "museumUrl",
    ]) {
      if (
        typeof artwork[key] !== "string" ||
        new URL(artwork[key]).protocol !== "https:"
      )
        throw new Error(`${artwork.id}: ${key} must use HTTPS`);
    }
    if (artwork.thumbnailUrl !== `images/${artwork.slug}-800.webp`)
      throw new Error(`${artwork.id}: invalid preview path`);
    if (typeof artwork.downloadable !== "boolean")
      throw new Error(`${artwork.id}: missing downloadable boolean`);
    if (
      artwork.downloadable &&
      (!/Public domain|CC0|开放下载|open download/i.test(artwork.rights) ||
        /US[- ]only|PD-US|美国限定/i.test(artwork.rights))
    )
      throw new Error(
        `${artwork.id}: downloadable artwork must document open download rights`,
      );
    for (const key of [
      "yearStart",
      "yearEnd",
      "width",
      "height",
      "aspectRatio",
    ]) {
      if (typeof artwork[key] !== "number" || !Number.isFinite(artwork[key]))
        throw new Error(`${artwork.id}: invalid ${key}`);
    }
    if (
      artwork.yearStart > artwork.yearEnd ||
      !Number.isInteger(artwork.yearStart) ||
      !Number.isInteger(artwork.yearEnd)
    )
      throw new Error(`${artwork.id}: invalid year range`);
    if (
      artwork.width <= 0 ||
      artwork.height <= 0 ||
      Math.abs(artwork.aspectRatio - artwork.width / artwork.height) >= 0.0001
    )
      throw new Error(`${artwork.id}: invalid image dimensions or ratio`);
    if (
      !Array.isArray(artwork.tags) ||
      !artwork.tags.length ||
      new Set(artwork.tags).size !== artwork.tags.length ||
      artwork.tags.some(
        (tag: unknown) => typeof tag !== "string" || !tag.trim(),
      )
    )
      throw new Error(`${artwork.id}: invalid tags`);
    if (artwork.favorite !== false || artwork.notes !== "")
      throw new Error(`${artwork.id}: personal data belongs in local storage`);
  }
}
