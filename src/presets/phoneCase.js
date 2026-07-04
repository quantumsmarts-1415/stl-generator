// Basic phone case: open-front shell with inward lip, camera window and
// charging-port cutout. Defaults fit a recent iPhone (147 x 71 x 8.3 mm).
// Print in a flexible filament (TPU) — a rigid case can't snap on.
import modeling from '@jscad/modeling'
import { minWallWarnings } from '../lib/printability.js'

const { roundedRectangle, cuboid } = modeling.primitives
const { subtract } = modeling.booleans
const { extrudeLinear } = modeling.extrusions
const { translate } = modeling.transforms

const LIP_RISE = 2 // how far the rim rises above the phone's front face (mm)

export const phoneCase = {
  id: 'phone-case',
  name: 'Phone Case',
  category: 'Phone',
  description: 'Basic TPU case shell — camera window + charging cutout.',
  params: [
    { key: 'phoneHeight', label: 'Phone height', min: 120, max: 180, step: 0.5, default: 147, unit: 'mm' },
    { key: 'phoneWidth', label: 'Phone width', min: 55, max: 90, step: 0.5, default: 71, unit: 'mm' },
    { key: 'phoneThickness', label: 'Phone thickness', min: 6, max: 14, step: 0.1, default: 8.3, unit: 'mm' },
    { key: 'cornerRadius', label: 'Phone corner radius', min: 4, max: 18, step: 0.5, default: 10, unit: 'mm' },
    { key: 'wall', label: 'Side wall', min: 1, max: 3.5, step: 0.1, default: 1.8, unit: 'mm' },
    { key: 'back', label: 'Back thickness', min: 0.8, max: 3, step: 0.1, default: 1.2, unit: 'mm' },
    { key: 'lip', label: 'Front lip overhang', min: 0.5, max: 3, step: 0.1, default: 1.5, unit: 'mm' },
    { key: 'clearance', label: 'Fit clearance', min: 0.1, max: 0.6, step: 0.05, default: 0.25, unit: 'mm' },
    { key: 'cameraSize', label: 'Camera window size', min: 20, max: 55, step: 0.5, default: 40, unit: 'mm' },
    { key: 'cameraMargin', label: 'Camera corner margin', min: 2, max: 15, step: 0.5, default: 5, unit: 'mm' },
    { key: 'portWidth', label: 'Charging cutout width', min: 15, max: 60, step: 1, default: 32, unit: 'mm' },
  ],
  build(p) {
    const c = p.clearance
    const W = p.phoneWidth + 2 * c // cavity size
    const H = p.phoneHeight + 2 * c
    const T = p.phoneThickness + c
    const totalZ = p.back + T + LIP_RISE

    const outer = extrudeLinear(
      { height: totalZ },
      roundedRectangle({
        size: [W + 2 * p.wall, H + 2 * p.wall],
        roundRadius: p.cornerRadius + p.wall,
        segments: 64,
      })
    )

    // phone pocket
    const pocket = translate(
      [0, 0, p.back],
      extrudeLinear(
        { height: T + 0.01 },
        roundedRectangle({ size: [W, H], roundRadius: p.cornerRadius, segments: 64 })
      )
    )

    // front opening, inset by the lip so the rim holds the phone in
    const lipR = Math.max(1, p.cornerRadius - p.lip)
    const opening = translate(
      [0, 0, p.back + T],
      extrudeLinear(
        { height: LIP_RISE + 1 },
        roundedRectangle({ size: [W - 2 * p.lip, H - 2 * p.lip], roundRadius: lipR, segments: 64 })
      )
    )

    // camera window through the back (top-left of the back, seen from behind)
    const camX = -p.phoneWidth / 2 + p.cameraMargin + p.cameraSize / 2
    const camY = p.phoneHeight / 2 - p.cameraMargin - p.cameraSize / 2
    const camera = cuboid({
      size: [p.cameraSize, p.cameraSize, p.back * 2 + 2],
      center: [camX, camY, p.back / 2],
    })

    // charging-port cutout through the bottom wall (including the rim)
    const port = cuboid({
      size: [p.portWidth, p.wall * 2 + c * 2 + 4, T + LIP_RISE + 2],
      center: [0, -(H / 2 + p.wall / 2), p.back + (T + LIP_RISE + 2) / 2 + 0.01],
    })

    return subtract(outer, pocket, opening, camera, port)
  },
  warnings(p) {
    const w = minWallWarnings({ thickness: Math.min(p.wall, p.back) })
    w.push('Print in flexible filament (TPU ~95A). A rigid PLA/PETG case cannot snap over a phone.')
    if (p.clearance < 0.15) w.push('Clearance under 0.15 mm will make the case very hard to fit.')
    if (p.lip > p.wall * 1.5) w.push('Large lip relative to wall may be fragile at the rim.')
    if (p.cameraSize + p.cameraMargin * 2 > p.phoneWidth) w.push('Camera window is wider than the phone.')
    return w
  },
}
