export const worldActorFiles = {
  self: '/assets/characters/ink/world/self.webp',
  shen: '/assets/characters/ink/world/shen.webp',
  guard: '/assets/characters/ink/world/guard.webp',
  nameless: '/assets/characters/ink/world/nameless.webp',
  faceless: '/assets/characters/ink/world/faceless.webp',
  mother: '/assets/characters/ink/world/mother.webp',
  han: '/assets/characters/ink/world/han.webp',
  tea: '/assets/characters/ink/world/tea.webp',
  child: '/assets/characters/ink/world/child.webp',
  chen: '/assets/characters/ink/world/chen.webp',
} as const

export type WorldActor = keyof typeof worldActorFiles
export type WorldNpc = Exclude<WorldActor, 'self' | 'shen' | 'guard' | 'nameless'>

// Each atlas has front, back, and right-facing rows. The right view also supplies the mirrored left view.
export const actorFrame = { width: 104, height: 144, rows: { down: 0, up: 1, right: 2, left: 2 } } as const
export const adultActorHeight = 56
export const npcHeight = { faceless: 56, mother: 50, han: 57, tea: 55, child: 41, chen: 55 } satisfies Record<WorldNpc, number>
