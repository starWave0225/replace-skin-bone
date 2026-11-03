<script setup lang="ts">
import Icon from './Icon.vue'
import { musicState, setMusicEnabled, setMusicVolume } from '../game/music'
import '../music.css'
function toggle() {
  const enabled = !musicState.enabled
  if (enabled && musicState.volume === 0) setMusicVolume(.4)
  setMusicEnabled(enabled)
}
</script>
<template>
  <button class="music-switch" :class="{ 'music-on': musicState.enabled }" :aria-label="musicState.enabled ? '关闭配乐' : '开启配乐'" :aria-pressed="musicState.enabled" :title="musicState.enabled ? '关闭配乐与环境声' : '开启配乐与环境声'" @click.stop="toggle" @keydown.stop>
    <Icon :name="musicState.enabled ? 'sound' : 'mute'" :size="18"/>
    <span>配乐 · {{musicState.enabled ? '开' : '关'}}</span>
  </button>
</template>
