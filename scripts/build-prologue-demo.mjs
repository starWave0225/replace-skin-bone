import { spawnSync } from 'node:child_process'
import { copyFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const output = 'artifacts/prologue-demo'
const env = { ...process.env, VITE_DEMO_MODE: 'prologue', VITE_BASE_PATH: process.env.VITE_BASE_PATH || '/qianmian-prologue-demo/' }
for (const args of [
  ['node_modules/vue-tsc/bin/vue-tsc.js', '--noEmit'],
  ['node_modules/vite/bin/vite.js', 'build', '--outDir', output],
]) {
  const result = spawnSync(process.execPath, args, { cwd: root, env, stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) process.exit(result.status || 1)
}
copyFileSync(path.join(root, 'ASSET_CREDITS.md'), path.join(root, output, 'ASSET_CREDITS.md'))
writeFileSync(path.join(root, output, '.nojekyll'), '')
writeFileSync(path.join(root, output, 'README.md'), '# 画皮：千面 · 序章试玩\n\n独立浏览器 demo，从雨夜来书开始，至序章片尾结束；不接入第一章。\n\n支持电脑键鼠与手机触屏，试玩存档独立保存。素材署名见 [ASSET_CREDITS.md](ASSET_CREDITS.md)。\n\n本仓库仅用于部署构建产物。源码项目：https://github.com/starWave0225/replace-skin-bone\n')
