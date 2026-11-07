import test from 'node:test'
import assert from 'node:assert/strict'
import { openingCandleDimDuration, openingCandleDuration, openingCandleFrame, openingCandleLayout } from '../src/game/opening-light'

test('烛火先摇曳再熄灭，余烬与烟丝衔接，光线只向暗处变化', () => {
  assert.equal(openingCandleFrame(null).brightness, 1)
  assert.equal(openingCandleFrame(null).smoke, 0)
  assert.ok(openingCandleFrame(350).lean > .8)
  assert.ok(openingCandleFrame(350).flame > 0)
  assert.equal(openingCandleFrame(720).flame, 0)
  assert.ok(openingCandleFrame(1100).smoke > .9)
  assert.ok(openingCandleFrame(1100).ember > 0)
  let previous = 1
  for (let ms = 0; ms <= openingCandleDuration; ms += 10) {
    const frame = openingCandleFrame(ms)
    assert.ok(frame.brightness <= previous)
    assert.ok(frame.brightness >= .079 && frame.brightness <= 1)
    previous = frame.brightness
  }
  assert.ok(openingCandleFrame(openingCandleDimDuration).brightness < .1)
  assert.equal(openingCandleFrame(openingCandleDuration).smoke, 0)
  assert.equal(openingCandleFrame(openingCandleDuration).ember, 0)
})

test('减少动态时保留熄火与暗光，不摆动火苗或移动烟丝', () => {
  for (const ms of [null, 350, 800, 1600, 3600]) {
    const frame = openingCandleFrame(ms, 1234, true)
    assert.equal(frame.lean, 0)
    assert.equal(frame.rise, .45)
    assert.equal(frame.brightness, openingCandleFrame(ms, 1234).brightness)
    assert.deepEqual(frame, openingCandleFrame(ms, 9999, true))
  }
})

test('烛火触碰区覆盖烛身，在桌面和手机横竖屏保持至少四十四像素宽', () => {
  for (const [width, height] of [[1280, 720], [390, 219.375], [422, 237.375], [320, 180]]) {
    const { x, wick, hit } = openingCandleLayout(width, height)
    assert.ok(hit.width >= 44 && hit.height >= 44)
    assert.ok(hit.left >= 0 && hit.left + hit.width <= width)
    assert.ok(hit.top >= 0 && hit.top + hit.height <= height)
    assert.ok(x > hit.left && x < hit.left + hit.width)
    assert.ok(wick > hit.top && wick < hit.top + hit.height)
  }
})

test('非有限动画时刻不误认为已吹灭，长时停留不会重新点亮', () => {
  for (const ms of [Number.NaN, Infinity]) assert.equal(openingCandleFrame(ms).brightness, 1)
  const later = openingCandleFrame(60000)
  assert.equal(later.flame, 0)
  assert.equal(later.smoke, 0)
  assert.ok(later.brightness < .1)
})
