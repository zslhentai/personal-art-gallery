import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { RowsPhotoAlbum } from "react-photo-album";
import "react-photo-album/rows.css";
import {
  artworks,
  artworkLink,
  decade,
  filterArtworks,
  galleryLink,
  imagePath,
  imageSrcSet,
  libraryKey,
  readLibrary,
  themeKey,
} from "./library";
import type { Artwork, PersonalEntry, PersonalLibrary } from "./types";
import Viewer from "./Viewer";

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  window.addEventListener("popstate", cb);
  return () => {
    window.removeEventListener("hashchange", cb);
    window.removeEventListener("popstate", cb);
  };
};
const getHash = () => location.hash || "#/";
const navigate = (hash: string) => {
  window.location.hash = hash;
};
const openViewer = (slug: string) => {
  history.pushState({ artViewer: true }, "", `#/artwork/${slug}?view=1`);
  window.dispatchEvent(new Event("hashchange"));
};
const subscribeViewport = (cb: () => void) => {
  const media = matchMedia("(max-width: 600px)");
  media.addEventListener("change", cb);
  return () => media.removeEventListener("change", cb);
};
const isMobile = () => matchMedia("(max-width: 600px)").matches;
const scrollPositions = new Map<string, number>();
function Icon({
  name,
  size = 20,
}: {
  name:
    | "heart"
    | "bookmark"
    | "moon"
    | "sun"
    | "shuffle"
    | "arrow"
    | "expand"
    | "filter";
  size?: number;
}) {
  const paths = {
    heart:
      "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
    bookmark: "M5 3h14v18l-7-4-7 4V3Z",
    moon: "M20.5 13.3A9 9 0 0 1 10.7 3.5a9 9 0 1 0 9.8 9.8Z",
    sun: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5",
    shuffle:
      "M3 5h3c4 0 8 14 12 14h3m-4-4 4 4-4 4M3 19h3c1.5 0 3-2 4.5-5M13 9c1.8-2.5 3.4-4 5-4h3m-4-4 4 4-4 4",
    arrow: "M4 12h16m-6-6 6 6-6 6",
    expand: "M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6",
    filter: "M4 7h16M4 17h16M8 4v6m8 4v6",
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
function ArtworkImage({
  artwork,
  eager = false,
  detail = false,
  sizes,
}: {
  artwork: Artwork;
  eager?: boolean;
  detail?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  return (
    <div
      className={`painting-image ${loaded ? "is-loaded" : ""}`}
      style={{ aspectRatio: artwork.aspectRatio }}
    >
      {!failed && (
        <img
          src={imagePath(artwork, detail ? 1200 : 800)}
          srcSet={imageSrcSet(artwork)}
          sizes={
            sizes ??
            (detail
              ? "(max-width: 700px) calc(100vw - 40px), (max-width: 1200px) 65vw, 820px"
              : "(max-width: 600px) calc(100vw - 40px), (max-width: 1000px) 45vw, 36vw")
          }
          width={artwork.width}
          height={artwork.height}
          alt={`${artwork.titleZh}。${artwork.alt}`}
          loading={eager ? "eager" : "lazy"}
          fetchPriority={eager ? "high" : "auto"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
        />
      )}
      {failed && (
        <span className="image-error">
          预览图片未能加载<span>请刷新页面重试</span>
        </span>
      )}
    </div>
  );
}
function ArtworkCard({
  artwork,
  eager,
  width,
}: {
  artwork: Artwork;
  eager: boolean;
  width: number;
}) {
  return (
    <article className="artwork-card">
      <a
        className="painting-link"
        href={artworkLink(artwork)}
        aria-label={`查看《${artwork.titleZh}》`}
      >
        <ArtworkImage
          artwork={artwork}
          eager={eager}
          sizes={`${Math.ceil(width)}px`}
        />
      </a>
      <div className="card-caption">
        <div>
          <a href={artworkLink(artwork)} className="card-title">
            {artwork.titleZh}
          </a>
          <p>{artwork.artist}</p>
        </div>
        <span className="card-year">
          {artwork.yearStart === artwork.yearEnd
            ? artwork.yearStart
            : `${artwork.yearStart}–${artwork.yearEnd}`}
        </span>
      </div>
    </article>
  );
}
function GalleryGrid({ items }: { items: Artwork[] }) {
  const mobile = useSyncExternalStore(subscribeViewport, isMobile);
  return (
    <RowsPhotoAlbum
      componentsProps={{ container: { "aria-label": "馆藏作品画廊" } }}
      photos={items.map((artwork) => ({
        src: artwork.thumbnailUrl,
        width: artwork.width,
        height: artwork.height,
        key: artwork.id,
        artwork,
      }))}
      spacing={(width) => (width < 600 ? 38 : 44)}
      targetRowHeight={(width) =>
        width < 600 ? 360 : width < 1000 ? 280 : 330
      }
      rowConstraints={(width) => ({
        maxPhotos: width < 600 ? 1 : width < 1000 ? 2 : 3,
        singleRowMaxHeight: mobile ? 620 : 440,
      })}
      render={{
        photo: (_, { photo, index, width, height }) => (
          <div
            className="react-photo-album--photo"
            style={
              {
                "--react-photo-album--photo-width": width,
                "--react-photo-album--photo-height": height,
              } as CSSProperties
            }
          >
            <ArtworkCard
              artwork={photo.artwork}
              eager={index < (mobile ? 1 : 3)}
              width={width}
            />
          </div>
        ),
      }}
    />
  );
}
function Filters({ params, path }: { params: URLSearchParams; path: string }) {
  const mobile = useSyncExternalStore(subscribeViewport, isMobile);
  const [open, setOpen] = useState(false);
  const active = ["artist", "movement", "decade", "tag"].filter((field) =>
    params.has(field),
  ).length;
  const clear = () => {
    const next = new URLSearchParams(params);
    ["artist", "movement", "decade", "tag"].forEach((field) =>
      next.delete(field),
    );
    navigate(`${path}${next.size ? `?${next}` : ""}`);
  };
  const update = (field: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(field, value);
    else next.delete(field);
    navigate(`${path}?${next}`);
  };
  return (
    <div className="filter-section">
      <button
        className="filter-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="gallery-filters"
      >
        筛选作品{active ? ` · ${active}` : ""}
        <span className="filter-chevron" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="m3 6 5 5 5-5" stroke="currentColor" strokeWidth="1.3" />
          </svg>
        </span>
      </button>
      <div
        className={`filter-disclosure ${open ? "expanded" : ""}`}
        inert={mobile && !open ? true : undefined}
      >
        <div id="gallery-filters" className="filters">
          {[
            {
              field: "artist",
              label: "画家",
              values: Array.from(
                new Map(
                  artworks.map((a) => [a.artistSlug, a.artist]),
                ).entries(),
              ),
            },
            {
              field: "movement",
              label: "流派 / 风格",
              values: [...new Set(artworks.map((a) => a.movement))].map((v) => [
                v,
                v,
              ]),
            },
            {
              field: "decade",
              label: "年代",
              values: [...new Set(artworks.map(decade))]
                .sort()
                .map((v) => [v, v]),
            },
            {
              field: "tag",
              label: "标签",
              values: [...new Set(artworks.flatMap((a) => a.tags))].map((v) => [
                v,
                v,
              ]),
            },
          ].map(({ field, label, values }) => (
            <label key={field}>
              <span>{label}</span>
              <select
                aria-label={label}
                data-active={params.has(field) || undefined}
                value={params.get(field) || ""}
                onChange={(event) => update(field, event.target.value)}
              >
                <option value="">全部{label.split(" / ")[0]}</option>
                {values.map(([value, text]) => (
                  <option key={value} value={value}>
                    {text}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <button
            className="reset-filters"
            type="button"
            disabled={!active}
            onClick={clear}
          >
            清除筛选
          </button>
        </div>
      </div>
      {active > 0 && (
        <div className="active-filters" aria-label="已选筛选">
          {["artist", "movement", "decade", "tag"].map((field) => {
            const v = params.get(field);
            return (
              v && (
                <button key={field} onClick={() => update(field, "")}>
                  {field === "artist"
                    ? artworks.find((a) => a.artistSlug === v)?.artist
                    : v}
                  <span aria-hidden="true"> ×</span>
                  <span className="sr-only">移除筛选</span>
                </button>
              )
            );
          })}
        </div>
      )}
    </div>
  );
}
function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="section-heading">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p className="section-description">{description}</p>
    </div>
  );
}
function ArtworkDetail({
  artwork,
  personal,
  update,
  onRandom,
}: {
  artwork: Artwork;
  personal: PersonalEntry;
  update: (patch: PersonalEntry) => void;
  onRandom: () => void;
}) {
  const favorite = personal.favorite ?? artwork.favorite;
  const index = artworks.indexOf(artwork);
  const [draft, setDraft] = useState(personal.notes ?? artwork.notes);
  const [saved, setSaved] = useState(false);
  const [actionStatus, setActionStatus] = useState("");
  return (
    <>
      <div className="detail-top">
        <a href="#/" className="back-link">
          ← 返回画廊
        </a>
        <span className="eyebrow">
          COLLECTION / {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <article className="artwork-detail">
        <div className="detail-visual">
          <button
            className="detail-image-button"
            onClick={() => openViewer(artwork.slug)}
            aria-label={`高清查看《${artwork.titleZh}》`}
          >
            <ArtworkImage artwork={artwork} eager detail />
            <span className="view-hint">
              <Icon name="expand" size={16} />
              高清查看
            </span>
          </button>
          <p className="image-credit">
            The Metropolitan Museum of Art · Open Access
          </p>
        </div>
        <div className="detail-information">
          <p className="eyebrow">
            {artwork.movement} / {artwork.year}
          </p>
          <h1>{artwork.titleZh}</h1>
          <p className="original-title" lang="en">
            {artwork.titleOriginal}
          </p>
          <a
            className="artist-link"
            href={galleryLink("artist", artwork.artistSlug)}
          >
            {artwork.artistZh}
            <span>{artwork.artist}</span>
          </a>
          <div className="personal-actions">
            <button
              aria-pressed={!!personal.liked}
              onClick={() => {
                update({ liked: !personal.liked });
                setActionStatus(
                  personal.liked
                    ? "已取消喜欢"
                    : `已喜欢《${artwork.titleZh}》`,
                );
              }}
            >
              <Icon name="heart" />
              {personal.liked ? "已喜欢" : "喜欢"}
            </button>
            <button
              aria-pressed={favorite}
              onClick={() => {
                update({ favorite: !favorite });
                setActionStatus(
                  favorite ? "已取消收藏" : `已收藏《${artwork.titleZh}》`,
                );
              }}
            >
              <Icon name="bookmark" />
              {favorite ? "已收藏" : "收藏"}
            </button>
          </div>
          <p className="sr-only" role="status">
            {actionStatus}
          </p>
          <dl className="metadata">
            {[
              ["Artist / 画家", artwork.artist],
              ["Year / 年份", artwork.year],
              ["Style / 流派", artwork.movement],
              ["Medium / 媒材", artwork.medium],
              ["Dimensions / 尺寸", artwork.dimensions],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
            <div>
              <dt>Collection / 馆藏</dt>
              <dd>
                <a href={artwork.museumUrl} target="_blank" rel="noreferrer">
                  {artwork.museum} ↗
                </a>
              </dd>
            </div>
            <div>
              <dt>Original Source / 原始来源</dt>
              <dd>
                <a href={artwork.sourceUrl} target="_blank" rel="noreferrer">
                  博物馆藏品记录 ↗
                </a>
              </dd>
            </div>
            <div>
              <dt>Image Source / 图片来源</dt>
              <dd>
                <a
                  href={artwork.imageSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  官方开放图片 ↗
                </a>
              </dd>
            </div>
            <div>
              <dt>Rights / 图片权限</dt>
              <dd>{artwork.rights}</dd>
            </div>
          </dl>
          <div className="detail-tags">
            <h2>Tags / 标签</h2>
            {artwork.tags.map((tag) => (
              <a key={tag} href={galleryLink("tag", tag)}>
                {tag}
              </a>
            ))}
          </div>
          <form
            className="notes"
            onSubmit={(event) => {
              event.preventDefault();
              update({ notes: draft });
              setSaved(true);
            }}
          >
            <label htmlFor="personal-notes">
              我的备注<span>只保存在此浏览器</span>
            </label>
            <textarea
              id="personal-notes"
              maxLength={5000}
              rows={3}
              placeholder="这幅画，让你想起了什么？"
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value);
                setSaved(false);
              }}
            />
            <div>
              <button type="submit">保存备注</button>
              <span role="status">{saved ? "备注已更新" : ""}</span>
            </div>
          </form>
        </div>
      </article>
      <nav className="artwork-pagination" aria-label="藏品之间导航">
        <a
          href={artworkLink(
            artworks[(index - 1 + artworks.length) % artworks.length],
          )}
        >
          ← 上一幅
          <span>
            {artworks[(index - 1 + artworks.length) % artworks.length].titleZh}
          </span>
        </a>
        <button onClick={onRandom}>
          <Icon name="shuffle" />
          再邂逅一幅
        </button>
        <a href={artworkLink(artworks[(index + 1) % artworks.length])}>
          下一幅 →<span>{artworks[(index + 1) % artworks.length].titleZh}</span>
        </a>
      </nav>
    </>
  );
}
function IndexPage({ type }: { type: "artists" | "tags" }) {
  const artists = Array.from(
    new Map(artworks.map((a) => [a.artistSlug, a])).values(),
  );
  const tags = [...new Set(artworks.flatMap((a) => a.tags))];
  return (
    <>
      <SectionHeading
        eyebrow={type === "artists" ? "THE ARTISTS" : "WAYS OF SEEING"}
        title={type === "artists" ? "循着画家的目光" : "寻找一种感受"}
        description={
          type === "artists"
            ? "不同的眼睛，望向同一个世界。"
            : "从一个词出发，走进画中的片刻。"
        }
      />
      <div className="index-grid">
        {(type === "artists" ? artists : tags).map((item) => {
          const isArtist = typeof item !== "string";
          const key = isArtist ? item.artistSlug : item;
          const matches = artworks.filter((a) =>
            isArtist ? a.artistSlug === key : a.tags.includes(key),
          );
          const representative = matches[0];
          return (
            <a
              className="index-item"
              aria-label={`${isArtist ? item.artistZh : item} · ${matches.length} 件作品`}
              key={key}
              href={galleryLink(isArtist ? "artist" : "tag", key)}
            >
              <div className="index-preview">
                <ArtworkImage artwork={representative} />
              </div>
              <div className="index-label">
                <h2>{isArtist ? item.artistZh : item}</h2>
                {isArtist && <p>{item.artist}</p>}
                <span>
                  {matches.length} 件作品 <Icon name="arrow" size={18} />
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </>
  );
}
export default function App() {
  const hash = useSyncExternalStore(subscribe, getHash);
  const [path, query = ""] = hash.slice(1).split("?");
  const params = new URLSearchParams(query);
  const [library, setLibrary] = useState<PersonalLibrary>(readLibrary);
  const [storageError, setStorageError] = useState(false);
  const [theme, setTheme] = useState(() => {
    try {
      return (
        localStorage.getItem(themeKey) ||
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      );
    } catch {
      return "light";
    }
  });
  const previousHash = useRef(hash);
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", theme === "dark" ? "#222522" : "#f6f4ef");
    try {
      localStorage.setItem(themeKey, theme);
    } catch {
      /* Theme remains available for this session. */
    }
  }, [theme]);
  useEffect(() => {
    const previous = previousHash.current;
    const previousPath = previous.slice(1).split("?")[0];
    const viewerChange = previous.includes("view=1") || hash.includes("view=1");
    if (previous !== hash && !viewerChange && path !== previousPath) {
      scrollPositions.set(previous, window.scrollY);
      window.scrollTo(0, scrollPositions.get(hash) || 0);
      mainRef.current?.focus({ preventScroll: true });
    }
    previousHash.current = hash;
  }, [hash, path]);
  const artwork = path.startsWith("/artwork/")
    ? artworks.find((a) => a.slug === path.split("/")[2])
    : undefined;
  useEffect(() => {
    document.title = `${artwork ? artwork.titleZh : path === "/favorites" ? "我的收藏" : path === "/artists" ? "画家" : path === "/tags" ? "标签" : "画廊"} · 私人美术馆`;
  }, [artwork, path]);
  const update = (id: string, patch: PersonalEntry) => {
    const next = { ...library, [id]: { ...library[id], ...patch } };
    setLibrary(next);
    try {
      localStorage.setItem(libraryKey, JSON.stringify(next));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  };
  const random = () => {
    const choices = artworks.filter((a) => a !== artwork);
    const pick = choices[Math.floor(Math.random() * choices.length)];
    navigate(artworkLink(pick));
  };
  const favorites = path === "/favorites";
  const likedMode = params.get("kind") === "liked";
  const items = filterArtworks(
    favorites
      ? artworks.filter((a) =>
          likedMode
            ? library[a.id]?.liked
            : (library[a.id]?.favorite ?? a.favorite),
        )
      : artworks,
    params,
  );
  const unknown =
    !["/", "", "/favorites", "/artists", "/tags"].includes(path) && !artwork;
  return (
    <>
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          mainRef.current?.focus();
        }}
      >
        跳到作品
      </a>
      <header className="site-header">
        <a href="#/" className="brand" aria-label="私人美术馆首页">
          <span className="brand-mark">
            A<span>R</span>
          </span>
          <span>
            私人美术馆<small>A ROOM FOR ART</small>
          </span>
        </a>
        <nav className="main-nav" aria-label="主要导航">
          {[
            ["/", "画廊"],
            ["/favorites", "收藏"],
            ["/artists", "画家"],
            ["/tags", "标签"],
          ].map(([href, text]) => (
            <a
              key={href}
              href={`#${href}`}
              aria-current={
                path === href || (href === "/" && path === "")
                  ? "page"
                  : undefined
              }
            >
              {text}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="random-header"
            onClick={random}
            aria-label="随机看一幅作品"
            title="在馆藏里偶遇一幅画"
          >
            <Icon name="shuffle" size={18} />
            <span className="random-full-label">随机看一幅</span>
            <span className="random-short-label" aria-hidden="true">
              偶遇
            </span>
          </button>
          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? "切换浅色模式" : "切换深色模式"}
          >
            <Icon name={theme === "dark" ? "sun" : "moon"} />
          </button>
        </div>
      </header>
      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className={artwork ? "main detail-main" : "main"}
      >
        {storageError && (
          <p className="storage-message" role="alert">
            浏览器未允许本地保存；本次修改仍可浏览，但刷新后可能丢失。
          </p>
        )}
        {artwork ? (
          <ArtworkDetail
            key={artwork.id}
            artwork={artwork}
            personal={library[artwork.id] || {}}
            update={(patch) => update(artwork.id, patch)}
            onRandom={random}
          />
        ) : path === "/artists" || path === "/tags" ? (
          <IndexPage type={path.slice(1) as "artists" | "tags"} />
        ) : unknown ? (
          <div className="empty-state">
            <p className="eyebrow">ARTWORK NOT FOUND</p>
            <h1>这件作品还未入馆</h1>
            <a href="#/">返回画廊 →</a>
          </div>
        ) : (
          <>
            {favorites ? (
              <SectionHeading
                eyebrow="YOUR PRIVATE COLLECTION"
                title="留在心里的画"
                description="那些让你停下脚步，想再看一次的作品。"
              />
            ) : (
              <section className="gallery-intro">
                <div>
                  <p className="eyebrow">A PRIVATE COLLECTION · EST. 2026</p>
                  <h1>
                    为喜欢的画，
                    <br />
                    留一间房。
                  </h1>
                  <p className="intro-description">
                    在日常之外，慢慢看一幅画。
                    <br />
                    收藏片刻，也收藏看见它时的自己。
                  </p>
                </div>
                <div className="intro-note">
                  <span className="small-rule" />
                  <p>
                    Art is a place
                    <br />
                    to pause.
                  </p>
                  <span>一处可以停留的地方</span>
                </div>
              </section>
            )}
            <div className="gallery-toolbar">
              <div className="gallery-tabs">
                {favorites ? (
                  <>
                    <a
                      href="#/favorites"
                      aria-current={!likedMode ? "page" : undefined}
                    >
                      收藏的作品
                    </a>
                    <a
                      href="#/favorites?kind=liked"
                      aria-current={likedMode ? "page" : undefined}
                    >
                      喜欢的作品
                    </a>
                  </>
                ) : (
                  <>
                    <span className="toolbar-title">馆藏作品</span>
                    <span className="toolbar-english">THE COLLECTION</span>
                  </>
                )}
              </div>
              <span className="work-count" aria-live="polite">
                {String(items.length).padStart(2, "0")} 件作品
              </span>
            </div>
            <Filters
              key={favorites ? "favorites" : "gallery"}
              params={params}
              path={favorites ? "/favorites" : "/"}
            />
            {items.length ? (
              <GalleryGrid items={items} />
            ) : (
              <div className="empty-state">
                <Icon name={favorites ? "bookmark" : "filter"} size={30} />
                <h2>{favorites ? "还没有留下作品" : "暂时没有匹配的作品"}</h2>
                <p>
                  {favorites
                    ? "打开一幅画，点一下喜欢或收藏，让它留在这里。"
                    : "试着减少一个筛选条件，再看看。"}
                </p>
                <a href={favorites ? "#/" : `#${path}`}>
                  {favorites ? "去画廊走走" : "清除筛选"} →
                </a>
              </div>
            )}
            {!favorites && (
              <div className="random-invitation">
                <div>
                  <p className="eyebrow">A LITTLE SERENDIPITY</p>
                  <h2>下一幅，交给偶然。</h2>
                  <p>不必寻找。也许它正在等你。</p>
                </div>
                <button onClick={random}>
                  <Icon name="shuffle" />
                  随机看一幅
                  <Icon name="arrow" />
                </button>
              </div>
            )}
          </>
        )}
      </main>
      <footer className="site-footer">
        <div>
          <span>私人美术馆</span>
          <p>A small collection. A slower way of seeing.</p>
        </div>
        <div>
          <span>为观看而收藏</span>
          <p>开放馆藏图像 · 个人收藏保存在此浏览器</p>
        </div>
        <a
          href="https://github.com/zslhentai/personal-art-gallery"
          target="_blank"
          rel="noreferrer"
        >
          关于这间美术馆 ↗
        </a>
      </footer>
      {artwork && params.get("view") === "1" && <Viewer slug={artwork.slug} />}
    </>
  );
}
