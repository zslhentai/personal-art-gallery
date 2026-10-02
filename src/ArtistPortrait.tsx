import { useState } from "react";
import type profiles from "./data/artists.json";

type Profile = (typeof profiles)[number];
export default function ArtistPortrait({ profile, eager = false }: {
  profile: Profile;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const source = profile.portraitUrl
    ? `${import.meta.env.BASE_URL}${profile.portraitUrl}`
    : "";
  return (
    <div className="artist-portrait">
      {source && !failed ? (
        <img
          src={source}
          srcSet={`${source} 320w, ${source.replace("-320.webp", "-640.webp")} 640w`}
          sizes={eager ? "(max-width: 600px) 104px, 180px" : "95px"}
          width={320}
          height={400}
          alt={`${profile.nameZh}肖像`}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
        />
      ) : (
        <span
          className="portrait-unavailable"
          role="img"
          aria-label={`${profile.nameZh}：${failed ? "肖像暂未加载" : "尚无确认的肖像"}`}
        >
          {failed ? "暂未加载" : "肖像待考"}
        </span>
      )}
    </div>
  );
}
