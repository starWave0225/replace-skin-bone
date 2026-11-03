import test from 'node:test'
import assert from 'node:assert/strict'
import { startGame } from '../src/game/engine'
import { readSave } from '../src/game/saves'
import type { SaveData } from '../src/game/types'

test('旧存档的对话地名更新为未闻县，保留剧情进度和选择记录', async t => {
  const state = startGame(true)
  state.history = [
    { speaker: '无面娘', text: '去槐阴县南街。' },
    { speaker: '你', text: '赴槐阴', choice: 'accept' },
    { speaker: '井中童影', text: '我家就在双生槐底下。' },
  ]
  const payload: SaveData = { version: 1, savedAt: 123456, state }
  const original = structuredClone(payload)
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB')
  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    value: {
      open() {
        const request = { result: {
          transaction() { return { objectStore() { return {
            get(slot: string) {
              assert.equal(slot, 'auto')
              const read = { result: structuredClone(payload), onsuccess: () => {} }
              queueMicrotask(() => read.onsuccess())
              return read
            },
          } } } },
        }, onsuccess: () => {} }
        queueMicrotask(() => request.onsuccess())
        return request
      },
    },
  })
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, 'indexedDB', descriptor)
    else Reflect.deleteProperty(globalThis, 'indexedDB')
  })

  const restored = await readSave('auto')
  const expected = structuredClone(original)
  expected.state.history[0].text = '去未闻县南街。'
  expected.state.history[1].text = '赴未闻县'
  assert.deepEqual(restored, expected)
  assert.deepEqual(payload, original)
})
