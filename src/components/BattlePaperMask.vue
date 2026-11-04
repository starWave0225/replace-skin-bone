<script setup lang="ts">
withDefaults(defineProps<{expression?:'calm'|'smile'|'cross'}>(),{expression:'calm'})
</script>
<template>
  <svg viewBox="0 0 32 42" aria-hidden="true">
    <path d="M4 8Q10 1 18 3L20 2Q27 4 29 11L28 16Q29 23 25 29L23 30Q20 34 16 36Q11 34 8 30L8 28Q3 23 3 16Z" fill="#d7c5a0" stroke="#3b2d25" stroke-width="1.15"/>
    <path d="M5 14Q7 6 17 5M26 12Q29 21 22 28Q20 32 17 34M5 20L7 24M10 28l2 2" fill="none" stroke="#ae9070" stroke-width=".7"/>
    <path v-if="expression==='cross'" d="M7 13q4 0 7 3M25 13q-4 0-7 3" fill="none" stroke="#534236" stroke-width=".85"/>
    <path v-else d="M7 14q4-3 7 0M18 14q4-3 7 0" fill="none" stroke="#534236" stroke-width=".85"/>
    <path d="M7 17q4-2 7 1q-4 2-7-1m11 1q3-3 7-1q-3 3-7 1" fill="#2a2621"/>
    <path d="M16 18q0 4-2 6l3 .5" fill="none" stroke="#9b795f" stroke-width=".9"/>
    <path v-if="expression==='smile'" d="M12 26q4 3 8 0" fill="none" stroke="#8d4d46" stroke-width="1.2" stroke-linecap="round"/>
    <path v-else d="M12 28q4-2 8 0" fill="none" stroke="#8d4d46" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M16 36q-3 3 2 5m-2-5q2 3-1 6" fill="none" stroke="#905042" stroke-width="1"/>
  </svg>
</template>
