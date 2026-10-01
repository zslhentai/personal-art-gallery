# 本轮收画：10 → 62 件

核实日期：2026-10-01。新增 52 件，覆盖 17 位画家；本轮没有增加产品功能、依赖或新布局。原有十件的 ID、slug、顺序和个人数据关联保持不变。新作品追加到馆藏，画家／标签索引、筛选、相邻跳转及随机入口自动使用完整 JSON。

## 收录结构

| 画家 | 原有 | 新增 | 总计 |
| --- | ---: | ---: | ---: |
| Claude Monet | 0 | 15 | 15 |
| Vincent van Gogh | 3 | 11 | 14 |
| Vilhelm Hammershøi | 2 | 3 | 5 |
| Johannes Vermeer | 0 | 4 | 4 |
| Rembrandt | 1 | 2 | 3 |
| Caspar David Friedrich | 0 | 3 | 3 |
| J. M. W. Turner | 0 | 3 | 3 |
| Auguste Renoir | 1 | 2 | 3 |
| Edgar Degas | 0 | 2 | 2 |
| Paul Cézanne | 0 | 2 | 2 |
| Georges Seurat | 1 | 1 | 2 |
| Grant Wood / Gustav Klimt / Édouard Manet / Edvard Munch | 0 | 各 1 | 各 1 |
| Jacques Louis David / Honoré Daumier | 各 1 | 0 | 各 1 |

莫奈覆盖睡莲、人物、花园、海岸、火车站、威尼斯、伦敦、鲁昂和干草堆；只保留少量构图不同的池塘作品。梵高增加星月夜、罗讷河上的星夜、向日葵、夜间露台、夜间咖啡馆、卧室、鸢尾花、杏花、麦田群鸦、奥维尔教堂和橄榄树。Almond Blossom / Blossoming Almond Tree 不重复收录。

重要版本说明：

- 睡莲与云的倒影：找到的可靠 4500px 文件是三联画的**单幅画板**，题名、英文及尺寸均明确说明；没有冒充完整三联画，也没有额外裁切。完整三联画待更合适高清来源。
- 日本桥为 NGA 1899 年藏本；睡莲池为伦敦 NG4240 藏本。尺寸、构图和馆藏不同，不是重复记录。
- 吉维尼的艺术家花园采用耶鲁 1983.7.12 藏本，不冒充奥赛的另一版本。
- 向日葵为慕尼黑藏本；卧室为奥赛藏本；鸢尾花为 Getty 藏本；橄榄树为爱丁堡藏本。
- 呐喊为挪威国家博物馆 NG.M.00939、1893 年版本，官方尺寸 91 × 73.5 cm、蛋彩与蜡笔纸板画。摄影：Nasjonalmuseet / Børre Høstland，CC BY 4.0；作品本身为 Public domain。详情保留署名、许可与来源，预览只缩小。
- 白色的门为拍卖来源记录；当前馆藏未公开，不编造收藏机构。

## 暂缓收录

| 作品 | 原因与证据 |
| --- | --- |
| Edward Hopper — Nighthawks | Commons 说明其在美国因未续展进入公有领域，同时提醒生命期计权地区可能仍受保护。`PD-old-50-1964` 不作为全球开放许可；本轮不收录。文件说明：https://commons.wikimedia.org/wiki/File:Nighthawks_by_Edward_Hopper_1942.jpg |
| Hopper — Automat / House by the Railroad | Commons 有文件，但 `PD-old-50` / 美国公有领域信息不足以确认本项目全部使用范围的许可；暂缓。Gas、Morning Sun、Rooms by the Sea、New York Movie 同样未取得可确认的开放使用许可。 |
| Andrew Wyeth — Christina’s World | 未找到可确认授权的开放高清作品文件；搜索到的房屋照片不是画作。MoMA 开放元数据不等于图片授权。 |
| Salvador Dalí — The Persistence of Memory | 未找到符合项目规则的开放高清图，不使用展厅衍生照片或不明转载。 |
| 部分搜索结果 | 排除展厅全景、细节图、彩色修正来源不明版本、错误画家、低分辨率文件。未强行凑到 80 件。 |

美国哥特式使用 Commons 已核实的 PD-Art 文件，含 VRT 权限记录 2011021110002363；不使用第一版 AIC API 中非开放标记的图像。Commons 原始说明：https://commons.wikimedia.org/wiki/File:Grant_DeVolson_Wood_-_American_Gothic.jpg 。

## 来源与数据核实

最终高清来源：15 件 Met 官方 CC0，47 件 Wikimedia Commons 的 Public domain / CC0 文件及明确许可的博物馆摄影。馆藏包括 NGA、AIC、MoMA、奥赛、耶鲁、Getty、Rijksmuseum、Mauritshuis、英国国家美术馆、丹麦／瑞典／挪威国家博物馆、梵高博物馆、波士顿美术馆、威尔士国家博物馆等。并不声称 Commons 文件全部由博物馆直接开放发布。

[collection-sources.json](collection-sources.json) 记录每件稳定 ID、核实日期、图像 URL、像素、许可证和元数据依据；Commons 记录另有文件页 ID、关联 Wikidata、原文件链接，新图保存实际下载文件的 SHA-256 与字节数。源文件和艺术家／系列由人工逐项判断，未机械导入搜索结果。

所有最终高清图都实际 GET 获取过并读取像素；原有 10 件 Met 再次核实 `isPublicDomain:true` 且图像地址未变。页面字段使用该具体藏本的数据，优先确切博物馆／Commons Artwork 数据，缺失值由关联 Wikidata补充。发现 Wikidata《雾海旅人》高度错误，改用汉堡官方 94.8 × 74.8 cm；没有盲信机器元数据。

链接检查没有发现 404。最初批量 HEAD 中 14 个 Commons 图像返回 429，随后下载与实际浏览器解码确认地址有效；这是限流，不将其标记为已删除。56 个来源页 HEAD 200；6 个官方来源页（NGA、Yale、AIC、苏格兰）有 403／防机器人限制，保留已由官方 API 或 Commons 原始记录确认的地址，不能宣称自动检查通过所有来源页。来源页限制不影响本地预览。

挪威官方 IIIF 手工在 Chromium / WebKit 成功解码，但重复 WebKit Viewer 检查中偶发传输未完成；最终换为同一摄影的 Commons 高清版本，保留官方元数据及 CC BY 4.0 署名。高清版本不超过约 12 MiB，避免原始超大扫描和 TIFF 直接进入移动 Viewer。

标签延续已有词汇，每件通常 3–4 个：场景、水面／室内／人物，和安静／梦幻／阴郁／明亮等氛围；流派仍有独立筛选。既有“孤独感”沿用，未另造同义标签。

## 预览与性能

共 186 个 400/800/1200px WebP，约 18.97 MiB；本轮新增约 15.08 MiB。原有预览未更换，新预览质量 76、移除附属元数据、保留比例，不放大。高清文件只用于临时核实与生成，没有进入仓库。

- Rows 维持原方案，手机单列，全部 62 件正常渲染，无虚拟列表或新依赖。
- 手机仅第一件 eager，其余 lazy；srcset、尺寸占位、async decode、Viewer 按需加载及 SW 不缓存画作保持原实现。
- 单图预算：400px <96 KiB，800px <320 KiB，1200px <700 KiB；另检查整个馆藏平均三张预览合计 <512 KiB／件。总预算随馆藏合理增长，单图约束更严格；不是简单删除旧预算测试。
- 390px 冷启动采样：首图 y=472.56、宽 350px，与扩容前相同；CLS=0，无横向溢出。新增后首屏仅 4 张本地预览，约 1.37 MiB，没有请求高清原图；375/430px 同样正常。浏览器懒加载可能提前加载邻近几件，具体数量随浏览器和时序变化。
- 单次本地 LCP 390px 约 404 → 504ms；入口 gzip 85.51 → 98.53 KB，增量约 13 KB 为馆藏数据。不将该本机采样当作实体手机或公网性能保证。

## 维护与测试

构建校验增加重复高清 URL、同 artistSlug 的作者姓名一致性、重复标签及美国限定下载权限检查；来源台账单元测试检查全覆盖、稳定 ID、实际像素和关联作品去重。预览测试读取实际 WebP 尺寸，验证完整比例和单图大小。

`refresh-previews.py` 支持 Met 和 Commons，遵守 Wikimedia 的 User-Agent 要求，权限或原图／缩放地址改变会阻止刷新；只保留临时高清文件。新增作品仍编辑同一个 JSON，无 CMS。

最终 lint、11/11 单元测试、build 通过；Chromium Desktop、Chromium 390px、WebKit 390px 共 50 项浏览器测试通过，1 项手机专用测试在桌面按设计跳过。

三浏览器回归保留全部既有测试并将固定十件断言改为真实数据计数；新增莫奈索引、氛围标签、新作品随机、收藏、许可与高清保存回归。全馆连续遍历逐幅验证图片实际加载、原比例及无溢出。WebKit 的截图上限为 32767 **物理**像素，DPR 3 下长馆藏采用首、中、尾截图，未删除逐幅检查。

实际以 390px / DPR 3 连续滚动全馆至底部约 6.7 秒：Chromium 帧间隔中位数 16.7ms、P95 16.8ms；WebKit 中位数 16ms、P95 23ms。857 个 DOM 节点，无横向溢出、无页面脚本错误、高清请求为 0。该结果仅描述本地模拟环境，未以此声称实体手机 FPS。

实体 iPhone 的真实滚动、系统保存与主屏幕安装仍需真机复核；外部高清源的网络与限流不由本站控制。本轮没有增加任何账号、数据库、云同步、AI、社区或收藏夹。
