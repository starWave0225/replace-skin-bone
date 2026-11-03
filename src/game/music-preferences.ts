export const MUSIC_ENABLED_KEY = 'huapi-music-enabled'
export const MUSIC_VOLUME_KEY = 'huapi-music-volume'

export function readMusicPreferences(storage?: Pick<Storage, 'getItem'>) {
  try {
    const saved = storage?.getItem(MUSIC_VOLUME_KEY)
    const volume = saved == null ? .4 : Number(saved)
    return {
      enabled: storage?.getItem(MUSIC_ENABLED_KEY) !== 'false',
      volume: Number.isFinite(volume) ? Math.min(1, Math.max(0, volume)) : .4,
    }
  } catch {
    return { enabled: true, volume: .4 }
  }
}
