# 编码前调研与第一版决策

调研日期：2026-10-01。仓库原有内容只有 `README.md`（一行项目名）；当前分支为 `main`，未发现 AGENTS.md、docs 或已有代码。A 中观看作品、手机体验及静态部署优先于参考项目的功能数量。

## 七个参考项目

| 项目与实际阅读来源                                                                                                                                                                                                                                                                                                                            | 最值得借鉴                                                                               | 不采用的部分及理由                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Immich README](https://github.com/immich-app/immich/blob/main/README.md)、[PreloadManager](https://github.com/immich-app/immich/blob/main/web/src/lib/components/asset-viewer/PreloadManager.svelte.ts)、[PhotoViewer](https://github.com/immich-app/immich/blob/main/web/src/lib/components/asset-viewer/PhotoViewer.svelte)                | 缩略图→预览→原图的质量分层；相邻内容加载；浏览器与详情信息分开；独立收藏状态             | 不引入服务器、账号、自动备份、EXIF、人脸识别、全文／语义搜索、视频。10 件作品无需虚拟滚动或复杂缓存管理。使用 HTTP 图片缓存，避免另建缓存服务                             |
| [PhotoSwipe README](https://github.com/dimsemenov/PhotoSwipe/blob/master/README.md)、[options](https://github.com/dimsemenov/PhotoSwipe/blob/master/docs/options.md)、实现中的 opener／destroy 生命周期                                                                                                                                       | v5 的双指缩放、拖动、左右切换、键盘、真实宽高、加载提示、错误提示、焦点恢复              | 不自研手势；不选择 README 中尚在研发的 v6。高清图片不使用小图 `msrc` 做放大占位；手机不额外预加载下一张大原图。打开动画设为 0，避免打开期间立即返回时库拒绝关闭           |
| [react-photo-album README](https://github.com/igordanchenko/react-photo-album/blob/main/README.md)、实际安装版本的 Rows 源码与类型                                                                                                                                                                                                            | Rows 用动态规划寻找近似目标高度的换行；原始宽高、响应式布局、不同分辨率图像              | 不让用户选择 Rows／Columns／Masonry；不引入 SSR。自定义卡片仍使用库的尺寸变量。单行最高高度按 viewport 决定，防止容器收缩触发断点反复变化                                 |
| [react-grid-gallery README](https://github.com/benhowell/react-grid-gallery/blob/master/README.md)                                                                                                                                                                                                                                            | Justified 的统一行高及横竖画混排思路                                                     | README 声明 2025-08-28 停止维护，不作为依赖；不采用照片社区式覆盖标签、多选、下载工具栏                                                                                   |
| [MoMA collection README](https://github.com/MuseumofModernArt/collection/blob/main/README.md)                                                                                                                                                                                                                                                 | 标题、艺术家、原始日期显示、媒材、尺寸及稳定标识；允许数据不完整                         | 不机械导入 department、classification、入馆日期、艺术家人口信息等字段。CC0 元数据不包括图片授权，README 明确说明 Images not included                                      |
| [artic.edu README](https://github.com/art-institute-of-chicago/artic.edu/blob/develop/README.md)、[artworkDetail](https://github.com/art-institute-of-chicago/artic.edu/blob/develop/resources/views/site/artworkDetail.blade.php)、[images](https://github.com/art-institute-of-chicago/artic.edu/blob/develop/docs/images.md)、官方馆藏 API | 大图与标题／日期／艺术家分层；藏品式媒材与尺寸；手机相关内容移至下方；来源和相邻作品导航 | 不引入 Laravel、Twill CMS、PostgreSQL、馆内位置、3D、多资源 Viewer。本环境主站图片遭 Cloudflare challenge，官网视觉细节不能声称已实际浏览验证；结论来自公开模板与图片文档 |
| [Open Collections README](https://github.com/jacobramirezsf/open-collections/blob/main/README.md)、[architecture](https://github.com/jacobramirezsf/open-collections/blob/main/docs/architecture.md)、[shared/types.ts](https://github.com/jacobramirezsf/open-collections/blob/main/shared/types.ts)                                         | 统一元数据、原始馆藏链接、明确图片权限；展示和搜索不依赖即时馆藏 API；图片优先           | 不引入 67 万条索引、SQLite/FTS5、Vercel functions、boards、多选、ZIP 下载代理、相似图、半色调编辑器。其密集 masonry 服务于大量搜索结果，不符合私人展厅的停留节奏          |

以上借鉴交互和组织方式，没有复制项目代码、整站或其大型架构。

## 推荐技术栈、画廊与 Viewer

Vite + React + TypeScript，输出纯静态 `dist/`。生产依赖为 React、react-dom、react-photo-album 和 PhotoSwipe。hash 路由保证 GitHub Pages 刷新详情无需服务端 rewrite；固定 Vite base `/personal-art-gallery/`。不使用框架服务端渲染、数据库或后端 API。

桌面 Rows／Justified，更适合在同一水平视线内阅读横幅、竖幅与接近方形的画，保留构图且有顺序。Masonry 可以保留比例，但更像不断向下扫描的图片搜索工具；竖幅会主导整列，跨列阅读顺序不直观。Rows 的代价是极端长宽比可能造成局部尺寸差异，限制每行数量，使用舒适的目标行高。390px 改为单列，避免竖画在多列中变成很小的缩略图。只提供这一套布局。

PhotoSwipe v5 处理成熟的双指、拖动、切换及桌面缩放。真实原图宽高用于计算初始 fit；高清动态加载，不把低清图放大冒充高清；中文操作名称、状态与错误提示。ESC、关闭按钮、浏览器返回关闭，直接打开 Viewer 链接关闭后仍停留详情页。桌面预加载下一件，手机不额外请求相邻高清原图。

## 推荐数据结构

本地 `src/data/artworks.json` 是馆藏的唯一编辑入口，每件包含用户提出的核心字段：

- `id`（来源前缀 + 馆藏 ID）、`slug`、`titleZh`、`titleOriginal`
- `artist`、`artistZh`、`artistSlug`
- `year`（保留原始显示值）、`yearStart`、`yearEnd`
- `movement`、`medium`、`dimensions`、`museum`、`museumUrl`
- `thumbnailUrl`、`imageUrl`、`sourceUrl`、`imageSourceUrl`
- `tags`、`favorite`、`notes`、`aspectRatio`、`width`、`height`、`rights`、`alt`

`width`／`height` 是原图像素而非画作厘米尺寸；`aspectRatio` 由它们导出并测试一致性。`rights` 与图片来源有实际用途，防止元数据与图片授权混淆。`artistZh` 支持中文阅读，`alt` 描述画面用于无障碍。流派、中文标题、中文描述、标签为本站手工整理，原文标题、年代、媒材、画作尺寸及原图来自官方记录；不声称是馆方正式译名或馆方认可的风格分类。

馆藏默认 `favorite:false`、`notes:""`，不代用户填写备注。`localStorage` 另存 `id → {favorite, liked, notes}`，不修改馆藏 JSON，迁移数据库时仍可用稳定 ID 关联。存储不可用／数据损坏时安全回退。第一版不添加无实际用途的 API、账号或数据库字段。

## 页面结构与第一版边界

- Gallery：首页介绍、馆藏 Rows、画家／流派／年代／标签组合筛选、随机入口。
- Artwork：完整预览、大图入口、双语标题与艺术家、藏品字段、来源、喜欢／收藏、个人备注、相邻作品。
- Favorites：收藏与喜欢两个独立列表，同样可组合筛选。
- Artists：画家索引，进入该画家的画廊筛选。
- Tags：自由标签索引，自动从 JSON 构建，进入该标签的筛选。
- Random Artwork：全站导航与首页底部入口，直接邂逅另一件作品，不加无用途的中间页面。

不包括账号、社区、评论、排行榜、后台、云同步、AI 推荐、多用户、多个收藏夹、下载代理或批量整理。

## 图源核实与实施调整

最初核实 AIC 的十件作品数据。官方 API 将 Nighthawks、American Gothic 标为 `is_public_domain:false`，不采用这两件的图片。其他 AIC 开放图像请求在本环境返回 Cloudflare 403；Wikimedia 请求也未成功。不能以未验证的地址填满页面。

转用 [Met Open Access](https://www.metmuseum.org/about-the-met/policies-and-documents/open-access) 的官方 API 与 `images.metmuseum.org`。十件入选作品均实际确认 `isPublicDomain:true`，缩略与高清地址可加载，像素尺寸已从实际原图读取。尝试的莫奈条目在本次 API 响应里没有开放图像且为 false，未强行填入；这不代表莫奈作品普遍不开放，只描述此次所选官方记录的状态。

高清原图仅下载到临时目录验证，未提交；仓库保存不裁切、移除文件元数据的 400／800／1200px WebP，总计约 4.08 MB。列表通过 `srcset/sizes` 选择尺寸，前几件 eager，其余 lazy，预留比例避免布局跳动。详情最高 1200px，Viewer 才请求博物馆原图（约 1.8–8.3 MB）。浏览器按标准 HTTP 缓存使用它们；第一版不添加 Service Worker，避免刷新后旧馆藏和旧图长期滞留。这样无需在线 API、私钥或长期运行服务。

## 移动端方案与实施顺序

390px 手机：20px 侧留白、单列、不裁切、导航单独一行、筛选展开为两列原生控件、16px 输入防止 iOS 自动放大、主要按钮至少 44px、详情图在前、信息在后、安全区与横屏。暗色采用柔暗绿灰背景、较低对比文字与独立图像衬底，保持画作原色。

顺序：仓库检查 → 七项目调研 → 数据／图源核实 → 视觉与 Rows → 详情 → 筛选／索引 → 喜欢／收藏／备注 → Viewer／随机 → GitHub Pages workflow → lint、数据测试、build、桌面和 390px 浏览器 → 修复 → 提交当前分支与公开部署验证。
