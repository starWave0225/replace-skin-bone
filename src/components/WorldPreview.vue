<script setup lang="ts">
import { computed, ref } from 'vue'
import WorldView from './WorldView.vue'
import MusicControls from './MusicControls.vue'
import { useSceneMusic } from '../game/music'
import { musicSceneForMap } from '../game/music-data'
import { worldMaps, worldSpawn } from '../game/world'
import type { WorldSpot } from '../game/world'
import type { Location, WorldState } from '../game/types'
import type { PlayerAppearance } from '../game/player-sprite'
const location=ref<Location>('street'),world=ref(worldSpawn('street',[20,11])),night=ref(false),appearance=ref<PlayerAppearance>('self'),message=ref('')
useSceneMusic(computed(() => musicSceneForMap(location.value, night.value ? 'night' : 'day')))
function visit(id:Location,arrival?:[number,number]){location.value=id;world.value=worldSpawn(id,arrival);message.value=''}
function interact(spot:WorldSpot){if(spot.destination)visit(spot.destination,spot.arrival);else message.value=`${spot.name}：请在正式剧情中交谈。`}
function remember(value:WorldState){if(value.map===location.value)world.value=value}
</script>
<template>
  <main class="world-preview-page"><header><a href="./" class="world-preview-logo">画皮 <span>借面</span></a><div><b>未闻县行图</b><p>青瓦旧墙，雨后苔生。</p></div><MusicControls/><a href="./">返回首页 ↗</a></header>
    <section class="world-preview-controls" aria-label="行图预览设置"><label>场景<select v-model="location" @change="visit(location)"><option v-for="map in Object.values(worldMaps)" :key="map.id" :value="map.id">{{map.name}}</option></select></label><label>形貌<select v-model="appearance"><option value="self">陆知微</option><option value="shen">沈砚之面</option><option value="guard">周平之面</option><option value="nameless">无相之身</option></select></label><button @click="night=!night">{{night?'切至白昼':'切至夜雨'}}</button><span>WASD 行走 · E 交互 · 点击寻路</span></section>
    <div class="world-preview-map"><WorldView :key="world.map" :world="world" :paused="false" :night="night" :appearance="appearance" :motion="true" quest="走近出口，按 E 切换场景。" @position="remember" @interact="interact"/></div>
    <footer><p role="status">{{message||'行图试玩，不影响剧情存档。'}}</p><a href="https://pixel-boy.itch.io/ninja-adventure-asset-pack" target="_blank" rel="noopener">像素素材：Pixel-Boy / AAA · CC0 ↗</a></footer>
  </main>
</template>
<style>
.world-preview-page{max-width:1540px;margin:auto;padding:0 30px 18px;background:#19231e;min-height:100svh}.world-preview-page>header{height:94px;display:flex;align-items:center;gap:28px;border-bottom:1px solid var(--line)}.world-preview-logo{font:42px MaShan,serif;text-decoration:none;color:#d9cfac}.world-preview-logo>span{font-size:21px;color:#b98262;border:1px solid #955e47;padding:5px}.world-preview-page>header>div{border-left:1px solid var(--line);padding-left:26px}.world-preview-page>header b{font-size:18px;font-weight:400;letter-spacing:4px}.world-preview-page>header p{font-size:14px;color:#8d9b83;letter-spacing:2px;margin-top:9px}.world-preview-page>header>a:last-child{margin-left:auto;font-size:15px;text-decoration:none;color:#aa9b74}.world-preview-controls{display:flex;gap:20px;align-items:center;padding:16px 0;flex-wrap:wrap}.world-preview-controls label{display:flex;align-items:center;gap:10px;color:#a5b097;font-size:15px;letter-spacing:2px}.world-preview-controls select{padding:7px 10px;border:1px solid #a79a6f55;color:#d4c8a8;background:#263228;max-width:175px;font-size:15px}.world-preview-controls button{padding:9px 14px;border:1px solid #a79a6f55;color:#c1b88f;font-size:15px}.world-preview-controls>span{margin-left:auto;font-size:14px;color:#8d9c83}.world-preview-map{height:calc(100svh - 225px);min-height:430px;border:1px solid #a99e6d44;position:relative;overflow:hidden}.world-preview-map .world-view{height:100%;position:relative}.world-preview-page>footer{display:flex;justify-content:space-between;gap:20px;font-size:14px;color:#889a80;padding-top:15px;line-height:1.8}.world-preview-page>footer a{color:#a99970;flex-shrink:0}@media(max-width:700px){.world-preview-page{padding:0 14px 18px}.world-preview-page>header{height:76px;gap:14px}.world-preview-logo{font-size:34px}.world-preview-page>header>div{padding-left:14px}.world-preview-page>header p{display:none}.world-preview-page>header b{font-size:16px;letter-spacing:2px}.world-preview-controls{gap:12px}.world-preview-controls>span{width:100%;margin:0;font-size:14px}.world-preview-controls label{font-size:14px;gap:6px}.world-preview-controls select{max-width:140px;font-size:14px}.world-preview-controls button{padding:8px 10px;font-size:14px}.world-preview-map{min-height:480px;height:calc(100svh - 254px)}.world-preview-page>footer{flex-direction:column;gap:8px}}
.world-preview-map .world-view{min-height:0}
</style>
