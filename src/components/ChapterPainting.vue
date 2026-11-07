<script setup lang="ts">
withDefaults(defineProps<{piece?:string;turns?:number;lamps?:string[];nameRevealed?:boolean}>(),{turns:0,lamps:()=>[]})
</script>
<template>
  <svg :viewBox="piece?`${({bridge:0,tree:200,well:400} as Record<string,number>)[piece]} 0 200 240`:'0 0 600 240'" class="chapter-painting" :style="{transform:`rotate(${turns*90}deg)`}" role="img" :aria-label="piece?'一片山水残画':'桥、柳树与井畔小灯的水墨残画'">
    <rect width="600" height="240" fill="#cdb98c"/>
    <path d="M0 91Q50 27 100 77T200 83Q251 23 305 70T400 69Q480 14 535 64T600 42L600 130L0 135Z" fill="#6e796d" opacity=".45"/>
    <path d="M0 122Q67 81 132 114T245 105T353 106T467 103T600 111" fill="none" stroke="#687369" stroke-width="3"/>
    <path d="M0 193Q150 208 290 180T600 191L600 240H0Z" fill="#697d76" opacity=".35"/>
    <g stroke="#65766b" stroke-width="1.5" fill="none" opacity=".7"><path d="M0 215Q160 190 300 214T600 212M0 228Q150 212 300 230T600 224"/></g>
    <path d="M0 174Q150 114 300 157T600 181M0 186Q150 126 300 169T600 193" fill="none" stroke="#473f33" stroke-width="5"/>
    <g stroke="#473f33" stroke-width="4"><path d="M30 164v19m48-35v24m51-34v24m50-23v23m47-20v24m48-16v24m48-11v24m48-14v23m48-16v25m48-14v23m48-14v23m48-17v22"/></g>
    <g stroke="#404a3c" fill="none"><path d="M347 190Q336 101 354 30M347 84Q290 51 253 47M350 69Q409 32 448 35" stroke-width="10"/><path d="M254 47q-3 62-28 92m45-87q6 51-13 91m37-83q9 43-6 91m19-82q15 53 3 89m96-115q25 44 17 91m-9-96q34 31 31 88m-11-92q33 29 37 70" stroke-width="3"/></g>
    <g fill="#4c4637"><path d="M43 150V97h64v51h-13v-38H56v40Z"/><path d="M26 98l49-28 49 28-11 5H35Z"/><path d="M470 124l51-30 61 27-11 7h-92Z"/><path d="M482 128h6v28h-6m76-28h6v37h-6"/></g>
    <ellipse cx="513" cy="190" rx="43" ry="15" fill="#554e40"/><path d="M470 190v23q40 21 86 0v-23" fill="#897c60" stroke="#504c3f" stroke-width="3"/><ellipse cx="513" cy="190" rx="30" ry="8" fill="#383d34"/>
    <path d="M442 184q-10 10-8 26h22q2-18-8-26" fill="#5c6253"/><circle cx="445" cy="177" r="8" fill="#8c7d62"/>
    <g v-for="(lamp,i) in [{id:'gate',x:98,y:112},{id:'bridge',x:199,y:151},{id:'eaves',x:554,y:140}]" :key="lamp.id">
      <circle v-if="lamps.includes(lamp.id)" :cx="lamp.x" :cy="lamp.y" r="24" fill="#e8c96c" opacity=".4"/>
      <path :d="`M${lamp.x} ${lamp.y-21}v11`" stroke="#514637" stroke-width="2"/>
      <rect :x="lamp.x-6" :y="lamp.y-10" width="12" height="17" rx="4" :fill="lamps.includes(lamp.id)?'#ffe6a0':'#8d7556'" stroke="#574d39"/>
      <text :x="lamp.x" :y="lamp.y+24" text-anchor="middle" fill="#493f30" font-size="12">{{['门','桥','檐'][i]}}</text>
    </g>
    <text v-if="nameRevealed" x="400" y="214" fill="#352f29" font-size="30" font-family="MaShan,serif">满</text>
    <path v-if="nameRevealed" d="M390 191l25 4-4 29-28-2Z" fill="#597c81" opacity=".2"/>
  </svg>
</template>
