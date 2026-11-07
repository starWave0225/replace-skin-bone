<script setup lang="ts">
import { computed, ref } from 'vue'
import Icon from './Icon.vue'
import { assetUrl } from '../game/asset-url'
import { activities, locations } from '../game/catalog'
import { activityReason } from '../game/engine'
import type { Activity, GameState, Location } from '../game/types'

const props = defineProps<{ state: GameState }>()
const emit = defineEmits<{ track: [activity: Activity] }>()
const artwork = assetUrl('/assets/maps/weiwen-county.webp')

// Landmarks and road bends are aligned to the painted scene on a 1000 × 625 grid.
const places = [
  { id: 'inn_well', x: 132, y: 168, note: '从客舍东厢的后门去后院。' },
  { id: 'inn', x: 169, y: 273, note: '西街外的客舍，东厢通往后井。' },
  { id: 'theatre', x: 273, y: 480, note: '西街尽处的茶楼，从南街过石桥可到。' },
  { id: 'street', x: 500, y: 356, note: '北侧通县衙，东边可去戚家，过桥便到茶楼。' },
  { id: 'yamen', x: 548, y: 179, note: '从南街北侧偏西的门进入。' },
  { id: 'home', x: 818, y: 355, note: '从南街北侧偏东的门入院。' },
  { id: 'studio', x: 780, y: 510, note: '南街过桥向东，沈记纸铺旁的画舍。戚婆婆交给你钥匙后可入。' },
  { id: 'well', x: 820, y: 218, note: '穿过戚家小院北门，便到后井。' },
] as const satisfies readonly { id: Location; x: number; y: number; note: string }[]

const visiblePlaces=computed(()=>places.filter(p=>props.state.chapterOne?!['well','yamen'].includes(p.id):p.id!=='studio'))
type Place = typeof places[number]['id']
const roads: readonly { from: Place; to: Place; d: string }[] = [
  { from: 'inn_well', to: 'inn', d: 'M132 168 C165 174 202 177 218 192 C228 214 225 249 208 266 Q191 276 169 273' },
  { from: 'inn', to: 'theatre', d: 'M169 273 C185 291 210 288 218 308 C231 324 264 318 291 329 C313 338 330 358 351 377 C369 393 370 409 353 422 C338 456 309 470 273 480' },
  { from: 'theatre', to: 'street', d: 'M273 480 C322 477 366 455 396 432 C437 396 481 393 527 413 Q541 417 543 397 Q528 369 500 356' },
  { from: 'street', to: 'yamen', d: 'M500 356 C530 336 557 302 570 280 Q595 244 599 225 Q583 205 548 179' },
  { from: 'street', to: 'home', d: 'M500 356 C535 370 549 391 587 391 C648 391 695 385 742 371 Q788 357 818 355' },
  { from: 'street', to: 'studio', d: 'M500 356 Q527 413 580 460 Q665 495 780 510' },
  { from: 'home', to: 'well', d: 'M818 355 C865 364 910 349 923 312 C938 271 899 260 865 253 Q841 240 820 218' },
]

const visibleRoads=computed(()=>roads.filter(r=>visiblePlaces.value.some(p=>p.id===r.from)&&visiblePlaces.value.some(p=>p.id===r.to)))
const prologue = computed(() => props.state.prologue)
const current = computed(() => prologue.value?.world.map ?? props.state.world?.map ?? 'theatre')
const currentLabel = computed(() => prologue.value?.phase === 'dream' ? '梦中雪宅' : locations[current.value].name)
const selection = ref<Place>()
const activePlace = computed(() => selection.value ?? current.value)
const selectedPlace = computed(() => places.find(place => place.id === selection.value))
const note = computed(() => {
  const chapter = prologue.value
  const place = selectedPlace.value
  if (!place) return '点图上地点，查看相邻道路和入口。'
  if (!chapter) return place.note

  if (place.id === 'inn_well') return '从客舍东厢进入后堂。问过无面娘枯井的事再来。'
  if (place.id === 'theatre') return '沿街巷往西走，茶楼里有一条上二楼的木梯。'
  return place.note
})
const activityEntries = computed(() => prologue.value || props.state.chapterOne ? [] : activities.map(activity => ({
  activity, reason: activityReason(props.state, activity),
})))
</script>

<template>
  <section class="county-atlas">
    <div class="county-sheet">
      <img class="county-art" :src="artwork" alt="斜俯视的未闻县全景，山坡下有客舍，石桥相连两岸，街巷旁有茶楼、县衙和戚家小院。" width="1586" height="992"/>
      <svg class="county-roads" viewBox="0 0 1000 625" preserveAspectRatio="none" aria-hidden="true">
        <g v-for="road in visibleRoads" :key="road.from + road.to" :class="{ 'county-road-active': road.from === activePlace || road.to === activePlace }">
          <path class="county-road-edge" :d="road.d"/>
          <path class="county-road-dash" :d="road.d"/>
        </g>
      </svg>
      <button v-for="place in visiblePlaces" :key="place.id" type="button" class="county-pin"
        :class="{ 'county-here': place.id === current }"
        :style="{ left: `${place.x / 10}%`, top: `${place.y / 6.25}%` }"
        :aria-label="locations[place.id].name" :aria-current="place.id === current ? 'location' : undefined"
        :aria-pressed="selection === place.id"
        @click="selection = selection === place.id ? undefined : place.id">
        <span class="county-pin-dot" aria-hidden="true"></span>
        <span class="county-pin-name" aria-hidden="true">{{ locations[place.id].name }}</span>
      </button>
    </div>

    <div class="county-caption">
      <div class="county-position"><i aria-hidden="true"></i><span>当前所在</span><strong>{{ currentLabel }}</strong></div>
      <div class="county-detail" aria-live="polite">
        <strong v-if="selectedPlace">{{ locations[selectedPlace.id].name }}</strong>
        <span>{{ note }}</span>
      </div>
    </div>

    <details v-if="activityEntries.length" class="county-activities">
      <summary tabindex="0">寻访去处<span v-if="state.mode === 'hub'">余力 {{ state.actionPoints }} 点</span></summary>
      <div class="map-activities">
        <button v-for="{ activity, reason } in activityEntries" :key="activity.id" class="map-activity" :disabled="!!reason" @click="emit('track', activity)">
          <span class="activity-mark">{{ activity.mark }}</span>
          <span><b>{{ activity.title }}</b><small>{{ reason || `${locations[activity.location].name} · 消耗一点行动` }}</small></span>
          <Icon :name="state.completed.includes(activity.id) ? 'check' : 'arrow'" :size="17"/>
        </button>
      </div>
    </details>
  </section>
</template>

<style scoped>
:global(#app .panel-map) {
  width: min(100%, 1180px, max(360px, calc(145dvh - 280px)));
  color: #e7d4ae;
  background: #242722;
  outline-color: #1d211d;
  border-color: #827050;
}
:global(#app .panel-map .modal-header) { padding: 12px clamp(14px, 2.6vw, 28px); border-color: #9d855440; }
:global(#app .panel-map .modal-header h2) { color: #f2dfb8; font-size: clamp(25px, 3vw, 38px); line-height: 1.1; margin: 3px 0 0; }
:global(#app .panel-map .modal-header .eyebrow) { color: #c8a776; font-size: 11px; }
:global(#app .panel-map .close-button) { color: #e8d2a7; border-color: #b5996477; }
:global(#app .panel-map .modal-content) { display: block; padding: 0; overflow-y: auto; overscroll-behavior: contain; }
:global(#app .panel-map .modal-footer) { display: none; }
.county-sheet { position: relative; isolation: isolate; background: #555247; }
.county-art { display: block; width: 100%; height: auto; }
.county-roads { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.county-roads path { fill: none; stroke-linecap: round; stroke-dasharray: 4 5; }
.county-road-edge { stroke: #2e2118; stroke-width: 4; opacity: .6; }
.county-road-dash { stroke: #f4dfb3; stroke-width: 1.8; opacity: .74; }
.county-road-active .county-road-edge { opacity: .95; }
.county-road-active .county-road-dash { stroke: #ffd583; stroke-width: 2.8; opacity: 1; }
.county-pin {
  position: absolute; transform: translate(-50%, -50%); z-index: 1;
  display: flex; align-items: center; justify-content: center; gap: 5px;
  min-width: 44px; min-height: 44px; padding: 0; border: 0; background: transparent;
}
.county-pin-dot, .county-position i {
  width: 12px; height: 12px; flex: none; transform: rotate(45deg);
  background: #dcb77b; border: 1px solid #f8e4b3; box-shadow: 0 0 0 2px #2c251b, 0 2px 6px #120e08;
}
.county-pin-name {
  position: absolute; top: calc(50% + 9px); left: 50%; transform: translateX(-50%);
  padding: 2px 8px; background: #242722f5; color: #f8e6bf; border: 1px solid #a68658;
  white-space: nowrap; font-size: clamp(11px, 1.45vw, 16px); font-weight: bold; line-height: 1.4;
}
.county-pin:hover, .county-pin:focus-visible, .county-pin[aria-pressed="true"] { z-index: 2; }
.county-pin[aria-pressed="true"] .county-pin-name { background: #eed3a0; color: #33281d; border-color: #fae3b5; }
.county-here .county-pin-dot, .county-position i { background: #a83c30; }
.county-here .county-pin-name { border-color: #da997a; }
.county-pin:focus-visible, .county-activities summary:focus-visible { outline: 2px solid #f4dbac; outline-offset: 2px; }
.county-caption {
  display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 24px;
  min-height: 45px; padding: 10px clamp(14px, 2.6vw, 28px); font-size: 14px; background: #2b3028;
}
.county-position, .county-detail { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 8px; }
.county-position { color: #d4b888; }
.county-position i { align-self: center; margin-right: 2px; width: 8px; height: 8px; }
.county-position strong, .county-detail strong { color: #f5dfb8; }
.county-detail { color: #e0d0ae; }
.county-activities { padding: 0 clamp(14px, 2.6vw, 28px); border-top: 1px solid #b1935c55; }
.county-activities summary { padding: 8px 0; color: #e5cf9d; cursor: pointer; font-size: 14px; }
.county-activities summary span { float: right; }
.county-activities .map-activities { margin: 0 0 12px; }
.county-activities .map-activity { color: #eadab8; background: #30362c; border-color: #ab916664; }
.county-activities .map-activity:not(:disabled):hover { background: #3c4435; }
.county-activities .map-activity small { color: #cdbb99; }
@media (max-width: 600px) {
  .county-pin-name { padding: 1px 4px; }
  .county-pin-dot { width: 9px; height: 9px; }
  .county-pin-name { top: calc(50% + 6px); }
  .county-caption { row-gap: 5px; font-size: 13px; }
}
</style>
