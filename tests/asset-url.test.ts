import test from 'node:test'
import assert from 'node:assert/strict'
import { assetUrl } from '../src/game/asset-url'

test('运行素材同时支持本地根目录和 GitHub Pages 项目目录', () => {
  for (const path of [
    '/assets/portraits/lu-v1.webp',
    '/assets/music/suspense3.ogg',
    '/assets/opening-sfx/door-creak-v1.wav',
    '/assets/opening-sfx/window-blown-open-v1.wav',
    '/assets/dream/realism/chinese_armchair/model.gltf',
  ]) {
    assert.equal(assetUrl(path, '/'), path)
    assert.equal(assetUrl(path, '/replace-skin-bone/'), `/replace-skin-bone${path}`)
    assert.equal(assetUrl(path, '/replace-skin-bone'), `/replace-skin-bone${path}`)
  }
})

test('不会重复添加项目目录，也不改写模型的相对依赖或外部地址', () => {
  for (const path of [
    '/replace-skin-bone/assets/portraits/lu-v1.webp',
    'textures/color.webp',
    'model.bin',
    'https://example.com/assets/portrait.webp',
    'data:image/png;base64,AA==',
  ]) assert.equal(assetUrl(path, '/replace-skin-bone/'), path)
})
