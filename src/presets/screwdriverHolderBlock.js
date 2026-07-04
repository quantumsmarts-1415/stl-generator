import modeling from '@jscad/modeling'
import { minWallWarnings } from '../lib/printability.js'

const { cuboid, cylinder } = modeling.primitives
const { subtract } = modeling.booleans
const { translate } = modeling.transforms

export const screwdriverHolderBlock = {
  id: 'screwdriver-holder-block',
  name: 'Screwdriver Holder Block',
  category: 'Tools & Workshop',
  description: 'Benchtop block with a single row of graduated holes sized for screwdriver shafts/handles, angled ready for grab-and-go use.',
  params: [
    { key: 'slotCount', label: 'Number of screwdriver slots', min: 2, max: 12, step: 1, default: 6, unit: '' },
    { key: 'startDiameter', label: 'Smallest shaft/handle diameter', min: 5, max: 15, step: 0.5, default: 8, unit: 'mm' },
    { key: 'diameterStep', label: 'Diameter increase per slot', min: 0, max: 4, step: 0.5, default: 1.5, unit: 'mm' },
    { key: 'holeDepth', label: 'Hole depth', min: 10, max: 50, step: 1, default: 25, unit: 'mm' },
    { key: 'wallMargin', label: 'Wall margin between holes', min: 1.5, max: 8, step: 0.5, default: 3, unit: 'mm' },
    { key: 'blockHeight', label: 'Total block height', min: 20, max: 70, step: 1, default: 40, unit: 'mm' },
    { key: 'blockDepth', label: 'Block depth (front-to-back)', min: 20, max: 80, step: 1, default: 35, unit: 'mm' },
  ],
  build(p) {
    const {
      slotCount: n,
      startDiameter: D0,
      diameterStep: dStep,
      holeDepth: hDepth,
      wallMargin: margin,
      blockHeight: H,
      blockDepth: Dp,
    } = p

    const maxDiameter = D0 + dStep * (n - 1)
    const pitch = maxDiameter + margin
    const blockWidth = n * pitch + margin

    const block = cuboid({
      size: [blockWidth, Dp, H],
      center: [blockWidth / 2, Dp / 2, H / 2],
    })

    // Holes drop in vertically from the top face, graduated in diameter left to right,
    // clamped so the deepest hole never exceeds the block height (leaves a solid floor).
    const safeHoleDepth = Math.min(hDepth, H - 6)
    const holes = []
    for (let i = 0; i < n; i++) {
      const diameter = D0 + dStep * i
      const x = margin + pitch * i + pitch / 2
      const y = Dp / 2
      const hole = translate(
        [x, y, H - safeHoleDepth / 2 + 0.01],
        cylinder({ radius: diameter / 2, height: safeHoleDepth + 0.5 })
      )
      holes.push(hole)
    }

    return subtract(block, ...holes)
  },
  warnings(p) {
    const warnings = minWallWarnings({ thickness: p.wallMargin })
    const maxDiameter = p.startDiameter + p.diameterStep * (p.slotCount - 1)
    if (p.wallMargin < 2) {
      warnings.push('Wall margin between holes is thin; adjacent holes may merge or the block may crack between slots.')
    }
    if (p.holeDepth > p.blockHeight - 6) {
      warnings.push('Hole depth is close to block height; depth has been clamped to preserve a solid floor at least 6mm thick.')
    }
    if (maxDiameter > p.blockDepth * 0.8) {
      warnings.push('Largest hole diameter is large relative to block depth; increase block depth for adequate wall support front-to-back.')
    }
    return warnings
  },
}
