import type { OpeningCue } from './opening'
import { openingCueDuration } from './opening'
import { openingRecordedSounds } from './opening-sfx'
import { assetUrl } from './asset-url'

let context: AudioContext | undefined
let master: GainNode | undefined
let rain: AudioBufferSourceNode | undefined
let wind: GainNode | undefined
let windFilter: BiquadFilterNode | undefined
let rainLevel: GainNode | undefined
let audioRequest = 0
let openingAmbience = false
const openingBuffers = new Map<OpeningCue, AudioBuffer>()
let loadingOpeningSounds: Promise<void> | undefined
export function preloadOpeningSounds(): Promise<void> {
  if (!context) return Promise.resolve()
  const audio = context
  return loadingOpeningSounds ??= Promise.all(Object.entries(openingRecordedSounds).map(async ([cue, recording]) => {
    try {
      const response = await fetch(assetUrl(recording.path))
      if (!response.ok) throw new Error(`Opening sound: ${response.status}`)
      const buffer = await audio.decodeAudioData(await response.arrayBuffer())
      openingBuffers.set(cue as OpeningCue, buffer)
    } catch { /* The procedural cue remains available if a recording cannot load. */ }
  })).then(() => {})
}
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
export async function setAudio(enabled: boolean, volume = 0.4, opening = false) {
  const request = ++audioRequest
  openingAmbience = enabled && opening
  if (!enabled) { if (context && master) master.gain.setTargetAtTime(0, context.currentTime, 0.06); return false }
  if (!context) {
    context = new AudioContext()
    master = context.createGain(); master.gain.value = 0; master.connect(context.destination)
    const buffer = context.createBuffer(1, context.sampleRate * 4, context.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * 0.11
    rain = context.createBufferSource(); rain.buffer = buffer; rain.loop = true
    const filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 900
    rain.connect(filter); rain.start()
    const windBuffer = context.createBuffer(1, context.sampleRate * 6, context.sampleRate)
    const windData = windBuffer.getChannelData(0)
    let brown = 0
    for (let i = 0; i < windData.length; i++) {
      brown = (brown + .025 * (Math.random() * 2 - 1)) / 1.025
      windData[i] = brown * 4
    }
    const windSource = context.createBufferSource(); windSource.buffer = windBuffer; windSource.loop = true
    windFilter = context.createBiquadFilter(); windFilter.type = 'bandpass'; windFilter.frequency.value = 280; windFilter.Q.value = .5
    wind = context.createGain(); wind.gain.value = 0
    windSource.connect(windFilter).connect(wind).connect(master); windSource.start()
    rainLevel = context.createGain(); rainLevel.gain.value = 1
    filter.connect(rainLevel).connect(master)
  }
  if (opening) void preloadOpeningSounds()
  if (!opening) { wind!.gain.setTargetAtTime(0, context.currentTime, .1); rainLevel!.gain.setTargetAtTime(1, context.currentTime, .1) }
  await context.resume()
  // A late autoplay unlock must not undo a pause, mute, or scene change.
  if (request !== audioRequest) return false
  master!.gain.setTargetAtTime(volume, context.currentTime, 0.2)
  return true
}
export function setOpeningWind(strength: number, time = 0, rainStrength = 1) {
  if (!openingAmbience || !context || !wind || !windFilter) return
  const gust = .78 + .22 * Math.sin(time / 740) * Math.sin(time / 1330)
  wind.gain.setTargetAtTime(Math.max(0, Math.min(1, strength)) * gust * 2.8, context.currentTime, .25)
  windFilter.frequency.setTargetAtTime(180 + Math.max(0, strength) * 190 + Math.sin(time / 1100) * 35, context.currentTime, .35)
  rainLevel?.gain.setTargetAtTime(Math.max(0, Math.min(2, rainStrength)), context.currentTime, .25)
}
export function clickTone() {
  if (!openingAmbience && context && master && master.gain.value > 0) pluck(440)
}

export function openingCue(cue: OpeningCue, offsetMs = 0): () => void {
  if (!context || !master || context.state !== 'running') return () => {}
  const duration = openingCueDuration(cue) / 1000, offset = Math.max(0, offsetMs) / 1000
  if (!Number.isFinite(offset) || offset >= duration) return () => {}
  const audio = context, now = audio.currentTime
  const output = audio.createGain(); output.connect(master)
  const source = audio.createBufferSource()
  const recording = openingBuffers.get(cue)
  const buffer = recording ?? audio.createBuffer(1, Math.ceil(audio.sampleRate * duration), audio.sampleRate)
  const data = buffer.getChannelData(0)
  let brown = 0
  for (let i = 0; !recording && i < data.length; i++) {
    const t = i / audio.sampleRate, n = Math.random() * 2 - 1
    brown = (brown + .025 * n) / 1.025
    if (cue === 'knock' || cue === 'step') data[i] = (Math.sin(t * Math.PI * (cue === 'knock' ? 165 : 85)) * .5 + brown * 3) * Math.exp(-t * 22)
    else if (cue === 'thunder') data[i] = (brown * 7 + n * .07) * Math.min(1, t * 12) * Math.exp(-t * 1.2)
    else if (cue === 'page') data[i] = n * .26 * Math.pow(Math.sin(t / duration * Math.PI), 3) * (1 - t / duration * .45)
    else if (cue === 'water') data[i] = Math.sin(t * (2300 - t * 2600)) * Math.exp(-t * 18) * .17 + n * .03
    else if (cue === 'door') data[i] = (Math.sin(t * (310 + Math.sin(t * 12) * 100)) * .1 + brown) * Math.sin(Math.PI * t / duration)
    else data[i] = (n * .22 + brown * 2) * Math.sin(Math.PI * t / duration)
  }
  source.buffer = buffer
  const filter = audio.createBiquadFilter()
  filter.type = 'lowpass'; filter.frequency.value = cue === 'page' || cue === 'door' && recording ? 4300 : cue === 'window' ? 4800 : cue === 'thunder' ? 360 : 950
  source.connect(filter).connect(output)
  output.gain.setValueAtTime(cue === 'thunder' ? 3.5 : cue === 'knock' ? 3 : 1.6, now)
  output.gain.setTargetAtTime(.0001, now + Math.max(0, duration - offset - .08), .03)
  let stopped = false
  const stop = () => {
    if (stopped) return
    stopped = true
    try { source.stop() } catch { /* already ended */ }
    source.disconnect(); filter.disconnect(); output.disconnect()
  }
  source.onended = stop; source.start(now, offset); source.stop(now + duration - offset)
  return stop
}
