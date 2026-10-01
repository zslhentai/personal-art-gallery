# 第一版验证记录

日期：2026-10-01。当前仓库 `zslhentai/personal-art-gallery`，分支 `main`。

## 实际完成的验证

- `npm run lint`：通过。
- `npm test`：通过。核对 10 件作品完整字段、唯一 ID／slug、年份范围、实际原图宽高与比例、来源域名、授权字段、30 张真实 WebP 文件及 5 MB 预览总量上限、Pages base 和部署 action。
- `npm run build`：通过。静态产物 `dist/`，入口 JS gzip 约 82.6 KB；按需 PhotoSwipe JS gzip 约 17.4 KB；CSS gzip 约 5.3 KB。无后端服务。
- Playwright：桌面 Chromium、390px Chromium、390px WebKit（iPhone 13：390×664 可视区，390×844 设备尺寸） 共 15 项浏览器检查通过。实际图片加载，无虚构的网络 mock。
- 图像：10 件 Met 官方记录的 `isPublicDomain:true`，30 张本地响应式预览全部可加载；所有高清源实际下载核实尺寸。高清 JPEG 只在临时目录验证，未入库。
- 画廊：每幅图原比例、无裁切、十件实际预览、390px 单列宽度、无横向溢出；浅色、深色桌面与 WebKit 手机截图已人工查看。
- 详情：必需藏品字段、原文和中文标题、出处与图片权限；hash 详情直达／刷新；不存在的作品正常回退。
- 筛选：画家／流派／年代／标签、组合筛选、零结果、清除、刷新保留 URL 筛选；Artists／Tags 进入正确结果。
- 收藏：喜欢和收藏独立；刷新持久化；取消收藏仍保留喜欢；空列表；备注保存并刷新保留；损坏 localStorage 内容回退。
- Random：打开另一幅作品、详情中不重复当前作品。
- Viewer：实际高清 JPEG 加载并解码显示、键盘左右、缩放按钮、ESC、关闭按钮、浏览器返回；直接 Viewer 链接关闭回详情；快速打开后返回不会残留遮罩。
- 手机手势：Chromium CDP 真实触摸事件模拟双指展开，确认 `pswp--zoomed-in`；放大后单指拖动，确认图像 transform 改变；缩回后左右滑动，计数由 `2 / 10` 变为 `3 / 10`；844×390 横屏无横向溢出；关闭回详情。
- 控制台：画廊浏览和主题切换无 console error／pageerror；Viewer 操作无 pageerror。

浏览器测试曾发现单件结果容器收缩引发 responsive 阈值循环、Viewer 打开动画期间立即返回残留遮罩、索引可访问名不明确；均已修复后重新通过。

## 云端检查

已将相同文件树和提交 `e5e0f80` 上传到远端 `main`，本地与远端 SHA 一致，工作区干净。[首次 GitHub Actions 运行](https://github.com/zslhentai/personal-art-gallery/actions/runs/36862845475) 的 `build` 与 `browser-tests` 均成功，云端执行了完整浏览器测试。仅 `deploy` 在 `actions/configure-pages` 因站点尚未启用返回 404；尚未进入实际发布步骤。直接访问目标 URL 同样为 HTTP 404，故未将目标地址称为已上线。

启用 Source 为 GitHub Actions 后，可在该运行选择 Re-run failed jobs，或从 Actions 手动运行完整工作流。

## 部署状态与权限限制

工作流 `.github/workflows/pages.yml` 已配置：main 推送／手动运行执行检查和构建，浏览器检查通过后以官方 Pages action 发布；PR 不部署。

尝试调用 `POST /repos/zslhentai/personal-art-gallery/pages`、`build_type=workflow` 启用站点，GitHub 返回 **403 Resource not accessible by integration**。这属于当前连接的 Pages 管理权限缺失，并非用户未授权，也不是代码构建失败。官方 `actions/configure-pages` 明确说自动 enablement 需要 GITHUB_TOKEN 之外具备 Pages／administration 写权限的凭据，故不加入无效的自动启用或要求用户提供密钥。

仓库管理员需在 **Settings → Pages → Source** 选 **GitHub Actions**，再运行部署工作流。目标公开地址为 https://zslhentai.github.io/personal-art-gallery/ 。在站点启用并完成实际部署前，不声称此网址已经上线。参见 README 中的部署步骤。

## 无法实际验证的内容与当前限制

- 未连接实体 iPhone。390px WebKit 和触摸模拟已验证，但实体 iOS Safari 的双指感觉、系统边缘返回、动态浏览器栏、安全区和 VoiceOver 仍需真机复核。
- 高清来源为第三方官方域名，未来可用性由博物馆控制；单图约 1.8–8.3 MB，移动网络首次观看需要等待。手机关闭额外相邻预加载，无原图入库。
- 浏览器标准 HTTP 缓存，没有专门离线模式。收藏、喜欢与备注只在该浏览器，不跨设备；清除站点数据会丢失个人状态。
- 元数据为导入时快照；官方修改标题／授权／图片时需人工复核。中文译名、标签和流派为本站整理。
- 莫奈、Hopper、Wood、Wyeth、Klimt 不为填充数量而加入未确认可用的高清地址；首版有梵高、哈默修伊、雷诺阿等十件明确开放作品，覆盖横／竖／接近方形、1650–1910 年代及多种风格和标签。

## 下一阶段优先级

1. 个人收藏和备注的 JSON 导出／导入，解决浏览器数据备份。
2. 扩充确认开放且稳定的莫奈等作品，继续保留逐件出处与权限。
3. 增加更小的高清层或 IIIF 来源，降低移动网络流量。
4. 实体 iPhone Safari／VoiceOver 验证并优化手势与返回。
5. 馆藏增加后检验更极端长宽比、筛选结果行高与首屏性能。
