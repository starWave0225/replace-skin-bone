import type { Activity, Location } from './types'
export const locations: Record<Location, { name: string; subtitle: string; image: string; verse: string }> = {
  inn: { name: '栖雨客舍', subtitle: '一纸旧约，故人未至', image: 'village.jpg', verse: '此来原为访故人，谁料故人已隔尘。' },
  theatre: { name: '无面茶楼', subtitle: '一盏隔夜茶，几重梦中人', image: 'temple.jpg', verse: '人死留骨，鬼死留名。' },
  street: { name: '槐阴南街', subtitle: '雨打旧巷，故人归来', image: 'village.jpg', verse: '借来一副面容，走进一场旧梦。' },
  home: { name: '戚家小院', subtitle: '门前一盏灯，等了许多年', image: 'garden.jpg', verse: '人间最难偿，不过一声娘。' },
  yamen: { name: '县衙值房', subtitle: '尘封旧卷，字字有痕', image: 'landscape.jpg', verse: '卷中写尽生死，卷外无人落款。' },
  well: { name: '戚家后井', subtitle: '井底月明，照见谁人', image: 'temple.jpg', verse: '你看向井底，井底也在看你。' },
  mansion: { name: '王宅残梦', subtitle: '人已不在，梦犹未醒', image: 'garden.jpg', verse: '他终于回来了。' },
}
export const activities: Activity[] = [
  { id: 'meal', title: '陪婆婆吃一碗面', subtitle: '一碗热面，几句家常', location: 'home', times: ['day', 'dusk'], start: 'meal_1', mark: '情' },
  { id: 'relic', title: '整理沈砚的遗物', subtitle: '旧笔残笺，记忆未干', location: 'home', times: ['day', 'dusk'], start: 'relic_1', mark: '忆' },
  { id: 'tea', title: '茶摊打听往事', subtitle: '市井闲谈，也有真言', location: 'street', times: ['day', 'dusk'], start: 'tea_1', mark: '闻' },
  { id: 'case', title: '前往县衙查旧案', subtitle: '韩七似乎有所隐瞒', location: 'yamen', times: ['day', 'dusk'], start: 'case_1', mark: '案' },
  { id: 'ritual', title: '夜访无面茶楼', subtitle: '一份记忆，换一门术', location: 'theatre', times: ['night'], start: 'ritual_1', mark: '术' },
  { id: 'watch', title: '在后井守夜', subtitle: '水面之下，有人在等', location: 'well', times: ['night'], start: 'watch_1', mark: '异' },
]
export const itemInfo: Record<string, { title: string; text: string; mark: string }> = {
  invitation: { title: '许文卿的邀书', text: '许文卿邀你来槐阴校谱，约定戌时在客舍东厢相见。', mark: '约' },
  originals: { title: '《画皮》残卷', text: '蒲松龄《画皮》的古文摘句。', mark: '典' },
  mirror: { title: '旧铜镜', text: '镜缘生了绿锈。它照得出你借来的脸，却照不见脸后的人。', mark: '镜' },
  face_shen: { title: '沈砚之面', text: '已故画师沈砚留下的面皮。', mark: '面' },
  face_guard: { title: '故捕快面谱', text: '韩七交付的周平仿面。', mark: '谱' },
  sketch: { title: '未完的归家图', text: '画上一个孩子牵着青年。路的尽头是一株双生槐。画角写着：小满，等天亮。', mark: '画' },
  file: { title: '沈砚失踪案卷', text: '案卷末页被人撕去。余下的字迹里，“王宅”二字被反复涂黑。', mark: '卷' },
  charm: { title: '安魂纸符', text: '无面娘给的安魂符，可将童影暂寄灯中。', mark: '符' },
  lantern: { title: '小纸灯', text: '灯芯很短，仍有人小心护着它。', mark: '灯' },
  scroll: { title: '沈砚的旧画卷', text: '画背写道：养母戚氏，待我如亲。若此去不归，愿有人替我照顾她。', mark: '归' },
  clue_mansion: { title: '王宅旧印', text: '藏在画轴中的半枚朱印。它与无面茶楼镜后的旧画，出自同一个地方。', mark: '印' },
}
export const journalInfo: Record<string, { title: string; text: string; status: string }> = {
  dream_witness: {title:'灯外的冤声',text:'女魂提到戌初的窗下、半笺的重笔，以及旧谱的经手人。',status:'梦中证词 · 尚待核实'},
  murder: {title:'一封未赴的旧约',text:'你以陆知微的姓名来到槐阴，故友许文卿却先一步遇害。半笺、住客簿和窗下鞋印尚未拼出答案。一夜梦后，你往西街寻找无面茶楼。',status:'序章已记 · 命案未明'},
  awakening: { title: '借来的姓名', text: '你借用了沈砚之面。', status: '因果初起' },
  accept: { title: '一桩旧认', text: '戚婆婆认你作儿子，你应下了。', status: '尚有牵连' },
  deny: { title: '未应的一声娘', text: '你说她认错了人。她松开手时，仍替你拂去肩头的雨。', status: '留有余温' },
  question: { title: '这张脸的来处', text: '你问她是否认得这张脸。她说认得，又似乎不敢再认。', status: '旧事待寻' },
  meal: { title: '一碗姜汤面', text: '你吃下她做的面。姜片沉在碗底，她看了很久，没有说话。', status: '人间烟火' },
  relic: { title: '纸上未归人', text: '你翻开沈砚的旧画。一个孩子，正在纸上等他天亮。', status: '记忆渐明' },
  tea: { title: '茶凉旧事热', text: '茶摊老板说，失踪那晚的雨很大。有人从王宅出来，怀中抱着一卷画。', status: '案外之言' },
  case: { title: '迟来的案卷', text: '韩七让你查阅沈砚的旧案。', status: '旧案未结' },
  ritual: { title: '以忆换术', text: '你交出一段不知属于谁的暖意，换来安魂的办法。术已学会，那个人的笑声却再也想不起。', status: '有失有得' },
  watch: { title: '夜半井声', text: '井下有人唤你哥哥。水面上没有你的倒影，只有一个等待天亮的孩子。', status: '承诺未了' },
  honest: { title: '自己的名字', text: '你承认自己不是沈砚。', status: '本心有声' },
  peace: { title: '送一盏归家的灯', text: '你没有冒认那个迟归的人，却愿意替他走完最后一段路。井水终于照出了月亮。', status: '一愿已偿' },
  bind: { title: '暂借一夜安宁', text: '你将童影安置在灯中，答应日后带它回家。', status: '来日须偿' },
  deceive: { title: '又一个等你的人', text: '你用沈砚的声音应下了那个孩子。它笑了。', status: '依附渐生' },
  stay: { title: '灯下有人', text: '你选择留下。今夜总有人不必再独自守灯。', status: '第一章终' },
  truth: { title: '面下之人', text: '你告诉戚婆婆，自己不是沈砚。', status: '第一章终' },
  leave: { title: '雨中背影', text: '你没有再应那声呼唤。身后的灯仍亮着，直到南街尽头也看不见。', status: '第一章终' },
}
export const clueInfo: Record<string, string> = { childhood: '沈砚小时候怕黑，总牵着养母的衣袖。', child_name: '井中孩子叫小满，沈砚曾许诺带他回家。', home_tree: '小满的家在双生槐下，门前挂一盏纸灯。', case_truth: '韩七曾奉命封锁王宅，漏下了求救的人。', child_promise: '沈砚说过：“等天亮，我带你回家。”', mansion: '沈砚的最后行踪，指向早已败落的王宅。' }
