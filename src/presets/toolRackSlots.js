import modeling from '@jscad/modeling'
import { minWallWarnings } from '../lib/printability.js'

const { cuboid, cylinder } = modeling.primitives
const { subtract, union } = modeling.booleans
const { translate, rotate } = modeling.transforms

export const toolRackSlots = {
  id: 'tool-rack-slots',
  name: 'Wall Tool Rack (Slots)',
  category: 'Tools & Workshop',
  description: 'Wall-mounted rack with a row of open-top slots to hold hand tools like pliers and wrenches by their handles.',
  params: [
    { key: 'slotCount', label: 'Number of slots', min: 2, max: 12, step: 1, default: 6, unit: '' },
    { key: 'slotWidth', label: 'Slot width', min: 6, max: 25, step: 0.5, default: 12, unit: 'mm' },
    { key: 'slotSpacing', label: 'Slot center-to-center spacing', min: 10, max: 40, step: 1, default: 22, unit: 'mm' },
    { key: 'slotDepth', label: 'Slot depth (into rack, downward)', min: 10, max: 40, step: 1, default: 25, unit: 'mm' },
    { key: 'rackThickness', label: 'Rack thickness (front-to-back)', min: 4, max: 15, step: 0.5, default: 8, unit: 'mm' },
    { key: 'rackHeight', label: 'Rack height', min: 30, max: 80, step: 1, default: 45, unit: 'mm' },
    { key: 'mountHoleDiameter', label: 'Mounting screw hole diameter', min: 2, max: 6, step: 0.1, default: 4, unit: 'mm' },
  ],
  build(p) {
    const {
      slotCount: n,
      slotWidth: sw,
      slotSpacing: pitch,
      slotDepth: sd,
      rackThickness: t,
      rackHeight: rh,
      mountHoleDiameter: mh,
    } = p

    const margin = pitch // extra body margin on each end beyond the outer slot centers
    const rackWidth = (n - 1) * pitch + margin * 2

    const body = cuboid({
      size: [rackWidth, t, rh],
      center: [rackWidth / 2, t / 2, rh / 2],
    })

    // Slots are open-top notches cut from the top edge downward, so each is a
    // box taller than needed, positioned so its top is above the rack top
    // (guaranteeing it actually opens through the top face) and its bottom
    // reaches down to (rackHeight - slotDepth).
    const slotCutters = []
    for (let i = 0; i < n; i++) {
      const x = margin + pitch * i
      const cutTop = rh + 1 // extend above the body so the cut is open at the top
      const cutBottom = rh - sd
      const cutHeight = cutTop - cutBottom
      const slot = translate(
        [x, t / 2, cutBottom + cutHeight / 2],
        cuboid({ size: [sw, t + 2, cutHeight] })
      )
      slotCutters.push(slot)
    }

    // Mounting holes through the thickness, placed near the bottom of the rack
    // between/below the slots, at the two ends and center for screws into studs/pegboard.
    // Cylinder default axis is Z, so rotate 90deg about X to lay it along Y
    // (through the rack's front-to-back thickness) before translating into place.
    const mountHoles = []
    const holeZ = Math.min(8, rh * 0.2)
    const holeXs = n <= 2 ? [rackWidth / 2] : [margin * 0.5, rackWidth / 2, rackWidth - margin * 0.5]
    for (const hx of holeXs) {
      const hole = translate(
        [hx, t / 2, holeZ],
        rotate([Math.PI / 2, 0, 0], cylinder({ radius: mh / 2, height: t + 2 }))
      )
      mountHoles.push(hole)
    }

    return subtract(body, union(...slotCutters), ...mountHoles)
  },
  warnings(p) {
    const warnings = minWallWarnings({ thickness: p.rackThickness })
    if (p.slotWidth > p.slotSpacing - 3) {
      warnings.push('Slot width is too close to slot spacing; adjacent slots may merge into one opening.')
    }
    if (p.slotDepth > p.rackHeight - 5) {
      warnings.push('Slot depth leaves little material below the slot; increase rack height or reduce slot depth.')
    }
    if (p.mountHoleDiameter > p.rackThickness) {
      warnings.push('Mounting hole diameter is larger than the rack thickness; the hole will blow out the face.')
    }
    return warnings
  },
}
