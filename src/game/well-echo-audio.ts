import type { EchoDirection } from './prologue'

let audio: AudioContext | undefined

export async function playWellKnock(echo?: EchoDirection) {
  try {
    const context = audio ??= new AudioContext()
    await context.resume()
    const now = context.currentTime
    const knock = (delay: number, pan: number, level: number) => {
      const source = context.createOscillator()
      const gain = context.createGain()
      const panner = context.createStereoPanner()
      const at = now + delay
      panner.pan.value = pan
      source.type = 'triangle'
      source.frequency.setValueAtTime(170, at)
      source.frequency.exponentialRampToValueAtTime(48, at + .22)
      gain.gain.setValueAtTime(level, at)
      gain.gain.exponentialRampToValueAtTime(.001, at + .4)
      source.connect(gain).connect(panner).connect(context.destination)
      source.start(at)
      source.stop(at + .41)
    }
    knock(0, 0, .19)
    if (echo) {
      const pan = echo === 'left' ? -.9 : echo === 'right' ? .9 : 0
      knock(.36, pan, .13)
      knock(.58, pan, .065)
    }
  } catch { /* The on-screen echo caption carries the same information. */ }
}
