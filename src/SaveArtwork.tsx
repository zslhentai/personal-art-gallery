import { useState } from "react";
import type { Artwork } from "./types";
import { saveArtwork } from "./saveArtwork";
export default function SaveArtwork({ artwork }: { artwork: Artwork }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    fallback?: string;
  }>();
  if (artwork.downloadable !== true) return null;
  return (
    <div className="save-artwork">
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setResult(undefined);
          void saveArtwork(artwork)
            .then(setResult)
            .finally(() => setBusy(false));
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          aria-hidden="true"
        >
          <path d="M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5" />
        </svg>
        {busy ? "正在准备原图…" : "保存作品"}
      </button>
      <p role="status">
        {result?.message}
        {result?.fallback && (
          <>
            {" "}
            <a href={result.fallback} target="_blank" rel="noreferrer">
              打开高清原图 ↗
            </a>
          </>
        )}
      </p>
    </div>
  );
}
