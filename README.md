# 私人美术馆 · Personal Art Gallery

一个安静、以画作为中心的响应式个人数字美术馆。十件开放作品，保留原始构图，适合手机长时间浏览。

Pages 公开地址：**https://zslhentai.github.io/personal-art-gallery/**

当前集成启用 Pages 时返回权限 403；需管理员按下方部署步骤在 Settings → Pages 选择 GitHub Actions 后发布。本地和云端构建／浏览器检查均通过；首次运行仅发布步骤因 Pages 未启用失败，此地址目前为 HTTP 404。启用后在 [Actions](https://github.com/zslhentai/personal-art-gallery/actions) 重新运行失败的部署任务或手动运行工作流即可发布。

## 第一版

- 桌面 Rows / Justified、390px 手机单列；预览不裁切，有比例占位及懒加载。
- 双语作品详情、馆藏元数据、官方出处与图片权限、相邻作品导航。
- PhotoSwipe v5：高清加载、双指缩放、拖动、左右切换、桌面滚轮／点击缩放、ESC／返回关闭。
- 画家、流派、年代、标签可组合筛选；画家与标签独立索引。
- 独立的喜欢和收藏，个人备注，保存在当前浏览器；明暗主题。
- 随机看一幅，详情页中避免连续抽到当前作品。

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

包括桌面 Chromium、390×844 Chromium 及 WebKit 的画廊／详情／筛选／索引／收藏／备注／随机／Viewer／返回行为与控制台检查。可通过 `CHROMIUM_PATH`、`WEBKIT_PATH` 指定已安装浏览器。本地模拟不能代替实体 iPhone 的双指手势与 iOS 系统边缘返回测试。

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

使用 GitHub 的默认域名，无需自建服务器或 CNAME。不要把构建后的 `dist/` 手动提交。

## 添加画作

唯一馆藏源是 `src/data/artworks.json`。复制一个条目，填入唯一稳定 `id/slug`、作品元数据和标签；记录可复用图片的授权及官方出处。中文题名、描述、流派和标签由本站整理，不代表博物馆正式译名。

`width/height` 是实际原图像素；`dimensions` 是实体画作尺寸；`aspectRatio = width / height`。保留 `year` 原文显示和 `yearStart/yearEnd` 数值区间（年代筛选按起始年）。新增标签和画家自动进入索引和筛选，不另写页面。

预览存为 `public/images/{slug}-400.webp`、`-800.webp`、`-1200.webp`，保留全构图，不放大低分辨率来源。详情和列表通过 `srcset` 选择尺寸；`imageUrl` 为外部官方高清图，`imageSourceUrl` 解释来源。首批预览总计约 4.08 MB，高清原图未入库。现有 Met 预览可用 `python3 scripts/refresh-previews.py` 重新核对并生成，需要 Python 3 与 ImageMagick 7。

默认 `favorite:false`、`notes:""`；用户的喜欢、收藏和备注另存于 `personal-art-gallery:library:v1` 的 localStorage 中。它们不会修改公开馆藏，不跨设备同步；清除站点数据会移除个人状态。

## 研究、验证与后续

完整的七项目调研、布局比较、字段取舍、图片许可核实和实施顺序见 [docs/research.md](docs/research.md)。实际验证与限制见 [docs/verification.md](docs/verification.md)。

优先改进：个人数据 JSON 导出／导入；补充确认开放的莫奈等作品；高清网络流量优化（IIIF 来源或可选更小高清层）；实体 iPhone 手势与 VoiceOver 验证；增加作品后重新检验极端比例与行布局。
