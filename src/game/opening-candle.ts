import { openingCandleFrame, openingCandleLayout } from './opening-light'

export function drawOpeningCandle(ctx: CanvasRenderingContext2D, width: number, height: number, elapsed: number | null, time: number, reduced: boolean) {
  const frame = openingCandleFrame(elapsed, time, reduced)
  const { x, base, wick, scale } = openingCandleLayout(width, height)
  ctx.save()
  // A warm pool of light reaches onto the paper, then recedes with the flame.
  const glow = ctx.createRadialGradient(x, wick, 0, x, wick, height * .62)
  glow.addColorStop(0, `rgba(255,173,72,${.22 * frame.flame})`)
  glow.addColorStop(.45, `rgba(236,155,62,${.08 * frame.flame})`)
  glow.addColorStop(1, 'rgba(235,148,53,0)')
  ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = glow; ctx.fillRect(0, 0, width, height)
  ctx.globalCompositeOperation = 'source-over'
  ctx.translate(x, base); ctx.scale(scale, scale)
  const ellipse = (cy: number, rx: number, ry: number, fill: string | CanvasGradient) => {
    ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(0, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill()
  }
  ellipse(17, 58, 13, '#130f0ca0')
  const bronze = ctx.createLinearGradient(-42, 0, 42, 0)
  bronze.addColorStop(0, '#251f17'); bronze.addColorStop(.35, '#827043'); bronze.addColorStop(.55, '#b0995c'); bronze.addColorStop(1, '#352a1b')
  ellipse(5, 47, 12, bronze)
  ctx.fillStyle = bronze; ctx.fillRect(-9, -27, 18, 30)
  ellipse(-28, 39, 10, bronze); ellipse(-31, 34, 7, '#4f3a24')
  const wax = ctx.createLinearGradient(-17, 0, 17, 0)
  wax.addColorStop(0, '#876a42'); wax.addColorStop(.3, '#dac290'); wax.addColorStop(.63, '#e9d7a8'); wax.addColorStop(1, '#a38653')
  ctx.fillStyle = wax
  ctx.beginPath(); ctx.moveTo(-17, -32); ctx.lineTo(-16, -163); ctx.quadraticCurveTo(-6, -169, 0, -163)
  ctx.quadraticCurveTo(8, -170, 17, -162); ctx.lineTo(18, -32); ctx.closePath(); ctx.fill()
  // Hardened drips and an uneven lip keep it from reading as a flat icon.
  ctx.lineCap = 'round'; ctx.strokeStyle = '#ead9af'; ctx.lineWidth = 5
  for (const [dx, end] of [[-10, -115], [8, -132], [13, -86]]) {
    ctx.beginPath(); ctx.moveTo(dx, -160); ctx.bezierCurveTo(dx - 3, -141, dx + 3, end - 8, dx, end); ctx.stroke()
  }
  ellipse(-163, 14, 4, '#b39a66'); ellipse(-164, 7, 2.3, '#58432c')
  ctx.strokeStyle = '#271a13'; ctx.lineWidth = 2.4
  ctx.beginPath(); ctx.moveTo(0, -163); ctx.quadraticCurveTo(4, -170, 1, -174); ctx.stroke()
  if (frame.ember > 0) {
    ctx.shadowColor = '#fa6223'; ctx.shadowBlur = 10 * frame.ember
    ctx.fillStyle = `rgba(255,115,43,${frame.ember})`; ctx.beginPath(); ctx.arc(1, -172, 2, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0
  }
  if (frame.flame > .001) {
    ctx.save(); ctx.translate(1, -174); ctx.transform(1, 0, frame.lean, 1, 0, 0); ctx.scale(1 + Math.abs(frame.lean) * .25, frame.flame)
    const fire = ctx.createLinearGradient(0, -68, 0, 5)
    fire.addColorStop(0, '#ffc76600'); fire.addColorStop(.22, '#ffab32dd'); fire.addColorStop(.64, '#ffe4a6'); fire.addColorStop(.86, '#fff8d9'); fire.addColorStop(1, '#698bba80')
    ctx.fillStyle = fire; ctx.shadowColor = '#ffbe53'; ctx.shadowBlur = 15
    ctx.beginPath(); ctx.moveTo(0, -70); ctx.bezierCurveTo(-6, -46, -23, -18, -10, -1); ctx.bezierCurveTo(7, 16, 24, -5, 9, -35); ctx.quadraticCurveTo(1, -51, 0, -70); ctx.fill()
    ctx.shadowBlur = 0; ctx.fillStyle = '#fff7cf'; ctx.beginPath(); ctx.ellipse(0, -8, 4.5, 13, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore()
  }
  if (frame.smoke > 0) {
    ctx.save(); ctx.translate(1, -174); ctx.lineCap = 'round'
    for (let i = 0; i < 3; i++) {
      const curl = reduced ? 0 : Math.sin(time / 360 + i) * 9
      const lift = 70 + frame.rise * 110 + i * 15
      ctx.strokeStyle = `rgba(204,211,204,${frame.smoke * (.22 - i * .035)})`
      ctx.lineWidth = 2 + i * 2; ctx.filter = `blur(${1 + i * .8}px)`
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(-9 + curl, -lift * .25, 20 + curl, -lift * .4, 6 + curl, -lift * .63); ctx.bezierCurveTo(-18 + curl, -lift * .8, 10 + curl, -lift, 24 + curl, -lift); ctx.stroke()
    }
    ctx.restore()
  }
  ctx.restore()
}
