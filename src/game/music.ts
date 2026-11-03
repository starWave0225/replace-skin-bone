import { assetUrl } from './asset-url'
import { computed, onUnmounted, reactive, watch, type MaybeRefOrGetter, toValue } from 'vue'
import { musicScenes, musicTracks, type MusicScene, type MusicTrackId } from './music-data'
import { MusicPlayer } from './music-player'
import { setAudio } from './audio'

const savedVolume = (() => { try { const v = localStorage.getItem('huapi-music-volume'); return v === null ? .4 : Math.min(1, Math.max(0, Number(v))) } catch { return .4 } })()
export const musicState = reactive({ enabled: false, volume: Number.isFinite(savedVolume) ? savedVolume : .4, scene: 'title' as MusicScene, preview: undefined as MusicTrackId | undefined, playing: false, loading: false, error: '', elapsed: 0, duration: 0 })
export const currentMusic = computed(() => musicTracks.find(track => track.id === (musicState.preview ?? musicScenes[musicState.scene].track))!)
const player = new MusicPlayer(id => {
  const media = new Audio()
  media.preload = 'auto'
  const extension = media.canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'm4a'
  media.src = assetUrl(`/assets/music/${id}.${extension}`)
  media.addEventListener('error', () => {
    if (player.media !== media || !musicState.enabled) return
    player.stop(); musicState.loading = false; musicState.playing = false; musicState.error = '配乐载入失败，请重试。'
  })
  return media
})
player.setVolume(musicState.volume)
let request = 0, ticker: ReturnType<typeof setInterval> | undefined
const owners = new Map<symbol, { scene: MusicScene; priority: number; order: number }>()
let order = 0
function updateScene() {
  const active = [...owners.values()].sort((a, b) => b.priority - a.priority || b.order - a.order)[0]
  if (!active) { ++request; player.stop(); void setAudio(false); musicState.playing = false; musicState.loading = false; if (ticker) clearInterval(ticker); ticker = undefined; return }
  const scene = active.scene
  if (scene !== musicState.scene) { musicState.preview = undefined; musicState.scene = scene }
  if (!ticker) ticker = setInterval(() => {
    const media = player.media
    musicState.elapsed = media?.currentTime ?? 0
    musicState.duration = media && Number.isFinite(media.duration) ? media.duration : 0
  }, 500)
}
async function syncPlayback() {
  const token = ++request
  musicState.error = ''; musicState.loading = false
  if (!musicState.enabled || document.hidden || !owners.size) { player.stop(); musicState.playing = false; void setAudio(false); return }
  if (player.track !== currentMusic.value.id) { musicState.elapsed = 0; musicState.duration = 0 }
  musicState.loading = true
  try {
    const success = await player.play(currentMusic.value.id)
    if (token !== request || !success) return
    musicState.playing = true; musicState.loading = false
    musicState.elapsed = player.media?.currentTime ?? 0
    musicState.duration = player.media && Number.isFinite(player.media.duration) ? player.media.duration : 0
    // Quiet procedural rain and interaction chimes under the recorded score.
    void setAudio(true, musicState.volume * .14).catch(() => {})
  } catch {
    if (token !== request) return
    musicState.playing = false; musicState.loading = false
    musicState.error = '浏览器尚未允许播放，请点击「播放配乐」重试。'
  }
}
const stopWatch = watch(() => [musicState.enabled, currentMusic.value.id], () => { void syncPlayback() }, { flush: 'sync' })
const visibilityChanged = () => { void syncPlayback() }
document.addEventListener('visibilitychange', visibilityChanged)
if (import.meta.hot) import.meta.hot.dispose(() => {
  ++request; stopWatch(); player.stop(); void setAudio(false)
  if (ticker) clearInterval(ticker)
  document.removeEventListener('visibilitychange', visibilityChanged)
})
export function setMusicEnabled(enabled: boolean) {
  if (musicState.enabled === enabled) { void syncPlayback(); return }
  musicState.enabled = enabled
}
export function setMusicVolume(value: number) {
  musicState.volume = Math.min(1, Math.max(0, Number.isFinite(value) ? value : .4))
  player.setVolume(musicState.volume)
  if (musicState.playing) void setAudio(true, musicState.volume * .14).catch(() => {})
  try { localStorage.setItem('huapi-music-volume', String(musicState.volume)) } catch { /* optional preference */ }
}
export function previewMusic(track: MusicTrackId) {
  const previous = currentMusic.value.id
  musicState.preview = track
  if (!musicState.enabled) setMusicEnabled(true)
  else if (previous === track) void syncPlayback()
}
export function followSceneMusic() { musicState.preview = undefined }
export function useSceneMusic(scene: MaybeRefOrGetter<MusicScene>, priority = 10) {
  const key = Symbol('scene-music'), index = ++order
  watch(() => toValue(scene), value => { owners.set(key, { scene: value, priority, order: index }); updateScene() }, { immediate: true, flush: 'sync' })
  onUnmounted(() => { owners.delete(key); updateScene() })
}
