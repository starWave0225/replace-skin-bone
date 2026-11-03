import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { openingShots, openingDuration, openingFrame, crossedOpeningCues, continuingOpeningCues, openingCues, openingBeats, openingWeather } from '../src/game/opening'
import { openingBookPages, openingBookTurnDuration, openingBookReducedTurnDuration, openingPoemRevealDuration, openingPoemVisibility, setOpeningBookBrightness } from '../src/game/opening-book'
import { openingPoem } from '../src/game/opening-poem'
import { advanceOpeningPlayback, createOpeningPlayback, isOpeningBookWaiting, openingBookStart, openingBookReveal, openingBookAftermath, turnOpeningPage } from '../src/game/opening-playback'
import { openingCamera } from '../src/game/opening-camera'
import { startGame } from '../src/game/engine'
import { advancePrologue, inspectCase, caseClues, isValidPrologue } from '../src/game/prologue'
import { openingImages } from '../src/game/opening-renderer'
import { openingRecordedSounds } from '../src/game/opening-sfx'
import { createHash } from 'node:crypto'

test('演出每一帧都有镜头，结尾严格停在进入调查的边界', () => {
  for (let time = 0; time < openingDuration; time += 17) {
    const frame = openingFrame(time)
    assert.ok(frame.progress >= 0 && frame.progress <= 1)
    assert.equal(frame.finished, false)
  }
  for (let i = 0; i < openingShots.length - 1; i++) {
    assert.equal(openingShots[i].end, openingShots[i + 1].start)
    assert.equal(openingFrame(openingShots[i].end).shot, openingShots[i + 1].id)
  }
  assert.equal(openingFrame(-100).time, 0)
  assert.equal(openingFrame(Number.NaN).time, 0)
  assert.equal(openingFrame(openingDuration + 1000).finished, true)
})

test('音效按跨过的时刻触发，停帧不重复，低帧率也不会漏掉敲门', () => {
  assert.deepEqual(crossedOpeningCues(openingBeats.knocks[0], openingBeats.knocks[0]), [])
  assert.deepEqual(crossedOpeningCues(openingBeats.knocks[0] - 1, openingBeats.knocks.at(-1)!).map(cue => cue.sound), ['knock', 'knock', 'knock'])
  const played = []
  for (let previous = 0; previous < openingDuration; previous += 83) played.push(...crossedOpeningCues(previous, previous + 83))
  assert.deepEqual(played, openingCues)
})

test('门轴声与开窗碰响各触发一次，暂停恢复不会重放起音', () => {
  for (const cue of ['door', 'window'] as const) {
    const at = openingBeats[cue], duration = openingRecordedSounds[cue].duration
    assert.deepEqual(crossedOpeningCues(at - 1, at), [{ at, sound: cue }])
    assert.deepEqual(crossedOpeningCues(at, at), [])
    assert.ok(continuingOpeningCues(at + 700).some(item => item.sound === cue && item.offset === 700))
    assert.ok(!continuingOpeningCues(at + duration).some(item => item.sound === cue))
  }
})

test('门窗实录完整打包、时长匹配、无削波，许可及文件校验记录齐全', () => {
  const manifest = JSON.parse(readFileSync(new URL('../docs/opening-sfx-assets.json', import.meta.url), 'utf8'))
  assert.equal(manifest.license, 'CC0 1.0')
  for (const [cue, recording] of Object.entries(openingRecordedSounds)) {
    const bytes = readFileSync(new URL(`../public${recording.path}`, import.meta.url))
    const asset = manifest.assets.find((item: { cue: string }) => item.cue === cue)
    assert.equal(createHash('sha256').update(bytes).digest('hex'), asset.sha256)
    assert.equal(bytes.toString('ascii', 0, 4), 'RIFF')
    assert.equal(bytes.toString('ascii', 8, 12), 'WAVE')
    assert.equal(bytes.readUInt16LE(22), 1)
    assert.equal(bytes.readUInt16LE(34), 16)
    const rate = bytes.readUInt32LE(24), length = bytes.readUInt32LE(40)
    assert.equal(length / 2 / rate * 1000, recording.duration)
    let peak = 0, energy = 0
    for (let i = 44; i < bytes.length; i += 2) { const sample = bytes.readInt16LE(i) / 32768; peak = Math.max(peak, Math.abs(sample)); energy += sample * sample }
    assert.ok(peak > .5 && peak < .95)
    assert.ok(Math.sqrt(energy / (length / 2)) > .015)
  }
})

test('推拉摇移全程不露出画面边界，减少动态效果时同一镜头保持机位', () => {
  for (let time = 0; time <= openingDuration; time += 41) {
    const camera = openingCamera(time), angle = camera.roll * Math.PI / 180
    assert.ok(Object.values(camera).every(Number.isFinite))
    for (const x of [-.5, .5]) for (const y of [-.5, .5]) {
      const sourceX = camera.x + (Math.cos(angle) * x + Math.sin(angle) * y / (16 / 9)) / camera.zoom
      const sourceY = camera.y + (-Math.sin(angle) * x * (16 / 9) + Math.cos(angle) * y) / camera.zoom
      assert.ok(sourceX >= -1e-8 && sourceX <= 1 + 1e-8, `x at ${time}`)
      assert.ok(sourceY >= -1e-8 && sourceY <= 1 + 1e-8, `y at ${time}`)
    }
  }
  for (const shot of openingShots) {
    const a = openingCamera(shot.start + (shot.end - shot.start) * .1, true)
    const b = openingCamera(shot.start + (shot.end - shot.start) * .9, true)
    assert.deepEqual(a, b)
    assert.equal(a.roll, 0); assert.equal(a.blur, 0)
  }
})

test('恢复演出只续播仍在持续的音效，不重放已结束的叩门', () => {
  const knock = openingBeats.knocks[0]
  assert.deepEqual(continuingOpeningCues(knock + 200), [{ at: knock, sound: 'knock', offset: 200 }])
  assert.deepEqual(continuingOpeningCues(knock + 400), [])
  const thunder = continuingOpeningCues(openingBeats.thunder[0] + 100).find(cue => cue.sound === 'thunder')
  assert.equal(thunder?.offset, 100)
  assert.equal(openingCues.some(cue => cue.sound === 'page'), false, '纸声由玩家翻页触发')
  assert.deepEqual(continuingOpeningCues(openingDuration), [])
})

test('先留静再看窗，风雨和视线在同一叙事节点改变', () => {
  const door = openingShots.find(shot => shot.id === 'door')!, pages = openingShots.find(shot => shot.id === 'pages')!
  const storm = openingShots.find(shot => shot.id === 'storm')!
  assert.ok(openingBeats.door - openingBeats.knocks.at(-1)! >= 3000)
  assert.deepEqual(openingWeather(storm.start), openingWeather(openingBeats.window))
  assert.ok(openingWeather(storm.start).wind < .02)
  assert.ok(openingWeather(openingBeats.window + 650).rain > openingWeather(door.start).rain * 5)
  assert.ok(openingWeather(openingBeats.window + 650).wind > openingWeather(door.start).wind * 5)
  assert.deepEqual(openingWeather(openingDuration), { wind: 0, rain: 0 })
  const quietA = openingCamera(pages.start), quietB = openingCamera(pages.start + (pages.end - pages.start) * .7)
  assert.deepEqual(quietA, quietB)
  const first = openingCamera(storm.start), window = openingCamera(storm.start + 1300), book = openingCamera(storm.end - 1)
  assert.ok(window.x > first.x + .15)
  assert.ok(book.y > window.y + .3)
})

test('镜头到达旧谱后等待玩家，长帧和长时间阅读都不能自动翻页或显诗', () => {
  const playback = createOpeningPlayback()
  assert.equal(turnOpeningPage(playback), false)
  advanceOpeningPlayback(playback, openingDuration * 2)
  assert.equal(playback.elapsed, openingBookStart)
  assert.equal(isOpeningBookWaiting(playback), true)
  advanceOpeningPlayback(playback, 60000)
  assert.equal(playback.elapsed, openingBookStart)
  assert.equal(playback.book.page, 0)
  assert.equal(playback.book.complete, false)
  assert.ok(playback.ambienceTime > playback.elapsed)
})

test('一次点击只翻一页，末页必须调暗灯火才可继续，确认后进入片尾', () => {
  const playback = createOpeningPlayback(true)
  assert.ok(openingBookPages.slice(0, -1).every(page => page.kind === 'text' && page.lines.length > 0))
  assert.equal(openingBookPages.at(-1)!.kind, 'poem')
  assert.equal(openingBookPages.at(-1)!.lines, openingPoem.lines)
  for (let page = 0; page < openingBookPages.length - 1; page++) {
    assert.equal(playback.book.page, page)
    assert.equal(turnOpeningPage(playback), true)
    assert.equal(turnOpeningPage(playback), false, '连点不能跳页')
    advanceOpeningPlayback(playback, openingBookTurnDuration - 1)
    assert.equal(playback.book.page, page)
    assert.equal(playback.elapsed, openingBookStart)
    advanceOpeningPlayback(playback, 1)
    assert.equal(playback.book.page, page + 1)
  }
  assert.equal(playback.book.complete, false)
  assert.equal(playback.elapsed, openingBookReveal)
  assert.equal(isOpeningBookWaiting(playback), true)
  assert.equal(turnOpeningPage(playback), false)
  advanceOpeningPlayback(playback, 60000)
  assert.equal(playback.elapsed, openingBookReveal)
  assert.equal(playback.book.revealed, false)
  setOpeningBookBrightness(playback.book, .2)
  advanceOpeningPlayback(playback, openingPoemRevealDuration - 1)
  assert.equal(turnOpeningPage(playback), false)
  advanceOpeningPlayback(playback, 1)
  assert.equal(playback.book.revealed, true)
  assert.equal(turnOpeningPage(playback), true)
  assert.equal(playback.book.complete, true)
  advanceOpeningPlayback(playback, 1)
  assert.equal(playback.elapsed, openingBookAftermath)
  advanceOpeningPlayback(playback, openingDuration)
  assert.equal(openingFrame(playback.elapsed).finished, true)
})

test('暗处显诗随亮度渐变，提前调暗和一闪而过的低亮度不能绕过发现过程', () => {
  const playback = createOpeningPlayback(true)
  setOpeningBookBrightness(playback.book, .1)
  assert.equal(playback.book.brightness, 1)
  for (let i = 0; i < openingBookPages.length - 1; i++) {
    turnOpeningPage(playback)
    advanceOpeningPlayback(playback, openingBookTurnDuration)
  }
  assert.ok(openingPoemVisibility(1) < .03)
  assert.ok(openingPoemVisibility(.5) > openingPoemVisibility(1))
  assert.ok(openingPoemVisibility(.2) > .99)
  setOpeningBookBrightness(playback.book, .5)
  advanceOpeningPlayback(playback, 10000)
  assert.equal(playback.book.revealed, false)
  setOpeningBookBrightness(playback.book, .2)
  advanceOpeningPlayback(playback, 600)
  setOpeningBookBrightness(playback.book, 1)
  advanceOpeningPlayback(playback, 1)
  assert.equal(playback.book.revealElapsed, 0)
  setOpeningBookBrightness(playback.book, Number.NaN)
  assert.equal(playback.book.brightness, 1)
  setOpeningBookBrightness(playback.book, -1)
  assert.equal(playback.book.brightness, .05)
  advanceOpeningPlayback(playback, openingPoemRevealDuration)
  assert.equal(playback.book.revealed, true)
  setOpeningBookBrightness(playback.book, 1)
  assert.ok(openingPoemVisibility(playback.book.brightness) < .03)
  assert.equal(playback.book.revealed, true, '重新调亮隐藏诗文，但保留已读记录')
  assert.equal(turnOpeningPage(playback), true)
})

test('减少动态效果仍需逐页确认，暂停的零增量不会推进，重播从第一页开始', () => {
  const playback = createOpeningPlayback(true)
  turnOpeningPage(playback, true)
  for (const delta of [0, -1, Number.NaN]) advanceOpeningPlayback(playback, delta)
  assert.equal(playback.book.turnElapsed, 0)
  advanceOpeningPlayback(playback, openingBookReducedTurnDuration)
  assert.equal(playback.book.page, 1)
  assert.equal(playback.elapsed, openingBookStart)
  assert.equal(createOpeningPlayback(true).book.page, 0)
})

test('播完或跳过开场只进入调查，不赠送线索，旧存档不重播', () => {
  const state = startGame(true), saved = structuredClone(state.prologue!)
  assert.equal(saved.phase, 'arrival')
  assert.equal(isValidPrologue(saved), true)
  assert.equal(advancePrologue(saved), true)
  assert.equal(saved.phase, 'investigation')
  assert.deepEqual(saved.clues, [])
  assert.equal(advancePrologue(saved), false)
  inspectCase(saved, caseClues[0].id)
  const resumed = structuredClone(saved)
  assert.equal(isValidPrologue(resumed), true)
  assert.equal(resumed.phase, 'investigation')
  assert.deepEqual(resumed.clues, [caseClues[0].id])
})

test('开场图片均为已打包的 WebP，单张不超过 1 MiB', () => {
  for (const path of Object.values(openingImages)) {
    const file = new URL(`../public${path}`, import.meta.url)
    assert.ok(existsSync(file), path)
    const data = readFileSync(file)
    assert.equal(data.toString('ascii', 0, 4), 'RIFF')
    assert.equal(data.toString('ascii', 8, 12), 'WEBP')
    assert.ok(data.length < 1024 * 1024, path)
  }
})
