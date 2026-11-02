<script setup lang="ts">
import { ref } from 'vue'
import { currentMusic, musicState, setMusicEnabled, setMusicVolume, previewMusic, followSceneMusic } from '../game/music'
import { musicAuthor, musicLicense, musicScenes, musicTracks } from '../game/music-data'
import '../music.css'
const menu = ref<HTMLDetailsElement>()
const emit = defineEmits<{ open: [value: boolean] }>()
function toggle() { emit('open', !!menu.value?.open) }
function close() { if (menu.value) menu.value.open = false }
function time(value: number) { return `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}` }
</script>
<template>
  <details ref="menu" class="music-controls" @toggle="toggle" @keydown.esc.stop="close" @keydown.stop @pointerdown.stop>
    <summary :class="{ 'music-on': musicState.playing }">♫ {{musicState.playing ? '配乐' : '开启配乐'}}</summary>
    <section class="music-panel" aria-label="场景配乐" @click.stop>
      <header><span>声入槐阴</span><button aria-label="收起配乐面板" @click="close">×</button></header>
      <p class="music-scene">{{musicState.preview ? '选曲试听' : musicScenes[musicState.scene].name}} · {{musicState.preview ? '暂用此曲' : '随场景切换'}}</p>
      <h2>{{currentMusic.label}}</h2><p class="music-mood">{{currentMusic.mood}}</p>
      <p class="music-status" role="status">{{musicState.error || (musicState.loading ? '正在载入配乐…' : musicState.playing ? `播放中 ${time(musicState.elapsed)} / ${time(musicState.duration)}` : '点击播放，听此间声色。')}}</p>
      <div class="music-actions"><button @click="setMusicEnabled(!musicState.playing || !!musicState.error)">{{musicState.playing ? '暂停配乐' : '播放配乐'}}</button><button v-if="musicState.preview" @click="followSceneMusic">跟随场景</button></div>
      <label class="music-volume">声量 <input type="range" :value="musicState.volume" min="0" max="1" step=".05" aria-label="配乐音量" @input="setMusicVolume(Number(($event.target as HTMLInputElement).value))"/><span>{{Math.round(musicState.volume * 100)}}%</span></label>
      <details class="music-library"><summary>场景曲目 · 七阕</summary><ol><li v-for="track in musicTracks" :key="track.id"><div><b>{{track.label}}</b><span>{{track.scenes}}</span><small>{{track.title}}</small></div><button :aria-label="`试听${track.label}`" :aria-pressed="currentMusic.id === track.id && musicState.playing" @click="previewMusic(track.id)">试听</button><a :href="track.source" target="_blank" rel="noopener noreferrer" :aria-label="`${track.title}官方来源`">来源 ↗</a></li></ol></details>
      <footer>音乐：{{musicAuthor}}<br/><a :href="currentMusic.source" target="_blank" rel="noopener noreferrer">{{currentMusic.title}} ↗</a> · <a :href="musicLicense" target="_blank" rel="noopener noreferrer">CC BY 4.0</a><br/>游戏内中文曲签为场景名，原曲名称见署名。<br/>本地播放 · 切景淡入淡出 · 切到后台暂停</footer>
    </section>
  </details>
</template>
