import modeling from '@jscad/modeling'
import { minWallWarnings } from '../lib/printability.js'

const { cylinder, cuboid } = modeling.primitives
const { union, subtract, intersect } = modeling.booleans

export const penCupOrganizer = {
  id: 'pen-cup-organizer',
  name: 'Pen & Pencil Cup Organizer',
  category: 'Desk & Phone Accessories',
  description: 'Cylindrical desk cup with a cross-divider splitting it into four compartments.',
  params: [
    { key: 'outerDiameter', label: 'Outer diameter', min: 50, max: 140, step: 1, default: 85, unit: 'mm' },
    { key: 'height', label: 'Cup height', min: 40, max: 160, step: 1, default: 100, unit: 'mm' },
    { key: 'wall', label: 'Wall thickness', min: 1.5, max: 5, step: 0.1, default: 2.5, unit: 'mm' },
    { key: 'floorThickness', label: 'Floor thickness', min: 1.5, max: 6, step: 0.5, default: 3, unit: 'mm' },
    { key: 'dividerThickness', label: 'Cross-divider thickness', min: 1.5, max: 6, step: 0.1, default: 2.5, unit: 'mm' },
    { key: 'dividerHeight', label: 'Divider height (from floor)', min: 20, max: 160, step: 1, default: 70, unit: 'mm' },
  ],
  build(p) {
    const {
      outerDiameter: OD,
      height: H,
      wall: t,
      floorThickness: FT,
      dividerThickness: dt,
      dividerHeight: DH,
    } = p
    const outerR = OD / 2
    const innerR = outerR - t

    // Outer cup shell: a cylinder shell with a floor, open at the top.
    const outerCyl = cylinder({
      radius: outerR,
      height: H,
      center: [0, 0, H / 2],
    })
    const innerCavity = cylinder({
      radius: innerR,
      height: H, // will be positioned so it starts above the floor and pokes through the top
      center: [0, 0, FT + H / 2],
    })
    const cupShell = subtract(outerCyl, innerCavity)

    // Cross divider: two perpendicular plates spanning the inner cavity, forming
    // a "+" cross-section that splits the cup into 4 compartments. Clipped to the
    // inner cylindrical cavity with an intersect so the divider doesn't poke outside
    // the wall, and clipped in height to DH (measured from the floor).
    const dividerDiskHeight = Math.min(DH, H - FT)
    const plateA = cuboid({
      size: [innerR * 2 + 2, dt, dividerDiskHeight],
      center: [0, 0, FT + dividerDiskHeight / 2],
    })
    const plateB = cuboid({
      size: [dt, innerR * 2 + 2, dividerDiskHeight],
      center: [0, 0, FT + dividerDiskHeight / 2],
    })
    const crossRaw = union(plateA, plateB)

    // Clip the cross to the inner cavity radius so it fits snugly against the inner wall
    // and doesn't extend past it (use a cylinder the size of the inner cavity as a clip mask).
    const clipMask = cylinder({
      radius: innerR,
      height: dividerDiskHeight + 2,
      center: [0, 0, FT + dividerDiskHeight / 2],
    })
    const cross = intersect(crossRaw, clipMask)

    let cup = union(cupShell, cross)

    // Lowest point is z=0 (floor bottom face). No further translation needed.
    return cup
  },
  warnings(p) {
    const warnings = minWallWarnings({ thickness: p.wall })
    const innerDiameter = p.outerDiameter - 2 * p.wall
    if (innerDiameter < 20) {
      warnings.push('Inner cavity is very small once wall thickness is subtracted; pens/pencils may not fit comfortably.')
    }
    if (p.dividerThickness < 1.2) {
      warnings.push('Divider is very thin and may warp or break during printing/use.')
    }
    if (p.dividerHeight > p.height - p.floorThickness) {
      warnings.push('Divider height exceeds available interior height; it will be clamped down to the cup interior height.')
    }
    if (p.floorThickness < 1.5) {
      warnings.push('Floor thickness below ~1.5mm may not print solid or may flex under load.')
    }
    return warnings
  },
}
