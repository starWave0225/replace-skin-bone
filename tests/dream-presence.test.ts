import test from 'node:test'
import assert from 'node:assert/strict'
import { dreamContact, dreamMirror, dreamMirrorContact, dreamShadows, dreamPlaybackDuration, dreamSubtitle } from '../src/game/dream-presence'
import { dreamBlocked, dreamPath, moveInDream } from '../src/game/dream-navigation'
import { dreamStations, type DreamStationId } from '../src/game/prologue'

test('女魂触碰点均可步行抵达，出生不会自动触发剧情', () => {
  let position = { x: 0, z: 8.3 }
  const seen: DreamStationId[] = []
  assert.equal(dreamContact(seen, position, 0), undefined)
  for (const [stage, station] of dreamStations.entries()) {
    const target = dreamShadows[station.id]
    assert.equal(dreamBlocked(target.x, target.z), false, station.id)
    const path = dreamPath(position, target)
    assert.ok(path.length, station.id)
    for (const next of path) {
      const moved = moveInDream(position, next.x - position.x, next.z - position.z)
      assert.ok(Math.hypot(moved.x - next.x, moved.z - next.z) < .01, station.id)
      position = moved
    }
    assert.equal(dreamContact(seen, position, stage), station.id)
    seen.push(station.id)
    assert.equal(dreamContact(seen, position, stage), undefined, '旧影未移走不能再触发')
  }
  assert.equal(dreamContact(seen, position, seen.length), undefined)
})

test('暂停、未出现的影子及远处物件不会推进梦境', () => {
  assert.equal(dreamContact([], dreamShadows.hall, 0, true), undefined)
  assert.equal(dreamContact([], dreamShadows.hall, 1), undefined)
  assert.equal(dreamContact([], dreamShadows.mirror, 0), undefined)
  assert.equal(dreamContact(['hall'], dreamShadows.hall, 1), undefined)
  assert.equal(dreamContact([], { x: Number.NaN, z: 6.6 }, 0), undefined)
})

test('对白逐句呈现并自动留出淡出时间，无需记下或确认', () => {
  for (const { id } of dreamStations) {
    assert.ok(dreamSubtitle(id, 0)?.text)
    const duration = dreamPlaybackDuration(id)
    assert.equal(dreamSubtitle(id, duration - 650), undefined)
    assert.equal(dreamSubtitle(id, duration), undefined)
    assert.ok(duration > 3400)
  }
})

test('女魂对白结束仍留在梦中，面向铜镜走至镜前才可离开', () => {
  const seen = dreamStations.map(station => station.id)
  const mirrorPose = { ...dreamMirror.approach, yaw: Math.PI / 2 }
  assert.equal(dreamMirrorContact(seen, { ...dreamShadows.mirror, yaw: Math.PI / 2 }), false)
  assert.equal(dreamMirrorContact(seen.slice(0, -1), mirrorPose), false)
  assert.equal(dreamMirrorContact(seen, mirrorPose, true), false)
  assert.equal(dreamMirrorContact(seen, { ...mirrorPose, yaw: -Math.PI / 2 }), false)
  assert.equal(dreamMirrorContact(seen, mirrorPose), true)
  let position = dreamShadows.mirror
  const path = dreamPath(position, dreamMirror.approach)
  assert.ok(path.length)
  for (const next of path) {
    position = moveInDream(position, next.x - position.x, next.z - position.z)
    assert.ok(Math.hypot(position.x - next.x, position.z - next.z) < .12, '镜架边缘可在寻路到达半径内通过')
  }
  assert.equal(dreamMirrorContact(seen, { ...position, yaw: Math.PI / 2 }), true)
})
