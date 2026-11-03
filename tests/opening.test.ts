import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { openingShots, openingDuration, openingFrame, crossedOpeningCues, openingCues } from '../src/game/opening'
import { startGame } from '../src/game/engine'
import { advancePrologue, inspectCase, caseClues, isValidPrologue } from '../src/game/prologue'
import { openingImages } from '../src/game/opening-renderer'

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
  assert.deepEqual(crossedOpeningCues(6050, 6050), [])
  assert.deepEqual(crossedOpeningCues(6000, 8000).map(cue => cue.sound), ['knock', 'knock', 'knock'])
  const played = []
  for (let previous = 0; previous < openingDuration; previous += 83) played.push(...crossedOpeningCues(previous, previous + 83))
  assert.deepEqual(played, openingCues)
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
