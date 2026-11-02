<script setup lang="ts">
withDefaults(defineProps<{ variant?: 'shen' | 'guard' | 'empty'; small?: boolean }>(), { variant: 'shen', small: false })
</script>
<template>
  <svg class="painted-mask" :class="[variant, { small }]" viewBox="0 0 300 420" aria-hidden="true">
    <defs>
      <linearGradient :id="`skin-${variant}`" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#c8b996"/><stop offset=".42" stop-color="#efe1bb"/><stop offset="1" stop-color="#877c63"/></linearGradient>
      <radialGradient :id="`cheek-${variant}`"><stop stop-color="#984d43" stop-opacity=".36"/><stop offset="1" stop-color="#984d43" stop-opacity="0"/></radialGradient>
      <filter :id="`paper-${variant}`"><feTurbulence type="fractalNoise" baseFrequency=".065" numOctaves="3" result="noise" seed="7"/><feColorMatrix in="noise" type="saturate" values="0"/><feBlend in="SourceGraphic" mode="multiply"/></filter>
    </defs>
    <path class="mask-thread" d="M150 0V47" stroke="#a69a75" stroke-width="1"/>
    <path d="M73 75Q144 30 222 79L231 165Q233 225 192 286Q169 323 146 332Q114 317 86 272Q53 225 63 155Z" fill="#000" opacity=".25" transform="translate(8 12)"/>
    <path d="M70 73Q143 31 219 77L226 162Q228 221 188 284Q167 317 146 328Q116 313 89 268Q54 220 62 153Z" :fill="`url(#skin-${variant})`" stroke="#93866a" stroke-width="1.3"/>
    <path d="M73 74Q145 35 215 77L217 102Q145 69 68 104Z" fill="#27302b" opacity=".86"/>
    <path d="M71 102Q87 87 101 91M181 89Q199 87 217 104" stroke="#171e1b" stroke-width="6" fill="none"/>
    <template v-if="variant !== 'empty'">
      <path d="M80 151Q105 132 129 148M164 147Q189 131 212 151" stroke="#353830" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M80 166Q105 154 126 170Q105 180 80 166M167 169Q188 153 212 166Q188 179 167 169" fill="#2b302b"/>
      <path d="M85 164Q105 158 121 168M171 168Q190 157 207 164" stroke="#c5b997" stroke-width="1" fill="none" opacity=".6"/>
      <path d="M147 160Q137 198 136 218Q147 228 160 217" stroke="#8e8064" stroke-width="2" fill="none"/>
      <path d="M122 255Q145 247 169 253Q149 264 122 255" fill="#834d42"/>
      <path d="M126 264Q149 271 168 260" stroke="#9f725c" fill="none"/>
      <ellipse cx="94" cy="212" rx="33" ry="37" :fill="`url(#cheek-${variant})`"/><ellipse cx="196" cy="211" rx="33" ry="37" :fill="`url(#cheek-${variant})`"/>
      <path v-if="variant === 'guard'" d="m183 112-16 98M114 276q31 45 61-4" stroke="#4b483d" stroke-width="3" fill="none"/>
    </template>
    <path d="m76 122-6 30 7 17-4 35M212 197l-8 24 4 15-12 21" stroke="#81785e" stroke-width=".8" fill="none"/>
    <path d="M145 330v41m-7-9h15m-17 7h19m-18 4 7 18 9-18" stroke="#934b3f" stroke-width="2" fill="none"/>
    <path d="M146 391v21m-4-21-3 19m11-19 4 19" stroke="#934b3f" stroke-width="2.5"/>
  </svg>
</template>
