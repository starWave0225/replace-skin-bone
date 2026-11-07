const clamp = (value: number) => Math.max(0, Math.min(1, value))
const smooth = (value: number) => { const t = clamp(value); return t * t * (3 - 2 * t) }

export const openingCandleDuration = 3600
export const openingCandleDimDuration = 1250

// The same playback clock drives the candle and the light on the page.
export function openingCandleFrame(elapsed: number | null, time = 0, reduced = false) {
  const lit = elapsed === null || !Number.isFinite(elapsed)
  const t = lit ? 0 : Math.max(0, elapsed)
  const gust = lit ? 0 : Math.sin(Math.PI * clamp(t / 700))
  const flame = lit ? 1 : 1 - smooth((t - 220) / 500)
  return {
    flame: flame * (reduced ? 1 : 1 + .045 * Math.sin(time / 93) + .025 * Math.sin(time / 47)),
    lean: reduced ? 0 : gust * .9 + (lit ? Math.sin(time / 170) * .045 : 0),
    brightness: lit ? 1 : 1 - .92 * smooth((t - 250) / 1000),
    smoke: lit ? 0 : smooth((t - 610) / 420) * (1 - smooth((t - 1700) / 1900)),
    rise: reduced ? .45 : clamp((t - 610) / 2300),
    ember: lit ? 0 : smooth((t - 400) / 250) * (1 - smooth((t - 900) / 1500)),
  }
}

export function openingCandleLayout(width: number, height: number) {
  const scale = height / 720
  const x = width * .947, base = height * .84, wick = base - 166 * scale
  const hitWidth = Math.max(44, 105 * scale), hitHeight = Math.max(74, 290 * scale)
  return { x, base, wick, scale, hit: { left: Math.max(0, Math.min(width - hitWidth, x - hitWidth / 2)), top: Math.max(0, wick - 90 * scale), width: hitWidth, height: hitHeight } }
}
