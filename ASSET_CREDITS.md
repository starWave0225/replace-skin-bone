# 公开素材与原典出处

运行时资源均存于本项目，不依赖外部图片或字体 CDN。

## 古画

大都会艺术博物馆各作品页面标记 **Public Domain**，Open Access 图像依 **CC0** 提供。用途为标题、行图与旧梦演出，不将画中人物标为本作人物。

| 本地文件 | 作品及来源 | 作者 / 年代 |
| --- | --- | --- |
| `temple.jpg` | [Landscape with Temple](https://www.metmuseum.org/art/collection/search/51664) | 佚名，明代 |
| `village.jpg` | [Landscape with Fishing Village and Boat on Lake](https://www.metmuseum.org/art/collection/search/51688) | 佚名，明或清代 |
| `landscape.jpg` | [Landscapes after old masters](https://www.metmuseum.org/art/collection/search/65075) | 王翚等，1692 |
| `garden.jpg` | [Landscapes in the styles of old masters](https://www.metmuseum.org/art/collection/search/49113) | 王鉴，1668 |
| `woman.jpg` | [Woman in a garden](https://www.metmuseum.org/art/collection/search/737761) | 传任熊，19 世纪中期 |

[博物馆开放使用政策](https://www.metmuseum.org/hubs/open-access)。API 返回的作品元数据保存在 `public/assets/met-metadata.json`。

## 地形素材

- [Tiny Town — Kenney](https://kenney.nl/assets/tiny-town)，**CC0 1.0**。
- 下载来源为 Kenney 本人发布的 [OpenGameArt 条目](https://opengameart.org/content/tiny-town)。
- 使用 `public/assets/tiles/tiny-town.png` 的草地小纹理与树木局部；完整许可保存在同目录。建筑形状与角色为本作 Canvas 绘制，主地图表面材质见下一节。

## 俯视角主地图：Poly Haven 公开材质

七套表面素材均为 Poly Haven 提供的 [CC0 1.0](https://polyhaven.com/license) 纹理。下载的是官方 Diffuse 贴图，没有使用网站示例渲染图。保留 1K 原图并通过官方 MD5 校验，运行文件转为 512px WebP，总计约 658 KiB；全部本地加载。`scripts/prepare-world-assets.py` 可重建资源，作者、下载地址、原文件 MD5 与运行文件 SHA256 见 `docs/world-public-assets.json`。

| 本地文件 | 素材 / 来源 | 作者 | 使用位置 |
| --- | --- | --- | --- |
| `world/roof.webp` | [Grey Roof Tiles](https://polyhaven.com/a/grey_roof_tiles) | Rob Tuytel | 原创中式屋顶表面 |
| `world/stone.webp` | [Mossy Cobblestone](https://polyhaven.com/a/mossy_cobblestone) | Sơn Nguyễn | 石路、桥面、庭院与值房地面 |
| `world/earth.webp` | [Forest Ground 04](https://polyhaven.com/a/forest_ground_04) | Rob Tuytel / Rico Cilliers | 草地、院落与后井的湿土、碎石与腐叶底层 |
| `world/plaster.webp` | [Worn Mossy Plasterwall](https://polyhaven.com/a/worn_mossy_plasterwall) | Amal Kumar | 民居斑驳灰墙 |
| `world/brick.webp` | [Mossy Stone Wall](https://polyhaven.com/a/mossy_stone_wall) | Amal Kumar | 院墙、河岸、井沿 |
| `world/floor.webp` | [Old Wood Floor](https://polyhaven.com/a/old_wood_floor) | Guillaume Monsergent | 客舍、茶楼、王宅木地板与戏台 |
| `world/wood.webp` | [Dark Wood](https://polyhaven.com/a/dark_wood) | Dario Barresi / Dimitrios Savva / Rico Cilliers | 木柱、门扇、桌案与架柜 |

这些是表面材质，并非现成的完整中国古镇地图。中式屋檐、窗棂、门匾、井体和植被造型仍由本作绘制；材质在 Canvas 中缩放、降饱和并叠加统一色调，沿用原有景物的碰撞与遮挡。独立 `?view=world` 行图页可步行检查七处场景、昼夜与借面外观，不访问正式剧情存档。

## 字体

- [Ma Shan Zheng](https://github.com/google/fonts/tree/main/ofl/mashanzheng)，马善政毛笔楷体，SIL OFL 1.1。
- [Noto Serif SC](https://github.com/google/fonts/tree/main/ofl/notoserifsc)，SIL OFL 1.1。
- 本地 WOFF2 为按本作文字截取的字符子集，保留对应 OFL 文本；没有将字体单独出售。

## 《画皮》原文

- 作者：清代蒲松龄（1640–1715），原作属于公有领域。
- 核对底本：[识典古籍《聊斋志异·画皮》](https://www.shidianguji.com/zh/book/XYXLZZY/chapter/1l6393j2mivxk)。仅使用古籍原文，没有使用网站现代译文或评注。
- 摘句保留该版本文字，分段、标点按界面需要排布。不同版本的「独奔/独行」「绘之/画之」等异文不混用。
- 剧情中的「原典」「旧卷所载」均为摘句标识，其余为游戏衍生文本。原作陈氏最终救活王生；王宅后续不是原著内容。

## 原创

青瓦房屋、瓦檐、灯笼、长衫人物、庭院陈设、面具、界面纹饰、程序化环境声与游戏衍生剧情为此 Demo 新作。环境效果保留 Web Audio 合成的低声雨响与交互提示音，已移除自动五声音阶拨弦；正式场景配乐改用文末列出的 PeriTune 授权录音。

## 专属对话立绘

使用内置 imagegen 生成九张透明底立绘：沈砚、戚婆婆、韩七、无面娘、小满、茶摊老板、卖灯人、陈氏残影，以及故捕快周平之面。它们是 AI 生成的本作角色图，不属于上文下载的公有领域古画。

原始 PNG：`assets-source/portraits/`；保持原 alpha 通道的运行时 WebP：`public/assets/portraits/`。完整提示词、生成方式与原稿映射见 `docs/portraits/prompts.json`。

当前使用 v2：以原角色图为编辑参考，调整为明清绣像、白描淡彩方向，强化市井衣冠与器物，保留人物自然的年龄、脸型和劳作痕迹。v1 原稿与提示词另存，便于回看。美术方向和参考资料见 `docs/portraits/art-direction-v2.md`。

## 序章与三维梦境新增资产

新增陆知微的本来身份透明立绘，以及廊中《借相》画卷，均由内置 imagegen 为本作生成，属于 AI 生成图像，未冒称古画。原始 PNG 存于 `assets-source/prologue/`，WebP 分别位于 `public/assets/portraits/lu-v1.webp`、`public/assets/dream/borrowed-likeness.webp`。完整提示词与文件映射见 `docs/prologue-assets.json`。

梦境的木构、窗棂、镜框、悬相与交互动画由程序构建；宫灯、家具和主要表面材质采用下列公开资产。环境声为 Web Audio 合成。渲染使用 Three.js（MIT），相关许可随 npm 包保留。以上资源均本地加载。

## 梦境写实素材：Poly Haven

以下资产从 Poly Haven 官方公开 API 取得，均依 [CC0 1.0](https://polyhaven.com/license) 提供。模型保留 PBR 材质；纹理转为 WebP 后本地使用，不依赖运行时外部 API。下载脚本为 `scripts/prepare-dream-assets.py`；原文件、完整文件元数据和作者记录保存在 `assets-source/polyhaven/`，清单为 `docs/dream-public-assets.json`。

| 资产 | 作者 | 场景用途 |
| --- | --- | --- |
| [Chinese Chandelier](https://polyhaven.com/a/chinese_chandelier) | Kirill Sannikov | 吊挂宫灯、第一盏灯和随身灯 |
| [Chinese Console Table](https://polyhaven.com/a/chinese_console_table) | Kirill Sannikov | 采笔条案、画卷下的条案 |
| [Chinese Armchair](https://polyhaven.com/a/chinese_armchair) | Kirill Sannikov | 圈椅 |
| [Chinese Screen Panels](https://polyhaven.com/a/chinese_screen_panels) | Kirill Sannikov | 两侧彩绘屏风 |
| [Chinese Tea Table](https://polyhaven.com/a/chinese_tea_table) | Kirill Sannikov | 首灯下的雕花小几 |
| [Chinese Cabinet](https://polyhaven.com/a/chinese_cabinet) | Kirill Sannikov | 后廊旧柜 |
| [Old Wood Floor](https://polyhaven.com/a/old_wood_floor) | Guillaume Monsergent | 旧木地板的颜色、法线与 AO / 粗糙度 |
| [Dark Wood](https://polyhaven.com/a/dark_wood) | Dario Barresi / Dimitrios Savva / Rico Cilliers | 梁柱、窗棂、门框 |
| [Worn Plaster Wall](https://polyhaven.com/a/worn_plaster_wall) | Dimitrios Savva | 剥蚀灰泥墙 |
| [Rough Linen](https://polyhaven.com/a/rough_linen) | colormass / Rico Cilliers | 织物帘幕 |
| [Moonless Golf](https://polyhaven.com/a/moonless_golf) | Greg Zaal | 夜景环境反射照明 |

模型采用 1K 纹理，主要表面采用 2K 纹理；此选取用于浏览器内存与近景细节之间的折中。所有实际下载文件通过官方 MD5 校验。

## 雨夜寻凶图片开场（2026-11-03）

使用内置 imagegen 为本作生成八张图片：雨夜客栈、东厢房门、关窗与开窗的见尸房间、带字与空白书页、敲门手部，以及女子水墨面容。陆知微与女魂沿用项目既有角色作为服饰或面容参考。原始 PNG 位于 `assets-source/opening/`，运行时 WebP 位于 `public/assets/opening/`，总计 2381530 字节，约 2.27 MiB；手部与女相保留透明通道。生成方式、原文件、引用图和完整提示词见 `docs/opening-assets.json`。

图像是本作生成素材，不标作公有领域古画或 Poly Haven CC0 资产。书页上的生成字迹仅作画面纹理，不作为《聊斋志异》原文引用。门窗开合、雨线、闪电、透视翻页、水墨显隐与镜头移动由程序合成；脚步、叩门、风雷、翻页和落水声由 Web Audio 合成。

## 白衣女魂显影

白衣女魂为本作新生成的 AI 角色影像，不属于 Poly Haven 公开资产，也未标为 CC0。使用内置 imagegen 生成 1024×1536 透明 PNG；原稿为 `assets-source/prologue/wronged-spirit-v1.png`，保持原 alpha 通道的运行时文件为 `public/assets/dream/wronged-spirit-v1.webp`。完整提示词、模式和文件来源保存在 `docs/dream-spirit-asset.json`。

角色为衍生故事中的无名冤魂，与《画皮》原著陈氏不是同一人物。场景以透明投影、深度遮挡、缓慢浮动和镜中显影表现，未使用现成第三方女鬼角色模型。

## 像素战斗专用素材

使用内置 imagegen 为本作生成四张原创像素图：`courtyard-v1` 月下小院、`shen-back-v1` 画师背身、`guard-back-v1` 捕快背身、`spirit-v1` 缠面影真身。战斗采用经典掌机回合制游戏常见的前后站位与底部菜单结构；画面中的人物、妖怪和场景为本作新设计。

原始 PNG 保存在 `assets-source/combat/`，运行 WebP 位于 `public/assets/combat/`，完整提示词、生成方式与文件映射见 `docs/combat-pixel-assets.json`。三个透明角色使用无损 WebP，已逐像素核对 alpha 与生成原图一致；背景转换为 WebP。运行素材合计约 3.06 MiB。这些 AI 生成图不标作 Poly Haven 或 CC0 下载素材。

飘浮的三张像素纸面由 `BattlePaperMask.vue` 绘制，舞台圆台、状态框、出招位移、伤害飘字和纸面掉落由本作界面代码制作。正式剧情的专属对话立绘继续使用人物谱中的原有文件。


## 场景与战斗配乐（2026-10-31 接入）

音乐作者：PeriTune / むつき醒 (Sei Mutsuki)，https://peritune.com/ 。以下七首均为 2015—2021 年公开的旧作，按 CC BY 4.0（https://creativecommons.org/licenses/by/4.0/）使用。作者当前使用条款 https://peritune.com/about/ 及 2026-03-01 公告 https://peritune.com/blog/2026/03/01/terms-update/ 明确旧作继续保留此许可；本项目未使用 2026 年 3 月之后适用新条款的曲目。

| 原曲 | 本作场景 | 官方来源 |
| --- | --- | --- |
| Chinatown_Healing | 标题、客舍 | https://peritune.com/blog/2017/06/22/chinatown/ |
| Folk_Chinese | 白昼南街 | https://peritune.com/blog/2018/01/14/folk_chinese/ |
| Taohua | 戚家小院、斗法胜利 | https://peritune.com/blog/2021/03/03/taohua/ |
| Shenxian_Drumless | 无面茶楼、王宅 | https://peritune.com/blog/2020/06/05/shenxian/ |
| Wuxia2_Guzheng_Pipa | 县衙、后井、夜间查案、败退 | https://peritune.com/blog/2018/10/13/wuxia2/ |
| Suspense | 序章入夜、第一人称梦境 | https://peritune.com/blog/2015/05/10/suspense1/ |
| Suspense3 | 回合制斗法 | https://peritune.com/blog/2015/08/29/suspense3/ |

五首民乐曲取自作者提供的免费循环版 ZIP，Suspense 与 Suspense3 使用官方免费完整版本。原 OGG / M4A 文件未修改；游戏运行时循环播放、调整音量，并在切景时作 900 毫秒淡入淡出。两首悬疑曲为氛围配乐，不将其标注为中国传统民乐。界面中文曲签由本作命名，不是作者原曲名。

下载包与网页许可证据保存在 `assets-source/music/`；运行文件在 `public/assets/music/`，按需加载 OGG，浏览器不支持时使用 M4A。每个文件的 SHA-256、原下载链接、日期与场景映射见 `docs/music-public-assets.json`。游戏内「配乐」面板和「画外拾遗」提供原曲、作者与许可链接。
