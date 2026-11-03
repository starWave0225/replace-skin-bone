import type { OpeningCue } from './opening'

let context: AudioContext | undefined
let master: GainNode | undefined
let rain: AudioBufferSourceNode | undefined
function pluck(frequency: number) {
  if (!context || !master) return
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  oscillator.type = 'triangle'
  oscillator.frequency.value = frequency
  gain.gain.setValueAtTime(0.0001, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.065, context.currentTime + 0.015)
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 4)
  oscillator.connect(gain).connect(master)
  oscillator.start(); oscillator.stop(context.currentTime + 4.1)
}
export async function setAudio(enabled: boolean, volume = 0.4) {
  if (!enabled) { if (context && master) master.gain.setTargetAtTime(0, context.currentTime, 0.15); return }
  if (!context) {
    context = new AudioContext()
    master = context.createGain(); master.connect(context.destination)
    const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.11
    rain = context.createBufferSource(); rain.buffer = buffer; rain.loop = true
    const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 900
    rain.connect(filter).connect(master); rain.start()
  }
  await context.resume()
  master!.gain.setTargetAtTime(volume, context.currentTime, 0.2)
}
export function clickTone() {
  if (context && master && master.gain.value > 0) pluck(440)
}

export function openingCue(cue: OpeningCue): () => void {
  if (!context || !master || context.state !== 'running') return () => {}
  const audio = context, now = audio.currentTime
  const output = audio.createGain(); output.connect(master)
  const duration = cue === 'pages' ? 4.8 : cue === 'thunder' ? 3.4 : cue === 'door' ? 1.8 : cue === 'window' ? 2.8 : .4
  const source = audio.createBufferSource()
  const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * duration), audio.sampleRate)
  const data = buffer.getChannelData(0)
  let brown = 0
  for (let i = 0; i < data.length; i++) {
    const t = i / audio.sampleRate, n = Math.random() * 2 - 1
    brown = (brown + .025 * n) / 1.025
    if (cue === 'knock' || cue === 'step') data[i] = (Math.sin(t * Math.PI * (cue === 'knock' ? 165 : 85)) * .5 + brown * 3) * Math.exp(-t * 22)
    else if (cue === 'thunder') data[i] = (brown * 7 + n * .07) * Math.min(1, t * 12) * Math.exp(-t * 1.2)
    else if (cue === 'pages') data[i] = n * .26 * Math.pow(Math.max(0, Math.sin(t * (38 - t * 4))), 7) * (1 - t / duration)
    else if (cue === 'water') data[i] = Math.sin(t * (2300 - t * 2600)) * Math.exp(-t * 18) * .17 + n * .03
    else if (cue === 'door') data[i] = (Math.sin(t * (310 + Math.sin(t * 12) * 100)) * .1 + brown) * Math.sin(Math.PI * t / duration)
    else data[i] = (n * .22 + brown * 2) * Math.sin(Math.PI * t / duration)
  }
  source.buffer = buffer
  const filter = audio.createBiquadFilter()
  filter.type = 'lowpass'; filter.frequency.value = cue === 'pages' ? 4300 : cue === 'window' ? 2100 : cue === 'thunder' ? 360 : 950
  source.connect(filter).connect(output)
  output.gain.setValueAtTime(cue === 'thunder' ? 3.5 : cue === 'knock' ? 3 : 1.6, now)
  output.gain.setTargetAtTime(.0001, now + duration - .08, .03)
  let stopped = false
  const stop = () => {
    if (stopped) return
    stopped = true
    try { source.stop() } catch { /* already ended */ }
    source.disconnect(); filter.disconnect(); output.disconnect()
  }
  source.onended = stop; source.start(now); source.stop(now + duration)
  return stop
}
