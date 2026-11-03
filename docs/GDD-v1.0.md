# 《画皮：借面》游戏设计文档 GDD v1.0

类型：中式恐怖 · 剧情养成 RPG · 志怪叙事 · 多结局 | 开发方向：单人可实现的浏览器游戏

我建议将《画皮：借面》设计为一款以身份养成为核心、人物关系为驱动、选择与后果为主要玩法的剧情 RPG。

游戏不要求玩家在地图上不断奔跑，也不需要通过打怪升级获得数值。玩家真正需要经营的是自己的身份：借用谁的面容、建立什么关系、如何维持本心，以及愿意为活下去付出什么代价。

整个游戏围绕一个问题展开：

> 世人以貌识人，以心辨善恶。
>
> 可若容貌是借来的，记忆是别人的，心也是偷来的……
>
> 那么，究竟什么才是我？

## 一、产品定位与制作范围

完整游戏

# 5–7 小时

首周目剧情时长目标

第一章 Demo

# 45–60 分钟

含完整章节结局

正式版章节

# 6 章

一条主线，多条人物支线

正式版结局

# 4 个

由行为、人物关系和本心决定

### 核心体验

玩家每一章都应经历四件事：

1. 进入新的身份：通过面皮进入原本不属于自己的生活。
2. 面对新的关系：有人依恋你，有人害怕你，有人想杀你。
3. 付出某种代价：帮助别人、伤害别人、说谎、承认真相，都可能改变自身。
4. 发现身份的真相：逐渐认识自己与那些亡者、王宅及陈氏的关联。

与普通视觉小说最大的差异是：面皮、人格、本心与人际关系均是可成长、可组合、可产生系统性后果的 RPG 机制，而非纯粹的剧情分支。

## 二、世界观与叙事框架

故事发生在康熙年间的虚构县城「未闻县」。

活人与亡者各行其道，但世上存在一种违反阴阳秩序的邪术——借面。

借面者可以用亡者遗存的面皮及执念，暂时获得对方的容貌、部分记忆及生前能力。

但世间没有免费的身份。

每借用一张脸，就可能继承一段债、一份情、一桩罪。

### 三条不能随意打破的世界规则

规则一：面可借，命不可借。

面皮可以伪装容貌、传递记忆，但不能真正复活原主。玩家也不能凭空制造任何想要的身份。

规则二：记忆不等于本人。

玩家拥有书生的记忆，不代表玩家就是书生。NPC 的态度取决于外貌、行为、记忆验证和长期关系，不能仅靠戴脸永久骗过所有人。

规则三：每一桩借面都有因果。

被借面的亡者留下的关系与遗憾不会消失。玩家可以偿还、承担、逃避或转嫁，但不能仅通过刷数值抹除后果。

### 主线真相

延续我们此前的设定：王生死后因陈氏求助异术而复生，随后逐渐失去原本的身份。陈氏为了留住丈夫，最终掌握借面之术，犯下一系列罪行。

玩家是一张由已故画师沈砚的面皮制成、却意外诞生独立意识的画皮。

游戏一开始，玩家已经知道自己并非普通活人。

但不知道自己为何苏醒、为何保有沈砚的记忆，以及自己是否仍受陈氏当年仪式的支配。

这种叙事方式能让玩家从头至尾真正参与“我想成为谁”的选择。

## 三、完整游戏循环

### 时间系统

一个游戏日分成三个时段：

| 时段 | 主要玩法             |
| -- | ---------------- |
| 白昼 | 拜访居民、工作、交易、社会关系  |
| 黄昏 | 重要人物事件、准备仪式、转换身份 |
| 子夜 | 灵异事件、亡魂互动、隐秘剧情   |

玩家每天拥有 3 点行动力，但不强制每个时段只能行动一次。关键剧情事件可锁定发生时段。

章节主线采用软期限：剧情事件会随着时间推进，错过的机会产生后果，但不会因为浪费一天就直接卡死主线。

## 四、角色养成系统

这里必须克制数值规模。

第一版不建议设置等级、经验、金币、体力、灵力、几十条技能树同时成长，否则剧情 RPG 会迅速变成数值管理游戏。

我建议只保留三个主要维度：

| 数值 | 范围          | 用途                 |
| -- | ----------- | ------------------ |
| 本心 | 0–100       | 抵抗记忆侵蚀，解锁自主表达与身份结局 |
| 业债 | 0–100       | 反映因果牵连，触发阴司追索与邪术选项 |
| 面契 | 0–100 / 每张脸 | 表示玩家对某张面皮的记忆与使用熟练度 |

本心不是善良值，业债也不是邪恶值。

例如，承认自己不是某位老妇的儿子，可能会伤害她，但提升本心；为了保护一个无辜者而借用他人身份，也可能产生业债。

### 面皮成长

面皮不通过战斗经验升级，而通过承担其原有身份的关系、完成相关任务、探索其生前记忆来成长。

[Tang Li AI Character - Posts | RolePlai](https://images.openai.com/static-rsc-4/tommvMvClyv-WGdOUsMdPKk4za6069f6vETBs8P5OucYYsgz48iYlVPfSZ187Ydi395WacpMifphuHwWSmSteY_1ZOsds1sutYXY_v5HklkOKVta7X55cyc2sMgNtYXveOF58Zbw0ZXdEdw4Sf0GkEGHdUEK9zWyDd1oe_0sbmM?purpose=inline)

沈砚之面 · 初始

身份：已故画师

专长：观察、绘像、识别面貌差异。

面契阶段：

- 0–24：借用容貌
- 25–59：获得部分记忆
- 60–84：解锁特殊身份交涉
- 85–100：触发原主生前真相

高面契不会必然抹除本心，但会开放更强的原主记忆影响事件。

### 人物关系

每个重要 NPC 具有两种不同的状态：

- 羁绊值：对玩家当前展现的身份的感情，范围 -100 至 100。
- 识破阶段：是否发现玩家并非原主，分为未知、起疑、确认、接受或敌对。

例如老妇对“儿子”的羁绊可以达到 90，但一旦知道玩家是画皮，她是否接受玩家，取决于前面的行动，而不是羁绊高就自动原谅。

这使人物关系更复杂，也更符合《聊斋》主题。

## 五、玩家界面设计

我建议采用 场景立绘 + 角色半身像 + 对话框 + RPG 功能面板 的组合。

[Steam 社区 :: 哀鸿：城破十日记](https://images.openai.com/static-rsc-4/9-saK6lAIaTeuuea9WUT4qzMLbmOkB7sH7j9-fdvX0e0d3bseCgStHUhgz9hWPb_ZXgFIBYaAlu2D_4QU4cVar1TTCup_ii1newuly1U6vb6qS2ZxxLCTwOvrKAPvLS5uAPKKAA6kPS7D1T7QGueO6_YSjL0f3xGLVJY7hzDM6U?purpose=inline)

[steamcommunity.com](https://steamcommunity.com/app/3220060/?curator_clanid=4777282\&l=schinese\&utm_source=chatgpt.com)

主界面需要六个核心入口：地图、行囊、面谱、人物、因果录、休息。

其中，因果录是本游戏区别于普通视觉小说的重要功能。

它会记录玩家做过的重要选择，但不会直接显示“好感+5”“业债+10”这样的破坏沉浸感的数值提示。

例如：

### 因果录

第一章 · 借皮入世

一桩旧认

戚婆婆以你为子，你未加否认。

有些谎言一旦说出口，便不再由说谎的人决定何时结束。

借来的姓名

你接受了“沈砚”这个名字。

名字可以借，名字之下的债却未必肯认新的主人。

夜半井声

你曾听见井下有人呼唤，却不知那声音为何与你如此相似。

该事件尚未了结。

玩家可以通过因果录回看自己的行为及相关故事，不需要反复翻阅对话历史。

# 六、第一章完整设计：《借皮入世》

[There are two people walking down the street with umbrellas - SeaArt AI](https://images.openai.com/static-rsc-4/EQouFzHlyRXTNBmJfhG8F3LxXVVsD-wMFSfHdRpdjYFsghpgajt24kqtTvXIqEOzeXXyaqrnDYBBlKQxyDao6plBm4iVy40YRBs5p202hWOz_Oj3IO6rPL9ao6n8C8_zAhdH2n5sLR1YFbkmXqboVVbYj7WGPqZGVCUyavjyAiI?purpose=inline)

[seaart.ai](https://www.seaart.ai/explore/detail/ciaadch4msbfb9pf6g2g?utm_source=chatgpt.com)

章节时长：45–60 分钟 · 游戏内时间：三日两夜 · 主要场景：5 个 · 可获得面皮：2 张

## 6.1 第一章的核心悬念

玩家刚刚获得一张画师的面皮，来到未闻县，希望找到与自身来历有关的线索。

入城不久，一个老妇人却突然抓住他的衣袖，唤他：

> “阿砚，你总算回来了。”

从这一刻起，玩家面对的不是一个简单的身份伪装问题。

他必须决定，是否有资格回应一个母亲对死去儿子的呼唤。

本章要完成三个目标：

- 教会玩家如何借面、对话、行动与建立人物关系。
- 用一桩具体的人物悲剧，让玩家体验身份选择的代价。
- 留下能够引向王宅主线的悬念。

## 6.2 第一章主要人物

[Anime character with white hair and blue eyes sitting in a doorway - SeaArt AI](https://images.openai.com/static-rsc-4/lP4jy9Cws0IEOtiaCklEi0C-lYb76W6HMi-zBa40tZmaPRH4UUWeDYpYDlKCq0oqYZU3xi3LTkhYNQcv-Ytig3d49iJfa7uWtBMvqrYvzdzypZMrd3_UffysZ3I33PcL-Pf7NOiVRju4ZBOu9YNjUfblK5rJdYY7Ne1spKI0ZK8?purpose=inline)

戚婆婆 · 六十一岁

沈砚的养母，居住在未闻县南街。

她始终相信失踪的儿子还活着，日日在门前留一盏灯。

角色矛盾： 她究竟是真的认不出自己的儿子，还是宁愿接受一个假的儿子？

[橙光第一锦衣卫-第一锦衣卫金手指晟晨-刷机之家](https://images.openai.com/static-rsc-4/gHRoajj2wEsEa1uZVv4gYQaHGj0ykx61eh1yvABgLNHUnUXi5kQ6u3ClsUNAspJUvjSF1qZvAaJv9elDlbWrzyTM4B-bzXPXsEWfzvMebSVAPsYNhwuinAE2ixyUv0Eu8dc9fGMse9sBFl1KL_rdjFjdgu381vglZdvZd4xzCKg?purpose=inline)

韩七 · 三十四岁

县衙捕快，曾负责沈砚失踪案。

他知道一些沈砚不为人知的秘密，怀疑玩家是冒名顶替的骗子。

角色矛盾： 他究竟是在追查真相，还是在掩盖过去的过失？

[夜叉 — 面の下に残る火｜Kaki](https://images.openai.com/static-rsc-4/Os_r0-JTLJXJEtDl_kKgyjwjSXd_o4XcldCHoVmmjXSL6f0ozyo5kZa7Q83D5mAlZFzeYsPZC7_sf1IZUCAr8RnL_phxSbMxt-J1mnaiFwmPP0FTlHlfNmloNsPrHsVCp849ZYY09jT24gUql_8Fx5on6onvx50kYqrDqktSjFQ?purpose=inline)

无面娘 · 年岁不详

无面戏楼的主人，也是让玩家苏醒的人。

她可以提供关于画皮的知识，但绝不会无偿回答问题。

角色矛盾： 她似乎希望玩家找到真相，却又在阻止玩家过早返回王宅。

[九色](https://images.openai.com/static-rsc-4/bLi9s-Hke8p02GjS1Koh5xnKe_o9dHTqjOtWQFAIXj7uS9gd-cMIgeBNow_HCuNNxMq_Ko404YAtKQmPdXnG4QCqYIp_Jeeb6HZPCNKWOkGy0A12uxqIA1XaEvsadnXULwIdA5OPNugR9FU6Pe1ab-IgYSCAgy-x-OUYTTGi2z0?purpose=inline)

井中童影 · 身份未知

子夜出现在戚家后院的井边。

它声称自己见过真正的沈砚，也知道玩家来到未闻县的原因。

角色矛盾： 它并非要杀玩家，而是希望玩家替它完成某件事。

## 6.3 第一章场景

[ENEMY短剧爆火，50亿播放只有2392元收入？ - 老范讲故事｜AI、大模型与商业世界的故事](https://images.openai.com/static-rsc-4/ZaFbwJLfOw39RawlNUksSQiZDmILmzQxOiYegNPlwdO4QQCThqPynhMHAuXda-kmassEIZHPE59HwR_qoUWxbM2nOiL-s0YBTd24zetZHUL5jGXe95d13AXmdOg5bEEDAVu4MYJqZv8sXZn-OSQFiBZ1f0GUXziXoQPSwqNC7HY?purpose=inline)

场景 A：无面戏楼

教学场景。领取面皮、学习身份切换、认识无面娘。

[Old town china lantern street | Free Photo  - rawpixel](https://images.openai.com/static-rsc-4/LOqy-utyecqi_dF7HpVZGLp3F7x_xbcOd_IfSsyOhPWAPqcYD3WGzEpBHpLDOVyqbc5vLTVyUXizIggTHq9pZk1bYCvN0U7sQ2xuV-gQ_B3sMFJ-_QZHP4YKfyxCYkhuAsRxl2ora-PHaLPv3wMSp7zOxWVn9xQuqNpaNHeboYU?purpose=inline)

场景 B：未闻县南街

主要行动枢纽。可遇见戚婆婆、韩七、茶摊老板。

[古人为何用“椿萱”两种植物来指代父母？背后的愿景每个人都追求_百科TA说](https://images.openai.com/static-rsc-4/zNb2rDQjpHS2ASwLT2bTATa3gxpfqJfusBPeyZcp4-Y_8pKG0yZc1iSXEiOcG6VV769R92miLy5PIMPL5YlcuWz8IfSRqaBr-S696-V2jTyyvNARk7Jvi47Srf1PHFNZ1gQGlQDW8nRTSzNtfrgNLC5SifTZIRkjCuxkuxFfZ7w?purpose=inline)

场景 C：戚家小院

本章情感中心。存在大量与母子关系有关的细节。

[画像ギャラリー | PC版 烽火と炊煙](https://images.openai.com/static-rsc-4/9HkgEwRztBaDWXASqf8nfhLdPf6ab9lGQtBsIaC7hZUFC0c0c8WcF-4QZvRjZOBelqV2d6hZUGk59zJzK0beRnXv83nOLMoGhFFb814icB2OKAJEgEfCnuqvW5ZhqXnq7hQEcLOpqbleUVKb6wNvmVwdBob7azaOaBANwQbL7Wo?purpose=inline)

场景 D：县衙值房

韩七事件与捕快面皮获取场所。

[Chinese Folk Horror Cinematic Stills Gemini Image Prompt | PromptBase](https://images.openai.com/static-rsc-4/26WSwUWKo97Jv4uDMIBbgLZw0FSqEg3Uw2pHYV2_fHYRICiJp-Z78PXl8uqRHgzECgzlJigbfW5p3ZScswA5qjSMNy_CS9UJklcZS2xU4WNPO1vse3rfuesOf2fjz8fue6nT8jXC6hz1MQLCppqnLGMKASKVEeSd87wH9UrWe_I?purpose=inline)

场景 E：戚家后井

章末事件所在地，发生第一次真正的超自然冲突。

## 6.4 第一章事件流程

### 章节事件流程图

E03 是可变顺序的自由行动区，E04 与 E05 的对白由玩家此前行为决定。

## 七、第一章逐场剧本与交互

### E01：无面戏楼（开场，约 8 分钟）

[The Painted Skin: A Chinese Folktale | by The Wandering Storyteller | Mythology Journal | Mar, 2026 | Medium](https://images.openai.com/static-rsc-4/GOK9bSQxdmPdBf0B6If4rdWWoCT_MZ1jF3OqT0wAqniV8_y1ZacjDf95_PFXoDPSZ9-LWJYq0EE_xI_5WUkhhi8FrCST3GtVaz_Hlr96emPC3TJsg0VP-cDRwzVDPQEgFI0-zEb35cU4GqR2R5Vok6T2jWXa89ksZG9W7Jkpdxc?purpose=inline)

[medium.com](https://medium.com/mythology-journal/the-painted-skin-a-chinese-folktale-e2ebba2e724f?utm_source=chatgpt.com)

画面全黑。

先传来剪刀裁纸的声音，接着是女人缓慢的哼唱。

屏幕中央出现一句文字：

> 人死留骨，鬼死留名。
>
> 倘若连姓名都不曾有过，又该往何处去？

玩家睁开眼睛。

一排排白色面皮吊在房梁上，灯火摇曳，每一张皮都像在凝视玩家。

无面娘站在梳妆台前。

无面娘：

“醒了？”

“别急着说话。你现在这副模样，连嘴也没有。”

“想入人间，就得先借张脸。”

桌上放着两样东西：一面铜镜、一张青年画师的面皮。

第一次互动：选择是否戴上沈砚的脸。

玩家可以先检查铜镜、面皮、房间，也可以直接选择佩戴。暂时无法离开戏楼，直到佩戴成功。

戴上之后，界面首次出现角色名：

沈砚（？）

无面娘告诫：

“记住，这张脸叫沈砚，可你不叫沈砚。”

随后玩家获得第一张面皮。

道具获得：沈砚之面

面契 10 / 100 · 解锁「辨相」：在重要对话中辨认对方细微表情，发现隐藏交涉提示。

任务更新：借皮入世

前往未闻县，寻找沈砚留下的生前痕迹。

这里有一个隐藏的设计：玩家第一次在镜中看见沈砚的脸时，背景里会出现一幅模糊的女人画像。

这个细节暂时不会解释，直到第三章才会知道，那是陈氏曾经为沈砚绘制的遗容。

### E02：南街认亲（约 8 分钟）

[《剑来》：萧愻叛变是给陈平安让路，杜懋飞升是烽火一时笔误_天幕_长城_天下](https://images.openai.com/static-rsc-4/I6b8Vf4cNLPlxhtc4hP0WlQovwobRFSnwhj9Wq75Lciod399FyvNEmGVUcTyJAJw_fEGIZutYWn1-_AaThflJHpZYk3uUYX0_lsWHgyCvhu7yA9KmMXuJHbfdwh55t9BY8OK2VVfLHmT7v5DNE2bfWUwSOibYEY_qPHEKhxV-D0?purpose=inline)

[sohu.com](https://www.sohu.com/a/562588577_100263688?utm_source=chatgpt.com)

玩家来到未闻县南街。

突然，身后一位老妇人打翻了菜篮。

“阿砚？”

“阿砚……是你么？”

老妇人抓住玩家的衣袖，手掌不住地颤抖。

“娘找了你好久。”

这是本章第一个重大抉择。

剧情选择体验

E02

「娘，我回来了。」

承认身份

「婆婆，您认错人了。」

否认身份

「您认识这张脸？」

询问来历

对应剧情反馈

戚婆婆哭着将你拥入怀中。你获得戚家的信任与住处，但从此必须面对一个母亲对儿子的期待。

羁绊 +20 · 本心 -5 · 面契 +10 · 埋下身份债

选择影响后续的行动入口与对话，数值在正式游戏中隐藏。

三个选项都能进入接下来的主线，但玩法与人物关系不同。

| 选择   | 立即获得      | 后续影响               |
| ---- | --------- | ------------------ |
| 承认身份 | 免费住处、戚家信任 | 戚婆婆对你产生更强的情感依赖     |
| 否认身份 | 童年记忆线索    | 需要其他方法进入戚家，较容易坦诚相告 |
| 询问来历 | 记忆与身世入口   | 戚婆婆更早察觉异常，但愿意提供线索  |

重要：不要设计一个明显的正确答案。

如果承认身份就一定是坏结局，玩家很快就会发现游戏其实在进行道德考试。

好的剧情 RPG 应当让玩家能够理解每一种选择的动机，并真正承担后果。

### E03：三日里的调查与养成（约 15–20 分钟）

进入这一阶段后，游戏开放有限自由行动。

玩家需要在白昼、黄昏与子夜之间安排活动。

未闻县行动日程

三日两夜

初一初二初三

白昼

拜访戚家 / 打听沈砚

调查、交涉及身份养成

黄昏

县衙调查 / 与韩七接触

人物交流与支线选择

子夜

观察井边异常

灵异事件及夜间探索

这是剧情排期示意；实际游戏的非强制活动允许玩家自由调整顺序，表格中的日期不代表必须当天完成。

在这一阶段，设计六个可选事件：

| 事件      | 行动成本 | 剧情 / 养成收益     |
| ------- | ---- | ------------- |
| 陪戚婆婆吃饭  | 1    | 羁绊提升，获得童年线索   |
| 整理沈砚遗物  | 1    | 面契提升，解锁画技     |
| 在茶摊打听往事 | 1    | 获得韩七与沈砚的矛盾    |
| 前往县衙打探  | 1    | 推进失踪案及捕快支线    |
| 夜访戏楼    | 1    | 向无面娘求助，支付一份记忆 |
| 后井守夜    | 1    | 发现井中童影的活动规律   |

玩家最多只能体验其中一部分，需要选择自己更相信谁、愿意付出什么。

但关键证据应该存在多种获取方式，以免遗漏支线就无法推进主线。

例如，不论玩家是否去县衙，都能在子夜事件前得知沈砚的死亡线索；主动调查的好处是获得更多信息、更有利的交涉选择，而不是避免剧情卡死。

### E04：井中童影（约 10–12 分钟）

[鬼市传说](https://images.openai.com/static-rsc-4/pArfzbQic08oAz0NAEuNJt-cVwnqpYqelv5Wac26xOSc8VZSSW5bbKkbRA1A0nnHChejaJQSkprs1OoNVKkP3hDyn-bGb0s-M61RhBZ7WPa0TZGJ-XblWvXlHVrafqZ1GPwAMrQNVOZ_0hc6SCcH8FTg3lSRvz4Of4RNqQQd8nM?purpose=inline)

[xcfstudio.com](https://xcfstudio.com/blog/article/608?utm_source=chatgpt.com)

本章高潮发生在第三日子夜。

玩家听到戚家后院传来儿童的哭声。

来到井旁时，井中传来一句话：

> “哥哥，你把我的脸还给我，好不好？”

玩家低头看去。

井中倒映出的不是自己的脸，而是一个年幼的孩子。

孩子说：

“你明明答应过我，等天亮就带我回家。”

但玩家根本不认识它。

根据玩家此前的养成与调查，系统开放不同的解决方式。

方式 A：以情动人

需要获得足够的童年记忆线索。

玩家发现童影实际上是沈砚生前救助过的孩子所留下的残念。孩子一直等着沈砚履行承诺。

玩家可以代替沈砚完成这件事，也可以告诉它真正的沈砚已经死去。

方式 B：以术安魂

需要提前向无面娘学习安魂之法。

能够将童影暂时安置，不需要立即解决其执念，但会产生新的因果义务。

方式 C：以面欺魂

使用沈砚的记忆与外貌，让童影相信玩家就是真正的沈砚。

这种方式最容易完成眼前的事件，却可能使童影对玩家产生无法消解的依附。

三条路径都能让玩家取得第一章所需的旧画卷，但会改变第二章能否重新遇见童影，以及它是否愿意帮助玩家。

这里不是传统 Boss 战。

Boss 本身就是一段尚未被完成的承诺。

### E05：归还亡者之名（约 8–10 分钟）

最后，玩家将带着井边发现的旧画卷回到戚婆婆面前。

画卷里是一个正在微笑的青年。

画背有两行字：

> 养母戚氏，待我如亲。
>
> 若此去不归，愿有人替我照顾她。

玩家终于明白，自己借用的不只是一个画师的脸，也是一个母亲最后的念想。

戚婆婆问：

“阿砚，你这次还走吗？”

玩家面对本章最后的关键选择：

1. 留下陪伴：暂时继续扮演沈砚，承担照顾戚婆婆的责任。
2. 坦言真相：告知自己并非她的儿子，但愿意以自己的身份继续帮助她。
3. 不辞而别：不再介入沈砚的旧日关系，转身离开未闻县南街。

三种选择都会进入第二章，但人物状态不同。

如果玩家选择坦言真相，并且此前建立了足够信任，戚婆婆可以出现一段特殊对白：

> “我知道。”
>
> “他从前吃饭，总要把姜挑出来。”
>
> “你第一次来，就把姜全吃了。”
>
> “我老了，眼睛不好，可我自己的儿子，我怎么会认不出来。”
>
> “只是那天看见你站在街口，我想着……”
>
> “哪怕是假的，让我再叫他一声，也好。”

这段话会直接呼应游戏的主题。

有时候，人并不是看不穿一张假面，而是宁愿不知道面具下面的真相。

章末画面切至王宅。

一名女子正对着铜镜，将一张新的人皮缓缓贴在脸上。

镜中的女人轻声说道：

“他终于回来了。”

第一章结束。

# 八、第一章事件数据与判定规则

前面的剧情是给玩家体验的，下面这部分则面向实际开发。

我建议不要让数值直接控制剧情的善恶，而是让它控制玩家能够做什么、说什么，以及 NPC 愿意相信什么。

## 8.1 第一章初始状态

| 属性    | 初始值  |
| ----- | ---- |
| 本心    | 50   |
| 业债    | 0    |
| 沈砚面契  | 10   |
| 戚婆婆羁绊 | 0    |
| 韩七羁绊  | -20  |
| 行动力   | 每日 3 |
| 当前面皮  | 沈砚之面 |

关系状态除了数值以外还应拥有事件标记，例如：

`mother_knows_truth` 表示戚婆婆是否明确知晓玩家是画皮。

`mother_accepts_player` 表示她知晓真相后，是否接受玩家以独立身份继续与自己来往。

这两者不能合并：知道真相与接受真相是两件事。

## 8.2 决策影响表

| 事件   | 选项   | 本心      | 业债    | 其他变化      |
| ---- | ---- | ------- | ----- | --------- |
| 南街认亲 | 认作母亲 | -5      | +0    | 戚婆婆羁绊 +20 |
| 南街认亲 | 否认身份 | +10     | +0    | 解锁记忆线索    |
| 南街认亲 | 询问来历 | +0      | +0    | 戚婆婆羁绊 +5  |
| 井中童影 | 完成承诺 | +10     | +0    | 童影安息      |
| 井中童影 | 暂时安魂 | +0      | +5    | 产生未了因果    |
| 井中童影 | 冒认原主 | -10     | +15   | 童影产生依附    |
| 章节终局 | 留下陪伴 | -5 至 +5 | 依前置行为 | 戚家关系延续    |
| 章节终局 | 坦言真相 | +10     | +0    | 可能获得戚婆婆认可 |
| 章节终局 | 不辞而别 | +0      | +0    | 戚家支线暂时关闭  |

上述是第一轮平衡值，后续应通过试玩检验。特别是“留下陪伴”，不应固定扣除本心：如果玩家此前已经坦诚身份，留下来便可能是出于自主选择，而非继续欺骗。

## 8.3 关键分支条件

建议明确设置以下条件：

| 特殊选项       | 触发条件                          |
| ---------- | ----------------------------- |
| 识破韩七的谎言    | `face_shenyan >= 30` 或拿到县衙旧案卷 |
| 井边以情动人     | 获得至少 2 条沈砚与童影的记忆线索            |
| 井边以术安魂     | 已向无面娘学习安魂术                    |
| 井边冒认沈砚     | 佩戴沈砚之面                        |
| 获得戚婆婆的主动认可 | 已坦白身份且信任事件满足                  |
| 解锁捕快之面     | 完成韩七支线，并获得合法的面皮来源             |

最后一条尤其重要：玩家不能通过随意偷走活人面孔获得职业。

按照世界规则，面皮只来自亡者残留，或者特殊术法制作的仿面。第一章的捕快之面可以来自韩七交付的一件旧案遗物——一名已故捕快的面谱。这样既能保留韩七本人作为后续重要 NPC，也不会产生设定冲突。

# 九、把第一章做成真正可玩的产品

## 9.1 剧情数据结构

我建议从一开始就让剧情内容与 UI、游戏逻辑解耦，避免后续所有分支都写在 Vue 组件里。

以下是第一章南街认亲事件的 TypeScript 数据示例。

```
type GameState = {
  day: number;
  time: "day" | "dusk" | "night";
  actionPoints: number;

  selfhood: number;
  karma: number;

  faceBond: Record<string, number>;
  relationships: Record<string, number>;

  inventory: string[];
  flags: Record<string, boolean>;
};

type Choice = {
  id: string;
  text: string;
  condition?: Condition;
  effects: Effect[];
  next: string;
};

type StoryNode = {
  id: string;
  speaker?: string;
  text: string;
  background?: string;
  portrait?: string;
  choices?: Choice[];
  next?: string;
};

type Condition = {
  type: "flag" | "stat" | "item";
  key: string;
  op: "eq" | "gte" | "lte";
  value: string | number | boolean;
};

type Effect = {
  type: "stat" | "flag" | "item";
  key: string;
  amount?: number;
  value?: boolean;
  itemId?: string;
};

const scene: StoryNode[] = [
  {
    id: "ch1_street_001",
    speaker: "戚婆婆",
    text: "阿砚……你总算回来了。",
    background: "south_street_rain",
    portrait: "mother_shocked",
    next: "ch1_street_002"
  },
  {
    id: "ch1_street_002",
    speaker: "旁白",
    text: "老妇紧紧抓住你的衣袖。"
      + " 你并不认识她，却忽然感到一阵熟悉。",
    choices: [
      {
        id: "accept",
        text: "娘，我回来了。",
        effects: [
          { type: "stat", key: "selfhood", amount: -5 },
          { type: "stat", key: "rel_mother", amount: 20 },
          { type: "flag", key: "claimed_son", value: true }
        ],
        next: "ch1_accept_001"
      },
      {
        id: "deny",
        text: "婆婆，您认错人了。",
        effects: [
          { type: "stat", key: "selfhood", amount: 10 },
          { type: "flag", key: "denied_identity", value: true }
        ],
        next: "ch1_deny_001"
      },
      {
        id: "question",
        text: "您认识这张脸？",
        effects: [
          { type: "stat", key: "face_shenyan", amount: 5 },
          { type: "stat", key: "rel_mother", amount: 5 }
        ],
        next: "ch1_question_001"
      }
    ]
  }
];
```

生产实现时还需要：

- 剧情节点 ID 唯一性验证，确保所有 `next` 都指向存在的节点。
- 条件判定引擎，支持 AND / OR / NOT 组合。
- 数值范围保护，避免本心、羁绊超出设计范围。
- 事件效果只执行一次，防止读档或重复点击刷数值。
- 保存剧情节点、状态快照与内容版本号，支持后续更新迁移。

## 9.2 技术架构

Vue 3 + TypeScript + Pinia

游戏 UI、响应式状态、面皮与关系面板

Story Engine

剧情节点、分支、条件、事件效果

RPG Engine

时间、面契、羁绊、物品、因果

Content Layer

JSON / YAML 剧情、角色配置、场景与音效资源

Save Layer · IndexedDB

本地存档、自动存档、剧情历史及版本迁移

第一版完全可以不使用 Phaser。场景由静态背景图、角色立绘、Canvas 特效和 DOM 界面构成即可。

技术难点不在渲染，而在于大量条件分支下的状态一致性。最好先实现一套稳定的剧情引擎，再逐步增加画面效果。

## 9.3 第一章资源清单

| 资源类别   | Demo 目标                |
| ------ | ---------------------- |
| 场景背景   | 5 个主场景，8–10 个时段 / 状态变体 |
| 人物立绘   | 5 位主要角色，约 15 个表情状态     |
| 面皮图像   | 2 张                    |
| 重要道具   | 8–12 件                 |
| 主线剧情节点 | 约 80–120 个             |
| 支线事件   | 6 个                    |
| BGM    | 4–5 首                  |
| 音效     | 约 20 个                 |
| 结局分支   | 3 种章节状态，汇入第二章          |

这些是首轮内容预算，并非必须全部是独立绘制的图片。面皮、立绘、场景光影都可以通过共用图层和局部替换降低资源量。

## 十、开发阶段与验收标准

我建议按照下面四个阶段开发，不要直接从完整六章开始。

阶段

## 01

纯文本可玩原型

实现剧情节点、选项、事件标记、数值变化、日程推进和存档。

验收标准：不依赖美术，第一章能够从头通关，主要选择均有可观察后果。

阶段

## 02

核心 RPG 系统

实现面皮切换、面契成长、NPC 羁绊和识破阶段、因果录、行动安排。

验收标准：不同面皮和不同前置选择能够实际改变事件入口与可用选项。

阶段

## 03

视听与恐怖氛围

补充立绘、场景、音效、音乐、画皮换脸动画和夜间异化效果。

验收标准：不依赖跳脸惊吓，依靠画面异常、音效和叙事建立恐怖感。

阶段

## 04

测试、平衡与发布

重点测试三类玩家：偏剧情、偏养成、偏收集。

验收标准：没有必然死档、错误分支锁死或无限刷取属性的问题；玩家能够理解自己为何获得某个结局。

## 十一、需要提前解决的叙事问题

我觉得这部作品能否成功，关键不是系统有多少，而是下面四点。

第一，别把面皮做成普通的换装系统。 每张面皮都必须有原主的人生、未了的事情、专属人物关系。面契成长应该意味着越来越了解一个人，而不是单纯获得更高攻击力。

第二，不要让本心成为玩家的道德成绩单。 玩家可以选择欺骗，但欺骗也可能出于善意；坦诚可能保护自己的身份，也可能残忍地伤害别人。关键是行为和后果，而不是替玩家判定对错。

第三，恐怖与温情需要交替。 如果每个场景都阴森、每个 NPC 都诡异，玩家很快会失去恐惧感。戚婆婆做的一碗面、县城的烟火气、普通居民的生活，恰恰会让夜晚的异常更加可怕。

第四，要把主线时间逻辑锁定。 当前设定中，陈氏与王生已经在王宅灭门夜死亡。因此第一章结尾出现的镜前女子应当是王宅留下的执念残影，而非一个仍然活着的陈氏。这个规则应提前写入编剧设定，不能到后期再依靠反转解释。

正式制作时，第一章建议统一为三个日程日、第三日子夜结束，避免“三日两夜”与最终夜间事件出现时间矛盾。

## 十二、这款游戏最值得坚持的特色

我认为《画皮：借面》应该有一个其他剧情 RPG 很少做到的体验：

玩家能否成为一个人，并不是由系统给他安排身份，而是由他如何对待与这个身份相关的人来决定。

比如第一章，玩家明明知道自己不是戚婆婆的儿子。

但玩家可以陪她吃饭，帮她修屋顶，为她买药，在夜里听她讲沈砚小时候的故事。

等到第三章，真正的沈砚的亡魂可能终于出现。

这时玩家要面对的，不是“谁才是真正的儿子”这么简单的问题。

而是：

血肉、记忆、姓名，以及共同度过的日子，究竟哪一样更能定义一个人？

这才是我希望从《聊斋志异》中保留下来的东西——披着鬼怪的外衣，却始终在谈人间。

### 下一步制作的优先事项

这份 GDD 已经能够确定玩法方向，但距离正式开发还缺少三个可执行资产：第一章逐节点对话剧本、全量事件状态表、以及首页和剧情界面的高保真原型。

我的建议是先做第一章 E01「无面戏楼」至 E02「南街认亲」的 10–15 分钟完整可玩版本，验证面皮交互、人物情感与选择反馈，再继续扩充自由行动阶段。

这会比先画完整地图、制作大量角色立绘，更快验证游戏到底好不好玩。
