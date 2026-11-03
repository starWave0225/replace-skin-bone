import test from 'node:test'
import assert from 'node:assert/strict'
import { MusicPlayer, type MusicMedia } from '../src/game/music-player'
import { musicSceneForMap, musicSceneForPrologue, musicScenes, musicTracks } from '../src/game/music-data'
import { existsSync, readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'

class Media implements MusicMedia {
  volume = 1; loop = false; paused = true; currentTime = 0; duration = 100
  finish?: () => void
  deferred = false
  async play() { this.paused = false; if (this.deferred) await new Promise<void>(resolve => { this.finish = resolve }) }
  pause() { this.paused = true }
}
test('查案、梦境、战斗与日常有不同配乐，所有场景均有本地曲目', () => {
  assert.equal(musicSceneForPrologue('arrival'), 'night')
  assert.equal(musicSceneForPrologue('investigation'), 'investigation')
  assert.equal(musicSceneForPrologue('night'), 'dream')
  assert.equal(musicSceneForPrologue('dream'), 'dream')
  assert.equal(musicSceneForMap('street', 'day'), 'street')
  assert.equal(musicSceneForMap('street', 'night'), 'night')
  assert.equal(musicSceneForMap('home'), 'home')
  assert.equal(musicSceneForMap('well'), 'investigation')
  assert.equal(musicSceneForMap('yamen'), 'investigation')
  assert.equal(musicSceneForMap('theatre'), 'teahouse')
  assert.equal(musicSceneForMap('mansion'), 'teahouse')
  assert.equal(musicSceneForMap('inn'), 'inn')
  const distinct = ['battle', 'dream', 'investigation', 'street'].map(scene => musicScenes[scene as keyof typeof musicScenes].track)
  assert.equal(new Set(distinct).size, 4)
  for (const scene of Object.values(musicScenes)) assert.ok(musicTracks.some(track => track.id === scene.track))
})
test('同一曲目跨场景与暂停恢复均保留播放位置', async () => {
  let created = 0
  const media = new Media(), player = new MusicPlayer(() => { created++; return media }, 0)
  await player.play('inn'); media.currentTime = 28
  await player.play('inn'); player.stop(); await player.play('inn')
  assert.equal(created, 1); assert.equal(media.currentTime, 28); assert.equal(media.loop, true)
  player.stop()
})
test('快速切景不会让迟到的播放请求盖过当前配乐', async () => {
  const first = new Media(), second = new Media(); first.deferred = true
  const player = new MusicPlayer(id => id === 'dream' ? first : second, 0)
  const pending = player.play('dream')
  await player.play('battle'); first.finish!()
  assert.equal(await pending, false)
  assert.equal(first.paused, true); assert.equal(second.paused, false); assert.equal(player.track, 'battle')
  player.stop()
})
test('载入期间静音会取消待播曲目，音量不会越界', async () => {
  const media = new Media(); media.deferred = true
  const player = new MusicPlayer(() => media, 0)
  player.setVolume(8)
  const pending = player.play('dream'); assert.equal(media.volume, 1)
  player.stop(); media.finish!(); assert.equal(await pending, false); assert.equal(media.paused, true)
  player.setVolume(-2); assert.equal(media.volume, 0)
  player.setVolume(NaN); assert.equal(media.volume, .4)
})
test('载入时快速暂停再恢复同一曲，旧请求不能静音新的播放', async () => {
  const media = new Media(), pending: (() => void)[] = []
  media.play = async () => { media.paused = false; await new Promise<void>(resolve => pending.push(resolve)) }
  const player = new MusicPlayer(() => media, 0)
  const first = player.play('inn'); player.stop(); const resumed = player.play('inn')
  pending[0](); assert.equal(await first, false)
  pending[1](); assert.equal(await resumed, true); assert.equal(media.paused, false)
  player.stop()
})
test('七首运行文件与官方来源归档的哈希一致，双格式齐全', () => {
  const manifest = JSON.parse(readFileSync('docs/music-public-assets.json', 'utf8'))
  assert.equal(manifest.tracks.length, 7)
  for (const track of manifest.tracks) {
    assert.equal(track.license, 'CC BY 4.0')
    assert.ok(track.published < '2026-03-01')
    for (const file of Object.values(track.runtime) as {path:string;sha256:string}[]) {
      assert.ok(existsSync(file.path), file.path)
      assert.equal(createHash('sha256').update(readFileSync(file.path)).digest('hex'), file.sha256)
    }
  }
})
