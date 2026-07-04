import modeling from '@jscad/modeling'
import { minWallWarnings } from '../lib/printability.js'

const { cuboid } = modeling.primitives
const { union, subtract } = modeling.booleans
const { translate, rotate } = modeling.transforms

// Helper: build an axis-aligned box given explicit min/max extents in X, Y, Z.
// This avoids error-prone center/size offset arithmetic when composing many
// adjacent parts.
function boxFromRange(xMin, xMax, yMin, yMax, zMin, zMax) {
  const size = [xMax - xMin, yMax - yMin, zMax - zMin]
  const center = [(xMin + xMax) / 2, (yMin + yMax) / 2, (zMin + zMax) / 2]
  return cuboid({ size, center })
}

export const adjustableDock = {
  id: 'adjustable-dock',
  name: 'Adjustable Angle Phone/Tablet Dock',
  category: 'Desk & Phone Accessories',
  description: 'Angled dock with a front lip and back support slot for phones or tablets, angle fully parametric.',
  params: [
    { key: 'deviceWidth', label: 'Device width (slot length)', min: 60, max: 260, step: 1, default: 130, unit: 'mm' },
    { key: 'deviceThickness', label: 'Device thickness (incl. case)', min: 5, max: 20, step: 0.5, default: 10, unit: 'mm' },
    { key: 'baseDepth', label: 'Base depth (front to back)', min: 60, max: 160, step: 1, default: 100, unit: 'mm' },
    { key: 'angle', label: 'Recline angle from vertical', min: 5, max: 35, step: 1, default: 18, unit: 'deg' },
    { key: 'lipHeight', label: 'Front lip height', min: 8, max: 25, step: 1, default: 14, unit: 'mm' },
    { key: 'wall', label: 'Wall thickness', min: 2, max: 8, step: 0.5, default: 4, unit: 'mm' },
  ],
  build(p) {
    const {
      deviceWidth: W,
      deviceThickness: DT,
      baseDepth: BD,
      angle: angleDeg,
      lipHeight: LH,
      wall: t,
    } = p
    const angleRad = (angleDeg * Math.PI) / 180

    const baseHeight = t * 2 // flat base slab thickness
    const backHeight = 90 // fixed reasonable back-support panel height before angling

    // Flat base slab, sitting on the bed, front edge at x=0, extending back to x = BD.
    const base = boxFromRange(0, BD, -W / 2, W / 2, 0, baseHeight)

    // Front lip: a rectangular ridge near the front of the base that the bottom edge
    // of the device rests against, with a slot cut into it for the device edge.
    // Slot layout along X: [frontWallStart..frontWallEnd] wall, then [slotStart..slotEnd] gap,
    // then [backWallStart..backWallEnd] wall.
    const frontWallStart = t * 2
    const frontWallEnd = frontWallStart + t
    const slotStart = frontWallEnd
    const slotEnd = slotStart + DT
    const backWallEnd = slotEnd + t

    const lipTop = baseHeight + LH
    const lipOuter = boxFromRange(frontWallStart, backWallEnd, -W / 2, W / 2, 0, lipTop)
    const slotCut = boxFromRange(slotStart, slotEnd, -W / 2 - 1, W / 2 + 1, baseHeight, lipTop + 1)
    const frontLip = subtract(lipOuter, slotCut)

    // Back support panel: a flat plate, upright, that gets rotated back by `angle`
    // degrees from vertical to recline the device resting against it. Build it
    // standing at the origin with its bottom-front edge on the rotation axis
    // (x=0, z=0), then rotate about Y and translate its pivot to the back of the base.
    const backPanelThickness = t
    const backPanel = boxFromRange(0, backPanelThickness, -W / 2, W / 2, 0, backHeight)
    // Rotate about Y axis: positive angle tilts the top of the panel toward +x
    // (backward lean, away from the device slot), which reclines the device.
    const backPanelTilted = rotate([0, angleRad, 0], backPanel)
    // Move the pivoted panel so its pivot edge sits at the back of the base.
    const backPanelPositioned = translate([BD - backPanelThickness, 0, baseHeight], backPanelTilted)

    let dock = union(base, frontLip, backPanelPositioned)

    // Everything is built with its lowest point at z=0 (base bottom face). No further shift needed.
    return dock
  },
  warnings(p) {
    const warnings = minWallWarnings({ thickness: p.wall })
    const slotGap = p.deviceThickness
    if (slotGap < 4) {
      warnings.push('Device slot is very narrow; thick cases may not fit. Increase device thickness param.')
    }
    if (p.angle > 30) {
      warnings.push('Recline angle above ~30 degrees may let a lightweight phone tip backward out of the dock.')
    }
    if (p.angle < 8) {
      warnings.push('Recline angle below ~8 degrees gives little back support; device may lean too far forward.')
    }
    if (p.baseDepth < p.deviceThickness * 6) {
      warnings.push('Base depth is small relative to device thickness; the dock may be unstable front-to-back.')
    }
    return warnings
  },
}
