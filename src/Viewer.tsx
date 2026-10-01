import { useEffect, useState } from "react";
import { artworks } from "./library";
import "photoswipe/style.css";
import { saveArtwork } from "./saveArtwork";
import type PhotoSwipe from "photoswipe";
export default function Viewer({ slug }: { slug: string }) {
  const [unavailable, setUnavailable] = useState<string>();
  useEffect(() => {
    let disposed = false;
    let viewer: PhotoSwipe | undefined;
    const opener = document.activeElement as HTMLElement | null;
    const startingHash = location.hash;
    const mobile = matchMedia("(max-width: 600px)").matches;
    const safeInsets = () => {
      const style = getComputedStyle(document.documentElement);
      return Object.fromEntries(
        ["top", "right", "bottom", "left"].map((side) => [
          side,
          parseFloat(style.getPropertyValue(`--safe-${side}`)) || 0,
        ]),
      );
    };
    void import("photoswipe")
      .then(({ default: PhotoSwipe }) => {
        if (disposed) return;
        viewer = new PhotoSwipe({
          dataSource: artworks.map((a) => ({
            src: a.imageUrl,
            width: a.width,
            height: a.height,
            alt: `${a.titleZh}，${a.artist}。${a.alt}`,
          })),
          index: Math.max(
            0,
            artworks.findIndex((a) => a.slug === slug),
          ),
          bgOpacity: 1,
          showHideAnimationType: "fade",
          // Open immediately so rapid browser-back cannot leave an opening viewer behind.
          showAnimationDuration: 0,
          hideAnimationDuration: matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? 0
            : 150,
          preload: [0, mobile ? 0 : 1],
          wheelToZoom: true,
          secondaryZoomLevel: 1,
          maxZoomLevel: 2,
          preloaderDelay: 150,
          paddingFn: (size) => {
            const safe = safeInsets();
            return {
              top: 66 + safe.top,
              bottom: (size.x < 600 ? 92 : 74) + safe.bottom,
              left: (size.x < 600 ? 12 : 60) + safe.left,
              right: (size.x < 600 ? 12 : 60) + safe.right,
            };
          },
          closeTitle: "关闭大图",
          zoomTitle: "缩放作品",
          arrowPrevTitle: "上一幅",
          arrowNextTitle: "下一幅",
          errorMsg:
            "高清图片暂时无法加载，请关闭后重试，或在作品详情中访问图片来源。",
        });
        if (mobile) {
          // PhotoSwipe creates adjacent holders even with preload [0, 0].
          // Keep its gestures; defer only inactive original-image requests.
          viewer.on("contentLoadImage", (event) => {
            if (!event.content.slide?.isActive) event.preventDefault();
          });
          viewer.on("slideActivate", ({ slide }) => {
            if (slide.content.state === "idle") slide.content.loadImage(false);
          });
        }
        viewer.on("uiRegister", () => {
          let saveButton: HTMLElement | undefined;
          let status: HTMLElement | undefined;
          const updateSave = () => {
            if (saveButton) {
              saveButton.hidden =
                artworks[viewer!.currIndex].downloadable !== true;
              saveButton.removeAttribute("disabled");
              saveButton.setAttribute(
                "aria-label",
                `保存作品《${artworks[viewer!.currIndex].titleZh}》`,
              );
            }
            if (status) status.replaceChildren();
          };
          viewer!.ui!.registerElement({
            name: "save-status",
            order: 8,
            isButton: false,
            appendTo: "root",
            onInit: (el) => {
              status = el;
              el.setAttribute("role", "status");
            },
          });
          viewer!.ui!.registerElement({
            name: "save-artwork",
            order: 8,
            isButton: true,
            appendTo: "bar",
            title: "保存作品",
            html: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 3v12m-4-4 4 4 4-4M5 16v5h14v-5"/></svg><span>保存</span>',
            onInit: (el) => {
              saveButton = el;
              updateSave();
              viewer!.on("change", updateSave);
            },
            onClick: () => {
              const a = artworks[viewer!.currIndex];
              if (
                a.downloadable !== true ||
                saveButton?.hasAttribute("disabled")
              )
                return;
              const index = viewer!.currIndex;
              saveButton?.setAttribute("disabled", "");
              if (status) status.textContent = "正在准备高清原图…";
              void saveArtwork(a)
                .then((result) => {
                  if (!status || disposed || viewer!.currIndex !== index)
                    return;
                  status.textContent = result.message;
                  if (result.fallback) {
                    const link = document.createElement("a");
                    link.href = result.fallback;
                    link.target = "_blank";
                    link.rel = "noreferrer";
                    link.textContent = " 打开高清原图 ↗";
                    status.append(link);
                  }
                })
                .finally(() => {
                  if (!disposed && viewer!.currIndex === index)
                    saveButton?.removeAttribute("disabled");
                });
            },
          });
          viewer!.ui!.registerElement({
            name: "artwork-caption",
            order: 9,
            isButton: false,
            appendTo: "root",
            onInit: (el, pswp) => {
              el.setAttribute("aria-live", "polite");
              el.setAttribute("aria-atomic", "true");
              const update = () => {
                const a = artworks[pswp.currIndex];
                el.textContent = `${a.titleZh}  ·  ${a.artist}  ·  ${a.year}`;
              };
              pswp.on("change", update);
              update();
            },
          });
        });
        viewer.on("destroy", () => {
          if (!disposed && location.hash === startingHash) {
            if (history.state?.artViewer) history.back();
            else location.replace(`#/artwork/${slug}`);
          }
          opener?.focus({ preventScroll: true });
        });
        viewer.init();
      })
      .catch(() => {
        if (!disposed) setUnavailable(slug);
      });
    return () => {
      disposed = true;
      viewer?.destroy();
    };
  }, [slug]);
  return unavailable === slug ? (
    <div className="viewer-load-error" role="alert">
      <p>高清查看暂时不可用，请联网后重试。</p>
      <button
        onClick={() => {
          if (history.state?.artViewer) history.back();
          else location.replace(`#/artwork/${slug}`);
        }}
      >
        返回作品
      </button>
    </div>
  ) : null;
}
