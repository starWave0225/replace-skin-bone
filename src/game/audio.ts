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
