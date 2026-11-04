/** Pixel-Boy + AAA, Ninja Adventure (CC0). Rectangles are source pixels, never screenshots. */
export const pixelAssetSource = 'https://pixel-boy.itch.io/ninja-adventure-asset-pack'
export const pixelEnvironmentFiles = {
  floor: '/assets/world-pixel/floor.png', interior: '/assets/world-pixel/interior.png',
  houses: '/assets/world-pixel/houses.png', nature: '/assets/world-pixel/nature.png',
  props: '/assets/world-pixel/props.png', beds: '/assets/world-pixel/beds.png',
  water: '/assets/world-pixel/water.png', walls: '/assets/world-pixel/walls.png',
  shadow: '/assets/world-pixel/shadow.png',
} as const
export const pixelCharacterFiles = {
  self: '/assets/world-pixel/self.png', shen: '/assets/world-pixel/shen.png',
  guard: '/assets/world-pixel/guard.png', nameless: '/assets/world-pixel/nameless.png',
  woman: '/assets/world-pixel/woman.png', mother: '/assets/world-pixel/mother.png',
  han: '/assets/world-pixel/han.png', tea: '/assets/world-pixel/tea.png', child: '/assets/world-pixel/child.png',
} as const
export const worldPixelFiles = { ...pixelEnvironmentFiles, ...pixelCharacterFiles }
export interface PixelRegion { sheet: keyof typeof pixelEnvironmentFiles; x: number; y: number; w: number; h: number }
const cell = (sheet: PixelRegion['sheet'], x: number, y: number, w = 1, h = 1): PixelRegion => ({ sheet, x: x * 16, y: y * 16, w: w * 16, h: h * 16 })
export const pixelRegions = {
  grass: cell('floor', 11, 12), grassDetail: cell('floor', 12, 12),
  soil: cell('floor', 12, 19), stone: cell('interior', 12, 13),
  floor: cell('interior', 1, 1), roof: cell('houses', 13, 1),
  plaster: cell('houses', 10, 9), wood: cell('props', 10, 2),
  window: cell('houses', 0, 3), door: cell('houses', 1, 3),
  tree: cell('nature', 0, 0, 2, 2), pine: cell('nature', 0, 2, 4, 3),
  willow: cell('nature', 4, 2, 4, 3), bamboo: cell('nature', 10, 8, 1, 2),
  bush: cell('nature', 0, 10), flowers: cell('nature', 5, 11),
  table: cell('props', 2, 10, 3, 1), shelf: cell('props', 3, 7, 1, 2),
  book: cell('props', 6, 13),
  cabinet: cell('props', 8, 7, 2, 2), bed: cell('beds', 9, 3, 3, 2),
  pot: cell('props', 1, 0), bench: cell('props', 11, 1, 3, 1),
  lantern: cell('props', 6, 3, 1, 2), curtain: cell('props', 8, 9, 2, 1),
  mirror: cell('props', 7, 4), notice: cell('props', 1, 5, 1, 2),
  well: cell('props', 6, 1), water: cell('water', 1, 1),
  waterTop: cell('water', 1, 0), waterBottom: cell('water', 1, 2),
  bridge: cell('water', 1, 13), ripple: cell('water', 11, 2),
} as const
export type PixelRegionId = keyof typeof pixelRegions
