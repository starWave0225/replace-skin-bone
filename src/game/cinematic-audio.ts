import type { StoryCue } from './story-cinematics'

/** Local, cancellable effects. No recordings or speech synthesis. */
export function createCinematicAudio() {
  let audio: AudioContext | undefined, generation = 0
  const live = new Set<AudioScheduledSourceNode>()
  function stop() { generation++; live.forEach(source => { try { source.stop() } catch { /* already ended */ } }); live.clear() }
  async function play(cue: StoryCue, volume: number) {
    const token = generation
    try {
      const ctx = audio ??= new AudioContext()
      await ctx.resume()
      if (token !== generation || ctx.state !== 'running') return
      const now = ctx.currentTime
      function tone(delay: number, hz: number, length: number, level: number) {
        const source = ctx.createOscillator(), gain = ctx.createGain(), at = now + delay
        source.type = 'triangle'; source.frequency.setValueAtTime(hz, at); source.frequency.exponentialRampToValueAtTime(hz * .3, at + length)
        gain.gain.setValueAtTime(.0001, at); gain.gain.exponentialRampToValueAtTime(Math.max(.0002, level * volume), at + .014); gain.gain.exponentialRampToValueAtTime(.0001, at + length)
        source.connect(gain).connect(ctx.destination); live.add(source); source.onended = () => { live.delete(source); source.disconnect(); gain.disconnect() }; source.start(at); source.stop(at + length + .02)
      }
      function rustle(length: number, hz: number, level: number) {
        const source = ctx.createBufferSource(), buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * length), ctx.sampleRate)
        const samples = buffer.getChannelData(0)
        for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / samples.length)
        const filter = ctx.createBiquadFilter(), gain = ctx.createGain()
        filter.type = 'bandpass'; filter.frequency.value = hz; filter.Q.value = .6; gain.gain.value = level * volume
        source.buffer = buffer; source.connect(filter).connect(gain).connect(ctx.destination); live.add(source)
        source.onended = () => { live.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect() }; source.start(now)
      }
      if (cue === 'strike') { tone(0, 110, .28, .26); rustle(.17, 340, .25) }
      else if (cue === 'cloth') rustle(.8, 1300, .18)
      else if (cue === 'whisper') { rustle(1.8, 700, .08); tone(0, 390, 1.6, .025) }
      else if (cue === 'wood') { tone(0, 190, .45, .11); rustle(.65, 450, .14) }
      else { tone(0, 170, .4, .16); tone(.38, 155, .45, .1); tone(.77, 140, .55, .05) }
    } catch { /* Captions preserve the story when audio is blocked. */ }
  }
  return { play, stop, dispose() { stop(); if (audio) void audio.close().catch(() => {}); audio = undefined } }
}
