import { createApp, defineAsyncComponent } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import PortraitGallery from './components/PortraitGallery.vue'
import './style.css'
const view = new URLSearchParams(window.location.search).get('view')
if (view === 'combat') document.title = '画皮：借面 · 战斗试玩'
if (view === 'world') document.title = '画皮：借面 · 未闻县行图'
const root = view === 'dream' ? defineAsyncComponent(()=>import('./components/DreamPreview.vue')) : view === 'combat' ? defineAsyncComponent(()=>import('./components/CombatPreview.vue')) : view === 'world' ? defineAsyncComponent(()=>import('./components/WorldPreview.vue')) : view === 'portraits' ? PortraitGallery : App
createApp(root).use(createPinia()).mount('#app')
