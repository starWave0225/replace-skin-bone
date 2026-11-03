import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { parse as parseSfc } from '@vue/compiler-sfc'
import { baseParse, NodeTypes } from '@vue/compiler-dom'
import { allNodes } from '../src/game/story.ts'
import { caseClues, dreamStations, protagonist } from '../src/game/prologue.ts'
import { locations, activities, itemInfo, journalInfo, clueInfo } from '../src/game/catalog.ts'
import { classics, originalSource } from '../src/game/classics.ts'
import { characterPortraits } from '../src/game/portraits.ts'
import { worldMaps } from '../src/game/world.ts'
import { combatFaces, combatMoves, combatIntents } from '../src/game/combat-data.ts'
import { musicTracks, musicScenes, musicAuthor, musicLicense } from '../src/game/music-data.ts'

// Read-only export. The caller saves the returned Markdown and JSON through apply_patch.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rows = []
const hasChinese = value => /[\u3400-\u9fff]/u.test(value)
const clean = value => value.replace(/[\t \r\n]+/g, ' ').trim()
function record(source, line, column, kind, text, context = '') {
  text = text.trim()
  if (text) rows.push({ source, line, column, kind, text, context })
}
function scanScript(source, content, lineOffset = 0, kind = '脚本文案') {
  const ast = ts.createSourceFile(source, content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  function visit(node) {
    let text
    let category = kind
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) text = node.text
    else if (ts.isTemplateExpression(node)) {
      text = node.head.text + node.templateSpans.map(span => '{{动态值}}' + span.literal.text).join('')
      category = '动态文案模板'
    }
    if (text && hasChinese(text)) {
      const position = ast.getLineAndCharacterOfPosition(node.getStart(ast))
      const context = ts.isPropertyAssignment(node.parent) ? node.parent.name.getText(ast) : ''
      record(source, position.line + lineOffset + 1, position.character + 1, category, text, context)
    }
    ts.forEachChild(node, visit)
  }
  visit(ast)
}
function scanTemplate(source, content, lineOffset = 0) {
  const ast = baseParse(content)
  function visit(node, tag = '') {
    if (node.type === NodeTypes.TEXT && /[\p{L}\p{N}]/u.test(node.content)) {
      record(source, node.loc.start.line + lineOffset, node.loc.start.column, '模板正文', clean(node.content), tag)
    } else if (node.type === NodeTypes.INTERPOLATION) {
      scanScript(source, node.content.content, node.loc.start.line + lineOffset - 1, '模板条件文案')
    } else if (node.type === NodeTypes.ELEMENT) {
      for (const prop of node.props) {
        if (prop.type === NodeTypes.ATTRIBUTE && prop.value && ['alt', 'title', 'aria-label', 'placeholder', 'content'].includes(prop.name)) {
          if (hasChinese(prop.value.content)) record(source, prop.loc.start.line + lineOffset, prop.loc.start.column, '说明与辅助标签', prop.value.content, prop.name)
        } else if (prop.type === NodeTypes.DIRECTIVE && prop.exp && hasChinese(prop.exp.content)) {
          scanScript(source, prop.exp.content, prop.loc.start.line + lineOffset - 1, prop.arg?.content === 'aria-label' ? '说明与辅助标签' : '模板条件文案')
        }
      }
    }
    for (const child of node.children ?? []) visit(child, node.tag ?? tag)
  }
  visit(ast)
}
function sourceFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(directory, entry.name)
    return entry.isDirectory() ? sourceFiles(full) : /\.(?:ts|vue|css|html)$/.test(entry.name) ? [full] : []
  })
}
for (const absolute of [...sourceFiles(path.join(root, 'src')), path.join(root, 'index.html')].sort()) {
  const source = path.relative(root, absolute).split(path.sep).join('/')
  const content = fs.readFileSync(absolute, 'utf8')
  if (source.endsWith('.vue')) {
    const { descriptor, errors } = parseSfc(content, { filename: absolute })
    if (errors.length) throw new Error(`${source}: ${errors.join(', ')}`)
    for (const block of [descriptor.script, descriptor.scriptSetup].filter(Boolean)) scanScript(source, block.content, block.loc.start.line - 1)
    if (descriptor.template) scanTemplate(source, descriptor.template.content, descriptor.template.loc.start.line - 1)
  } else if (source.endsWith('.ts')) scanScript(source, content)
  else if (source.endsWith('.html')) scanTemplate(source, content)
  else for (const match of content.matchAll(/content\s*:\s*(['"])(.*?)\1/g)) {
    if (hasChinese(match[2])) record(source, content.slice(0, match.index).split('\n').length, 1, '样式装饰文字', match[2])
  }
}
const seen = new Set()
const inventory = rows.filter(row => {
  const key = JSON.stringify([row.source, row.line, row.column, row.kind, row.text])
  if (seen.has(key)) return false
  seen.add(key)
  return true
}).sort((a, b) => a.source.localeCompare(b.source, 'en') || a.line - b.line || a.column - b.column)

const out = []
const add = (...lines) => out.push(...lines)
const quote = text => text.split('\n').map(line => line ? `> ${line}` : '>').join('\n')
const cell = text => String(text ?? '').replaceAll('|', '\\|').replaceAll('\n', '<br>')
function table(headers, items) {
  add(`| ${headers.join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`)
  for (const item of items) add(`| ${item.map(cell).join(' | ')} |`)
  add('')
}
function heading(text, level = 2) { add(`${'#'.repeat(level)} ${text}`, '') }
function templateSection(source, className) {
  const { descriptor } = parseSfc(fs.readFileSync(path.join(root, source), 'utf8'))
  const ast = baseParse(descriptor.template.content)
  function find(node) {
    if (node.type === NodeTypes.ELEMENT && node.props.some(prop => prop.type === NodeTypes.ATTRIBUTE && prop.name === 'class' && prop.value?.content.split(/\s+/).includes(className))) return node
    for (const child of node.children ?? []) { const found = find(child); if (found) return found }
  }
  return find(ast)
}
function prose(node) {
  if (node.type === NodeTypes.TEXT) return node.content
  if (node.type === NodeTypes.INTERPOLATION) return ''
  if (node.tag === 'br') return '\n'
  const text = (node.children ?? []).map(prose).join('')
  return node.tag === 'small' ? `\n${text}` : text
}
function pageProse(source, className) {
  const section = templateSection(source, className)
  if (!section) throw new Error(`Missing template section: ${source} ${className}`)
  const nodes = section.tag === 'p' ? [section] : section.children.filter(node => node.type === NodeTypes.ELEMENT && ['h1', 'p', 'blockquote'].includes(node.tag))
  for (const node of nodes) {
    const text = prose(node).replace(/[\t ]+/g, ' ').replace(/ *\n */g, '\n').trim()
    if (text) add(node.tag === 'h1' ? `**${text}**` : quote(text), '')
  }
}
const names = {
  opening: '初入无面茶楼', dressing: '借面前的选择', mirror: '查看铜镜', touch: '触碰面皮', room: '环顾茶楼', wear: '覆上沈砚之面',
  street: '南街遇见戚婆婆', recognition: '回应认亲', accept: '应下儿子的身份', deny: '否认身份', question: '追问这张脸', arrival: '韩七相邀', arrival_end: '自由寻访提示',
  meal: '陪婆婆吃面', meal_choice: '饭桌上的选择', meal_care: '陪伴与劈柴', meal_honest: '向婆婆坦白', relic: '查看沈砚遗物', relic_choice: '如何处理旧画', relic_care: '晾画', relic_memory: '追索记忆',
  tea: '茶摊旧闻', tea_choice: '追问茶摊老板', tea_end: '寻找孩子', tea_press: '追问封门令', case: '县衙查案', case_question: '韩七盘问', case_truth: '向韩七坦白', case_expose: '指出韩七的隐情', case_silence: '只看案卷', case_gift: '获得周平面谱', case_archive: '封存卷宗', case_guard: '借捕快之面查卷', case_end: '离开值房',
  ritual: '夜访茶楼', ritual_choice: '是否以忆换术', ritual_learn: '学安魂术', ritual_refuse: '留下记忆', watch: '后井守夜', watch_choice: '回应童影', watch_listen: '听童影说完', watch_name: '询问姓名', activity_end: '寻访结束',
  deadline: '第三日黄昏', well: '子夜井声', well_choice: '井边抉择', peace: '以情动人', bind: '以术安魂', deceive: '以面欺魂', scroll: '井底旧画', farewell: '回到戚家', final_choice: '章末抉择', stay_honest: '坦白后留下', stay_mask: '继续冒认并留下', stay_wait: '留下等待接纳', truth_accept: '婆婆以吃姜辨人', truth_relic: '婆婆以收画辨人', truth_wait: '真相尚待接受', leave: '留画离开', coda: '王宅残梦', chapter_end: '第一章结束',
}
function condition(value) {
  if (!value) return '无前置条件'
  if ('all' in value) return value.all.map(condition).join('，且')
  if ('any' in value) return value.any.map(condition).join('，或')
  if ('not' in value) return `不满足：${condition(value.not)}`
  if ('face' in value) return value.face === 'guard' ? '当前借周平之面' : '当前借沈砚之面'
  if ('stat' in value) return `${({ shen: '沈砚面契', guard: '周平面契', mother: '婆婆羁绊', han: '韩七羁绊', selfhood: '本心', karma: '业债' })[value.stat]} ≥ ${value.gte}`
  const flags = { can_empathize: '童影记忆至少两条', knows_ritual: '已学安魂术', mother_knows_truth: '婆婆已知身份真相', mother_can_accept: '婆婆达到接纳条件', trust_meal: '已陪婆婆吃面', heard_han_past: '已听到韩七旧事', file_obtained: '已获得案卷' }
  return `${value.is === false ? '未满足：' : ''}${flags[value.flag] ?? value.flag}`
}

const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()
const dirty = execFileSync('git', ['status', '--short', '--', 'src', 'index.html'], { cwd: root, encoding: 'utf8' }).trim().length > 0
const date = process.env.COPY_REVIEW_DATE ?? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Singapore' }).format(new Date())
const summary = { storyNodes: allNodes.length, storyChoices: allNodes.reduce((sum, node) => sum + (node.choices?.length ?? 0), 0), caseClues: caseClues.length, dreamStations: dreamStations.length, items: Object.keys(itemInfo).length, journals: Object.keys(journalInfo).length, sourceCandidates: inventory.length, sourceFiles: new Set(inventory.map(row => row.source)).size }
heading('画皮借面文案审阅稿', 1)
add(`版本：${date} 本地工作区，基准提交 ${commit}${dirty ? '，包含未提交的文案调整' : ''}。`, '')
add('正文保留当前代码原句，按剧情和用途编排。全部分支均列出，不代表一次游玩会全部出现。界面附录收录提示、动态文案模板、辅助标签及源码中的中文候选；其中个别数据字段暂未显示。{{动态值}} 代表姓名、数值等运行时内容。', '')
add('尚未实装的后续章节见 [主剧情初稿](MAIN_STORY-v1.md)。文案审阅不更改游戏进度或现有文本。', '')
table(['内容', '数量'], [['第一章剧情段落', summary.storyNodes], ['剧情选项', summary.storyChoices], ['客舍调查线索', summary.caseClues], ['梦境查验点', summary.dreamStations], ['物品说明', summary.items], ['因果录条目', summary.journals], ['源码文案候选', summary.sourceCandidates]])
add('目录：', '', '- 一 序章与梦境', '- 二 第一章全部对白与分支', '- 三 行囊与因果录', '- 四 地点和人物文字', '- 五 战斗文字', '- 六 原典摘句与配乐', '- 七 界面文案和系统提示', '- 八 辅助标签与源码索引', '- 九 后续主剧情草稿', '')

heading('一 序章与梦境')
add(`主角：${protagonist.name}，${protagonist.age} 岁，${protagonist.occupation}。`, '', '先列序章正文，再列调查线索和梦境查验文字。按钮、操作提示及老板回应的源码位置另见第七部分 PrologueView。', '')
heading('标题页引子', 3)
pageProse('src/App.vue', 'title-verse')
heading('雨夜寻凶图片演出', 3)
add('开场为约 34 秒的图片演出，没有旁白、对白或说明字幕。完成或跳过后进入客舍调查。分镜与素材见 [序章说明](PROLOGUE-v2.md) 和 [图片生成记录](opening-assets.json)。', '')
heading('初步判断', 3)
pageProse('src/components/PrologueView.vue', 'prologue-deduction')
add('三个判断：', '')
for (const button of templateSection('src/components/PrologueView.vue', 'prologue-deductions').children.filter(node => node.type === NodeTypes.ELEMENT && node.tag === 'button')) {
  const label = button.children.find(node => node.type === NodeTypes.ELEMENT && node.tag === 'b')
  add(`- ${prose(label).trim()}`)
}
add('')
heading('夜宿', 3)
pageProse('src/components/PrologueView.vue', 'prologue-night')
heading('入梦', 3)
pageProse('src/components/DreamExploration.vue', 'dream-intro')
heading('梦醒', 3)
pageProse('src/components/DreamExploration.vue', 'dream-waking')
const morning = inventory.find(row => row.source === 'src/components/PrologueView.vue' && row.context === 'text' && row.text.startsWith('天色微亮'))
if (morning) add(quote(morning.text), '')
for (const clue of caseClues) {
  heading(clue.title, 3)
  add(quote(clue.text), '', `案簿摘要：${clue.inference}`, '')
}
for (const station of dreamStations) {
  heading(station.title, 3)
  add(`交互：${station.action}`, '', quote(station.text), '', `白衣女魂：${station.whisper}`, '', `查验后引导：${station.revelation}`, '', `案记标题：${station.clueTitle}`, '', `案记正文：${station.clueNote}`, '')
  if (station.originalId) add(`引用原典：${classics.find(item => item.id === station.originalId).title}`, '')
}

heading('二 第一章全部对白与分支')
let group
for (const node of allNodes) {
  const current = node.id.replace(/_\d+$/, '')
  if (group !== current) { group = current; heading(names[group] ?? group, 3) }
  add(`**${node.speaker ?? '旁白'}** · ${node.id} · ${locations[node.location].name}`, '', quote(node.text), '')
  for (const choice of node.choices ?? []) {
    add(`- 选项：${choice.text}`, `  - 显示条件：${condition(choice.when)}`)
    if (choice.note) add(`  - 悬停说明：${choice.note}`)
    if (choice.locked) add(`  - 不可选时提示：${choice.locked}`)
    add(`  - 接续：${choice.next}`)
  }
  if (node.choices?.length) add('')
  if (node.next) add(`接续：${node.next}`, '')
  if (node.end) add(`段落结束：${node.end === 'hub' ? '回到自由探索' : '第一章结算'}`, '')
}

heading('人物在其他时辰的回应', 3)
const appScript = parseSfc(fs.readFileSync(path.join(root, 'src/App.vue'), 'utf8')).descriptor.scriptSetup.content
const appAst = ts.createSourceFile('App.vue.ts', appScript, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
function stringChoices(node) {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [node.text]
  if (ts.isConditionalExpression(node)) return [...stringChoices(node.whenTrue), ...stringChoices(node.whenFalse)]
  return []
}
function ambient(node) {
  if (ts.isVariableDeclaration(node) && node.name.getText(appAst) === 'replies' && ts.isObjectLiteralExpression(node.initializer)) {
    for (const prop of node.initializer.properties) {
      if (!ts.isPropertyAssignment(prop) || !ts.isArrayLiteralExpression(prop.initializer)) continue
      const [speaker, reply] = prop.initializer.elements
      const event = activities.find(item => item.id === prop.name.getText(appAst))
      add(`**${speaker.text}** · ${event?.title ?? prop.name.getText(appAst)}`, '')
      for (const text of stringChoices(reply)) add(quote(text), '')
    }
  }
  if (ts.isCallExpression(node) && node.expression.getText(appAst) === 'showAmbientDialogue' && node.arguments.length >= 2 && ts.isStringLiteral(node.arguments[0]) && ts.isStringLiteral(node.arguments[1])) add(`**${node.arguments[0].text}** · 街头回应`, '', quote(node.arguments[1].text), '')
  ts.forEachChild(node, ambient)
}
ambient(appAst)

heading('三 行囊与因果录')
heading('物品说明', 3)
for (const item of Object.values(itemInfo)) add(`**${item.title}**`, '', quote(item.text), '')
heading('记忆线索', 3)
for (const text of Object.values(clueInfo)) add(`- ${text}`)
add('')
heading('因果录', 3)
for (const entry of Object.values(journalInfo)) add(`**${entry.title}** · ${entry.status}`, '', quote(entry.text), '')

heading('四 地点和人物文字')
heading('地点资料', 3)
table(['地点', '资料中的副题', '资料中的题句'], Object.values(locations).map(item => [item.name, item.subtitle, item.verse]))
add('地点副题、题句属于数据字段，当前行走地图主要显示地点名称。', '')
heading('人物立绘资料', 3)
table(['人物', '身份'], Object.values(characterPortraits).map(item => [item.name, item.role]))
heading('调查事件', 3)
table(['事件', '副题', '地点', '时段'], activities.map(item => [item.title, item.subtitle, locations[item.location].name, item.times.map(time => ({ day: '白昼', dusk: '黄昏', night: '子夜' })[time]).join('、')]))
for (const map of Object.values(worldMaps)) {
  heading(map.name, 3)
  table(['人物或物件', '交互提示'], map.spots.map(spot => [spot.name, spot.hint]))
  const signs = [...new Set(map.objects.map(object => object.title).filter(Boolean))]
  if (signs.length) add(`场景题字：${signs.join('、')}`, '')
}

heading('五 战斗文字')
table(['面皮', '定位', '特性', '说明'], Object.values(combatFaces).map(face => [face.name, face.role, face.passive, face.passiveText]))
table(['招式', '说明'], Object.values(combatMoves).map(move => [move.name, move.description]))
table(['敌方意图', '危险', '说明'], combatIntents.map(intent => [intent.name, intent.danger, intent.description]))
add('逐招记录、战斗结果与不可出招提示见第七部分 combat.ts 和 CombatPreview。', '')

heading('六 原典摘句与配乐')
add(`原典底本：[识典古籍 画皮](${originalSource})。`, '')
for (const passage of classics) add(`**${passage.title}**`, '', quote(passage.text), '', `说明：${passage.context}`, '')
heading('配乐资料', 3)
table(['游戏内曲名', '原曲名', '场景', '资料中的音色情绪'], musicTracks.map(track => [track.label, track.title, track.scenes, track.mood]))
add(`音乐署名：${musicAuthor}。许可：[CC BY 4.0](${musicLicense})。音色情绪字段当前未在配乐面板展示。`, '')
table(['配乐场景', '面板名称'], Object.entries(musicScenes).map(([id, scene]) => [id, scene.name]))

const dataFiles = new Set(['src/game/story.ts', 'src/game/prologue.ts', 'src/game/catalog.ts', 'src/game/classics.ts', 'src/game/portraits.ts', 'src/game/world.ts', 'src/game/combat-data.ts', 'src/game/music-data.ts'])
function listRows(selected) {
  for (const row of selected) add(`- ${row.kind}${row.context ? ` · ${row.context}` : ''} · ${row.source}:${row.line}`, ...row.text.split('\n').map(line => `  > ${line}`), '')
}
heading('七 界面文案和系统提示')
add('按文件列出当前界面正文及脚本内的文案候选。条件分支中的每一种说法分别保留；时段回应、主线任务、结局短句、存档提醒也在其中。', '')
for (const source of [...new Set(inventory.filter(row => !dataFiles.has(row.source) && row.kind !== '说明与辅助标签').map(row => row.source))]) {
  heading(source.replace(/^src\//, ''), 3)
  listRows(inventory.filter(row => row.source === source && row.kind !== '说明与辅助标签'))
}
heading('八 辅助标签与源码索引')
add('辅助标签用于图片替代文本、无障碍名称和悬停说明，不全部显示为正文。每条候选附有源码位置；完整机器清单可运行 node --import tsx scripts/export-copy.mjs --inventory 提取。', '')
listRows(inventory.filter(row => row.kind === '说明与辅助标签'))
heading('九 后续主剧情草稿')
add('后续主线的案件真相、人物动机、六章结构、四类结局与夜宿演出草稿保存在 [MAIN_STORY-v1.md](MAIN_STORY-v1.md)，后续章节尚未接入可玩剧情；序章图片开场已实现。柳见秋、殷照、程素娘等新增姓名也仅属于这份草稿。', '')
const draft = fs.readFileSync(path.join(root, 'docs/MAIN_STORY-v1.md'), 'utf8')
for (const title of draft.matchAll(/^### ((?:序章|第[一二三四五六]章) .+)$/gm)) add(`- ${title[1]}`)
add('', '重新提取：在项目根目录运行 node --import tsx scripts/export-copy.mjs --markdown。程序只输出文稿，不修改游戏文件。', '')

const markdown = out.join('\n')
const machine = { version: 1, date, baseCommit: commit, includesUncommittedCopy: dirty, summary, story: allNodes.map(({ id, speaker, text, location, next, end, choices }) => ({ id, speaker, text, location, next, end, choices })), inventory }
const mode = process.argv[2]
if (mode === '--markdown') process.stdout.write(markdown)
else console.log(JSON.stringify(mode === '--summary' ? summary : mode === '--inventory' ? machine : { summary, markdown, machine }, null, 2))
