import { createApp, defineAsyncComponent } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import PortraitGallery from './components/PortraitGallery.vue'
import './style.css'
import './mobile.css'
import './viewport.css'
const view = new URLSearchParams(window.location.search).get('view')
if (view === 'prologue-well') document.title = '画皮：借面 · 序章井边教学'
if (view === 'combat') document.title = '画皮：借面 · 战斗试玩'
if (view === 'world') document.title = '画皮：借面 · 未闻县行图'
if (view === 'opening') document.title = '画皮：借面 · 雨夜寻凶'
if (view === 'dream') document.title = '画皮：借面 · 梦中寻相'
const root = view === 'prologue-well' ? defineAsyncComponent(()=>import('./components/PrologueWellPreview.vue')) : view === 'opening' ? defineAsyncComponent(()=>import('./components/OpeningPreview.vue')) : view === 'dream' ? defineAsyncComponent(()=>import('./components/DreamPreview.vue')) : view === 'combat' ? defineAsyncComponent(()=>import('./components/CombatPreview.vue')) : view === 'world' ? defineAsyncComponent(()=>import('./components/WorldPreview.vue')) : view === 'portraits' ? PortraitGallery : App
createApp(root).use(createPinia()).mount('#app')
