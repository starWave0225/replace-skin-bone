import { activities } from './catalog'
import { activityReason } from './engine'
import { prologueHintIds } from './prologue'
import { story } from './story'
import type { GameState, Location } from './types'
import { worldMaps, type WorldSpot } from './world'

export interface WorldGuidance { hints: string[]; primary: string[] }
const activitySpots: Record<string, readonly string[]> = {
  meal: ['mother'], relic: ['relic'], tea: ['tea'], case: ['han'], ritual: ['faceless'], watch: ['well', 'child'],
}
function usableDoor(state: GameState, spot: WorldSpot) {
  return !!spot.destination && !(!state.flags.wearing_first_face && spot.destination === 'street')
    && !(state.nodeId === 'street_1' && spot.destination === 'well')
}
/** Follow actual map connections; never suggest a shortcut through a closed story gate. */
function firstExit(state: GameState, from: Location, to: Location): string[] {
  const seen = new Set<Location>([from])
  const queue = [{ map: from, first: '' }]
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i]
    for (const door of worldMaps[node.map].spots) {
      if (!usableDoor(state, door) || seen.has(door.destination!)) continue
      const first = node.first || door.id
      if (door.destination === to) return [first]
      seen.add(door.destination!); queue.push({ map: door.destination!, first })
    }
  }
  return []
}
function toward(state: GameState, map: Location, destination: Location, spots: readonly string[]) {
  return map === destination ? [...spots] : firstExit(state, map, destination)
}
function storyTarget(state: GameState): { map: Location; spots: readonly string[] } {
  const id = state.nodeId, node = story[id]
  if (!state.flags.wearing_first_face) return { map: 'theatre', spots: id === 'dressing' ? ['faceless', 'skin'] : ['faceless'] }
  if (id === 'street_1') return { map: 'street', spots: ['mother_street'] }
  if (id === 'deadline_1') return { map: 'street', spots: ['han_street'] }
  if (id === 'well_1') return { map: 'well', spots: ['well', 'child'] }
  if (id === 'farewell_1') return { map: 'home', spots: ['mother'] }
  if (id === 'case_archive') return { map: 'yamen', spots: ['archive'] }
  const map = node?.location ?? 'street'
  const spots: Record<Location, readonly string[]> = {
    inn: ['owner'], inn_well: ['well_spirit'], theatre: ['faceless'], theatre_upper: [], home: id.startsWith('relic') ? ['relic'] : ['mother'],
    street: node?.speaker === '韩七' || node?.portraitSpeaker === '韩七' ? ['han_street'] : ['mother_street'],
    studio: [], yamen: ['han'], well: ['well', 'child'], mansion: ['echo'],
  }
  return { map, spots: spots[map] }
}
export function worldGuidance(state: GameState, map: Location, trackedActivity = ''): WorldGuidance {
  if (state.mode === 'ending') return { hints: [], primary: [] }
  if (state.prologue) {
    const hints = map === state.prologue.world.map ? prologueHintIds(state.prologue) : []
    return { hints, primary: hints }
  }
  const points = worldMaps[map].spots
  const exits = points.filter(spot => usableDoor(state, spot)).map(spot => spot.id)
  const originals: Record<string, string[]> = { notice: ['encounter', 'homeless', 'warning'], mirror: ['window', 'wear', 'judgment'], archive: ['scroll', 'wife', 'revival'] }
  const readable = points.filter(spot => originals[spot.id]?.some(id => !state.flags[`original_${id}`])).map(spot => spot.id)
  let primary: string[], other: string[] = []
  if (state.mode === 'story') {
    const target = storyTarget(state)
    primary = toward(state, map, target.map, target.spots)
    if (map === 'street' && state.flags.wearing_first_face) other = ['mother_street', 'han_street']
  } else {
    const available = activities.filter(activity => !activityReason(state, activity))
    const tracked = available.find(activity => activity.id === trackedActivity)
    if (tracked) primary = toward(state, map, tracked.location, activitySpots[tracked.id])
    else {
      const here = available.filter(activity => activity.location === map)
      primary = here.length ? here.flatMap(activity => [...activitySpots[activity.id]])
        : available.flatMap(activity => firstExit(state, map, activity.location))
      if (!available.length) primary = map === 'street' ? ['rest'] : map === 'home' ? ['home_rest'] : firstExit(state, map, 'street')
    }
    // These characters still have a greeting even after their investigation is complete.
    other = points.filter(spot => ['mother', 'mother_street', 'han', 'han_street', 'tea', 'faceless', 'rest', 'home_rest'].includes(spot.id)).map(spot => spot.id)
    other.push(...available.filter(activity => activity.location === map).flatMap(activity => [...activitySpots[activity.id]]))
  }
  const valid = new Set(points.map(spot => spot.id))
  primary = [...new Set(primary)].filter(id => valid.has(id))
  return { hints: [...new Set([...exits, ...readable, ...other, ...primary])].filter(id => valid.has(id)), primary }
}
