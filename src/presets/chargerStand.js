import modeling from '@jscad/modeling'
import { minWallWarnings } from '../lib/printability.js'

const { cuboid, cylinder, roundedCuboid } = modeling.primitives
const { union, subtract } = modeling.booleans
const { translate, rotate } = modeling.transforms

// Helper: build an axis-aligned box given explicit min/max extents in X, Y, Z.
function boxFromRange(xMin, xMax, yMin, yMax, zMin, zMax) {
  const size = [xMax - xMin, yMax - yMin, zMax - zMin]
  const center = [(xMin + xMax) / 2, (yMin + yMax) / 2, (zMin + zMax) / 2]
  return cuboid({ size, center })
}

export const chargerStand = {
  id: 'charger-stand',
  name: 'Wireless Charger Stand',
  category: 'Desk & Phone Accessories',
  description: 'Angled cradle that holds a puck-style wireless charger and props the phone up while charging.',
  params: [
    { key: 'baseWidth', label: 'Base width', min: 60, max: 140, step: 1, default: 90, unit: 'mm' },
    { key: 'baseDepth', label: 'Base depth', min: 60, max: 140, step: 1, default: 95, unit: 'mm' },
    { key: 'puckDiameter', label: 'Charging puck diameter', min: 50, max: 100, step: 1, default: 70, unit: 'mm' },
    { key: 'puckThickness', label: 'Charging puck thickness', min: 4, max: 15, step: 0.5, default: 8, unit: 'mm' },
    { key: 'cradleAngle', label: 'Cradle recline angle from vertical', min: 5, max: 30, step: 1, default: 15, unit: 'deg' },
    { key: 'wall', label: 'Wall thickness', min: 2, max: 6, step: 0.5, default: 3, unit: 'mm' },
    { key: 'cablePortDiameter', label: 'Rear cable port diameter', min: 4, max: 12, step: 0.5, default: 8, unit: 'mm' },
  ],
  build(p) {
    const {
      baseWidth: BW,
      baseDepth: BD,
      puckDiameter: PD,
      puckThickness: PT,
      cradleAngle: angleDeg,
      wall: t,
      cablePortDiameter: cpd,
    } = p
    const angleRad = (angleDeg * Math.PI) / 180
    const baseHeight = t * 2
    const puckR = PD / 2
    const potHeight = PT + t // pocket depth (puck thickness) plus a floor of thickness t

    // Flat base slab.
    const base = roundedCuboid({
      size: [BW, BD, baseHeight],
      roundRadius: Math.min(3, baseHeight / 3),
      center: [0, 0, baseHeight / 2],
    })

    // Cradle block: a block that will hold the recessed puck pocket, built upright
    // at the origin (its bottom-front pivot edge at x=0,z=0), then reclined by angle
    // and moved to sit on the back portion of the base — same technique as the
    // adjustable dock preset.
    const cradleThickness = potHeight + t // pocket depth + a solid back wall behind it
    const cradleHeight = puckR * 2 + 2 * t // enough height (in local z, pre-rotation) to hold the puck pocket + walls
    const cradleWidth = Math.max(BW - 2 * t, PD + 2 * t)

    const cradleOuter = boxFromRange(
      0, cradleThickness,
      -cradleWidth / 2, cradleWidth / 2,
      0, cradleHeight
    )

    // Puck pocket: a cylindrical recess sunk into the front face (x=0 face) of the
    // cradle block, centered on the block, open toward -x (the phone/puck-facing side).
    const puckPocket = cylinder({
      radius: puckR,
      height: potHeight + 1,
      center: [0, 0, 0], // placeholder, positioned below
    })
    // cylinder's default axis is Z; rotate so its axis is X (pointing into the block from the front face)
    const puckPocketRotated = rotate([0, Math.PI / 2, 0], puckPocket)
    const puckPocketPositioned = translate(
      [potHeight / 2 - 0.5, 0, cradleHeight / 2],
      puckPocketRotated
    )

    // Rear cable port: a small through-hole from the back face to the puck pocket
    // so the charging cable can pass through the cradle to the puck.
    const cablePort = cylinder({
      radius: cpd / 2,
      height: cradleThickness + 2,
      center: [0, 0, 0],
    })
    const cablePortRotated = rotate([0, Math.PI / 2, 0], cablePort)
    const cablePortPositioned = translate(
      [cradleThickness / 2, 0, cradleHeight / 2],
      cablePortRotated
    )

    const cradleCarved = subtract(cradleOuter, puckPocketPositioned, cablePortPositioned)

    // Recline the cradle backward by cradleAngle degrees (rotating about Y through
    // its bottom-front pivot edge at x=0,z=0), then place it at the back of the base.
    // Because the pivot is the block's bottom-FRONT edge, tilting backward swings the
    // bottom-BACK edge (local x=cradleThickness, z=0) down by cradleThickness*sin(angle),
    // which can dip below the base top at extreme wall/angle combinations. Compensate
    // by lifting the cradle up by that worst-case dip so it never clips through the base.
    const cradleDip = cradleThickness * Math.sin(angleRad)
    const cradleTilted = rotate([0, angleRad, 0], cradleCarved)
    const cradlePositioned = translate([BD - cradleThickness, 0, baseHeight + cradleDip], cradleTilted)

    let stand = union(base, cradlePositioned)

    // Lowest point is z=0 (base bottom face). No further translation needed.
    return stand
  },
  warnings(p) {
    const warnings = minWallWarnings({ thickness: p.wall })
    if (p.puckDiameter + 2 * p.wall > p.baseWidth) {
      warnings.push('Charging puck is wide relative to base width; the cradle may overhang the base.')
    }
    if (p.cradleAngle > 25) {
      warnings.push('Recline angle above ~25 degrees may let the phone slide off the puck while charging.')
    }
    if (p.cablePortDiameter < 5) {
      warnings.push('Cable port is narrow; many charging cable connectors may not pass through.')
    }
    if (p.puckThickness + p.wall < 6) {
      warnings.push('Puck pocket floor plus puck thickness is quite thin; check fit against your specific charger.')
    }
    return warnings
  },
}
