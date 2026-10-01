import { useEffect } from "react";
import { artworks } from "./library";
import "photoswipe/style.css";
import type PhotoSwipe from "photoswipe";
export default function Viewer({ slug }: { slug: string }) {
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
    void import("photoswipe").then(({ default: PhotoSwipe }) => {
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
    });
    return () => {
      disposed = true;
      viewer?.destroy();
    };
  }, [slug]);
  return null;
}
