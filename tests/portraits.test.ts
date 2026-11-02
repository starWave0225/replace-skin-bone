import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { allNodes, story } from '../src/game/story'
import { characterPortraits, getDialoguePortrait } from '../src/game/portraits'

test('全部真实说话人物均有专属立绘，包括卖灯人和主角', () => {
  const meta = ['旁白','行旅提示','第一章 · 借皮入世']
  const prefixes = ['原典','旧卷所载','檐下旧声','旧事残文']
  const speakers = [...new Set(allNodes.map(node => node.speaker).filter(Boolean))] as string[]
  const realSpeakers = speakers.filter(speaker => !meta.includes(speaker) && !prefixes.some(prefix => speaker.startsWith(prefix)))
  assert.ok(realSpeakers.includes('卖灯人'))
  for (const speaker of realSpeakers) assert.ok(getDialoguePortrait(speaker), `${speaker} 缺少立绘`)
})
test('主角的说话立绘随当前借用面皮切换，旁白和原典不显示人物', () => {
  assert.equal(getDialoguePortrait('你','shen')?.id,'shen')
  assert.equal(getDialoguePortrait('你','guard')?.id,'guard')
  assert.equal(getDialoguePortrait('你 · 沈砚之面','shen')?.side,'left')
  for (const speaker of ['旁白','行旅提示','原典残句 · 道士言','旧事残文 · 陈氏救夫',undefined]) assert.equal(getDialoguePortrait(speaker),undefined)
  assert.equal(getDialoguePortrait('戚婆婆')?.side,'right')
})
test('交谈中的叙述保留场景人物，独立叙述和原典不串入上一场立绘', () => {
  const portraitAt = (id: string) => {
    const node = story[id]
    return getDialoguePortrait(node.speaker, 'shen', node.portraitSpeaker)?.id
  }
  assert.equal(portraitAt('opening_2'), 'faceless')
  assert.equal(portraitAt('street_1'), 'mother')
  assert.equal(portraitAt('street_4'), 'mother')
  assert.equal(portraitAt('arrival_2'), 'han')
  assert.equal(portraitAt('relic_memory_1'), undefined)
  assert.equal(portraitAt('opening_1'), undefined)
  assert.equal(getDialoguePortrait('韩七', 'shen', '戚婆婆')?.id, 'han')
  assert.equal(getDialoguePortrait('你', 'guard', '戚婆婆')?.id, 'guard')
})
test('全部立绘文件已打包在项目内，并且是有效 WebP 资源', () => {
  const paths = Object.values(characterPortraits).map(portrait => portrait.src)
  assert.equal(new Set(paths).size,10)
  for (const path of paths) {
    const filename = resolve('public',path.slice(1))
    assert.ok(existsSync(filename),`${path} 未保存到项目`)
    const bytes = readFileSync(filename)
    assert.equal(bytes.subarray(0,4).toString(),'RIFF')
    assert.equal(bytes.subarray(8,12).toString(),'WEBP')
  }
})
