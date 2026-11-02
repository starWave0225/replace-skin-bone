<script setup lang="ts">
withDefaults(defineProps<{expression?:'calm'|'smile'|'cross'}>(),{expression:'calm'})
</script>
<template>
  <svg viewBox="0 0 32 42" shape-rendering="crispEdges" aria-hidden="true">
    <path d="M9 2H23V5H27V10H29V25H26V31H22V35H18V38H14V35H10V31H6V25H3V10H5V5H9Z" fill="#30454c"/>
    <path d="M10 4H22V7H25V11H27V24H24V29H20V33H17V35H15V33H12V29H8V24H5V11H7V7H10Z" fill="#f8e6b4"/>
    <path d="M10 4H22V7H11V10H8V23H5V11H7V7H10Z" fill="#fff5d7"/>
    <path d="M24 12H27V24H24V29H20V33H17V35H15V33H18V29H22V23H24Z" fill="#d7b87d"/>
    <path d="M9 12H14V14H8V13H9ZM19 12H24V14H18V13H19Z" fill="#69565b"/>
    <path v-if="expression==='cross'" d="M8 16H11V18H14V20H10V18H8ZM22 16H25V18H23V20H19V18H22Z" fill="#34434a"/>
    <path v-else d="M8 16H14V18H12V19H9V18H8ZM18 16H24V18H23V19H20V18H18Z" fill="#34434a"/>
    <path d="M15 19H17V24H14V22H15Z" fill="#c59b75"/>
    <path v-if="expression==='smile'" d="M12 26H14V28H18V26H20V29H17V30H15V29H12Z" fill="#b96b63"/>
    <path v-else d="M13 27H19V29H13Z" fill="#b96b63"/>
    <path d="M7 21H10V23H7ZM22 21H25V23H22Z" fill="#e5a58b"/>
    <path d="M15 37H18V40H15ZM11 39H15V42H11ZM18 39H22V42H18Z" fill="#c56558"/>
  </svg>
</template>
