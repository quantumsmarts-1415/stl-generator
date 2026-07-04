import modeling from '@jscad/modeling'
import { minWallWarnings } from '../lib/printability.js'

const { cuboid, cylinder } = modeling.primitives
const { union } = modeling.booleans
const { translate, rotate } = modeling.transforms

export const pegHook = {
  id: 'peg-hook',
  name: 'Pegboard Hook',
  category: 'Tools & Workshop',
  description: 'Two-prong pegboard hook sized to standard 25.4mm hole spacing, with an upturned tip to retain tools.',
  params: [
    { key: 'holeSpacing', label: 'Hole spacing', min: 12.7, max: 50.8, step: 0.1, default: 25.4, unit: 'mm' },
    { key: 'holeDiameter', label: 'Peg hole diameter', min: 4, max: 8, step: 0.05, default: 6.35, unit: 'mm' },
    { key: 'boardThickness', label: 'Pegboard thickness', min: 3, max: 10, step: 0.5, default: 6.35, unit: 'mm' },
    { key: 'reach', label: 'Hook reach (out from board)', min: 15, max: 80, step: 1, default: 40, unit: 'mm' },
    { key: 'hookThickness', label: 'Prong thickness', min: 3, max: 10, step: 0.5, default: 6, unit: 'mm' },
    { key: 'hookWidth', label: 'Prong width', min: 6, max: 20, step: 0.5, default: 10, unit: 'mm' },
  ],
  build(p) {
    const {
      holeSpacing: S,
      holeDiameter: D,
      boardThickness: BT,
      reach: R,
      hookThickness: T,
      hookWidth: W,
    } = p

    // Local working frame before final reorientation:
    // X = across the two prongs, Y = depth (peg pokes toward -Y through the board,
    // arm reaches out toward +Y from the board face at y=0), Z = vertical in that frame.
    const pegLength = BT + 6 // through the board plus a bit of clearance beyond
    const backPlateHeight = D + 2 * T
    const backPlateThickness = T

    function singleProng(offsetX) {
      const peg = translate(
        [offsetX, -pegLength / 2, 0],
        rotate([Math.PI / 2, 0, 0], cylinder({ radius: D / 2 - 0.3, height: pegLength }))
      )

      const backPad = cuboid({
        size: [W, backPlateThickness, backPlateHeight],
        center: [offsetX, backPlateThickness / 2, 0],
      })

      const arm = cuboid({
        size: [W, R, T],
        center: [offsetX, backPlateThickness + R / 2, 0],
      })

      const lipHeight = T * 3
      const lip = translate(
        [offsetX, backPlateThickness + R - T / 2, lipHeight / 2 - T / 2],
        cuboid({ size: [W, T, lipHeight] })
      )

      return union(peg, backPad, arm, lip)
    }

    const half = S / 2
    const hook = union(singleProng(-half), singleProng(half))

    // Reorient so the flat back plate becomes the base of the print (common for
    // pegboard hooks - printed lying on the face that presses against the board).
    // Rotating -90deg about X maps (x, y, z) -> (x, z, -y).
    const rotated = rotate([-Math.PI / 2, 0, 0], hook)

    // Old y ranged from -pegLength/2 (peg tip, most negative) to
    // backPlateThickness + R (lip outer face, most positive).
    // New z = -old y, so new z ranges from -(backPlateThickness + R) up to pegLength/2.
    // Lowest new z = -(backPlateThickness + R); lift by that amount so min z = 0.
    const liftZ = backPlateThickness + R
    return translate([0, 0, liftZ], rotated)
  },
  warnings(p) {
    const warnings = minWallWarnings({ thickness: p.hookThickness })
    if (p.holeDiameter > p.holeSpacing / 2) {
      warnings.push('Hole diameter is large relative to hole spacing; prongs may merge or overlap.')
    }
    if (p.hookThickness < 3) {
      warnings.push('Prong thickness below 3mm may snap under load-bearing use.')
    }
    if (p.reach > 60 && p.hookThickness < 5) {
      warnings.push('Long reach with a thin prong may sag or break; increase prong thickness.')
    }
    return warnings
  },
}
