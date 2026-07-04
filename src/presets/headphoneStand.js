import modeling from '@jscad/modeling'
import { minWallWarnings } from '../lib/printability.js'

const { cylinder, roundedCuboid } = modeling.primitives
const { union } = modeling.booleans
const { translate, rotate } = modeling.transforms
const { hull } = modeling.hulls

export const headphoneStand = {
  id: 'headphone-stand',
  name: 'Headphone Stand',
  category: 'Desk & Phone Accessories',
  description: 'Weighted-base headphone stand with a padded-radius hook arm for over-ear headphones.',
  params: [
    { key: 'baseWidth', label: 'Base width', min: 60, max: 160, step: 1, default: 100, unit: 'mm' },
    { key: 'baseDepth', label: 'Base depth', min: 50, max: 140, step: 1, default: 90, unit: 'mm' },
    { key: 'baseHeight', label: 'Base height', min: 8, max: 30, step: 1, default: 14, unit: 'mm' },
    { key: 'postHeight', label: 'Post height (base top to hook center)', min: 100, max: 260, step: 1, default: 170, unit: 'mm' },
    { key: 'postDiameter', label: 'Post diameter', min: 12, max: 30, step: 1, default: 20, unit: 'mm' },
    { key: 'hookRadius', label: 'Hook arm radius (headband curve)', min: 20, max: 50, step: 1, default: 32, unit: 'mm' },
    { key: 'hookThickness', label: 'Hook arm thickness', min: 8, max: 25, step: 1, default: 16, unit: 'mm' },
  ],
  build(p) {
    const {
      baseWidth: BW,
      baseDepth: BD,
      baseHeight: BH,
      postHeight: PH,
      postDiameter: PD,
      hookRadius: HR,
      hookThickness: HT,
    } = p
    const postR = PD / 2

    // Base slab, sitting on the print bed, centered at origin in X/Y.
    const base = roundedCuboid({
      size: [BW, BD, BH],
      roundRadius: Math.min(4, BH / 3),
      center: [0, 0, BH / 2],
    })

    // Vertical post rising from the base.
    const post = cylinder({
      radius: postR,
      height: PH,
      center: [0, 0, BH + PH / 2],
    })

    // Hook arm: a torus-like quarter-loop approximated by hulling two cylinders
    // (one vertical continuation of the post, one horizontal at the top, offset
    // sideways by HR) so headphones can be slung over it. This keeps it CSG-only
    // (hull of primitives) rather than sculpted organic geometry.
    const hookCenterZ = BH + PH
    const armA = cylinder({
      radius: HT / 2,
      height: HT,
      center: [0, 0, hookCenterZ],
    })
    // Horizontal cylinder: default cylinder axis is Z, so rotate 90 degrees about Y
    // to lay its axis along X, then translate it sideways by HR at the same height
    // as armA so hulling the two produces a smooth quarter-loop hook arm.
    const armBUpright = cylinder({ radius: HT / 2, height: HT, center: [0, 0, 0] })
    const armBRotated = rotate([0, Math.PI / 2, 0], armBUpright)
    const armB = translate([HR, 0, hookCenterZ], armBRotated)

    const hookArm = hull(armA, armB)

    // End lip at the tip of the hook so headphones don't slide off; a simple
    // wider disc (short cylinder) centered on the tip of the horizontal arm.
    const tipLip = cylinder({
      radius: HT / 2 + 3,
      height: HT * 0.4,
      center: [HR, 0, hookCenterZ],
    })

    let stand = union(base, post, hookArm, tipLip)

    // Lowest point is z=0 already (base bottom face). No further translation needed.
    return stand
  },
  warnings(p) {
    const warnings = minWallWarnings({ thickness: Math.min(p.postDiameter, p.hookThickness) / 2 })
    if (p.hookRadius * 2 > p.baseWidth * 1.5) {
      warnings.push('Hook radius is large relative to base width; the stand may tip over under headphone weight.')
    }
    if (p.postHeight > p.baseWidth * 3) {
      warnings.push('Post is tall and slender relative to the base footprint; consider a wider or heavier base for stability.')
    }
    if (p.postDiameter < 12) {
      warnings.push('Post diameter is thin for its height and may snap or wobble; 12mm or more is recommended.')
    }
    return warnings
  },
}
