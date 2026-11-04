import { readonly, ref } from 'vue'

const storageKey = 'borrowed-face-interaction-rings'
const enabled = ref(true)
try { enabled.value = localStorage.getItem(storageKey) !== 'off' } catch { /* Storage is optional. */ }

export const interactionRingsEnabled = readonly(enabled)

export function toggleInteractionRings() {
  enabled.value = !enabled.value
  try { localStorage.setItem(storageKey, enabled.value ? 'on' : 'off') } catch { /* Session preference still works. */ }
}
