import type { GameState, SaveData } from './types'
import { isValidState } from './engine'
const DB_NAME = 'borrowed-face-v1'
let database: Promise<IDBDatabase> | undefined
function db() {
  return database ??= new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1)
    request.onupgradeneeded = () => request.result.createObjectStore('saves')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => { database = undefined; reject(new Error('浏览器暂时无法打开本地存档')) }
  })
}
export async function writeSave(slot: string, state: GameState): Promise<void> {
  const database = await db()
  const payload: SaveData = { version: 1, savedAt: Date.now(), state: JSON.parse(JSON.stringify(state)) }
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction('saves', 'readwrite')
    transaction.objectStore('saves').put(payload, slot)
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(new Error('存档写入失败，请检查浏览器存储空间'))
    transaction.onabort = () => reject(new Error('存档写入中断'))
  })
}
export async function readSave(slot: string): Promise<SaveData | undefined> {
  const database = await db()
  return new Promise((resolve, reject) => {
    const request = database.transaction('saves').objectStore('saves').get(slot)
    request.onsuccess = () => {
      const value = request.result as SaveData | undefined
      if (value && (value.version !== 1 || !isValidState(value.state))) { reject(new Error('此存档版本或内容无法读取')); return }
      // Existing saves keep a copy of past dialogue, including the former place name.
      if (value) for (const entry of value.state.history) entry.text = entry.text.replace(/槐阴(?:县)?/g, '未闻县')
      resolve(value)
    }
    request.onerror = () => reject(new Error('存档读取失败'))
  })
}
