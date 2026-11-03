import type { Effect, Location, StoryNode } from './types'
import { classics } from './classics'
import { getDialoguePortrait } from './portraits'
const original = (id: string) => classics.find(p => p.id === id)!.text

const content: StoryNode[] = []
type Line = string | [string, string]
function sequence(id: string, location: Location, lines: Line[], next?: string, effects?: Effect[], portrait?: StoryNode['portrait']) {
  // Keep the interlocutor on stage through narration within this sequence only.
  // Seed leading narration from the first character, so restoring a save is deterministic.
  let portraitSpeaker = lines.find((line): line is [string, string] => Array.isArray(line) && !!getDialoguePortrait(line[0]))?.[0]
  lines.forEach((line, index) => {
    const speaker = Array.isArray(line) ? line[0] : '旁白'
    if (getDialoguePortrait(speaker)) portraitSpeaker = speaker
    content.push({
      id: `${id}_${index + 1}`, location, speaker,
      text: Array.isArray(line) ? line[1] : line, portrait, portraitSpeaker,
      next: index < lines.length - 1 ? `${id}_${index + 2}` : next,
      effects: index === 0 ? effects : undefined,
    })
  })
}
const add = (node: StoryNode) => content.push(node)

sequence('opening', 'theatre', [
  ['原典 · 异史氏曰', original('judgment')],
  '西街尽处，一间茶楼半掩着门。没有招幌，门槛却与你梦中所见一模一样。\n你报出自己的姓名：陆知微。有人在帘后应了一声。',
  '茶已斟好，席上却没有别的客人。帘后挂着几张未绘完的相貌，像还未署名的画。\n你没有伸手。来这里，是为许文卿的那桩案子。',
  ['无面娘', '梦里的路，寻到了？\n陆知微，你要问的，是许文卿最后见过的人。'],
  ['无面娘', '城中画师沈砚，也曾替王宅描过相。如今他人已不在，有些门，却还认得他的脸。\n要追许文卿留下的旧谱，先听明白这张相的来处。'],
], 'dressing', undefined, 'mask')
add({ id: 'dressing', location: 'theatre', speaker: '无面娘', portrait: 'mask', text: '铜镜里是你自己的眉眼，案上是另一个人的相貌。\n她把一盏灯推近：“看清了，再决定借不借。”', choices: [
  { id: 'mirror', text: '先看一眼铜镜', next: 'mirror_1', effects: [{ flag: 'seen_mirror' }] },
  { id: 'skin', text: '触碰画师的面皮', next: 'touch_1' },
  { id: 'room', text: '环顾这间茶楼', next: 'room_1' },
  { id: 'wear', text: '将沈砚之面覆在脸上', note: '借面入世', next: 'wear_1', effects: [{ item: 'mirror' }, { item: 'face_shen' }, { journal: 'awakening' }, { flag: 'wearing_first_face' }] },
] })
sequence('mirror', 'theatre', [
  ['原典残影 · 窥窗见鬼', original('window')],
  '镜中仍是陆知微：赶路留下的倦色，眉下那颗从小便有的小痣。\n你把镜子转向案上的薄相，两张不同的脸，一同落在镜里。',
  '镜后，一幅女人的旧画倒映在灯影里。还未看清，无面娘便将镜子转了过去。',
  ['无面娘', '别看太久。\n有些东西，你看见它，它也就记住你了。'],
], 'dressing')
sequence('touch', 'theatre', [
  '面皮微凉，薄得像一页旧信。指尖碰到它时，一股墨香忽然钻进你的记忆。\n有人在雨里喊你的名字。你却不知道那是谁。',
  ['无面娘', '这张相留着亡者的笔意与记忆。\n覆上去，你可以借他的容貌与本领。摘下来，仍须以自己的姓名，承担做过的事。'],
  ['无面娘', '容貌能借，命不能借。\n记忆也不是你。记牢了。'],
], 'dressing')
sequence('room', 'theatre', [
  '帘后没有戏台。只有一张空椅，一把断弦的琴，和许多叫不出名字的脸。\n门外有雨。门槛上没有任何人的足印。',
  ['无面娘', '这里是无面茶楼。来的人，都少一样东西。\n你少的是什么，得自己去找。'],
], 'dressing')
sequence('wear', 'theatre', [
  ['原典残影 · 举皮化形', original('wear')],
  '薄相贴住你的额头。眉眼一点点陌生，呼吸却仍是你自己的。\n铜镜里，画师沈砚抬起头；你知道，抬头的人是陆知微。',
  ['无面娘', '须记：你名陆知微，所借之相，名沈砚。\n相能助你过门，却不能替你偿事。'],
  '你试着弯起手指。脑海里浮出握笔的姿势，还有一扇门、一盏灯、一句未说完的话。\n面谱已开启。「辨相」能让你察觉别人脸上一闪而过的迟疑。',
  ['无面娘', '去未闻县南街。找找这张脸留下的痕迹。\n至于王宅……天亮以前，别往那里去。'],
], 'street_1')
sequence('street', 'street', [
  '黄昏的南街，雨还没有停。卖茶的拢起火炉，挑担的踏过青石板。\n你以另一个人的容貌走回街上。暂时没有人认出你。',
  '一只菜篮忽然滚到脚边。青菜散了一地。\n身后传来一声极轻的呼唤。',
  ['戚婆婆', '阿砚？\n阿砚……是你么？'],
  '老妇抓住你的衣袖。她的手掌布满细小的裂口，抖得很厉害。\n你不认识她，身体里却升起一阵不属于你的酸楚。',
  ['戚婆婆', '娘找了你好久。\n你怎么……连封信也不捎回来。'],
], 'recognition')
add({ id: 'recognition', location: 'street', speaker: '你 · 沈砚之面', text: '这一声“娘”，落在一个并非她儿子的人身上。\n你准备如何回应？', choices: [
  { id: 'accept', text: '娘，我回来了。', note: '接下这个身份，也接下她的等候', next: 'accept_1', effects: [{ stat: 'selfhood', add: -5 }, { stat: 'mother', add: 20 }, { stat: 'shen', add: 10 }, { flag: 'claimed_son' }, { journal: 'accept' }] },
  { id: 'deny', text: '婆婆，您认错人了。', note: '说出此刻的真话', next: 'deny_1', effects: [{ stat: 'selfhood', add: 10 }, { flag: 'denied_identity' }, { flag: 'mother_suspicious' }, { clue: 'childhood' }, { journal: 'deny' }] },
  { id: 'question', text: '您认识这张脸？', note: '先问一问这张脸的来历', next: 'question_1', effects: [{ stat: 'mother', add: 5 }, { stat: 'shen', add: 5 }, { flag: 'mother_suspicious' }, { journal: 'question' }] },
] })
sequence('accept', 'street', [
  '戚婆婆将你拥进怀里。她的肩膀很瘦。\n你听见自己说出“娘”字，那声音熟悉得让你害怕。',
  ['戚婆婆', '回来就好。回来就好。\n灶上的水一直温着，娘给你做面。'],
  '街角的捕快停下脚步。他没有走近，只用拇指缓缓摩挲着刀柄。',
], 'arrival_1', [{ flag: 'home_invited' }])
sequence('deny', 'street', [
  '她的手松开了一点。眼里的光却没有立刻熄灭。',
  ['戚婆婆', '是么……是娘眼花了。\n我家阿砚小时候怕黑，走这条街，总牵着我的衣袖。'],
  ['戚婆婆', '你若没有去处，也来坐坐吧。\n我住南街尽头。门前挂着灯，很好找。'],
], 'arrival_1', [{ flag: 'home_invited' }])
sequence('question', 'street', [
  '她望着你，像望着一扇开了又关的门。',
  ['戚婆婆', '认得。怎么不认得。\n我替他擦了二十多年的脸……你说我认不认得。'],
  ['戚婆婆', '你想知道他的事，就来家里。\n雨大，别站着了。'],
], 'arrival_1', [{ flag: 'home_invited' }])
sequence('arrival', 'street', [
  ['韩七', '沈画师。三年不见，倒像从来没离开过。\n我在县衙等你。有些旧事，总要讲清楚。'],
  '天色沉下来。戚家门前亮起一盏小灯。\n一张脸把你带进了未闻县，却还没有告诉你，该相信谁。',
], 'arrival_end', [{ flag: 'met_han' }, { flag: 'met_mother' }])
add({ id: 'arrival_end', location: 'street', speaker: '行旅提示', text: '三日之间，你可以拜访、调查，或静待天明。\n每次调查占用一个时段与一点行动。第三日黄昏，旧事将找上门来。\n关键线索有不同来路，未查遍旧事，也能继续前行。', end: 'hub' })

sequence('meal', 'home', [
  '灶上煮着面。戚婆婆把最大的那只碗推到你面前，碗边磕掉了一小块。\n“这个缺口，还是你小时候摔的。”',
  ['戚婆婆', '阿砚从前怕黑。后来自己怕着，却还要提灯去找别人。\n有个叫小满的孩子，总跟在他身后。'],
  '面汤里浮着姜片。你吃了一口。\n她正添柴的手忽然停住，又很快低下头去。',
], 'meal_choice', [{ clue: 'childhood' }, { clue: 'child_name' }, { journal: 'meal' }, { stat: 'mother', add: 12 }, { flag: 'trust_meal' }])
add({ id: 'meal_choice', location: 'home', speaker: '你', text: '她没有问你这些年去了哪里。\n只有炉火噼啪作响。', choices: [
  { id: 'care', text: '陪她吃完，再把灶旁的柴劈好。', next: 'meal_care_1', effects: [{ stat: 'mother', add: 8 }, { stat: 'shen', add: 10 }, { flag: 'helped_mother' }] },
  { id: 'honest', text: '婆婆，我有这张脸，却不是沈砚。', next: 'meal_honest_1', effects: [{ stat: 'selfhood', add: 10 }, { flag: 'mother_knows_truth' }, { journal: 'honest' }, { stat: 'mother', add: 4 }] },
] })
sequence('meal_care', 'home', [
  '你把柴码在不漏雨的地方。戚婆婆坐在门边，慢慢说起沈砚画坏的第一幅画。\n你听着，仿佛也分到了一小段真实的日子。',
  ['戚婆婆', '吃饱了，就把灯带上。\n夜里路滑。别像从前，只顾着别人。'],
], 'activity_end', [{ item: 'lantern' }])
sequence('meal_honest', 'home', [
  '柴火爆出一声轻响。她望了望你的碗，许久才点点头。',
  ['戚婆婆', '那……这碗面，也吃完吧。\n你总归也走了很远的路。'],
  '她没有赶你离开，也没有再叫你阿砚。\n那声称呼停在她唇边，像一盏被手掌护住的火。',
], 'activity_end', [{ item: 'lantern' }])

sequence('relic', 'home', [
  '床底的木匣并未上锁。几支秃笔、一小块青墨，还有一叠被反复翻看的画。\n你一碰笔杆，指间便生出熟悉的力道。',
  '一幅未完的画上，青年牵着一个孩子。路的尽头，两株槐树长在一起。\n画角写着：小满，等天亮。',
  '记忆忽然涌上来。大雨，一双赤着的脚，一个孩子把脸埋进你的衣襟。\n“哥哥，我家就在双生槐底下。门口有灯。”',
], 'relic_choice', [{ item: 'sketch' }, { clue: 'child_name' }, { clue: 'home_tree' }, { stat: 'shen', add: 20 }, { journal: 'relic' }])
add({ id: 'relic_choice', location: 'home', speaker: '你', text: '画纸的边缘卷起。\n背面另有一行被水泡淡的字：“王宅之约，勿告母亲。”', choices: [
  { id: 'care', text: '把受潮的旧画仔细晾好。', next: 'relic_care_1', effects: [{ stat: 'mother', add: 8 }, { flag: 'trust_relic' }, { clue: 'mansion' }] },
  { id: 'memory', text: '闭上眼，追索那段雨中的记忆。', next: 'relic_memory_1', effects: [{ stat: 'shen', add: 10 }, { clue: 'child_promise' }, { flag: 'memory_intrusion' }] },
] })
sequence('relic_care', 'home', ['你用干净的纸压住画角。戚婆婆经过窗前，没有进来。\n隔了一会儿，她在门边放下一小碟桂花糕。'], 'activity_end')
sequence('relic_memory', 'home', ['雨里传来沈砚的声音：“等天亮，我带你回家。”\n你睁开眼时，手里不知何时已握住那支秃笔。你分不清刚才想起的人，究竟是谁。'], 'activity_end')

sequence('tea', 'street', [
  '茶摊的老炉子烧得很旺。老板见到你的脸，先是怔了怔，才递过一只粗瓷碗。',
  ['茶摊老板', '沈先生？你可叫韩捕快好找。\n三年前那一晚，他在王宅外守到天亮，回来时鞋底全是血泥。'],
  ['茶摊老板', '有人瞧见你抱着画卷从宅里出来，身后还跟着个孩子。\n可那孩子后来……谁也没再见着。'],
  ['卖灯人', '炉边的卖灯人插了一句：“双生槐那家的小满？母亲早不在了，屋子倒还留着。”\n你将这条路记了下来。'],
], 'tea_choice', [{ clue: 'mansion' }, { clue: 'home_tree' }, { journal: 'tea' }, { flag: 'heard_han_past' }])
add({ id: 'tea_choice', location: 'street', speaker: '茶摊老板', text: '“你问这些，是打算把当年的案子翻出来？”', choices: [
  { id: 'protect', text: '我想先找到那个孩子。', next: 'tea_end_1', effects: [{ clue: 'child_name' }, { flag: 'seeking_child' }] },
  { id: 'press', text: '韩七当晚到底守住了什么？', next: 'tea_press_1', effects: [{ clue: 'case_truth' }, { flag: 'han_suspected' }] },
] })
sequence('tea_end', 'street', [['茶摊老板', '你倒还是这副性子。\n可那口井夜里不太平。别独自去。']], 'activity_end')
sequence('tea_press', 'street', [['茶摊老板', '他守的是一纸封门令。\n宅里有人求救，门却到天亮才开。这话，你当我没说。']], 'activity_end')

sequence('case', 'yamen', [
  '韩七关上值房的门。案上没有热茶，只有一叠缺了页的旧卷。',
  ['韩七', '你的字，我认得。你的脸，我也认得。\n可沈砚当年伤的是右手。你方才推门，用的也是右手。'],
], 'case_question', [{ item: 'file' }, { journal: 'case' }])
add({ id: 'case_question', location: 'yamen', speaker: '韩七', text: '“说吧，你是什么人？”\n他的目光避开了卷尾那枚王宅的封印。', choices: [
  { id: 'truth', text: '我借了他的脸，来找他没做完的事。', next: 'case_truth_1', effects: [{ stat: 'selfhood', add: 5 }, { stat: 'han', add: 20 }, { flag: 'han_knows_truth' }] },
  { id: 'observe', text: '你怕的不是这张脸，是当年没打开的门。', note: '辨相 · 旧案卷可供验证', next: 'case_expose_1', when: { any: [{ stat: 'shen', gte: 30 }, { flag: 'heard_han_past' }, { flag: 'file_obtained' }] }, locked: '面契不足，且尚未听到相关旧事', effects: [{ stat: 'han', add: 10 }, { clue: 'case_truth' }, { flag: 'han_exposed' }] },
  { id: 'silence', text: '我只想看看卷里写了什么。', next: 'case_silence_1', effects: [{ stat: 'han', add: 5 }] },
] })
sequence('case_truth', 'yamen', [
  '韩七握刀的手紧了一瞬，最后却慢慢松开。',
  ['韩七', '我见过比你更像人的东西，也见过比鬼更不像人的人。\n那晚我奉命封门。里面有人叫我，我没应。'],
], 'case_gift_1', [{ clue: 'case_truth' }])
sequence('case_expose', 'yamen', [
  '韩七低下头。灯光在他眉骨间留下一道深影。',
  ['韩七', '我以为听令行事，就不必再想门里面的人。\n三年了。原来门关上，声音也不会停。'],
], 'case_gift_1')
sequence('case_silence', 'yamen', [
  '你翻开案卷。沈砚最后一次出现的地方，被朱笔圈在王宅后门。\n卷尾夹着小满的寻人告示。',
  ['韩七', '卷宗上写了失踪。\n有些没能写进去的，你日后会明白。'],
], 'case_gift_1')
sequence('case_gift', 'yamen', [
  ['旧卷所载 ·《画皮》', original('scroll')],
  ['韩七', '这是周平的旧面谱。他是捕快，早已不在了。\n那位懂术的人说，亡者遗形可以制成仿面。你若能用，就替他再查一次案。'],
  '你接过面谱。纸上的轮廓微微发热。\n面谱已收录「故捕快之面」。在面谱中借用它，可以用另一个身份与韩七交涉。',
], 'case_archive', [{ item: 'face_guard' }, { flag: 'guard_unlocked' }, { clue: 'child_name' }, { clue: 'mansion' }, { stat: 'guard', add: 10 }])
add({ id: 'case_archive', location: 'yamen', speaker: '韩七', text: '“后架还有一卷封存的值夜录。\n按规矩，只有当值捕快能看。”\n他把钥匙放在案角，转过身去。', choices: [
  { id: 'guard', text: '借故捕快之面，查阅值夜录。', note: '面谱中切换面皮后可用', next: 'case_guard_1', when: { face: 'guard' }, locked: '需要在面谱中借用故捕快之面', effects: [{ clue: 'child_promise' }, { flag: 'sealed_file' }, { stat: 'guard', add: 20 }] },
  { id: 'leave', text: '记下现有线索，离开值房。', next: 'case_end_1' },
] })
sequence('case_guard', 'yamen', [
  '韩七看着你戴上周平的脸，唇边动了动，终究没有叫出那个名字。\n他向旁边让开半步。',
  '值夜录记着沈砚最后的话：“小满，等天亮，我带你回家。”\n末页还有一笔：王宅井中所见，并非活人。',
], 'activity_end')
sequence('case_end', 'yamen', ['你将旧卷收好。韩七一直没有回头。\n有些人把沉默当作最后一道门。'], 'activity_end')

sequence('ritual', 'theatre', [
  ['原典残句 · 道士言', original('pity')],
  '茶楼的灯比初见时更暗。无面娘坐在帘后，手中的线穿过一张没有五官的脸。',
  ['无面娘', '井里有声音？死人没说完的话，总比活人的长。\n想学安魂？拿一份记忆来换。'],
  '你想起一段暖意：有人替你挡住风，指尖带着墨。\n你不知那属于沈砚，还是属于你。',
], 'ritual_choice')
add({ id: 'ritual_choice', location: 'theatre', portrait: 'mask', speaker: '无面娘', text: '“学了，今后便有你该偿的事。\n不学，也未必没有别的路。”', choices: [
  { id: 'learn', text: '交出那份记忆，学安魂之术。', next: 'ritual_learn_1', effects: [{ flag: 'knows_ritual' }, { flag: 'memory_paid' }, { item: 'charm' }, { journal: 'ritual' }] },
  { id: 'refuse', text: '这份记忆，我想先留着。', next: 'ritual_refuse_1', effects: [{ stat: 'selfhood', add: 5 }, { flag: 'kept_memory' }] },
] })
sequence('ritual_learn', 'theatre', [
  '笑声从你的记忆里一点点退去。你想再看清那人的脸，却只记得一只挡风的手。\n无面娘将画好的纸符压进你掌心。',
  ['无面娘', '魂可暂安，愿不可空。\n若把它留在灯中，就得有一日亲自送它归家。'],
], 'activity_end')
sequence('ritual_refuse', 'theatre', [
  ['无面娘', '也好。知道什么不肯给，才算开始有了自己。\n井里的孩子要的未必是术。你听仔细些。'],
  '她把一根旧灯芯递给你：“带不走人，至少带一盏灯。”',
], 'activity_end', [{ item: 'lantern' }])

sequence('watch', 'well', [
  ['檐下旧声 ·《画皮》', original('night')],
  '井沿长满青苔。你俯身时，水里没有你的脸，只有一轮被风吹碎的月亮。',
  ['井中童影', '哥哥。你这次带灯了么？'],
  '一双小手贴在水面下面。你听见孩子低声念着同一句话：“等天亮，带我回家。”',
  '墙外更夫敲过三声。童影忽然躲进黑暗。\n井底浮上半截朽木，缠着画轴上的旧丝线。',
], 'watch_choice', [{ clue: 'child_promise' }, { journal: 'watch' }, { flag: 'seen_child' }])
add({ id: 'watch_choice', location: 'well', speaker: '你', text: '它没有向你扑来，只一直望着你。\n你在井边蹲下。', choices: [
  { id: 'listen', text: '不催它，听它说完。', next: 'watch_listen_1', effects: [{ clue: 'home_tree' }, { stat: 'selfhood', add: 5 }, { flag: 'listened_child' }] },
  { id: 'name', text: '你认识原来用这张脸的人？', next: 'watch_name_1', effects: [{ clue: 'child_name' }, { stat: 'shen', add: 10 }] },
] })
sequence('watch_listen', 'well', [['井中童影', '我家门口有两棵长在一起的槐树。\n娘在门前挂了灯。灯一直没灭，为什么没有人来接我？']], 'activity_end')
sequence('watch_name', 'well', [['井中童影', '他叫我小满。他说画好了，就送我回去。\n你明明跟他长得一样，怎么连我的名字也不记得？']], 'activity_end')
add({ id: 'activity_end', location: 'street', speaker: '旁白', text: '一段往事暂告一歇。\n天色又向前移了一寸。', end: 'hub' })

sequence('deadline', 'street', [
  ['原典残句 · 道士言', original('warning')],
  '第三日黄昏，韩七在南街尽头拦住你。\n这一回，他没有按刀。',
  ['韩七', '戚家后井有了响动。\n我当年没救下的人，这次不能再装作听不见。'],
  ['韩七', '沈砚已经死了。卷宗里没写，我却知道。\n井里那个孩子叫小满，他还在等一句“带你回家”。'],
  '无论你已查到多少，旧事终究来到了门前。\n今夜，你必须为这张借来的脸作一次回答。',
], 'well_1', [{ clue: 'child_name' }, { clue: 'mansion' }, { flag: 'death_known' }])
sequence('well', 'well', [
  '子夜。戚家后井传来哭声。\n戚婆婆在屋里点着灯，没有出来。',
  ['井中童影', '哥哥，你把我的脸还给我，好不好？'],
  '你低下头。井里倒映着一个孩子，眉眼却一点点变成沈砚。\n它认不出脸与人之间的分别，只记得有人答应过它。',
  ['井中童影', '你明明说过，等天亮就带我回家。\n天都亮了好多次了。你为什么还不来？'],
], 'well_choice', [{ flag: 'met_child' }])
add({ id: 'well_choice', location: 'well', portrait: 'child', speaker: '你', text: '水面升起，像一张绷紧的皮。\n你可以借旧日的承诺开口，也可以选择承担一桩新的因果。', choices: [
  { id: 'peace', text: '小满，我不是他。但我知道你的家在哪里。', note: '以情动人 · 至少两条童影记忆', next: 'peace_1', when: { flag: 'can_empathize' }, locked: '需要两条沈砚与童影有关的记忆线索', effects: [{ stat: 'selfhood', add: 10 }, { flag: 'child_at_peace' }, { journal: 'peace' }] },
  { id: 'ritual', text: '以安魂符暂安童影，承诺日后送它归家。', note: '以术安魂 · 需要提前学会', next: 'bind_1', when: { flag: 'knows_ritual' }, locked: '尚未向无面娘学会安魂术', effects: [{ stat: 'karma', add: 5 }, { flag: 'child_bound' }, { journal: 'bind' }] },
  { id: 'deceive', text: '是我。我来接你了。', note: '以面欺魂 · 用沈砚的声音回答', next: 'deceive_1', when: { face: 'shen' }, locked: '需要借用沈砚之面，可在面谱中切换', effects: [{ stat: 'selfhood', add: -10 }, { stat: 'karma', add: 15 }, { flag: 'child_attached' }, { journal: 'deceive' }] },
] })
sequence('peace', 'well', [
  '你把灯放在井边，说起双生槐，说起门前的灯，说起画纸上那个没有画完的天明。\n“沈砚已经不在了。他没能带你走完，我愿意替他走。”',
  ['井中童影', '他不是不来……是不能来了么？'],
  '你没有点头，也没有摇头。只是把手伸向水面。\n孩子的指尖像一片薄雾，最后化在暖黄的灯光里。',
  '井底浮起一卷旧画。上面已经没有水。\n你听见一个很远的声音说：“哥哥，这次天真的亮了。”',
], 'scroll_1')
sequence('bind', 'well', [
  '纸符落进灯焰。井水缓缓平下去，孩子的影子缩成一点微弱的光。',
  ['井中童影', '那你明天，会不会也不记得我？'],
  '你托住灯，答应在找到双生槐之前，不让它熄灭。\n这不是了结，只是你亲口应下的一段后来。',
  '一卷旧画从井底浮起。小满的声音停在灯芯里，轻轻地哼着歌。',
], 'scroll_1')
sequence('deceive', 'well', [
  '你让沈砚的记忆漫过喉咙，用那个人的声音叫了一声“小满”。\n井水骤然平静。',
  ['井中童影', '我就知道，你不会不要我。'],
  '孩子笑了。你的影子旁边，多出一小段不属于你的影子。\n它牢牢牵着你的衣角。',
  '旧画卷浮到井边。你伸手去接，水里那张脸仍在微笑。\n你不知道，下一次该怎样向它解释。',
], 'scroll_1')
sequence('scroll', 'well', [
  '画卷里，一个青年微微笑着。不是你，却与你有同样的眉眼。\n画背只有两行字。',
  '养母戚氏，待我如亲。\n若此去不归，愿有人替我照顾她。',
  '画轴里藏着半枚王宅旧印。你终于明白，沈砚最后去的地方，也是你来处的方向。\n可在去那里之前，还有一个人在灯下等你。',
], 'farewell_1', [{ item: 'scroll' }, { item: 'clue_mansion' }, { flag: 'scroll_found' }])
sequence('farewell', 'home', [
  '戚婆婆坐在桌边。面已经凉了，她仍替你留着一双筷子。\n她看见画卷，手指在青年的脸旁停了很久。',
  ['戚婆婆', '阿砚。\n你这次，还走吗？'],
], 'final_choice')
add({ id: 'final_choice', location: 'home', speaker: '你', text: '你借用的不只是一个名字。\n此刻，你愿意如何回应她？', choices: [
  { id: 'stay_honest', text: '我不是沈砚，但我愿意留下陪您。', when: { all: [{ flag: 'mother_knows_truth' }, { flag: 'mother_can_accept' }] }, next: 'stay_honest_1', effects: [{ stat: 'selfhood', add: 5 }, { ending: 'stay' }, { journal: 'stay' }, { flag: 'mother_accepts_player' }] },
  { id: 'stay_honest_wait', text: '我愿意留下。您不必急着接受我。', when: { all: [{ flag: 'mother_knows_truth' }, { not: { flag: 'mother_can_accept' } }] }, next: 'stay_wait_1', effects: [{ stat: 'selfhood', add: 5 }, { ending: 'stay' }, { journal: 'stay' }] },
  { id: 'stay_mask', text: '娘，我先不走了。', note: '继续以沈砚的身份陪伴她', when: { flag: 'mother_knows_truth', is: false }, next: 'stay_mask_1', effects: [{ stat: 'selfhood', add: -5 }, { ending: 'stay' }, { journal: 'stay' }] },
  { id: 'truth_accept', text: '我不是您的儿子。可我愿意以自己的身份回来。', when: { all: [{ flag: 'mother_can_accept' }, { flag: 'trust_meal' }] }, next: 'truth_accept_1', effects: [{ stat: 'selfhood', add: 10 }, { flag: 'mother_knows_truth' }, { flag: 'mother_accepts_player' }, { ending: 'truth' }, { journal: 'truth' }] },
  { id: 'truth_relic', text: '我不是您的儿子。可我愿意以自己的身份回来。', when: { all: [{ flag: 'mother_can_accept' }, { not: { flag: 'trust_meal' } }] }, next: 'truth_relic_1', effects: [{ stat: 'selfhood', add: 10 }, { flag: 'mother_knows_truth' }, { flag: 'mother_accepts_player' }, { ending: 'truth' }, { journal: 'truth' }] },
  { id: 'truth_wait', text: '我不是您的儿子。这件事，我不想再瞒您。', when: { flag: 'mother_can_accept', is: false }, next: 'truth_wait_1', effects: [{ stat: 'selfhood', add: 10 }, { flag: 'mother_knows_truth' }, { ending: 'truth' }, { journal: 'truth' }] },
  { id: 'leave', text: '把画卷留下，趁雨离开。', note: '离开这段借来的关系', next: 'leave_1', effects: [{ ending: 'leave' }, { journal: 'leave' }] },
] })
sequence('stay_honest', 'home', [
  '她把那双筷子往你面前挪了一点。没有再叫你阿砚。',
  ['戚婆婆', '那明日，你想吃什么？\n不必跟他一样。你喜欢的，告诉我就好。'],
  '你第一次觉得，即使借着另一个人的脸，也可以以陆知微的姓名，被人留下。',
], 'coda_1')
sequence('stay_mask', 'home', [
  '她点点头，起身把面端回灶上。\n“凉了，娘再给你热热。”',
  '你坐在沈砚坐过的地方。窗外的雨声很轻。\n此刻的安宁是真的，那声“娘”之下没有说完的话，也是真的。',
], 'coda_1')
sequence('stay_wait', 'home', [
  '她望着你，又望了望怀中的画卷。良久，她把门边那把空椅往桌前挪了一点。',
  ['戚婆婆', '先坐吧。\n你说的事，我还得慢慢想。'],
  '你没有再叫她娘。今夜留下，只是你自己的决定。至于她会如何回应，你愿意再等一些日子。',
], 'coda_1')
sequence('truth_accept', 'home', [
  ['戚婆婆', '我知道。'],
  ['戚婆婆', '他从前吃饭，总要把姜挑出来。\n你第一次来，就把姜全吃了。'],
  ['戚婆婆', '我老了，眼睛不好。可我自己的儿子，我怎么会认不出来。'],
  ['戚婆婆', '只是那天看见你站在街口，我想着……\n哪怕是假的，让我再叫他一声，也好。'],
  '她擦去画卷上的一点灰，替青年理好不存在的衣领。\n然后抬起头，望向你。',
  ['戚婆婆', '往后回来，先敲门。\n我给你也留一双筷子。'],
], 'coda_1')
sequence('truth_relic', 'home', [
  ['戚婆婆', '我知道。\n阿砚收画，从来不肯让我进他的屋子。'],
  ['戚婆婆', '你那天晾着他的旧画，却把门开着。\n你在等我进去，问一句要不要留。'],
  '她将画卷放在桌上。一头是她养大的孩子，一头是你们刚刚有过的日子。',
  ['戚婆婆', '往后回来，先敲门。\n我给你也留一双筷子。'],
], 'coda_1')
sequence('truth_wait', 'home', [
  '戚婆婆望着你，像终于听见了一个早已猜到的答案。\n她把画卷抱在怀里，慢慢坐了回去。',
  ['戚婆婆', '让我想一想。\n你……先去吧。夜里路滑。'],
  '真话说出了口，伤口却还需要时间。\n你替她关好门，灯光从门缝里落在脚边。',
], 'coda_1')
sequence('leave', 'home', [
  '你把画卷压在碗边，没有再应那声呼唤。\n走到南街尽头时，身后的灯还亮着。',
  '你没有回头。\n雨落在这张借来的脸上，与任何活人的脸都没有分别。',
], 'coda_1')
sequence('coda', 'mansion', [
  ['旧事残文 · 陈氏救夫', original('wife')],
  ['旧事残文 · 王生复息', original('revival')],
  '未闻县外，王宅早已无人。\n铜镜却在空屋里，一寸寸亮了起来。',
  '一名女子的残影坐在镜前，将一张新面缓缓覆上脸。\n那是多年前的一场执念，至今仍在重复。',
  ['镜中残影', '他终于回来了。'],
], 'chapter_end', [{ flag: 'seen_mansion_echo' }], 'woman')
add({ id: 'chapter_end', location: 'mansion', speaker: '第一章 · 借皮入世', text: '面容是借来的。\n这一路走过的日子，却终于有一些属于你。', end: 'ending' })

export const story = Object.fromEntries(content.map(node => [node.id, node])) as Record<string, StoryNode>
export const allNodes = content
