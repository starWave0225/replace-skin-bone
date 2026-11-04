# 公开素材与原典出处

运行时资源均存于本项目，不依赖外部图片或字体 CDN。

## 古画

大都会艺术博物馆各作品页面标记 **Public Domain**，Open Access 图像依 **CC0** 提供。用途包括行图与旧梦演出，画中人物作为场景意象。

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

## 俯视角主地图：Ninja Adventure 公开像素素材（2026-11-03）

作者 **Pixel-Boy / AAA**，来源为作者发布的 [Ninja Adventure Asset Pack](https://pixel-boy.itch.io/ninja-adventure-asset-pack)。作者页面与包内 LICENSE 均注明 **CC0 1.0 Universal**，允许用于商业或非商业游戏。使用 2026-03-29 上传版本，2026-11-03 下载。

探索地图沿用此素材包的地形图块。18 张原始 PNG 包含旧版像素人物，完整原稿保存在 `assets-source/world-pixel/`，本地文件位于 `public/assets/world-pixel/`。完整包校验和、每个文件的原路径、尺寸、SHA-256、旧版角色映射见 `docs/world-pixel-assets.json`；包内许可与致谢为 `public/assets/world-pixel/LICENSE.txt`、`CREDITS.txt`。`scripts/prepare-world-pixel-assets.py` 可离线重建与核验。

旧版人物选型：陆知微使用 SamuraiBlue，沈砚使用 SorcererOrange，周平使用 Samurai，无相之身使用 Spirit；无面娘、戚婆婆、韩七、茶摊老板与井中童影分别使用 Princess、OldWoman、Hunter、OldMan、Child。

地形、树木与家具直接裁切作者图块；瓦面、木材、石路与地板在 Canvas 中降饱和与调明暗。建筑轮廓、庭院、街道和中文匾额由本作重组，保持现有地图的游戏布局。旧井由公开容器轮廓与石质井台组合。参考传统仙侠 RPG 的行图氛围，项目不包含《仙剑奇侠传》原作的角色或地图文件。

## 历史俯视角材质：Poly Haven

以下七套 Poly Haven [CC0 1.0](https://polyhaven.com/license) 纹理用于之前的主地图版本，现保留归档；当前探索地图使用上方的公开像素图块。旧版下载的是官方 Diffuse 贴图，保留 1K 原图与官方 MD5 校验记录；512px WebP 共约 658 KiB。历史重建脚本为 `scripts/prepare-world-assets.py`，作者、下载地址、MD5 与 SHA256 见 `docs/world-public-assets.json`。

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

## 标题插画与封面

横版标题插画 `public/assets/title/painted-skin-title.webp` 与竖版封面 `assets-source/title/painted-skin-cover.png` 均由内置 ImageGen 生成。以用户提供的志怪插画为视觉参考，重新构图，表现一位披着美人皮相的妖物正在案上描眉。生成提示词见 `docs/title-assets.json`。

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

开场使用内置 ImageGen 生成的十张重绘素材，包括檐雨、抵店、廊下、房门、敲门手、垂手、关窗与开窗的东厢、陆知微越肩所见的东厢全景及空白旧谱。以《画皮：借面》横版标题画为风格参考，统一使用木刻墨线、褪色朱砂和旧纸纹理。PNG 原稿位于 `assets-source/opening/ink/`，运行时 WebP 位于 `public/assets/opening/ink/`，敲门手保留透明通道。参考图、归档镜头和完整提示词见 `docs/opening-assets-ink.json`。初版图片及曾用于旧谱的女相保存在 `docs/opening-assets.json` 所列的归档路径。

图像是本作生成素材，不标作公有领域古画或 Poly Haven CC0 资产。当前旧谱片语在 `src/game/opening-book.ts` 中维护，末页诗文在 `src/game/opening-poem.ts` 中独立维护，由 Canvas 排成竖列，均为可替换的衍生占位文案，不作为《聊斋志异》原文引用。门窗开合、雨线、闪电、点击翻页、环境光或手动灯火驱动的暗处显诗、水墨显隐和镜头移动由程序合成；脚步、叩门、风雷、翻页和落水声由 Web Audio 合成。

## 白衣女魂显影

白衣女魂为本作新生成的 AI 角色影像，不属于 Poly Haven 公开资产，也未标为 CC0。使用内置 imagegen 生成 1024×1536 透明 PNG；原稿为 `assets-source/prologue/wronged-spirit-v1.png`，保持原 alpha 通道的运行时文件为 `public/assets/dream/wronged-spirit-v1.webp`。完整提示词、模式和文件来源保存在 `docs/dream-spirit-asset.json`。

角色为衍生故事中的无名冤魂，与《画皮》原著陈氏不是同一人物。场景以透明投影、深度遮挡、缓慢浮动和镜中显影表现，未使用现成第三方女鬼角色模型。

## 版画人物与雨后斗法

内置 ImageGen 以《画皮：借面》横版封面和现有角色立绘为参考，重绘四种主角形貌、六种地图 NPC、两种借面战斗背影、井中怨灵与雨后小院。PNG 原稿位于 `assets-source/characters/ink/`，运行素材位于 `public/assets/characters/ink/`。各图集的角色、方向、步幅、参考图和提示词见 `docs/character-ink-assets.json`。描墨纸面由 `BattlePaperMask.vue` 绘制。

## 归档的像素战斗素材

使用内置 imagegen 为本作生成四张原创像素图：`courtyard-v1` 月下小院、`shen-back-v1` 画师背身、`guard-back-v1` 捕快背身、`spirit-v1` 缠面影真身。战斗采用经典掌机回合制游戏常见的前后站位与底部菜单结构；画面中的人物、妖怪和场景为本作新设计。

原始 PNG 保存在 `assets-source/combat/`，运行 WebP 位于 `public/assets/combat/`，完整提示词、生成方式与文件映射见 `docs/combat-pixel-assets.json`。三个透明角色使用无损 WebP，已逐像素核对 alpha 与生成原图一致；背景转换为 WebP。运行素材合计约 3.06 MiB。这些 AI 生成图不标作 Poly Haven 或 CC0 下载素材。

早期战斗的舞台圆台、状态框、出招位移、伤害飘字和纸面掉落由本作界面代码制作。


## 场景与战斗配乐（2026-10-31 接入）

音乐作者：PeriTune / むつき醒 (Sei Mutsuki)，https://peritune.com/ 。以下七首均为 2015—2021 年公开的旧作，按 CC BY 4.0（https://creativecommons.org/licenses/by/4.0/）使用。作者当前使用条款 https://peritune.com/about/ 及 2026-03-01 公告 https://peritune.com/blog/2026/03/01/terms-update/ 明确旧作继续保留此许可；本项目未使用 2026 年 3 月之后适用新条款的曲目。

| 原曲 | 本作场景 | 官方来源 |
| --- | --- | --- |
| Chinatown_Healing | 客舍 | https://peritune.com/blog/2017/06/22/chinatown/ |
| Folk_Chinese | 白昼南街 | https://peritune.com/blog/2018/01/14/folk_chinese/ |
| Taohua | 戚家小院、斗法胜利 | https://peritune.com/blog/2021/03/03/taohua/ |
| Shenxian_Drumless | 无面茶楼、王宅 | https://peritune.com/blog/2020/06/05/shenxian/ |
| Wuxia2_Guzheng_Pipa | 回合制斗法 | https://peritune.com/blog/2018/10/13/wuxia2/ |
| Suspense | 县衙、后井、夜间查案、败退 | https://peritune.com/blog/2015/05/10/suspense1/ |
| Suspense3 | 标题、梦境试玩 | https://peritune.com/blog/2015/08/29/suspense3/ |

五首民乐曲取自作者提供的免费循环版 ZIP，Suspense 与 Suspense3 使用官方免费完整版本。原 OGG / M4A 文件未修改；游戏运行时循环播放、调整音量，并在切景时作 900 毫秒淡入淡出。两首悬疑曲为氛围配乐，不将其标注为中国传统民乐。界面中文曲签由本作命名，不是作者原曲名。

序章从客舍调查至井边教学战使用本作为此章制作的《井底余声》。低弦和疏落的拨弦由程序合成，48 秒循环，文件为 `public/assets/music/prologue_undersong.ogg` 与同名 M4A。

下载包与网页许可证据保存在 `assets-source/music/`；运行文件在 `public/assets/music/`，按需加载 OGG，浏览器不支持时使用 M4A。每个文件的 SHA-256、原下载链接、日期与场景映射见 `docs/music-public-assets.json`。游戏内「画外拾遗」提供原曲、作者与许可链接；配乐按钮仅提供开关。


## 片头木门与风掀窗扇音效（2026-11-03）

录音来源：[Various Sound Effects](https://opengameart.org/node/143670)，作者 laleksic，依 [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) 使用。原下载包为 https://opengameart.org/sites/default/files/sounds_8.zip 。

- 木门：`door_creak_open.wav` 去除前端静音、放慢至 0.55 倍并调整音量，形成 2.8 秒的旧门轴吱呀声；在门开始打开时触发。
- 窗扇：将 `door_creak_close.wav`、`door_open.wav`、`door_close.wav` 剪辑混合成 1.2 秒的轴响与木框碰撞声，表现风吹开木窗；这些原录音来自门，不将其标作实录窗户。与现有程序风雨声同步播放。

两段均为本地单声道 24kHz PCM16 WAV，包含短淡入淡出；跟随全局声量、静音、演出暂停与切后台，恢复时从当前音效的中途续播。预先解码，载入失败时保留原有合成音效。原始录音及许可页面位于 `assets-source/opening-sfx/`，运行文件位于 `public/assets/opening-sfx/`，剪辑说明与 SHA-256 见 `docs/opening-sfx-assets.json`。

## 未闻县大地图

`public/assets/maps/weiwen-county.webp` 为内置 ImageGen 生成的县城全景。画面以斜俯视的志怪版画呈现已实装的地点，地名和线路由游戏界面叠加。

<details>
<summary>全景生成提示词</summary>

Use case: stylized-concept. Asset type: full-screen illustrated world map backdrop for the Chinese supernatural RPG Painted Skin. Paint a single continuous, geographically legible panorama of an old Chinese county seen from a 45-degree high oblique aerial view, with rooftops, facades, trees and terrain in depth, as if looking down from a mountain. Wide landscape roughly 16:10, all key sites comfortably within the frame. Compose as an original late-imperial Chinese gazetteer landscape with Liaozhai woodblock ink outlines, subtle etched paper texture and painted washes; mist and subdued slate-jade river, charcoal tile roofs, rice-paper beige and muted cinnabar lanterns. A quiet uneasy dusk, legible enough for interactive labels. Layout anchors in percent (left to right x, top to bottom y): foreground west/left a lantern-lit two-storey teahouse at (27,70); a small isolated traveller's inn tucked against low slopes at (15,39) with an adjacent stone well just behind it at (15,23); a broad stone-paved market street, main town hub (53,53); a larger dignified yamen gate compound on the higher central ground (52,25); at right a modest walled family courtyard (76,48), behind it a little round well among trees (79,27). River sweeps from the bottom left past the lower edge of the town towards the right side, crossed by a single central stone arch bridge roughly (43,67). Old lanes and courtyards organically connect the landmarks, with little patches of trees, distant hills and humid fog at edges. Each landmark clearly distinguishable, no cutaway interiors or grid. Full bleed illustration. No writing, signage glyphs, labels, UI, pins, route lines, compass, characters or watermarks.

</details>
