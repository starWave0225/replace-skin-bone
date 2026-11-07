import { createApp, defineAsyncComponent } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import PortraitGallery from './components/PortraitGallery.vue'
import './style.css'
import './mobile.css'
import './viewport.css'
import { isPrologueDemo } from './game/build-profile'
const view = isPrologueDemo ? null : new URLSearchParams(window.location.search).get('view')
if (isPrologueDemo) document.title = '画皮：千面 · 序章试玩'
if (view === 'prologue-well') document.title = '画皮：千面 · 序章井边教学'
if (view === 'combat') document.title = '画皮：千面 · 战斗试玩'
if (view === 'world') document.title = '画皮：千面 · 未闻县行图'
if (view === 'opening') document.title = '画皮：千面 · 雨夜寻凶'
if (view === 'dream') document.title = '画皮：千面 · 梦中寻相'
if (view === 'cg') document.title = '画皮：千面 · 剧情 CG'
if (view === 'chapter-one') document.title = '画皮：千面 · 第一章试玩'
const root = view === 'chapter-one' ? defineAsyncComponent(()=>import('./components/ChapterOnePreview.vue')) : view === 'cg' ? defineAsyncComponent(()=>import('./components/CinematicPreview.vue')) : view === 'prologue-well' ? defineAsyncComponent(()=>import('./components/PrologueWellPreview.vue')) : view === 'opening' ? defineAsyncComponent(()=>import('./components/OpeningPreview.vue')) : view === 'dream' ? defineAsyncComponent(()=>import('./components/DreamPreview.vue')) : view === 'combat' ? defineAsyncComponent(()=>import('./components/CombatPreview.vue')) : view === 'world' ? defineAsyncComponent(()=>import('./components/WorldPreview.vue')) : view === 'portraits' ? PortraitGallery : App
createApp(root).use(createPinia()).mount('#app')
