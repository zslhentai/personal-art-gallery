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
        preload: [0, matchMedia("(max-width: 600px)").matches ? 0 : 1],
        wheelToZoom: true,
        secondaryZoomLevel: 1,
        maxZoomLevel: 2,
        preloaderDelay: 150,
        paddingFn: (size) => ({
          top: 66,
          bottom: size.x < 600 ? 92 : 74,
          left: size.x < 600 ? 12 : 60,
          right: size.x < 600 ? 12 : 60,
        }),
        closeTitle: "关闭大图",
        zoomTitle: "缩放作品",
        arrowPrevTitle: "上一幅",
        arrowNextTitle: "下一幅",
        errorMsg:
          "高清图片暂时无法加载，请关闭后重试，或在作品详情中访问图片来源。",
      });
      viewer.on("uiRegister", () => {
        viewer!.ui!.registerElement({
          name: "artwork-caption",
          order: 9,
          isButton: false,
          appendTo: "root",
          onInit: (el, pswp) => {
            el.setAttribute("aria-live", "polite");
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
