// Minimalist wedge phone charging stand. A solid wedge with an angled slot
// for the phone and a cable tunnel from the back into the slot floor.
// Defaults sized for a recent iPhone (with room for a slim case).
import modeling from '@jscad/modeling'
import { minWallWarnings } from '../lib/printability.js'

const { polygon, rectangle, cuboid } = modeling.primitives
const { subtract } = modeling.booleans
const { extrudeLinear } = modeling.extrusions
const { translate, rotate, rotateX } = modeling.transforms

export const phoneStand = {
  id: 'phone-stand',
  name: 'Phone Stand',
  category: 'Phone',
  description: 'Minimalist wedge dock with cable pass-through for charging.',
  params: [
    { key: 'width', label: 'Width', min: 50, max: 130, step: 1, default: 78, unit: 'mm' },
    { key: 'depth', label: 'Depth', min: 60, max: 130, step: 1, default: 84, unit: 'mm' },
    { key: 'backHeight', label: 'Back height', min: 45, max: 110, step: 1, default: 74, unit: 'mm' },
    { key: 'angle', label: 'Recline angle', min: 10, max: 35, step: 1, default: 22, unit: '°' },
    { key: 'slotWidth', label: 'Phone slot width', min: 8, max: 22, step: 0.5, default: 13, unit: 'mm' },
    { key: 'slotDepth', label: 'Phone slot depth', min: 15, max: 45, step: 1, default: 28, unit: 'mm' },
    { key: 'cableWidth', label: 'Cable tunnel width', min: 0, max: 25, step: 1, default: 14, unit: 'mm' },
  ],
  build(p) {
    const { width: W, depth: D, backHeight: BH, slotWidth: SW, slotDepth: SD } = p
    const beta = (p.angle * Math.PI) / 180 // recline from vertical, leaning back (+x)
    const frontHeight = Math.min(20, BH * 0.3)

    // Side profile in XY: x = front(0) → back(D), y = up.
    const apexX = 0.7 * D
    const profilePts = [
      [0, 0],
      [D, 0],
      [D, BH * 0.72],
      [apexX, BH],
      [0, frontHeight],
    ]
    let profile = polygon({ points: profilePts })

    // Angled phone slot, cut in 2D so it spans the full width.
    // Entry point sits on the top slope between the front edge and the apex.
    const entryX = 0.42 * D
    const entryY = frontHeight + (BH - frontHeight) * (entryX / apexX)
    const dir = [Math.sin(beta), Math.cos(beta)] // up-and-back
    const slotFloorY = Math.max(10, entryY - SD)
    const slotLen = (entryY - slotFloorY) + 60 // extends well past the surface
    const slotBottom = [entryX - dir[0] * (entryY - slotFloorY), slotFloorY]
    const slotCenter = [
      slotBottom[0] + (dir[0] * slotLen) / 2,
      slotBottom[1] + (dir[1] * slotLen) / 2,
    ]
    const slotRect = translate(
      [slotCenter[0], slotCenter[1], 0],
      rotate([0, 0, -beta], rectangle({ size: [SW, slotLen] }))
    )
    profile = subtract(profile, slotRect)

    // Extrude across the width, then stand upright (z-up, on the bed).
    let stand = extrudeLinear({ height: W }, profile)
    stand = translate([0, W / 2, 0], rotateX(Math.PI / 2, stand))

    // Cable tunnel: from the back face, under the slot, opening into its floor.
    if (p.cableWidth > 0) {
      const tunnel = cuboid({
        size: [D - slotBottom[0] + SW + 6, p.cableWidth, slotFloorY + 4],
        center: [(D + slotBottom[0] - SW / 2) / 2, 0, (slotFloorY + 4) / 2 + 2],
      })
      stand = subtract(stand, tunnel)
    }

    return translate([-D / 2, 0, 0], stand)
  },
  warnings(p) {
    const w = minWallWarnings({})
    if (p.slotWidth < 10) w.push('Slot under 10 mm is snug — phones with cases may not fit.')
    if (p.slotDepth > p.backHeight * 0.55) w.push('Very deep slot may weaken the wedge.')
    if (p.cableWidth > 0 && p.cableWidth < 8) w.push('Cable tunnel under 8 mm may not pass a connector plug.')
    return w
  },
}
