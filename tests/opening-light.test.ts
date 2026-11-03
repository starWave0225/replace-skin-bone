import test from 'node:test'
import assert from 'node:assert/strict'
import { observeOpeningLight, openingBrightnessFromLux, type OpeningLightMode } from '../src/game/opening-light'
import { openingPoemBrightnessThreshold, openingPoemVisibility } from '../src/game/opening-book'

class LightSensor extends EventTarget {
  static latest: LightSensor
  illuminance: number | null = null
  stopped = false
  constructor(_options: { frequency: number }) { super(); LightSensor.latest = this }
  start() {}
  stop() { this.stopped = true }
  read(lux: number | null) { this.illuminance = lux; this.dispatchEvent(new Event('reading')) }
}

test('环境越暗诗越清楚，极端照度有界，非法读数不当作黑暗', () => {
  let previous = 0
  for (const lux of [0, 1, 5, 10, 20, 50, 200, 500, 1000, 100000]) {
    const brightness = openingBrightnessFromLux(lux)!
    assert.ok(brightness >= .05 && brightness <= 1)
    assert.ok(brightness >= previous)
    previous = brightness
  }
  const dim = openingBrightnessFromLux(10)!, bright = openingBrightnessFromLux(500)!
  assert.ok(dim <= openingPoemBrightnessThreshold)
  assert.ok(openingPoemVisibility(dim) > .99)
  assert.ok(openingPoemVisibility(bright) < .03)
  for (const lux of [-1, Number.NaN, Infinity]) assert.equal(openingBrightnessFromLux(lux), null)
})

test('无感光能力时直接使用手动灯火，不伪造设备亮度', () => {
  const modes: OpeningLightMode[] = [], readings: number[] = []
  const stop = observeOpeningLight(value => readings.push(value), mode => modes.push(mode))
  assert.deepEqual(modes, ['manual'])
  assert.deepEqual(readings, [])
  stop()
})

test('有效感光更新灯火，手动接管或退出后迟到的读数无效', () => {
  const modes: OpeningLightMode[] = [], readings: number[] = []
  const stop = observeOpeningLight(value => readings.push(value), mode => modes.push(mode), LightSensor)
  const sensor = LightSensor.latest
  try {
    assert.deepEqual(modes, ['sensing'])
    for (const lux of [null, Number.NaN, -1]) sensor.read(lux)
    assert.deepEqual(readings, [])
    sensor.read(10)
    assert.deepEqual(readings, [openingBrightnessFromLux(10)])
    assert.deepEqual(modes, ['sensing', 'ambient'])
    stop()
    assert.equal(sensor.stopped, true)
    sensor.read(500)
    sensor.dispatchEvent(new Event('error'))
    assert.equal(readings.length, 1)
    assert.deepEqual(modes, ['sensing', 'ambient'])
  } finally { stop() }
})

test('权限拒绝或传感器故障时停止感光并允许手动继续', () => {
  const modes: OpeningLightMode[] = []
  const stop = observeOpeningLight(() => assert.fail('不应产生读数'), mode => modes.push(mode), LightSensor)
  const sensor = LightSensor.latest
  sensor.dispatchEvent(new Event('error'))
  assert.deepEqual(modes, ['sensing', 'manual'])
  assert.equal(sensor.stopped, true)
  sensor.read(0)
  stop()
})

test('构造或启动感光失败也能回退；没有读数时三秒内开放手动模式', t => {
  const modes: OpeningLightMode[] = []
  class BlockedSensor extends LightSensor { start() { throw new Error('NotAllowedError') } }
  observeOpeningLight(() => {}, mode => modes.push(mode), BlockedSensor)()
  assert.deepEqual(modes, ['sensing', 'manual'])
  assert.equal(LightSensor.latest.stopped, true)
  class UnavailableSensor extends LightSensor { constructor(options: { frequency: number }) { super(options); throw new Error('SecurityError') } }
  modes.length = 0
  observeOpeningLight(() => {}, mode => modes.push(mode), UnavailableSensor)()
  assert.deepEqual(modes, ['manual'])
  t.mock.timers.enable({ apis: ['setTimeout'] })
  modes.length = 0
  const stop = observeOpeningLight(() => {}, mode => modes.push(mode), LightSensor)
  t.mock.timers.tick(3000)
  assert.deepEqual(modes, ['sensing', 'manual'])
  assert.equal(LightSensor.latest.stopped, true)
  stop()
})
