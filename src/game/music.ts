import { assetUrl } from './asset-url'
import { computed, onUnmounted, reactive, watch, type MaybeRefOrGetter, toValue } from 'vue'
import { musicScenes, musicTracks, type MusicScene, type MusicTrackId } from './music-data'
import { MusicPlayer } from './music-player'
import { MUSIC_ENABLED_KEY, MUSIC_VOLUME_KEY, readMusicPreferences } from './music-preferences'
import { setAudio } from './audio'

const preferences = (() => { try { return readMusicPreferences(localStorage) } catch { return readMusicPreferences() } })()
export const musicState = reactive({ enabled: preferences.enabled, volume: preferences.volume, scene: 'title' as MusicScene, preview: undefined as MusicTrackId | undefined, playing: false, loading: false, awaitingInteraction: false, error: '', elapsed: 0, duration: 0 })
export const currentMusic = computed(() => musicScenes[musicState.scene].track === null ? undefined : musicTracks.find(track => track.id === (musicState.preview ?? musicScenes[musicState.scene].track)))
const player = new MusicPlayer(id => {
  const media = new Audio()
  media.preload = 'auto'
  const extension = media.canPlayType('audio/ogg; codecs="vorbis"') ? 'ogg' : 'm4a'
  media.src = assetUrl(`/assets/music/${id}.${extension}`)
  media.addEventListener('error', () => {
    if (player.media !== media || !musicState.enabled || !currentMusic.value) return
    player.stop(); musicState.loading = false; musicState.playing = false; musicState.awaitingInteraction = false; musicState.error = '配乐载入失败，请重试。'
  })
  return media
})
player.setVolume(musicState.volume)
let request = 0, ticker: ReturnType<typeof setInterval> | undefined
const owners = new Map<symbol, { scene: MusicScene; active: boolean; priority: number; order: number }>()
let playbackActive = false
let order = 0
function updateScene() {
  const active = [...owners.values()].sort((a, b) => b.priority - a.priority || b.order - a.order)[0]
  if (!active) { playbackActive = false; ++request; player.stop(); void setAudio(false); musicState.playing = false; musicState.loading = false; musicState.awaitingInteraction = false; if (ticker) clearInterval(ticker); ticker = undefined; return }
  const scene = active.scene
  const activityChanged = playbackActive !== active.active, sceneChanged = scene !== musicState.scene
  playbackActive = active.active
  if (scene !== musicState.scene) { musicState.preview = undefined; musicState.scene = scene }
  if (!ticker) ticker = setInterval(() => {
    const media = player.media
    musicState.elapsed = media?.currentTime ?? 0
    musicState.duration = media && Number.isFinite(media.duration) ? media.duration : 0
  }, 500)
  const trackChanged = !!currentMusic.value && player.track !== currentMusic.value.id
  if (activityChanged || sceneChanged || trackChanged || (!musicState.playing && !musicState.loading)) void syncPlayback()
}
async function syncPlayback() {
  const token = ++request
  musicState.error = ''; musicState.loading = false; musicState.awaitingInteraction = false
  if (!musicState.enabled || document.hidden || !owners.size || !playbackActive) { player.stop(); musicState.playing = false; void setAudio(false); return }
  const track = currentMusic.value
  if (!track) {
    player.stop(); musicState.playing = false; musicState.elapsed = 0; musicState.duration = 0
    // Web Audio may wait for a gesture without rejecting its resume promise.
    musicState.awaitingInteraction = true
    try {
      const success = await setAudio(true, musicState.volume * .7, true)
      if (token !== request || !success) return
      musicState.playing = true; musicState.awaitingInteraction = false
    } catch (error) {
      if (token !== request) return
      if (!(error && typeof error === 'object' && 'name' in error && error.name === 'NotAllowedError')) {
        musicState.awaitingInteraction = false; musicState.error = '环境声播放失败，请重试。'
      }
    }
    return
  }
  if (player.track !== track.id) { musicState.elapsed = 0; musicState.duration = 0 }
  musicState.loading = true
  try {
    const success = await player.play(track.id)
    if (token !== request || !success) return
    musicState.playing = true; musicState.loading = false
    musicState.elapsed = player.media?.currentTime ?? 0
    musicState.duration = player.media && Number.isFinite(player.media.duration) ? player.media.duration : 0
    // Quiet procedural rain and interaction chimes under the recorded score.
    void setAudio(true, musicState.volume * .14).catch(() => {})
  } catch (error) {
    if (token !== request) return
    musicState.playing = false; musicState.loading = false
    if (error && typeof error === 'object' && 'name' in error && error.name === 'NotAllowedError') musicState.awaitingInteraction = true
    else musicState.error ||= '配乐播放失败，请重试。'
  }
}
const stopWatch = watch(() => musicState.enabled, () => { void syncPlayback() }, { flush: 'sync' })
const visibilityChanged = () => { void syncPlayback() }
const interactionEvents = ['pointerdown', 'click', 'keydown'] as const
const retryAutoplay = () => {
  if (!musicState.enabled || !musicState.awaitingInteraction || document.hidden || !owners.size || !playbackActive) return
  // Capture before game handlers stop propagation; play() stays inside the user gesture.
  void syncPlayback()
}
document.addEventListener('visibilitychange', visibilityChanged)
for (const event of interactionEvents) document.addEventListener(event, retryAutoplay, true)
if (import.meta.hot) import.meta.hot.dispose(() => {
  ++request; stopWatch(); player.stop(); void setAudio(false)
  if (ticker) clearInterval(ticker)
  document.removeEventListener('visibilitychange', visibilityChanged)
  for (const event of interactionEvents) document.removeEventListener(event, retryAutoplay, true)
})
export function setMusicEnabled(enabled: boolean) {
  try { localStorage.setItem(MUSIC_ENABLED_KEY, String(enabled)) } catch { /* optional preference */ }
  if (musicState.enabled === enabled) { void syncPlayback(); return }
  musicState.enabled = enabled
}
export function setMusicVolume(value: number) {
  musicState.volume = Math.min(1, Math.max(0, Number.isFinite(value) ? value : .4))
  player.setVolume(musicState.volume)
  if (musicState.playing) void setAudio(true, musicState.volume * (currentMusic.value ? .14 : .7), !currentMusic.value).catch(() => {})
  try { localStorage.setItem(MUSIC_VOLUME_KEY, String(musicState.volume)) } catch { /* optional preference */ }
}
export function previewMusic(track: MusicTrackId) {
  musicState.preview = track
  if (!musicState.enabled) setMusicEnabled(true)
  else void syncPlayback()
}
export function followSceneMusic() { musicState.preview = undefined; void syncPlayback() }
export function useSceneMusic(scene: MaybeRefOrGetter<MusicScene>, priority = 10, active: MaybeRefOrGetter<boolean> = true) {
  const key = Symbol('scene-music'), index = ++order
  watch(() => [toValue(scene), toValue(active)] as const, ([scene, active]) => { owners.set(key, { scene, active, priority, order: index }); updateScene() }, { immediate: true, flush: 'sync' })
  onUnmounted(() => { owners.delete(key); updateScene() })
}
