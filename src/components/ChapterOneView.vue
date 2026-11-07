<script setup lang="ts">
import {computed,onMounted,onUnmounted,ref} from 'vue'
import type {GameState} from '../game/types'
import {chapterOneEvidence,chapterOneStages,chapterOneCanChangeFace,type ChapterOneCommand} from '../game/chapter-one'
import {chapterOneMap,chapterOneGuidance} from '../game/chapter-one-world'
import {navigationLock,type NavigationId} from '../game/navigation'
import {getDialoguePortrait,characterPortraits} from '../game/portraits'
import {assetUrl} from '../game/asset-url'
import {useSceneMusic} from '../game/music'
import {musicSceneForMap} from '../game/music-data'
import WorldMapPanel from './WorldMapPanel.vue'
import WorldView from './WorldView.vue'
import DialoguePortrait from './DialoguePortrait.vue'
import ScreenPages from './ScreenPages.vue'
import TaskGuide from './TaskGuide.vue'
import GameDock from './GameDock.vue'
import MusicControls from './MusicControls.vue'
import ChapterPainting from './ChapterPainting.vue'
import CombatPreview from './CombatPreview.vue'
import '../chapter-one.css'

const props=withDefaults(defineProps<{state:GameState;paused?:boolean;motion?:boolean;preview?:boolean}>(),{motion:true})
const emit=defineEmits<{command:[value:ChapterOneCommand];exit:[];save:[];settings:[];restart:[]}>()
const c=computed(()=>props.state.chapterOne!)
const localPanel=ref(''),selected=ref<number>(),notice=ref('')
// Position updates must not rebuild the canvas background every animation frame.
const map=computed(()=>chapterOneMap(c.value))
const guidance=computed(()=>chapterOneGuidance(c.value))
const current=computed(()=>c.value.dialogue?.lines[c.value.dialogue.index])
const portrait=computed(()=>current.value?getDialoguePortrait(current.value.speaker==='陆知微'&&c.value.face==='shen'?'你':current.value.speaker,'shen'):undefined)
const paused=computed(()=>props.paused||!!localPanel.value||!!c.value.puzzle||!!c.value.dialogue||c.value.stage==='complete')
const labels:Record<string,string>={tasks:'任务指引',map:'未闻县 · 行迹',bag:'行囊',faces:'面谱',people:'相逢之人',journal:'因果录',meal:'两双筷子',painting:'残画里的名字',lamps:'画中未亮的灯',mirror:'镜前借相'}
const panelName=computed(()=>localPanel.value||c.value.puzzle||'')
const people=computed(()=>[characterPortraits.self,characterPortraits.faceless,...(c.value.evidence.includes('letter')?[characterPortraits.mother]:[]),...(c.value.unlocked?[characterPortraits.shen]:[]),...(c.value.flags.lanternHung?[characterPortraits.child]:[]),characterPortraits.han])
useSceneMusic(()=>c.value.battle?(c.value.battle.status==='active'?'battle':c.value.battle.status==='won'?'victory':'defeat'):musicSceneForMap(c.value.world.map,c.value.stage==='report'?'dusk':'day'),10)
function send(command:ChapterOneCommand){if(!props.paused)emit('command',command)}
function open(id:NavigationId){
  if(props.paused)return
  const reason=navigationLock(props.state,id);if(reason){notice.value=reason;return}
  notice.value=''
  if(id==='save'){emit('save');return}
  if(id==='tasks'){localPanel.value=localPanel.value==='tasks'?'':'tasks';return}
  if(c.value.dialogue||c.value.puzzle){notice.value='先收起眼前的对话或物件，再翻行囊。';return}
  localPanel.value=localPanel.value===id?'':id
}
function close(){if(localPanel.value){localPanel.value='';notice.value='';return}selected.value=undefined;notice.value='';send({type:'close'})}
function pick(index:number){if(selected.value===undefined)selected.value=index;else{send({type:'swap',a:selected.value,b:index});selected.value=undefined}}
function key(e:KeyboardEvent){
  if(props.paused||e.repeat)return
  if(e.key==='Escape'&&panelName.value){e.preventDefault();close();return}
  if(['BUTTON','INPUT','TEXTAREA','SELECT'].includes((e.target as HTMLElement)?.tagName))return
  if(!localPanel.value&&current.value&&!current.value.choices&&(e.code==='Space'||e.code==='Enter')){e.preventDefault();send({type:'next'})}
}
onMounted(()=>window.addEventListener('keydown',key))
onUnmounted(()=>window.removeEventListener('keydown',key))
</script>

<template>
  <main class="chapter-one" :class="{'chapter-preview':preview,'motion-off':!motion}" :data-stage="c.stage" :data-face="c.face" aria-label="第一章 借皮入世">
    <header class="chapter-header"><button class="chapter-brand" @click="emit('exit')" aria-label="返回首页">画皮 <span>千面</span></button><div><small>第一日 · {{c.stage==='report'||c.stage==='complete'?'黄昏':'日间'}}</small><b>借皮入世</b></div><nav><MusicControls/><button v-if="preview" @click="localPanel='reset'">重开</button><button v-else @click="emit('settings')" aria-label="设置">设置</button></nav></header>

    <CombatPreview v-if="c.battle" :story-battle="c.battle" :paused="paused" @action="send({type:'combat',action:$event})" @next="send({type:'collect'})" @retry="send({type:'retry'})"/>

    <section v-else class="chapter-world">
      <WorldView :world="c.world" :paused="paused" :night="c.stage==='report'" :appearance="c.face" :motion="motion" :map-override="map" quest="" :hints="map.spots.filter(p=>p.kind!=='door').map(p=>p.id)" :primary-hints="guidance" @position="send({type:'position',world:$event})" @interact="send({type:'interact',id:$event.id})"/>
      <span v-if="!paused" class="chapter-stage-label">{{c.face==='self'?'陆知微 · 本相':'沈砚 · 借面'}}</span>
      <template v-if="current">
        <DialoguePortrait :portrait="portrait"/>
        <section class="chapter-dialogue" role="dialog" aria-label="当前剧情" :key="`${c.dialogue?.id}-${c.dialogue?.index}`">
          <header><strong>{{current.speaker}}</strong><small>{{c.dialogue!.index+1}} / {{c.dialogue!.lines.length}}</small></header>
          <ScreenPages><p>{{current.text}}</p><div v-if="current.choices" class="chapter-choices"><button v-for="choice in current.choices" :key="choice.id" :disabled="props.paused" @click="send({type:'choice',id:choice.id})">{{choice.text}}</button></div></ScreenPages>
          <footer v-if="!current.choices"><span>轻触继续 · 空格</span><button :disabled="props.paused" @click="send({type:'next'})">继续 →</button></footer>
        </section>
      </template>
    </section>

    <GameDock v-if="!c.battle&&c.stage!=='complete'" :state="state" :active="localPanel" @open="open"/>
    <p v-if="notice&&!panelName" class="chapter-notice" role="status"><button @click="notice=''" aria-label="收起提示">×</button>{{notice}}</p>

    <section v-if="panelName" class="chapter-overlay" role="dialog" :aria-label="labels[panelName]||'重新试玩'" :inert="props.paused">
      <header><div><small>借皮入世</small><h2>{{labels[panelName]||'重新试玩'}}</h2></div><button @click="close" aria-label="收起面板">收起 ×</button></header>
      <ScreenPages :key="panelName" class="chapter-panel-pages">
        <TaskGuide v-if="panelName==='tasks'" :chapter-one="c"/>
        <template v-else-if="panelName==='meal'">
          <p>戚婆婆把两双筷子摆在桌上，说沈砚从前总坐东边。她在等你落座。</p>
          <div class="meal-table"><div class="meal-lamp">灯</div><span>西 · 墨槽</span><i>两双筷子</i><span>东 · 灯座</span></div>
          <p v-if="c.flags.tableSeen" class="chapter-clue">已见：西侧桌沿与墨槽磨得最亮；宽袖从东侧伸过，会碰到灯。</p><p v-else>桌边似有旧痕。可以先收起面板，细看饭桌。</p>
          <div class="chapter-buttons"><button @click="send({type:'seat',seat:'west'})">坐西边，收住袖口</button><button @click="send({type:'seat',seat:'east'})">依她所言，坐东边</button></div>
        </template>
        <template v-else-if="panelName==='painting'">
          <p>先选一片，再点另一片交换位置；各片可以转动。沿桥栏与远山接好断线。</p>
          <div class="painting-fragments"><article v-for="(piece,index) in c.pieces" :key="index" :class="{selected:selected===index}"><button class="fragment-image" :aria-label="`选择第${index+1}片残画`" :aria-pressed="selected===index" :disabled="c.flags.paintingAligned||!c.evidence.includes(`fragment-${piece.id}`)" @click="pick(index)"><ChapterPainting v-if="c.evidence.includes(`fragment-${piece.id}`)" :piece="piece.id" :turns="piece.turns"/><span v-else>缺页</span></button><button :disabled="c.flags.paintingAligned||!c.evidence.includes(`fragment-${piece.id}`)" :aria-label="`转动第${index+1}片残画`" @click="send({type:'rotate',index})">转动 ↻</button></article></div>
          <p v-if="c.flags.frameSeen" class="chapter-clue">画框：上缘浅、下缘深；桥栏 → 柳梢 → 井沿，山脊与桥栏须同时相续。</p>
          <div class="chapter-buttons"><button v-if="!c.flags.paintingAligned" @click="send({type:'assemble'})">检视接缝</button><button v-else @click="send({type:'overlay'})">覆上青布，辨认余墨</button></div>
        </template>
        <template v-else-if="panelName==='lamps'">
          <ChapterPainting :lamps="c.lampOrder" name-revealed/>
          <p v-if="c.flags.playbillSeen">戏单：候客 · 归舟 · 闭门。{{c.face==='shen'?'画中笔锋起于门，穿桥而过，收于檐。':'画上的细线，还需画师的眼睛辨认。'}}</p><p v-else>三盏灯都未亮。案边的旧戏单似有次序。</p>
          <div class="chapter-buttons lamp-buttons"><button v-for="lamp in [{id:'gate',name:'门灯'},{id:'bridge',name:'桥灯'},{id:'eaves',name:'檐灯'}]" :key="lamp.id" :aria-pressed="c.lampOrder.includes(lamp.id)" @click="send({type:'lamp',id:lamp.id})">{{lamp.name}} {{c.lampOrder.includes(lamp.id)?'●':'○'}}</button></div>
        </template>
        <template v-else-if="panelName==='mirror'||panelName==='faces'">
          <p>陆知微善辨文书；沈砚能认画中余墨。换面不消耗时辰，需站到场景中的铜镜前。</p>
          <div class="chapter-faces"><article v-for="face in [{id:'self' as const,title:'陆知微',role:'本相 · 校书辨字',portrait:characterPortraits.self},{id:'shen' as const,title:'沈砚',role:'画师 · 观墨破相',portrait:characterPortraits.shen}]" :key="face.id"><img :src="face.portrait.src" :alt="face.title"/><h3>{{face.title}}</h3><p>{{face.role}}</p><button :disabled="!chapterOneCanChangeFace(c)||c.face===face.id||panelName!=='mirror'" @click="send({type:'face',face:face.id})">{{c.face===face.id?'此刻面目':face.id==='self'?'收起借面':'借沈砚之面'}}</button></article></div>
          <p v-if="panelName==='faces'">面谱只记所借之面。要收放面容，请走近地图上的铜镜。</p>
          <div class="chapter-growth"><span>本心 <b>{{c.stats.selfhood}}</b></span><span>画师共鸣 <b>{{c.stats.bond}}</b></span><span>婆婆信任 <b>{{c.stats.trust}}</b></span></div>
        </template>
        <template v-else-if="panelName==='bag'"><p>青布、纸灯与文书都有各自的去处。</p><article v-for="id in c.evidence" :key="id" class="chapter-entry"><h3>{{chapterOneEvidence[id].name}}</h3><p>{{chapterOneEvidence[id].text}}</p></article></template>
        <template v-else-if="panelName==='journal'"><p class="chapter-clue">{{chapterOneStages[c.stage].goal}}</p><div class="chapter-growth"><span>本心 {{c.stats.selfhood}}</span><span>画师共鸣 {{c.stats.bond}}</span><span>婆婆信任 {{c.stats.trust}}</span></div><article v-for="(entry,i) in c.journal" :key="entry" class="chapter-entry"><small>第 {{i+1}} 笔</small><p>{{entry}}</p></article><h3>近来对话</h3><article v-for="(entry,i) in c.history.slice(-12)" :key="i" class="chapter-entry"><h3>{{entry.speaker}}</h3><p>{{entry.text}}</p></article></template>
        <template v-else-if="panelName==='people'"><article v-for="person in people" :key="person.id" class="chapter-person"><img :src="person.src" :alt="person.name"/><div><h3>{{person.name}}</h3><p>{{person.role}}</p><p v-if="person.id==='mother'">{{c.flags.toldTruth?'已知你是陆知微。':'仍在借来的眉眼里找她的孩子。'}} · 信任 {{c.stats.trust}}</p><p v-if="person.id==='child'">{{c.flags.lanternHung?'客舍后井已有一盏灯。旧日冤屈仍待查清。':''}}</p></div></article></template>
        <template v-else-if="panelName==='map'"><p>此刻：{{map.name}} · {{chapterOneStages[c.stage].title}}</p><WorldMapPanel :state="state"/><p>走到出入口进入相邻场景；“寻路”可自动走到人物或物件旁。光圈开关在底栏。</p><p class="chapter-clue">{{chapterOneStages[c.stage].goal}}</p></template>
        <template v-else-if="panelName==='reset'"><p>从青布入章重新试玩？这会清除本页的第一章试玩进度。</p><button class="chapter-primary" @click="localPanel='';emit('restart')">重新试玩</button></template>
        <p v-if="c.message" class="chapter-clue" role="status">{{c.message}}</p>
      </ScreenPages>
    </section>

    <section v-if="c.stage==='complete'" class="chapter-ending" aria-label="第一章结束">
      <img :src="assetUrl('/assets/opening/ink/guestroom-storm.webp')" alt=""/>
      <div><small>卷一终 · 借皮入世</small><h1>死人留下的押</h1><ScreenPages><blockquote>「这是周平的押。可他已经死了。」</blockquote><p>风把半页残纸吹得轻响。你借了一张脸，留下了一盏灯；现在，要去问另一个死人的名字。</p><p>{{c.flags.toldTruth?'戚婆婆知道了陆知微的名字。':'戚婆婆仍在等一句迟来的实话。'}} {{c.flags.childTruth?'小满知道等来的不是沈砚，却仍收下了灯。':'小满在熟悉的声音里安静下来，那份承诺还留在你身上。'}}</p><div class="chapter-growth"><span>本心 {{c.stats.selfhood}}</span><span>画师共鸣 {{c.stats.bond}}</span><span>婆婆信任 {{c.stats.trust}}</span></div><p class="chapter-next">第二日 · 纸上囚人<br/><small>后续章节尚未开放。本章进度已保留。</small></p></ScreenPages><div class="chapter-ending-actions"><button v-if="preview" @click="emit('restart')">重新试玩本章</button><button class="chapter-primary" @click="emit('exit')">返回首页 →</button></div></div>
    </section>
  </main>
</template>
