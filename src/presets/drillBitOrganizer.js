import modeling from '@jscad/modeling'
import { minWallWarnings } from '../lib/printability.js'

const { cuboid, cylinder } = modeling.primitives
const { subtract } = modeling.booleans
const { translate } = modeling.transforms

export const drillBitOrganizer = {
  id: 'drill-bit-organizer',
  name: 'Drill Bit Organizer',
  category: 'Tools & Workshop',
  description: 'Graduated block of holes across rows and columns for sorting drill bits by size.',
  params: [
    { key: 'columns', label: 'Columns', min: 3, max: 20, step: 1, default: 10, unit: '' },
    { key: 'rows', label: 'Rows', min: 1, max: 5, step: 1, default: 2, unit: '' },
    { key: 'startDiameter', label: 'Smallest hole diameter', min: 1, max: 5, step: 0.1, default: 1.5, unit: 'mm' },
    { key: 'diameterStep', label: 'Diameter increase per column', min: 0.1, max: 2, step: 0.1, default: 0.5, unit: 'mm' },
    { key: 'holeDepth', label: 'Hole depth', min: 5, max: 30, step: 1, default: 15, unit: 'mm' },
    { key: 'wallMargin', label: 'Wall margin (min material between holes)', min: 1, max: 6, step: 0.5, default: 2.5, unit: 'mm' },
    { key: 'baseHeight', label: 'Base height below holes', min: 3, max: 15, step: 1, default: 6, unit: 'mm' },
  ],
  build(p) {
    const {
      columns: cols,
      rows,
      startDiameter: D0,
      diameterStep: dStep,
      holeDepth: hDepth,
      wallMargin: margin,
      baseHeight: base,
    } = p

    // Largest hole diameter (last column) governs pitch so nothing overlaps.
    const maxDiameter = D0 + dStep * (cols - 1)
    const pitchX = maxDiameter + margin
    const pitchY = maxDiameter + margin

    const blockWidth = cols * pitchX + margin
    const blockDepth = rows * pitchY + margin
    const blockHeight = base + hDepth

    const block = cuboid({
      size: [blockWidth, blockDepth, blockHeight],
      center: [blockWidth / 2, blockDepth / 2, blockHeight / 2],
    })

    const holes = []
    for (let c = 0; c < cols; c++) {
      const diameter = D0 + dStep * c
      const x = margin + pitchX * c + pitchX / 2
      for (let r = 0; r < rows; r++) {
        const y = margin + pitchY * r + pitchY / 2
        const hole = translate(
          [x, y, blockHeight - hDepth / 2 + 0.01],
          cylinder({ radius: diameter / 2, height: hDepth + 0.5 })
        )
        holes.push(hole)
      }
    }

    return subtract(block, ...holes)
  },
  warnings(p) {
    const warnings = minWallWarnings({ thickness: p.wallMargin })
    const maxDiameter = p.startDiameter + p.diameterStep * (p.columns - 1)
    if (p.wallMargin < 1.2) {
      warnings.push('Wall margin between holes is very thin and may fail to print cleanly or crack.')
    }
    if (maxDiameter > 12) {
      warnings.push('Largest hole diameter is quite large; consider fewer columns or a smaller diameter step.')
    }
    if (p.baseHeight < 3) {
      warnings.push('Base beneath the holes is thin; increase base height to avoid breakthrough.')
    }
    return warnings
  },
}
