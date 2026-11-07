import type { GameState, WorldState } from './types'
import { collides, TILE, worldSpawn } from './world'
import { chapterOneMap } from './chapter-one-world'
import { createCombat, performCombatAction, type CombatState } from './combat'
import type { CombatAction } from './combat-data'

export type ChapterOneStage='visit'|'borrow'|'meal'|'painting'|'lamps'|'hang'|'cache'|'battle'|'report'|'complete'
export interface ChapterLine {speaker:string;text:string;choices?:{id:string;text:string}[]}
export interface ChapterOneState {
  version:1;stage:ChapterOneStage;world:WorldState;face:'self'|'shen';unlocked:boolean;
  stats:{selfhood:number;bond:number;trust:number};flags:Record<string,boolean>;
  evidence:string[];journal:string[];history:ChapterLine[];
  dialogue?:{id:string;index:number;lines:ChapterLine[]};puzzle?:'meal'|'painting'|'lamps'|'mirror';
  pieces:{id:'bridge'|'tree'|'well';turns:number}[];lampOrder:string[];
  battle?:CombatState;message:string;
}
export const chapterOneStages:Record<ChapterOneStage,{title:string;goal:string}>={
  visit:{title:'一角青布',goal:'先以自己的面目，去戚家问这角青布的来历。'},
  borrow:{title:'故人的托付',goal:'携青布与托付书，回无面茶楼问借面之法。'},
  meal:{title:'两双筷子',goal:'借沈砚之面回戚家，看看他曾经坐过的饭桌。'},
  painting:{title:'残画里的名字',goal:'到南街沈砚画舍寻三片残画，辨清画框与笔迹。'},
  lamps:{title:'画中未亮的灯',goal:'读旧戏单，以沈砚的笔法找出三盏灯的次序。'},
  hang:{title:'为一个孩子留灯',goal:'带纸灯到栖雨客舍后井，完成沈砚的托付。'},
  cache:{title:'画架夹层',goal:'小满说画架后还藏着东西。回画舍寻找。'},
  battle:{title:'背画纸傀',goal:'看准补相与重击，破开纸面，再伤其形。'},
  report:{title:'半张值夜录',goal:'黄昏前，把半张值夜录交给南街的韩七。'},
  complete:{title:'死人留下的押',goal:'第一章结束。第二章「纸上囚人」尚未开放。'},
}
export const chapterOneEvidence:Record<string,{name:string;text:string}>={
  'case-letter':{name:'客舍半笺',text:'许文卿的半封信，末尾相约的笔锋与前文不同。凶手身份仍未查明。'},
  'case-ledger':{name:'客舍入宿簿',text:'簿上只记许文卿一人，小二却听见屋里有人交谈，始终不见第二人的身影。'},
  'case-tracks':{name:'镜前湿鞋印',text:'湿鞋印从铜镜延续到后窗，越近窗台越淡。它不是从窗外踏进来的。'},
  cloth:{name:'一角青布',text:'从客舍后井拾得。边角缝着细密回针，布上残留极淡的墨色。'},
  letter:{name:'沈砚的托付书',text:'「娘：若我不归，莫替我告官。客舍后井有个孩子，怕黑。烦来人替我留一盏灯。砚。」末笔迟疑，确是同一人写成。'},
  'fragment-bridge':{name:'残画 · 桥栏',text:'两道桥栏穿过断口；纸背留下画框的压痕。'},
  'fragment-tree':{name:'残画 · 树梢',text:'柳枝与远山各有一处断线，恰可同旁片相接。'},
  'fragment-well':{name:'残画 · 井沿',text:'井边坐着一个没有画完的孩子，手里提着未亮的灯。'},
  name:{name:'画中小名「满」',text:'青布上的逆笔覆上残画，组成一个「满」字。井里等候的孩子叫小满。'},
  lantern:{name:'沈砚留下的纸灯',text:'画台暗屉里的一盏旧纸灯。灯能带到井边，许下的事才算做成。'},
  record:{name:'半张值夜录',text:'「王宅移囚一名，未入正簿……」纸角钤着县衙旧印，押字像一个「周」。余下半页被撕去。'},
  pigment:{name:'胶矾笔记',text:'纸傀靠胶矾补相。沈砚看出墨色受潮后泛白，事先调好的松烟能阻断它第一次补相。'},
}
const line=(speaker:string,text:string,choices?:ChapterLine['choices']):ChapterLine=>({speaker,text,...(choices?{choices}:{})})
function talk(s:ChapterOneState,id:string,lines:ChapterLine[]){s.dialogue={id,index:0,lines};s.message='';s.history.push(lines[0]);s.history=s.history.slice(-100)}
function note(s:ChapterOneState,text:string){if(!s.journal.includes(text))s.journal.push(text)}
function gain(s:ChapterOneState,id:string){if(!s.evidence.includes(id))s.evidence.push(id)}
function say(s:ChapterOneState,text:string,speaker='陆知微'){talk(s,'aside',[line(speaker,text)])}
export function createChapterOne():ChapterOneState{
  const s:ChapterOneState={version:1,stage:'visit',world:worldSpawn('theatre'),face:'self',unlocked:false,stats:{selfhood:60,bond:0,trust:0},flags:{},evidence:['cloth'],journal:['井边怨声散了。一角青布在手，女魂给的七日之期才刚开始。'],history:[],pieces:[{id:'well',turns:1},{id:'bridge',turns:3},{id:'tree',turns:2}],lampOrder:[],message:''}
  talk(s,'arrival',[line('旁白','天将亮时，陆知微再次推开茶楼的门。青布晾在掌心，像从一场梦里带回的一角夜色。'),line('无面娘','这是裹画的布，不是裹尸的。针脚这么密，缝它的人怕东西丢了。去南街戚家问问。'),line('陆知微','你说过，我能借沈砚的脸。'),line('无面娘','先用你自己的脸，问明白他留下了什么。借一张面，容易；接住那个人没做完的事，难。')])
  return s
}
export function startChapterOne(s:GameState){
  if(s.chapterOne||s.prologue?.phase!=='curtain'||s.prologue.wellEncounter?.stage!=='complete')return false
  const heard=!!s.prologue.heardAppeal
  s.chapterOne=createChapterOne();s.chapterOne.flags.heardAppeal=heard
  for(const id of s.prologue.clues)if(chapterOneEvidence[`case-${id}`])gain(s.chapterOne,`case-${id}`)
  note(s.chapterOne,'许文卿之死尚未查明。半笺异笔、入宿簿的人声与镜前鞋印，仍要与王宅旧事相印证。')
  if(heard)note(s.chapterOne,'街上有人为儿伸冤，称官府找不出真凶，便拿与县衙有过节的人充作嫌犯。')
  delete s.prologue;s.mode='hub';s.world=s.chapterOne.world;s.flags.wearing_first_face=false;s.day=1;s.time='day';s.stats.selfhood=s.chapterOne.stats.selfhood;s.stats.shen=0;s.stats.mother=0;return true
}
export function chapterOneCanChangeFace(s:ChapterOneState){return s.unlocked&&chapterOneMap(s).spots.some(p=>p.id==='mirror'&&Math.hypot(p.x*TILE-s.world.x,p.y*TILE-s.world.y)<80)}
export type ChapterOneCommand =
  |{type:'interact';id:string}|{type:'next'}|{type:'choice';id:string}|{type:'position';world:WorldState}
  |{type:'close'}|{type:'face';face:'self'|'shen'}|{type:'seat';seat:'east'|'west'}
  |{type:'swap';a:number;b:number}|{type:'rotate';index:number}|{type:'assemble'}|{type:'overlay'}
  |{type:'lamp';id:string}|{type:'combat';action:CombatAction}|{type:'retry'}|{type:'collect'}

export function chapterOneCommand(s:ChapterOneState,c:ChapterOneCommand):boolean{
  if(c.type==='next'){
    const d=s.dialogue;if(!d||d.lines[d.index].choices)return false
    if(d.index+1<d.lines.length){d.index++;s.history.push(d.lines[d.index]);return true}
    delete s.dialogue
    if(d.id==='mother-first'){gain(s,'letter');s.stage='borrow';s.stats.trust+=4;note(s,'戚婆婆认出青布上的针脚，交给我沈砚的托付书。他要替客舍后井的孩子留灯。')}
    if(d.id==='borrow'){s.unlocked=true;s.face='shen';s.stage='meal';s.stats.bond=15;note(s,'第一次借沈砚之面。眼睛认得墨的深浅，记忆却接不上他的日常。')}
    if(d.id==='meal-end'){s.stage='painting';note(s,s.flags.seatRight?'饭桌西侧的墨槽与袖痕，替我找到沈砚从前的座位。':'我坐错了沈砚的位置。戚婆婆没有追问，只把那盏灯挪远了。')}
    if(d.id==='child-end'){s.stage='cache';note(s,'小满死在三年前的王宅井中。沈砚把裹画布带到客舍，他的一缕魂也跟了来；画架后藏着沈砚留下的纸。')}
    if(d.id==='ambush'){s.stage='battle';s.face='shen';s.battle=createCombat('shen','chapter-one');s.battle.repairWeakened=!!s.flags.pigmentSeen}
    if(d.id==='report'){s.stage='complete';note(s,'韩七认出值夜录上的押字属于已死的周平。明日，他愿带我查这件事。')}
    return true
  }
  if(c.type==='choice')return chooseChapter(s,c.id)
  if(s.dialogue)return false
  if(c.type==='combat'){
    if(s.stage!=='battle'||!s.battle)return false
    const r=performCombatAction(s.battle,c.action);if(!r.ok)return false;s.battle=r.state;return true
  }
  if(c.type==='retry'){if(s.stage!=='battle'||s.battle?.status!=='lost')return false;s.battle=createCombat('shen','chapter-one');s.battle.repairWeakened=!!s.flags.pigmentSeen;return true}
  if(c.type==='collect'){
    if(s.stage!=='battle'||s.battle?.status!=='won')return false
    s.stage='report';gain(s,'record');s.stats.bond+=10;s.stats.selfhood+=3;delete s.battle
    note(s,'背画纸傀已散。纸臂上的墨线与值夜录的县衙旧印同形，像有人用公门的印拘着它。')
    talk(s,'victory',[line('旁白','纸傀塌成一叠旧纸，最后一笔墨线仍向画架伸去。你抢在火星吞纸之前，取回半张值夜录。'),line('陆知微','沈砚不是无故被押进牢里。许兄，你邀我来校的旧谱，究竟牵着多少人的性命？')]);return true
  }
  if(s.stage==='battle')return false
  if(c.type==='close'){delete s.puzzle;s.message='';return true}
  if(c.type==='face'){
    if(!chapterOneCanChangeFace(s)||s.puzzle!=='mirror'||s.face===c.face)return false
    s.face=c.face;s.message=c.face==='shen'?'镜面浮起旧墨，眉眼与衣裳渐作画师模样。':'指腹的墨痕退去。铜镜里，又是陆知微。';return true
  }
  if(c.type==='seat'){
    if(s.stage!=='meal'||s.puzzle!=='meal')return false
    delete s.puzzle;s.flags.seatRight=c.seat==='west';s.stats.trust+=c.seat==='west'?8:-4
    talk(s,'meal-end',[line('陆知微',c.seat==='west'?'我坐西边。袖口总擦着墨槽，坐东边怕碰倒灯。':'我坐东边吧。'),line('戚婆婆',c.seat==='west'?'还记得那盏灯啊……面凉了，快吃。':'你从前从不肯坐那里。也罢，人回来就好。'),line('旁白','她又添了一双筷子，却没有再问。临出门，她把南街画舍的钥匙放到你掌心。'),line('戚婆婆','他还有一幅画没画完。你替我去看看，别让雨打坏了。')]);return true
  }
  if(c.type==='swap'||c.type==='rotate'){
    if(s.puzzle!=='painting'||s.flags.paintingAligned)return false
    if(c.type==='rotate'){if(!Number.isInteger(c.index)||!s.pieces[c.index])return false;s.pieces[c.index].turns=(s.pieces[c.index].turns+1)%4}
    else{if(!Number.isInteger(c.a)||!Number.isInteger(c.b)||!s.pieces[c.a]||!s.pieces[c.b])return false;[s.pieces[c.a],s.pieces[c.b]]=[s.pieces[c.b],s.pieces[c.a]]}
    s.message='';return true
  }
  if(c.type==='assemble'){
    if(s.stage!=='painting'||s.puzzle!=='painting')return false
    if(!['bridge','tree','well'].every(id=>s.evidence.includes(`fragment-${id}`))){s.message='画还缺页。案头、旧卷和匣底各有一片。';return true}
    if(!s.flags.frameSeen){s.message='哪一边朝上，还得看看画框留下的痕迹。';return true}
    if(!s.pieces.every((p,i)=>p.id===['bridge','tree','well'][i]&&p.turns===0)){s.message='桥栏与山脊没有同时接上。可再转动、调换残片。';return true}
    s.flags.paintingAligned=true;s.message='桥栏与远山连成一线。画上仍缺一个名字，青布上的墨痕也许能补它。';return true
  }
  if(c.type==='overlay'){
    if(s.puzzle!=='painting'||!s.flags.paintingAligned||s.stage!=='painting')return false
    if(s.face!=='shen'){s.message='布上只有散开的墨。也许画师的眼睛，能分清这些笔画。';return true}
    gain(s,'name');s.stage='lamps';s.stats.bond+=5;delete s.puzzle;talk(s,'name',[line('旁白','布纤维里的逆笔恰好补在画纸的空处，组成一个小小的「满」字。旁边，是一盏没有点亮的灯。'),line('陆知微','小满……原来他一直在等人叫他的名字。')]);note(s,'残画与青布相合，露出孩子的名字：小满。');return true
  }
  if(c.type==='lamp'){
    if(s.stage!=='lamps'||s.puzzle!=='lamps'||!['gate','bridge','eaves'].includes(c.id))return false
    if(s.face!=='shen'){s.message='三盏灯都画得一样。换一双能认笔锋的眼睛再看。';return true}
    const expected=['gate','bridge','eaves'];if(c.id!==expected[s.lampOrder.length]){s.lampOrder=[];s.message='灯影一颤，俱灭了。戏单上的先后，还要与画里的落笔相对。';return true}
    s.lampOrder.push(c.id);s.message='一线暖光沿着画中水路行去。'
    if(s.lampOrder.length===3){gain(s,'lantern');s.stage='hang';delete s.puzzle;note(s,'候客开门，归舟过桥，闭门归檐。画中灯次已解，暗屉弹开，露出一盏真正的纸灯。');talk(s,'lantern',[line('旁白','三盏画灯一一亮起，画台下的暗屉发出轻响。里面不是金银，只有一盏仔细糊好的纸灯。'),line('陆知微','纸上的路照亮了，井边却还黑着。我得把它带过去。')])}return true
  }
  if(s.puzzle)return false
  if(c.type==='position'){
    const map=chapterOneMap(s),w=c.world
    if(w.map!==s.world.map||!Number.isFinite(w.x)||!Number.isFinite(w.y)||w.x<0||w.y<0||w.x>map.width*TILE||w.y>map.height*TILE||!['down','up','left','right'].includes(w.facing)||collides(map,w.x,w.y))return false
    s.world={...w};return true
  }
  if(c.type!=='interact')return false
  const spot=chapterOneMap(s).spots.find(p=>p.id===c.id)
  if(!spot||Math.hypot(s.world.x-spot.x*TILE,s.world.y-spot.y*TILE)>80)return false
  s.message=''
  if(spot.kind==='door'&&spot.destination){
    if(spot.destination==='studio'&&['visit','borrow','meal'].includes(s.stage)){say(s,'门锁着。还是先去戚家问明白沈砚的下落。');return true}
    s.world=worldSpawn(spot.destination,spot.arrival);return true
  }
  return interactChapter(s,c.id)
}

function chooseChapter(s:ChapterOneState,id:string){
  const d=s.dialogue,entry=d?.lines[d.index],choice=entry?.choices?.find(c=>c.id===id)
  if(!d||!choice)return false
  s.history.push(line('陆知微',choice.text));delete s.dialogue
  if(d.id==='identity'){
    s.flags.identityChosen=true;s.flags.toldTruth=id==='truth';s.flags.borrowedName=id==='mask'
    s.stats.selfhood+=id==='truth'?8:id==='mask'?-5:0;s.stats.trust+=id==='truth'?6:id==='mask'?2:0;s.stats.bond+=id==='mask'?4:0
    talk(s,'table-invite',[line('戚婆婆',id==='truth'?'陆先生……你别急着说。我先给你盛碗面。就当有人陪我坐一会儿。':id==='mask'?'阿砚，你的手怎么这么凉？坐下，娘给你盛面。':'怎么不说话？门口风大，坐下再说。'),line('戚婆婆','你从前总坐东边。筷子已经摆好了。'),line('旁白','她说得极轻，目光却停在你的手上。桌面被旧年的墨磨出一条暗槽。')]);s.flags.mealInvited=true;return true
  }
  if(d.id==='repair'){
    s.flags.truthRepaired=true;s.flags.toldTruth=true;s.stats.selfhood+=5;s.stats.trust+=5
    say(s,'她读完托付书，把另一双筷子收进匣中。「陆先生，往后来的时候，叫一声就是了。」','旁白');return true
  }
  if(d.id==='child'){
    s.flags.childTruth=id==='truth';s.stats.selfhood+=id==='truth'?6:-3;s.stats.bond+=id==='promise'?5:2
    talk(s,'child-end',[line('陆知微',id==='truth'?'小满，我不是沈砚。我叫陆知微。是他托我来给你留灯。':'小满，灯给你带来了。今夜不必再等在黑里。'),line('小满',id==='truth'?'我知道……你的影子不一样。你肯留下灯，就不是来哄我的。':'哥哥的声音……可你手里那盏灯，怎么比从前还暖？'),line('小满','我在王家的井里睡了很久。下过三回雪。后来有人捞起那块布，我就跟到这里来了。'),line('小满','他把一张纸藏到画架背后，说有人看见，就能让别的人回家。你替我看看吧。'),line('旁白','灯在井沿稳稳亮着。小满的影子不再往下坠，却仍没有离开。此刻能偿的，是这一夜的等候。')]);return true
  }
  return false
}

function interactChapter(s:ChapterOneState,id:string):boolean{
  if(id==='mirror'){if(!s.unlocked)say(s,'铜镜里还是自己的脸。先查清青布与沈砚的关系。');else s.puzzle='mirror';return true}
  if(id==='faceless'){
    if(s.stage==='borrow')talk(s,'borrow',[line('无面娘','布、字、活人的认领。三样齐了，这张面才有了来处。'),line('陆知微','借了他的脸，就能知道他经历过什么？'),line('无面娘','能借到落笔的习惯，借不到一生的记忆。谁真心待过他，谁恨过他，都要你自己去问。'),line('旁白','无面娘把薄如蝉翼的面覆在镜上。你伸手触镜，指腹先染上旧墨；再抬眼时，陌生的眉眼已经长在自己脸上。'),line('无面娘','镜前收放。七日内替他了却心愿，归还面皮，方能释魂。此术损命，逾期莫怪我未提醒。记住自己的名字，也别叫一个老人再等一夜。')])
    else say(s,s.unlocked?'你用沈砚的眼睛看见了什么，也别忘了用陆知微的心再想一遍。':'先去戚家。死人留下的东西，有时活人还认得。','无面娘');return true
  }
  if(id==='mother'){
    if(s.stage==='visit')talk(s,'mother-first',[line('陆知微','婆婆，我姓陆。这角青布，是昨夜在客舍后井找到的。您认得么？'),line('戚婆婆','……这针脚是我缝的。阿砚出门总忘带伞，我拿旧衣给他缝了块裹画布。'),line('戚婆婆','他们说他死在牢里了。我连最后一面都没见着。你若是为他来的，把这张字带上。'),line('旁白','她从砚下抽出一页纸。纸上说的不是申冤，而是替一个怕黑的孩子留灯。'),line('陆知微','我会去看看。以我自己的名字答应您。')])
    else if(s.stage==='meal'){
      if(s.face==='self'){say(s,s.flags.toldTruth?'陆先生，陪我吃碗面吧。只是那幅没画完的画，还要借他的眼睛才能看清。':'陆先生，你回来了。茶楼可有消息？','戚婆婆');return true}
      if(!s.flags.identityChosen)talk(s,'identity',[line('戚婆婆','……阿砚？', [{id:'truth',text:'我叫陆知微，借他的面，是为查清他的死。'},{id:'silent',text:'先扶她坐下，暂且不答。'},{id:'mask',text:'娘，我回来了。'}])])
      else s.puzzle='meal'
    }else if(s.unlocked&&!s.flags.toldTruth&&!s.flags.truthRepaired)talk(s,'repair',[line('戚婆婆','你有话要说，是不是？',[{id:'truth',text:'递上托付书，坦白自己是陆知微。'}])])
    else say(s,s.face==='self'?'陆先生，井边那孩子若还冷，家里还有旧棉衣。':'我等过他，也等得起一个愿意替他把事做完的人。','戚婆婆');return true
  }
  if(id==='table'){
    if(!s.flags.tableSeen){s.flags.tableSeen=true;note(s,'饭桌西侧的墨槽磨得发亮，灯座旁有袖口扫过的旧痕。沈砚惯坐西边。')}
    say(s,s.face==='shen'?'指尖落到西侧墨槽时，手腕自然而然收了一下。坐东边，宽袖会碰倒灯。':'西侧桌沿磨得最亮，墨槽里压着深浅不一的陈墨。东侧灯座旁，却没有常年坐人的磨痕。');return true
  }
  if(id==='letter'){say(s,s.evidence.includes('letter')?chapterOneEvidence.letter.text:'砚下压着一张纸。未经主人应允，不宜擅取。');return true}
  if(id.startsWith('fragment-')){gain(s,id);say(s,chapterOneEvidence[id].text);return true}
  if(id==='frame'){s.flags.frameSeen=true;say(s,'画框上缘褪得浅，下缘留着水痕。三片残画该从桥栏接到柳梢，再接井沿；桥栏和山脊两条线，都要续得上。');return true}
  if(id==='painting'){
    if(s.evidence.includes('name'))say(s,'青布上的逆笔已经与画中空处合成一个「满」字。灯影仍在画台另一端。')
    else if(s.stage==='painting')s.puzzle='painting'
    else say(s,'残画仍伏在案上。');return true
  }
  if(id==='playbill'){s.flags.playbillSeen=true;say(s,s.face==='shen'?'戏单三折：候客、归舟、闭门。指尖循到门前的落笔，经过桥心，收在檐下。画师不是按远近点灯，是按归家的次序。':'旧戏单写着：一折候客，二折归舟，三折闭门。纸角的短线像随手涂抹，暂辨不出用意。');return true}
  if(id==='lamps'){if(s.stage==='lamps')s.puzzle='lamps';else say(s,s.evidence.includes('lantern')?'暗屉已经空了。纸灯该照在真人等候的地方。':'画上少了一个名字。先把残画拼完整，再看这三处灯影。');return true}
  if(id==='pigment'){
    if(s.face==='shen'){s.flags.pigmentSeen=true;gain(s,'pigment');say(s,chapterOneEvidence.pigment.text+' 你调起一小碟松烟，收在笔囊里。')}
    else say(s,'一碟发白的胶矾，一碟黑色颜料。只凭抄书时用墨的习惯，分不清画师为什么把它们放在一起。');return true
  }
  if(id==='well'||id==='child'){
    if(s.stage!=='hang'){say(s,s.flags.lanternHung?'纸灯仍在亮着。井里传出很轻的呼吸，像睡熟了。':'井下静悄悄的。沈砚说过，要替这里的孩子留一盏灯。');return true}
    s.flags.lanternHung=true;talk(s,'child',[line('旁白','你把纸灯系在井边。风没有吹灭它；井水反而亮起一点暖色。'),line('小满',s.face==='shen'?'哥哥，你怎么才来？':'你的脸不认得，可你手里的灯，我认得。'),line('陆知微','灯是留给你的。',[{id:'truth',text:'告诉他：我是陆知微，来替沈砚完成托付。'},...(s.face==='shen'?[{id:'promise',text:'借沈砚的声音，轻声答应今晚不再让他等。'}]:[])])]);return true
  }
  if(id==='cache'){
    if(s.stage!=='cache'){say(s,'画架背后的木条严丝合缝，还看不出哪里能打开。');return true}
    if(s.face!=='self'){say(s,'这字不像画上的题款。沈砚的习惯反让我只顾笔势。收起他的面，用自己校书的眼光读一遍。');return true}
    talk(s,'ambush',[line('旁白','依小满所言，你压住画架背面的第三枚木钉。夹层里，一张公文被折得极小。'),line('陆知微','「王宅移囚一名，未入正簿……」这不是旧谱，是县衙的值夜录。押字下的墨色与正文不同，有人后来补过。'),line('旁白','一张背朝外的旧画忽然撑起四肢。纸臂上的红黑墨线，竟与公文的旧印同形。它扑向你手里的纸，你护住残页，退到墙边的铜镜前。'),line('陆知微','它要毁的不是我，是证据。沈砚，再借你的笔一用。'),line('旁白','镜里的眉眼重新覆上你的面目。你执起画笔，退进门外小院，纸傀随即越过门槛。')]);return true
  }
  if(id==='han'){
    if(s.stage==='report')talk(s,'report',[line('韩七',s.face==='shen'?'站住！沈砚的案卷已结，你这张脸从哪里来？':'陆先生，你要问的旧案，我未必能说。'),line('陆知微','先看这张值夜录。无论我长什么样，纸上的名字总不会自己改。'),line('旁白','韩七接过残纸，目光在押字上停了很久。他把纸举向斜阳，指节一点点收紧。'),line('韩七','这是周平的押。可他已经死了。他从前在县衙当差，后来辞了差事做游侠，这笔旧押我认得。'),line('韩七','明日卯时，县衙后门。你若还敢来，我带你看看一个死人怎么值的夜。')])
    else say(s,s.face==='shen'?'沈砚？……不对。你说话的停顿，跟他不一样。若为翻案而来，带实据来。':'近来的案子都不干净。你是外乡人，话不要只听一面。','韩七');return true
  }
  if(id==='tea'||id==='owner'){say(s,s.face==='shen'?'这张脸我认得。前阵子替客舍修灯，手上总沾着墨。官差来拿他时，他只说画还没收好。':'沈画师没多少钱，倒肯替孩子画不要钱的灯。如今一张告示，便把人说成了凶徒。',id==='owner'?'客舍掌柜':'茶摊老板');return true}
  if(id==='notice'){say(s,s.face==='shen'?'告示上的画像并不像你，只有袖口那块墨迹画得很重。作画者见过沈砚，却像故意不画清眉眼。':'「沈某，涉王宅旧案，已于狱中病故。」短短一行没有日期，盖印的地方却压住了原字。');return true}
  return false
}

export function isValidChapterOne(value:unknown):value is ChapterOneState{
  if(!value||typeof value!=='object')return false
  const s=value as ChapterOneState,finite=(n:unknown,min=0,max=100)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max
  if(s.version!==1||!Object.hasOwn(chapterOneStages,s.stage)||!['self','shen'].includes(s.face)||typeof s.unlocked!=='boolean'||typeof s.message!=='string')return false
  if(!s.stats||!finite(s.stats.selfhood)||!finite(s.stats.bond)||!finite(s.stats.trust,-100)||!s.flags||Object.values(s.flags).some(v=>typeof v!=='boolean'))return false
  if(!s.world||!['street','theatre','home','studio','inn','inn_well'].includes(s.world.map)||!['down','up','left','right'].includes(s.world.facing))return false
  const map=chapterOneMap(s);if(!finite(s.world.x,0,map.width*TILE)||!finite(s.world.y,0,map.height*TILE))return false
  if(!Array.isArray(s.evidence)||s.evidence.some(id=>!Object.hasOwn(chapterOneEvidence,id))||!Array.isArray(s.journal)||s.journal.some(t=>typeof t!=='string'))return false
  const validLine=(l:ChapterLine)=>!!l&&typeof l.speaker==='string'&&typeof l.text==='string'&&(!l.choices||Array.isArray(l.choices)&&l.choices.every(c=>typeof c.id==='string'&&typeof c.text==='string'))
  if(!Array.isArray(s.history)||!s.history.every(validLine)||!Array.isArray(s.pieces)||s.pieces.length!==3||new Set(s.pieces.map(p=>p.id)).size!==3||s.pieces.some(p=>!['bridge','tree','well'].includes(p.id)||!Number.isInteger(p.turns)||!finite(p.turns,0,3)))return false
  if(!Array.isArray(s.lampOrder)||s.lampOrder.length>3||s.lampOrder.some((id,i)=>id!==['gate','bridge','eaves'][i]))return false
  if(s.puzzle&&!['meal','painting','lamps','mirror'].includes(s.puzzle))return false
  if(s.dialogue&&(!Array.isArray(s.dialogue.lines)||!s.dialogue.lines.every(validLine)||!Number.isInteger(s.dialogue.index)||!s.dialogue.lines[s.dialogue.index]||typeof s.dialogue.id!=='string'))return false
  if(s.face==='shen'&&!s.unlocked)return false
  if(s.stage==='battle'){
    const b=s.battle
    if(!b||b.context!=='chapter-one'||b.face!=='shen'||!finite(b.hp)||!finite(b.ink,0,6)||!Number.isInteger(b.turn)||b.turn<1||!['active','won','lost'].includes(b.status)||!b.enemy||!finite(b.enemy.hp,0,48)||!finite(b.enemy.skin,0,30)||b.enemy.maxHp!==48||b.enemy.maxSkin!==30||!finite(b.intentIndex,0,4)||!finite(b.exposure,0,2)||!finite(b.mark,0,3)||!finite(b.breaks,0,10000)||!finite(b.damageTaken,0,10000)||!Array.isArray(b.log)||!b.log.every(l=>typeof l.text==='string'&&['player','enemy','system'].includes(l.side)&&Number.isInteger(l.turn)))return false
  }else if(s.battle)return false
  return true
}
