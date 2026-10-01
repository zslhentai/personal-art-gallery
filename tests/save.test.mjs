import { test } from "node:test";
import assert from "node:assert/strict";
import { artworkFilename, saveArtwork } from "../src/saveArtwork.ts";
const artwork = {
  artist: 'Artist<>:"/\\|?*',
  titleOriginal: "Title\nAnother.",
  year: "",
  imageUrl: "https://example.org/art.JPEG?token=1",
};
test("safe filenames preserve original format, MIME and optional year", () => {
  assert.equal(
    artworkFilename(artwork),
    "Artist_________ - Title_Another.jpeg",
  );
  for (const [mime, ext] of [
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
  ])
    assert.ok(
      artworkFilename({ ...artwork, year: "1900–1906" }, mime).endsWith(
        ` - 1900–1906.${ext}`,
      ),
    );
  assert.ok(
    artworkFilename({
      ...artwork,
      imageUrl: "https://example.org/art.PNG",
    }).endsWith(".png"),
  );
  assert.ok(
    artworkFilename({ ...artwork, titleOriginal: "x".repeat(300) }).length <=
      185,
  );
});
test("unconfirmed download rights cause no fetch or browser action", async () => {
  const result = await saveArtwork({ ...artwork, downloadable: false });
  assert.match(result.message, /未确认开放下载/);
  const unknown = await saveArtwork(artwork);
  assert.match(unknown.message, /未确认开放下载/);
});
