import type { Artwork } from "./types.ts";
const formats: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
// eslint-disable-next-line no-control-regex -- Windows filename control characters are invalid.
const invalidFilenameCharacters = /[<>:"/\\|?*\u0000-\u001f]/g;
export function artworkFilename(
  artwork: Pick<Artwork, "artist" | "titleOriginal" | "year" | "imageUrl">,
  mime = "",
) {
  const urlExtension = new URL(artwork.imageUrl).pathname
    .match(/\.(jpe?g|png|webp)$/i)?.[1]
    ?.toLowerCase();
  const extension =
    formats[mime.split(";")[0].toLowerCase()] || urlExtension || "jpg";
  const parts = [artwork.artist, artwork.titleOriginal, artwork.year].filter(
    (value) => value?.trim(),
  );
  const name =
    parts
      .join(" - ")
      .replace(invalidFilenameCharacters, "_")
      .replace(/\s+/g, " ")
      .replace(/[. ]+$/g, "")
      .slice(0, 180)
      .replace(/[. ]+$/g, "") || "Artwork";
  return `${name}.${extension}`;
}
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  // Safari needs the URL to remain alive after the initiating click.
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export function isIOS() {
  return (
    /iPhone|iPad|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}
function openOriginal(url: string) {
  try {
    const tab = window.open("about:blank", "_blank");
    if (!tab) return false;
    tab.opener = null;
    tab.location.replace(url);
    return true;
  } catch {
    return false;
  }
}
export async function saveArtwork(
  artwork: Artwork,
): Promise<{ message: string; fallback?: string }> {
  if (artwork.downloadable !== true)
    return { message: "此作品未确认开放下载，请查看来源与图片权限。" };
  if (isIOS()) {
    const opened = openOriginal(artwork.imageUrl);
    return {
      message: opened
        ? "已打开高清原图，可长按图片保存。"
        : "请打开高清原图，可长按图片保存。",
      fallback: artwork.imageUrl,
    };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(artwork.imageUrl, {
      mode: "cors",
      credentials: "omit",
      cache: "force-cache",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Original unavailable");
    const blob = await response.blob();
    if (!blob.size || !formats[blob.type.split(";")[0].toLowerCase()])
      throw new Error("Unsupported image response");
    downloadBlob(blob, artworkFilename(artwork, blob.type));
    return { message: "高清原图已交给浏览器保存。" };
  } catch {
    const opened = openOriginal(artwork.imageUrl);
    return {
      message: opened
        ? "已打开高清原图，可长按图片保存，或另存为。"
        : "无法直接下载，请打开高清原图，长按保存或另存为。",
      fallback: artwork.imageUrl,
    };
  } finally {
    clearTimeout(timeout);
  }
}
