export type Time = 'day' | 'dusk' | 'night'
export type Face = 'shen' | 'guard'
import type { PrologueState } from './prologue'
export type Location = 'theatre' | 'street' | 'home' | 'yamen' | 'well' | 'mansion' | 'inn' | 'inn_well'
export interface WorldState { map: Location; x: number; y: number; facing: 'down' | 'up' | 'left' | 'right' }
export type Stat = 'selfhood' | 'karma' | 'shen' | 'guard' | 'mother' | 'han'
export type Condition = { flag: string; is?: boolean } | { stat: Stat; gte: number } | { face: Face } | { all: Condition[] } | { any: Condition[] } | { not: Condition }
export type Effect = { stat: Stat; add: number } | { flag: string; value?: boolean } | { item: string } | { clue: string } | { journal: string } | { face: Face } | { ending: 'stay' | 'truth' | 'leave' }
export interface Choice { id: string; text: string; note?: string; next: string; when?: Condition; locked?: string; effects?: Effect[] }
export interface StoryNode {
  id: string; speaker?: string; text: string; location: Location; portrait?: 'woman' | 'mask' | 'child'; portraitSpeaker?: string;
  next?: string; choices?: Choice[]; effects?: Effect[]; end?: 'hub' | 'ending';
}
export interface HistoryEntry { speaker: string; text: string; choice?: string }
export interface GameState {
  version: 1; nodeId: string; day: number; time: Time; actionPoints: number; face: Face;
  stats: Record<Stat, number>; flags: Record<string, boolean>; inventory: string[]; clues: string[];
  journal: string[]; completed: string[]; applied: string[]; history: HistoryEntry[];
  mode: 'story' | 'hub' | 'ending'; ending?: 'stay' | 'truth' | 'leave'; activity?: string;
  world?: WorldState;
  prologue?: PrologueState;
}
export interface Activity { id: string; title: string; subtitle: string; location: Location; times: Time[]; start: string; mark: string }
export interface SaveData { version: 1; savedAt: number; state: GameState }
