/** Independent artist records: names stay compatible with stable artwork IDs. */
export function validateArtists(profiles: unknown, artworks: { artistSlug: string; artist: string; artistZh: string }[]) {
  if (!Array.isArray(profiles)) throw new Error("Artists must be an array");
  const known = new Map(artworks.map((a) => [a.artistSlug, a]));
  const seen = new Set<string>();
  for (const p of profiles) {
    const a = known.get(p?.artistSlug);
    if (!a || seen.has(p.artistSlug)) throw new Error("Unknown or duplicate artistSlug");
    seen.add(p.artistSlug);
    if (p.nameZh !== a.artistZh || p.nameOriginal !== a.artist) throw new Error(`${p.artistSlug}: inconsistent artist name`);
    for (const field of ["lifespan", "nationality", "movement", "description", "biography"])
      if (typeof p[field] !== "string" || !p[field].trim()) throw new Error(`${p.artistSlug}: missing ${field}`);
    if (p.description.length > 35 || p.biography.replace(/\s/g, "").length < 150 || p.biography.length > 320)
      throw new Error(`${p.artistSlug}: biography length`);
    if (!Number.isInteger(p.birthYear) || (p.deathYear !== null && (!Number.isInteger(p.deathYear) || p.deathYear < p.birthYear)))
      throw new Error(`${p.artistSlug}: lifespan`);
    if (!Array.isArray(p.biographySources) || p.biographySources.length < 2)
      throw new Error(`${p.artistSlug}: missing biography sources`);
    const urls = p.biographySources.map((source: { url: string; label: string }) => {
      if (!source.label || new URL(source.url).protocol !== "https:") throw new Error(`${p.artistSlug}: invalid source`);
      return source.url;
    });
    if (new Set(urls).size !== urls.length) throw new Error(`${p.artistSlug}: duplicate biography source`);
    if (p.portraitUrl) {
      if (p.portraitUrl !== `portraits/${p.artistSlug}-320.webp` || !["Public domain", "CC0"].includes(p.portraitRights) || new URL(p.portraitSourceUrl).protocol !== "https:" || !p.portraitCaption)
        throw new Error(`${p.artistSlug}: portrait provenance`);
    } else if (!p.portraitMissingReason || p.portraitSourceUrl || p.portraitRights)
      throw new Error(`${p.artistSlug}: missing portrait must be explicit`);
  }
  if (seen.size !== known.size) throw new Error("Every collected artist needs an independent profile");
}
