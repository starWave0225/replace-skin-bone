export interface MusicMedia {
  volume: number; loop: boolean; paused: boolean; currentTime: number; duration: number
  play(): Promise<void>; pause(): void
}
type Channel = { id: string; media: MusicMedia }

/** One shared player. A stale play() resolution cannot restart an abandoned scene. */
export class MusicPlayer {
  private current?: Channel
  private outgoing?: Channel
  private generation = 0
  private wanted?: string
  private fade?: ReturnType<typeof setInterval>
  private volume = .4
  constructor(private create: (id: string) => MusicMedia, private fadeMs = 900) {}
  get media() { return this.current?.media }
  get track() { return this.current?.id }
  setVolume(value: number) {
    this.volume = Math.min(1, Math.max(0, Number.isFinite(value) ? value : .4))
    if (this.current && !this.fade) this.current.media.volume = this.volume
  }
  private cancelFade() {
    if (this.fade) clearInterval(this.fade)
    this.fade = undefined
    this.outgoing?.media.pause(); this.outgoing = undefined
  }
  stop() {
    this.generation++
    this.wanted = undefined
    this.cancelFade()
    this.current?.media.pause()
  }
  async play(id: string): Promise<boolean> {
    const request = ++this.generation
    this.wanted = id
    this.cancelFade()
    const previous = this.current
    if (previous?.id === id) {
      previous.media.volume = this.volume
      try { await previous.media.play() }
      catch (error) { if (request !== this.generation) return false; throw error }
      if (request !== this.generation) return false
      return true
    }
    const next: Channel = { id, media: this.create(id) }
    next.media.loop = true
    next.media.volume = previous && !previous.media.paused ? 0 : this.volume
    this.current = next; this.outgoing = previous
    try { await next.media.play() }
    catch (error) {
      next.media.pause()
      if (request === this.generation) { this.cancelFade(); this.current = undefined; throw error }
      return false
    }
    if (request !== this.generation) {
      if (this.current !== next || this.wanted !== id) next.media.pause()
      return false
    }
    if (!previous || previous.media.paused || !this.fadeMs) {
      this.cancelFade(); next.media.volume = this.volume; return true
    }
    const start = Date.now(), oldVolume = previous.media.volume
    this.fade = setInterval(() => {
      const progress = Math.min(1, (Date.now() - start) / this.fadeMs)
      next.media.volume = this.volume * progress
      previous.media.volume = oldVolume * (1 - progress)
      if (progress === 1) this.cancelFade()
    }, 30)
    return true
  }
}
