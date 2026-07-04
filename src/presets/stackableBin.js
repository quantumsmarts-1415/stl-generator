import modeling from '@jscad/modeling'
import { minWallWarnings } from '../lib/printability.js'

const { cuboid } = modeling.primitives
const { subtract, union } = modeling.booleans
const { translate } = modeling.transforms

export const stackableBin = {
  id: 'stackable-bin',
  name: 'Stackable Parts Bin',
  category: 'Tools & Workshop',
  description: 'Small parts storage tray with a stepped rim so bins stack securely on top of each other.',
  params: [
    { key: 'width', label: 'Width', min: 30, max: 200, step: 1, default: 80, unit: 'mm' },
    { key: 'depth', label: 'Depth', min: 30, max: 200, step: 1, default: 60, unit: 'mm' },
    { key: 'height', label: 'Height', min: 15, max: 100, step: 1, default: 40, unit: 'mm' },
    { key: 'wallThickness', label: 'Wall thickness', min: 1, max: 4, step: 0.1, default: 1.6, unit: 'mm' },
    { key: 'lipHeight', label: 'Stacking lip height', min: 2, max: 8, step: 0.5, default: 4, unit: 'mm' },
    { key: 'lipClearance', label: 'Stacking lip clearance (printed-in gap)', min: 0.1, max: 0.6, step: 0.05, default: 0.3, unit: 'mm' },
  ],
  build(p) {
    const {
      width: W,
      depth: Dp,
      height: H,
      wallThickness: t,
      lipHeight: lip,
      lipClearance: clr,
    } = p

    // Outer shell: a simple open-top tub.
    const outer = cuboid({ size: [W, Dp, H], center: [0, 0, H / 2] })
    const cavity = cuboid({
      size: [W - 2 * t, Dp - 2 * t, H], // taller than needed, opens through the top
      center: [0, 0, t + (H) / 2 + 0.01],
    })
    const tub = subtract(outer, cavity)

    // Stacking lip: a raised step around the top rim, inset by the wall
    // thickness plus a small clearance, so the bottom of the bin above
    // (which has the same footprint as this bin's cavity opening) can nest
    // down over/into this lip. We add an outer raised collar that is
    // slightly smaller than the outer footprint (inset by clearance) so a
    // second identical bin's outer base perimeter can slip over it, and the
    // lip is solid (not hollow) sitting on top of the rim.
    const lipOuter = cuboid({
      size: [W - 2 * clr, Dp - 2 * clr, lip],
      center: [0, 0, H + lip / 2],
    })
    const lipInner = cuboid({
      size: [W - 2 * t - 2 * clr, Dp - 2 * t - 2 * clr, lip + 1],
      center: [0, 0, H + lip / 2],
    })
    const lipRing = subtract(lipOuter, lipInner)

    return union(tub, lipRing)
  },
  warnings(p) {
    const warnings = minWallWarnings({ thickness: p.wallThickness })
    if (p.wallThickness * 2 + 10 > Math.min(p.width, p.depth)) {
      warnings.push('Wall thickness is large relative to width/depth; interior cavity may be too small to be useful.')
    }
    if (p.lipClearance < 0.15) {
      warnings.push('Stacking lip clearance is very tight; bins may not stack/unstack without friction or need supports-free fit tuning.')
    }
    if (p.lipHeight > p.height * 0.3) {
      warnings.push('Stacking lip height is large relative to bin height; consider reducing it for a lower-profile stack.')
    }
    return warnings
  },
}
