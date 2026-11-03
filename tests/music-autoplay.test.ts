import test from 'node:test'
import assert from 'node:assert/strict'
import { createRenderer, ref } from 'vue'
import type { MusicScene } from '../src/game/music-data'
import { MUSIC_ENABLED_KEY, MUSIC_VOLUME_KEY, readMusicPreferences } from '../src/game/music-preferences'

test('首次默认开启配乐，读取静音和零音量偏好，存储不可用时仍能进入游戏', () => {
  assert.deepEqual(readMusicPreferences(), { enabled: true, volume: .4 })
  const values = new Map([[MUSIC_ENABLED_KEY, 'false'], [MUSIC_VOLUME_KEY, '0']])
  const storage = { getItem: (key: string) => values.get(key) ?? null }
  assert.deepEqual(readMusicPreferences(storage), { enabled: false, volume: 0 })
  values.set(MUSIC_VOLUME_KEY, 'invalid')
  assert.deepEqual(readMusicPreferences(storage), { enabled: false, volume: .4 })
  assert.deepEqual(readMusicPreferences({ getItem() { throw new Error('blocked') } }), { enabled: true, volume: .4 })
})

test('场景配乐自动开始、交互解锁和静音偏好', async t => {
  class Page extends EventTarget { hidden = false }
  class Media extends EventTarget {
    static instances: Media[] = []
    static allowed = true
    static failure = ''
    static plays = 0
    src = ''; preload = ''; volume = 1; loop = false; paused = true
    currentTime = 0; duration = 100
    constructor() { super(); Media.instances.push(this) }
    canPlayType() { return 'probably' }
    async play() {
      Media.plays++
      if (!Media.allowed || Media.failure) {
        const error = new Error('play rejected')
        error.name = Media.failure || 'NotAllowedError'
        throw error
      }
      this.paused = false
    }
    pause() { this.paused = true }
  }
  type Host = { children: Host[]; parent?: Host; text?: string }
  const renderer = createRenderer<Host, Host>({
    createElement: () => ({ children: [] }),
    createText: text => ({ children: [], text }),
    createComment: text => ({ children: [], text }),
    insert(child, parent) { parent.children.push(child); child.parent = parent },
    remove(child) { if (child.parent) child.parent.children = child.parent.children.filter(node => node !== child) },
    parentNode: node => node.parent ?? null,
    nextSibling: () => null,
    setText(node, text) { node.text = text },
    setElementText(node, text) { node.text = text },
    patchProp() {},
  })
  const page = new Page(), values = new Map<string, string>()
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value) } }
  const previous = new Map(['document', 'localStorage', 'Audio'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)]))
  for (const [key, value] of Object.entries({ document: page, localStorage: storage, Audio: Media })) Object.defineProperty(globalThis, key, { configurable: true, writable: true, value })
  const music = await import('../src/game/music')
  let app: ReturnType<typeof renderer.createApp> | undefined
  let scene = ref<MusicScene>('title')
  const settle = () => new Promise<void>(resolve => setImmediate(resolve))
  function mount(value: MusicScene) {
    app?.unmount()
    scene = ref(value)
    app = renderer.createApp({ setup() { music.useSceneMusic(scene); return () => null } })
    app.mount({ children: [] })
  }
  const current = () => Media.instances.at(-1)!
  try {
    await t.test('标题页在场景名称未变化时也会首次自动播放', async () => {
      assert.equal(music.musicState.enabled, true)
      mount('title')
      await settle()
      assert.equal(music.musicState.playing, true)
      assert.equal(current().loop, true)
      assert.ok(current().src.endsWith('/music/chinatown_healing.ogg'))
      assert.equal(Media.plays, 1)
    })
    await t.test('直接进入战斗时被拦截，首次点击同步重试且不重复播放', async () => {
      Media.allowed = false
      mount('battle')
      await settle()
      assert.equal(music.musicState.awaitingInteraction, true)
      assert.equal(music.musicState.error, '')
      assert.equal(music.musicState.playing, false)
      Media.allowed = true
      const plays = Media.plays
      page.dispatchEvent(new Event('pointerdown'))
      assert.equal(Media.plays, plays + 1)
      page.dispatchEvent(new Event('click'))
      assert.equal(Media.plays, plays + 1)
      await settle()
      assert.equal(music.musicState.playing, true)
      assert.ok(current().src.endsWith('/music/wuxia2_guzheng_pipa.ogg'))
    })
    await t.test('等待交互时主动静音，之后的点击、按键和切景均不会重新开启', async () => {
      Media.allowed = false
      scene.value = 'dream'
      await settle()
      assert.equal(music.musicState.awaitingInteraction, true)
      music.setMusicEnabled(false)
      Media.allowed = true
      const plays = Media.plays
      for (const event of ['pointerdown', 'click', 'keydown']) page.dispatchEvent(new Event(event))
      scene.value = 'home'
      await settle()
      assert.equal(Media.plays, plays)
      assert.equal(music.musicState.playing, false)
      assert.equal(music.musicState.awaitingInteraction, false)
      assert.equal(values.get(MUSIC_ENABLED_KEY), 'false')
      assert.equal(readMusicPreferences(storage).enabled, false)
    })
    await t.test('重新开启、页面隐藏恢复和场景切曲均保留预期状态', async () => {
      music.setMusicEnabled(true)
      await settle()
      assert.equal(values.get(MUSIC_ENABLED_KEY), 'true')
      assert.ok(current().src.endsWith('/music/taohua.ogg'))
      current().currentTime = 18
      page.hidden = true
      page.dispatchEvent(new Event('visibilitychange'))
      assert.equal(current().paused, true)
      page.hidden = false
      page.dispatchEvent(new Event('visibilitychange'))
      await settle()
      assert.equal(music.musicState.playing, true)
      assert.equal(current().currentTime, 18)
      scene.value = 'dream'
      await settle()
      assert.ok(current().src.endsWith('/music/suspense3.ogg'))
    })
    await t.test('移除场景后再次进入同一场景，会恢复播放', async () => {
      mount('dream')
      await settle()
      assert.equal(music.musicState.playing, true)
      assert.equal(current().paused, false)
    })
    await t.test('试听曲目和跟随场景均立即播放', async () => {
      music.previewMusic('folk_chinese')
      await settle()
      assert.ok(current().src.endsWith('/music/folk_chinese.ogg'))
      music.followSceneMusic()
      await settle()
      assert.ok(current().src.endsWith('/music/suspense3.ogg'))
    })
    await t.test('媒体错误不会伪装成自动播放拦截，仍可手动重试', async () => {
      Media.failure = 'NotSupportedError'
      scene.value = 'street'
      await settle()
      assert.equal(music.musicState.awaitingInteraction, false)
      assert.ok(music.musicState.error)
      const plays = Media.plays
      page.dispatchEvent(new Event('click'))
      assert.equal(Media.plays, plays)
      Media.failure = ''
      music.setMusicEnabled(true)
      await settle()
      assert.equal(music.musicState.playing, true)
      assert.equal(music.musicState.error, '')
    })
  } finally {
    music.setMusicEnabled(false)
    app?.unmount()
    for (const [key, descriptor] of previous) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else Reflect.deleteProperty(globalThis, key)
    }
  }
})
