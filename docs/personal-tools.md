# 高清保存、个人备份与 PWA

2026-10-01，当前仓库 main。保持 React / Vite、Rows、PhotoSwipe、JSON、localStorage 和原有 GitHub Pages 工作流，未新增 npm 依赖。界面入口：详情操作区、Viewer 顶栏、收藏页“备份与迁移”和页脚“备份与安装”。工具页为 `#/my-gallery`，采用与现有页面相同的留白、字体和单色轻按钮。

## 保存作品

仅 `downloadable === true` 显示保存入口；保存函数也检查该字段。当前十件作品已经在第一版逐件核实 Met `isPublicDomain:true`，其 `rights` 为 Public domain / CC0，本轮明确设置 downloadable:true。未知或受限作品填写 false，继续显示馆藏、出处与权限，不能因为图像能打开就自动允许下载。

桌面获取 `imageUrl`，使用 CORS、无凭据、`force-cache` 尽量复用浏览器 HTTP 缓存；响应成功且为 JPEG / PNG / WebP 才创建 Blob 下载。校验 MIME 与非空响应，不把错误 HTML 当图片保存；请求 30 秒超时，按钮避免同一入口重复触发。文件名为 `Artist - Artwork Title - Year.ext`，原文题名，清除非法字符，省略缺失年份；优先按响应 MIME 选扩展名，其次识别 URL 的 jpg/jpeg/png/webp，限制文件名长度。临时 Blob URL 延迟释放，兼容 Safari 保存。

iOS（包括以触摸方式运行的 iPad）选择在点击事件内同步打开高清原图，提示“已打开高清原图，可长按图片保存。”这是主动采用可靠降级，不假定 Safari 支持异步 Blob 保存。桌面 CORS／HTTP／格式／超时失败同样尝试打开原图；弹窗被拦截时，保留可点击的“打开高清原图”链接。原图本身失效时仍可在详情访问馆藏记录；不代理、不绕过来源限制。

Met 的 HEAD 采样含 Access-Control-Allow-Origin，但浏览器实际 GET 曾被拒绝，因此直接下载无法保证。Viewer 保存针对当前展示作品，切换时同步权限与可访问名称，复用现有 PhotoSwipe，不提前下载作品。没有引入 Web Share 文件流程：iOS 手势权限与来源 CORS 仍有差异，同步打开原图更稳定。

## 备份结构与导入

```json
{
  "app": "personal-art-gallery",
  "schemaVersion": 1,
  "exportedAt": "2026-10-01T00:00:00.000Z",
  "entries": {
    "met-441933": {
      "favorite": true,
      "liked": false,
      "notes": "月光很安静。"
    }
  }
}
```

文件名 `personal-art-gallery-backup-YYYY-MM-DD.json`。只导出用户记录；不含整套作品、图片、主题设置或凭据。目前没有自定义标签和分组，所以不虚构这些字段。空馆藏记录可导出 `entries:{}`。iPhone 可通过浏览器保存到“文件”；定期自行保留备份。

导入限制 1 MiB，先解析并完整验证项目标识、schemaVersion、时间、entries、布尔状态与最多 5000 字备注，再显示预览；确认之前不写入。未知字段忽略，未知 artwork id 跳过并计数。不识别的老／新版本明确拒绝，保留现有记录，不猜测迁移。

仅提供合并：喜欢和收藏取正向并集，已有非空备注优先，备份只补入空白备注；其他记录不清空。用户在预览中明确看到规则并点“确认合并导入”。坏数据使整次导入失败，不会先写一部分。localStorage 写入成功后才替换 React 状态；容量或权限失败时数据和预览保留。无静默覆盖选项，避免一键误删当前记录。未来增加用户字段时应升级版本并明确兼容逻辑。

## PWA 与缓存

`manifest.webmanifest`：私人美术馆、standalone、固定 id/start_url/scope `/personal-art-gallery/`、原有浅色主题／背景。192/512px PNG 图标沿用现有框中 A 标志，主体位于 maskable 安全区域；另有 180px Apple Touch Icon 和 ICO / SVG favicon。Apple 元信息与 viewport-fit=cover 保留。支持安装提示的浏览器可在工具页主动安装；Safari 显示“分享 → 添加到主屏幕”，安装后显示独立应用提示。

生产构建生成 `/personal-art-gallery/sw.js`，内容哈希决定版本；开发服务器不注册 worker。页面 load 后注册，scope 限定仓库路径，updateViaCache:none。

- 缓存 shell HTML、入口 JS/CSS、已打包的馆藏 JSON、小型备份工具代码、manifest、UI 图标。备份代码按需执行，后台入缓存以支持第一次离线使用。
- PhotoSwipe 仍按需加载；使用后本地 JS/CSS 可进入代码缓存，最多 16 个 runtime 条目。
- 不纳入本地作品预览、跨域高清原图、下载 Blob、其他域名或其他站点路径。
- 导航优先联网获取新 HTML，网络失败才返回安装时的 shell；404 等正常 HTTP 响应不被替换成首页。哈希路由继续支持详情直达和刷新。
- 新 worker 完成安装后等待；“刷新更新”提示提醒先保存备注，用户点击后才 skipWaiting，controllerchange 刷新。页面重新可见或恢复联网时检查更新；不定时强制刷新。
- 激活时删除本项目旧缓存，不删除其他应用缓存，更不删除个人 localStorage。

离线仍可整理喜欢、收藏、备注和备份。未加载的图片与原图需要网络；首次离线且 PhotoSwipe 尚未缓存时显示可返回的错误提示。仅在 shell 成功安装后提供离线能力，PWA 不是整套馆藏离线下载器。

## 小优化与维护

修复详情图片说明写死 Met 的问题，改用作品自身 museum/downloadable。离线说明明确区分界面可用与图像需要网络；工具模块失败和 Viewer 模块失败都有恢复入口。没有添加浏览历史、最近看过、复杂收藏夹或动画，避免本轮扩大范围。

新增作品除既有图像文件测试外，Vite buildStart 自动校验：ID/slug 唯一、必需标题／画家／年份／馆藏／权限、HTTPS 来源、预览路径、布尔 downloadable、标签、年份范围、宽高与 aspectRatio 一致。标为开放下载必须记录 Public domain / CC0 或明确开放下载；其他许可需人工核实并调整明确规则，不能仅开启按钮。默认个人备注和收藏仍为空。校验失败直接阻止构建与 Pages 发布。

CI 浏览器依赖安装曾在 Azure Ubuntu 镜像下载阶段等待超过 15 分钟；工作流改为 Ubuntu 官方 archive 镜像，保留 Chromium / WebKit 的全部依赖安装与测试，Pages 部署仍须两个检查任务通过。

## 验证与限制

最终结果：lint 通过，10/10 单元测试通过，生产 build 通过；三项目浏览器测试 44 项通过，1 项手机专用测试在桌面按设计跳过。原有回归覆盖保留。入口 JS gzip 约 85.51 KB（第二轮 83.07 KB，增加约 2.44 KB）；备份工具单独 chunk gzip 约 2.82 KB，PhotoSwipe 仍为按需 17.42 KB。没有新增图片预加载或将原图放入缓存。

单元覆盖备份往返、空数据、损坏／外来文件、旧／新版本、未知字段／ID、非法状态、超长备注、合并不覆盖、无原地修改；文件名与扩展名；禁下载不触发浏览器行为；新增作品校验。

浏览器复用全部现有回归，并检查真实 JSON 文件下载与恢复、导入预览、保留当前备注、存储失败、真实跨域原图降级、当前 Viewer 作品保存、禁下载隐藏与来源链接。允许 CORS 的直接 Blob 下载采用本地 PNG 响应夹具，真实 Met GET 用于验证可用或降级，不声称来源总能直接下载。原图 503 故障注入独立于 SW，避免测试路由被 worker 接管；正常加载与缓存仍启用实际 SW。

PWA 验证 manifest、图标和 worker 子路径；实际两版 worker 更新、等待确认、旧缓存清理、备注保留；中断测试服务器模拟来源不可达，并注入浏览器离线信号验证缓存回退。Chromium 普通持久配置的 CDP installabilityErrors 为空；自动测试私密上下文的 in-incognito 属环境限制，不当作应用缺陷。安装事件 UI 生命周期另用事件夹具测试，不宣称已在实体主屏幕安装。

未连接实体 iPhone / Android，真实 Safari 长按保存、导出到文件、主屏幕安装、系统边缘返回和 VoiceOver 仍需真机验证。iOS 主屏幕与 Safari 的存储是否共享由系统版本决定；备份导入提供迁移途径，不能保证自动共享。第三方图片权限、CORS、可用性与 HTTP 缓存由来源控制。合并不会用备份替换已有备注，若需要精确覆盖需另行设计明确预览。

下一阶段最值得做的三项：实体手机验证保存／备份／安装全流程；评估开放 IIIF 或更小高清层降低弱网等待；在确有需求后设计逐项冲突选择和版本兼容，继续避免云同步与后台。
