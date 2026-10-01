import { useRef, useState } from "react";
import type { PersonalLibrary } from "./types";
import { artworks } from "./library";
import {
  createBackup,
  parseBackup,
  mergeBackup,
  maxBackupBytes,
} from "./backup";
import { downloadBlob, isIOS } from "./saveArtwork";
import { usePwa, installPwa } from "./pwa";
export default function MyGallery({
  library,
  restore,
}: {
  library: PersonalLibrary;
  restore: (next: PersonalLibrary) => boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<ReturnType<typeof parseBackup>>();
  const [message, setMessage] = useState("");
  const [reading, setReading] = useState(false);
  const pwa = usePwa();
  const exportData = () => {
    const backup = createBackup(library);
    downloadBlob(
      new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }),
      `personal-art-gallery-backup-${backup.exportedAt.slice(0, 10)}.json`,
    );
    setMessage(
      "备份已交给浏览器保存。请保留这份 JSON 文件；在 iPhone 上可存入“文件”。",
    );
  };
  return (
    <section className="my-gallery">
      <div className="section-heading">
        <p className="eyebrow">KEEP YOUR COLLECTION</p>
        <h1>让喜欢的画，长久留下。</h1>
        <p className="section-description">
          备份你的收藏，也为这间美术馆留一个日常入口。
        </p>
      </div>
      <section className="quiet-tool" aria-labelledby="backup-title">
        <h2 id="backup-title">备份与迁移</h2>
        <p>
          喜欢、收藏和备注只保存在此浏览器。换设备或清理浏览器前，先留一份备份。
        </p>
        <div className="quiet-actions">
          <button onClick={exportData}>↓ 导出我的美术馆数据</button>
          <button disabled={reading} onClick={() => input.current?.click()}>
            ↑ {reading ? "正在读取…" : "导入备份"}
          </button>
        </div>
        <input
          ref={input}
          className="sr-only"
          type="file"
          accept=".json,application/json"
          aria-label="选择美术馆 JSON 备份"
          tabIndex={-1}
          onChange={async (event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (!file) return;
            setPreview(undefined);
            setMessage("");
            setReading(true);
            try {
              if (file.size > maxBackupBytes)
                throw new Error("备份文件超过 1 MB，请检查文件。");
              setPreview(
                parseBackup(
                  await file.text(),
                  new Set(artworks.map((a) => a.id)),
                ),
              );
            } catch (error) {
              setMessage(
                error instanceof Error
                  ? error.message
                  : "无法读取备份，现有数据未修改。",
              );
            } finally {
              setReading(false);
            }
          }}
        />
        <p className="tool-status" role="status">
          {message}
        </p>
        {preview && (
          <div className="import-preview">
            <h3>确认这份备份</h3>
            <p>
              导出于 {new Date(preview.exportedAt).toLocaleString("zh-CN")} ·
              可合并 {Object.keys(preview.entries).length} 件作品
              {preview.skipped > 0
                ? ` · 跳过 ${preview.skipped} 件未在当前馆藏中的作品`
                : ""}
            </p>
            <p>
              仅合并：保留已有喜欢和收藏；已有非空备注优先，备份备注只补入空白处。不会清空其他记录。
            </p>
            <div className="quiet-actions">
              <button
                onClick={() => {
                  if (restore(mergeBackup(library, preview.entries))) {
                    setMessage(
                      `已合并 ${Object.keys(preview.entries).length} 件作品，跳过 ${preview.skipped} 件未知作品。已有记录已保留。`,
                    );
                    setPreview(undefined);
                  } else
                    setMessage(
                      "浏览器未允许保存，未导入任何记录。请先允许本地存储。",
                    );
                }}
              >
                确认合并导入
              </button>
              <button onClick={() => setPreview(undefined)}>取消</button>
            </div>
          </div>
        )}
      </section>
      <section className="quiet-tool" aria-labelledby="install-title">
        <h2 id="install-title">把美术馆放在主屏幕</h2>
        {pwa.installed ? (
          <p>
            你正在以独立应用方式观看。收藏与备注仍保存在当前设备，记得定期备份。
          </p>
        ) : (
          <>
            <p>让它成为每天可以顺手走进的一间房。</p>
            {pwa.canInstall ? (
              <div className="quiet-actions">
                <button
                  onClick={() => {
                    void installPwa().catch(() =>
                      setMessage("请通过浏览器菜单添加到主屏幕。"),
                    );
                  }}
                >
                  添加到主屏幕
                </button>
              </div>
            ) : (
              <p>
                {isIOS()
                  ? "在 Safari 中打开，轻点“分享”，再选择“添加到主屏幕”。"
                  : "通过浏览器菜单选择“安装应用”或“添加到主屏幕”；支持的浏览器会提供安装选项。"}
              </p>
            )}
          </>
        )}
        <p>离线可打开界面并整理个人记录；未加载的画作和高清原图需要联网。</p>
        {pwa.unavailable && (
          <p className="tool-status">
            此浏览器暂未启用离线缓存，联网浏览和备份仍可使用。
          </p>
        )}
      </section>
      <a className="back-link" href="#/favorites">
        返回我的收藏 →
      </a>
    </section>
  );
}
