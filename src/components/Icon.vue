<script setup lang="ts">
withDefaults(defineProps<{ name: string; size?: number }>(), { size: 20 })
const paths: Record<string, string> = {
  map: 'm3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2V5Zm6-2v16M15 5v16',
  bag: 'M6 8h12l2 12H4L6 8Zm3 0V5a3 3 0 0 1 6 0v3M8 13h8',
  mask: 'M4 3c4 2 12 2 16 0v9c0 5-5 9-8 10-3-1-8-5-8-10V3Zm3 6 3 1m4 0 3-1m-8 7c2 1 4 1 6 0',
  people: 'M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3M9 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm8 1a4 4 0 0 1 0 8m5 9v-3a4 4 0 0 0-3-3',
  book: 'M12 5C9 2 4 3 2 4v16c4-2 7-1 10 1 3-2 6-3 10-1V4c-2-1-7-2-10 1Zm0 0v16',
  moon: 'M20.5 13.5A9 9 0 0 1 10.5 3a9 9 0 1 0 10 10.5Z',
  sun: 'M12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0-5v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5',
  dusk: 'M3 17h18M5 13a7 7 0 0 1 14 0M12 2v3M3 5l2 2m14 0 2-2M3 21h18',
  save: 'M4 3h13l4 4v14H3V3h1Zm3 0v6h10V3M7 21v-8h10v8',
  sound: 'M3 9h4l5-5v16l-5-5H3V9Zm13-2a7 7 0 0 1 0 10m3-13a11 11 0 0 1 0 16',
  mute: 'M3 9h4l5-5v16l-5-5H3V9Zm13 0 6 6m0-6-6 6',
  settings: 'M12 8a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM9 2h6l1 4 4 1 2 5-3 3v5l-5 2-3-3-5 1-3-5 2-4-1-5 5-4Z',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  close: 'm5 5 14 14M19 5 5 19',
  leaf: 'M20 3C9 1 2 5 4 15c9 7 17 0 16-12ZM4 20 16 8',
  clock: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 3v6l4 2',
  check: 'm4 12 5 5L20 6',
  lock: 'M6 10h12v11H6V10Zm3 0V6a3 3 0 0 1 6 0v4m-3 4v3',
  history: 'M3 11a9 9 0 1 1 3 8M3 4v7h7m2-5v6l4 2',
  info: 'M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 7v7m0-11v1',
  home: 'm2 10 10-8 10 8M5 8v13h14V8m-10 13v-8h6v8',
  download: 'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
}
</script>
<template><svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path :d="paths[name] || paths.leaf" /></svg></template>
