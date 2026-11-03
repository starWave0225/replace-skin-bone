// 浏览器环境光（lux），不是系统屏幕背光。不可用时由玩家手动调节页内灯火。
export interface OpeningLightSensor extends EventTarget {
  readonly illuminance: number | null
  start(): void
  stop(): void
}
export type OpeningLightSensorConstructor = new (options: { frequency: number }) => OpeningLightSensor
export type OpeningLightMode = 'sensing' | 'ambient' | 'manual'

export function openingBrightnessFromLux(lux: number) {
  if (!Number.isFinite(lux) || lux < 0) return null
  return Math.min(1, .05 + .95 * Math.log1p(lux / 10) / Math.log1p(100))
}

export function observeOpeningLight(
  onBrightness: (brightness: number) => void,
  onMode: (mode: OpeningLightMode) => void,
  Sensor: OpeningLightSensorConstructor | undefined = typeof window !== 'undefined' && window.isSecureContext
    ? (window as Window & { AmbientLightSensor?: OpeningLightSensorConstructor }).AmbientLightSensor : undefined,
) {
  let sensor: OpeningLightSensor | undefined
  let stopped = false
  let timeout: ReturnType<typeof setTimeout> | undefined
  const stop = () => {
    stopped = true
    clearTimeout(timeout)
    sensor?.removeEventListener('reading', reading)
    sensor?.removeEventListener('error', unavailable)
    try { sensor?.stop() } catch { /* Some implementations throw after an unsuccessful start. */ }
  }
  const unavailable = () => { if (!stopped) { stop(); onMode('manual') } }
  const reading = () => {
    if (stopped || sensor?.illuminance == null) return
    const brightness = openingBrightnessFromLux(sensor.illuminance)
    if (brightness === null) return
    clearTimeout(timeout)
    onBrightness(brightness); onMode('ambient')
  }
  if (!Sensor) { onMode('manual'); return stop }
  try {
    sensor = new Sensor({ frequency: 2 })
    sensor.addEventListener('reading', reading)
    sensor.addEventListener('error', unavailable)
    onMode('sensing')
    // A present API can still fail to deliver readings; never leave the player waiting for it.
    timeout = setTimeout(unavailable, 3000)
    sensor.start()
  } catch { unavailable() }
  return stop
}
