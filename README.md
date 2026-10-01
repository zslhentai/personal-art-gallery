# 私人美术馆 · Personal Art Gallery

一个安静、以画作为中心的响应式个人数字美术馆。62 件经过来源与版权核实的作品，保留原始构图，适合手机长时间浏览。

Pages 公开地址：**https://zslhentai.github.io/personal-art-gallery/**

GitHub Pages 已启用，公开地址实测返回 HTTP 200。每次推送 main 经检查后自动部署；发布结果见 [Actions](https://github.com/zslhentai/personal-art-gallery/actions)。

## 第一版

- 桌面 Rows / Justified、390px 手机单列；预览不裁切，有比例占位及懒加载。
- 双语作品详情、馆藏元数据、官方出处与图片权限、相邻作品导航。
- PhotoSwipe v5：高清加载、双指缩放、拖动、左右切换、桌面滚轮／点击缩放、ESC／返回关闭。
- 画家、流派、年代、标签可组合筛选；画家与标签独立索引。
- 独立的喜欢和收藏，个人备注，保存在当前浏览器；明暗主题。
- 随机看一幅，详情页中避免连续抽到当前作品。
- 开放作品高清保存，iOS / 跨域限制时打开原图；喜欢、收藏和备注 JSON 备份／合并导入。
- PWA 主屏幕入口与轻量离线界面，更新前主动提示，不缓存高清画作。

不需要账号、数据库、后端服务、API key 或远程实时馆藏查询。

## 本地开发

需要 Node.js 24、npm。

```bash
npm ci
npm run dev
```

访问终端提示的 `/personal-art-gallery/` 路径。生产预览：

```bash
npm run lint
npm test
npm run build
npm run preview
```

浏览器验证：

```bash
npx playwright install --with-deps chromium webkit
npm run test:e2e
```

包括桌面 Chromium、390×664 视口（iPhone 13 / DPR 3）的 Chromium 及 WebKit 的画廊／详情／筛选／索引／收藏／备注／随机／Viewer／返回行为与控制台检查。可通过 `CHROMIUM_PATH`、`WEBKIT_PATH` 指定已安装浏览器。本地模拟不能代替实体 iPhone 的双指手势与 iOS 系统边缘返回测试。

## GitHub Pages 部署

使用当前仓库 `zslhentai/personal-art-gallery` 的 `main` 分支，未创建新仓库。

1. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
2. 提交并推送 `main`。`.github/workflows/pages.yml` 自动安装依赖，执行 lint、数据测试、生产构建、桌面与 390px 浏览器测试。
3. 检查通过后，官方 `upload-pages-artifact`／`deploy-pages` 发布 `dist/`。首次发布可能需要数分钟，Actions 的部署任务会给出实际 Pages 地址。
4. 日后每次推送 `main` 自动更新。其他分支的 PR 只检查，不公开部署；可在 Actions 手动运行 workflow。

Vite `base` 固定为 `/personal-art-gallery/`。应用使用 `#/` hash 路由，所以 Pages 刷新作品详情不会 404。例如：

- 画廊：`https://zslhentai.github.io/personal-art-gallery/`
- 详情：`https://zslhentai.github.io/personal-art-gallery/#/artwork/moonlight-strandgade`
- 收藏：`https://zslhentai.github.io/personal-art-gallery/#/favorites`
- 画家：`https://zslhentai.github.io/personal-art-gallery/#/artists`
- 标签：`https://zslhentai.github.io/personal-art-gallery/#/tags`

Manifest、图标和构建生成的 Service Worker 均使用仓库子路径；HTTPS Pages 支持安装。版本更新按提示点击“刷新更新”，会保留个人记录。开发服务器不注册 worker；使用 build + preview 验证 PWA。

使用 GitHub 的默认域名，无需自建服务器或 CNAME。不要把构建后的 `dist/` 手动提交。

## 添加画作

唯一馆藏源是 `src/data/artworks.json`。复制一个条目，填入唯一稳定 `id/slug`、作品元数据和标签；记录可复用图片的授权及官方出处。必须填写 `downloadable` 布尔值，只有明确 Public Domain / CC0 或开放下载才置 true；未知或受限填写 false。构建会校验关键字段、来源、比例和下载权限。中文题名、描述、流派和标签由本站整理，不代表博物馆正式译名。

`width/height` 是实际原图像素；`dimensions` 是实体画作尺寸；`aspectRatio = width / height`。保留 `year` 原文显示和 `yearStart/yearEnd` 数值区间（年代筛选按起始年）。新增标签和画家自动进入索引和筛选，不另写页面。

预览存为 `public/images/{slug}-400.webp`、`-800.webp`、`-1200.webp`，保留全构图，不放大低分辨率来源。详情和列表通过 `srcset` 选择尺寸；`imageUrl` 为外部官方高清图，`imageSourceUrl` 解释来源。全部预览总计约 18.97 MiB，高清原图未入库。Met / Commons 预览可用 `python3 scripts/refresh-previews.py` 重新核对并生成，需要 Python 3 与 ImageMagick 7。

默认 `favorite:false`、`notes:""`；用户的喜欢、收藏和备注另存于 `personal-art-gallery:library:v1` 的 localStorage 中。它们不会修改公开馆藏，不自动跨设备同步；清除站点数据会移除个人状态。可从收藏页或页脚进入“备份与安装”，先导出 JSON，再在新设备预览并确认合并导入；已有非空备注优先保留。iPhone 可通过 Safari 分享菜单添加到主屏幕。

## 研究、验证与后续

完整的七项目调研、布局比较、字段取舍、图片许可核实和实施顺序见 [docs/research.md](docs/research.md)。第一版实际验证与限制见 [docs/verification.md](docs/verification.md)。第二轮自检、精修、性能采样和验证见 [docs/polish-review.md](docs/polish-review.md)。

本轮 10 → 62 件馆藏、版本取舍、未收录作品、来源与性能记录见 [docs/collection-expansion.md](docs/collection-expansion.md)；逐件来源台账见 [docs/collection-sources.json](docs/collection-sources.json)。

高清保存、备份结构／导入策略、PWA 缓存与更新、验证边界见 [docs/personal-tools.md](docs/personal-tools.md)。

优先改进：实体手机保存／备份／安装与 VoiceOver 验证；开放 IIIF 或更小高清层；有明确需求时提供导入冲突选择与版本兼容。
