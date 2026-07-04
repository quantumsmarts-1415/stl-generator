// Storage box + friction-fit lid, printed side by side. The lid's inner lip
// is undersized by `clearance` per side so it slips into the box after
// printing (0.2 mm is a good FDM starting point).
import modeling from '@jscad/modeling'
import { minWallWarnings } from '../lib/printability.js'

const { cuboid } = modeling.primitives
const { subtract, union } = modeling.booleans
const { translate } = modeling.transforms

export const boxWithLid = {
  id: 'box-with-lid',
  name: 'Box with Lid',
  category: 'Boxes',
  description: 'Open box + slip-fit lid with printed-in clearance.',
  params: [
    { key: 'width', label: 'Width', min: 30, max: 150, step: 1, default: 80, unit: 'mm' },
    { key: 'depth', label: 'Depth', min: 20, max: 150, step: 1, default: 60, unit: 'mm' },
    { key: 'height', label: 'Height', min: 10, max: 100, step: 1, default: 40, unit: 'mm' },
    { key: 'wall', label: 'Wall thickness', min: 1, max: 4, step: 0.1, default: 2, unit: 'mm' },
    { key: 'clearance', label: 'Fit clearance (per side)', min: 0.05, max: 0.6, step: 0.05, default: 0.2, unit: 'mm' },
    { key: 'lipHeight', label: 'Lid lip height', min: 3, max: 20, step: 0.5, default: 8, unit: 'mm' },
  ],
  build(p) {
    const { width: W, depth: D, height: H, wall: t, clearance: c, lipHeight } = p
    const gap = 10

    const box = subtract(
      cuboid({ size: [W, D, H], center: [0, 0, H / 2] }),
      cuboid({ size: [W - 2 * t, D - 2 * t, H], center: [0, 0, t + H / 2] })
    )

    const lidX = W + gap // lid centre, box centred at 0
    const lid = union(
      cuboid({ size: [W, D, t], center: [lidX, 0, t / 2] }),
      cuboid({
        size: [W - 2 * t - 2 * c, D - 2 * t - 2 * c, lipHeight],
        center: [lidX, 0, t + lipHeight / 2],
      })
    )

    // centre the pair on the bed
    return translate([-lidX / 2, 0, 0], union(box, lid))
  },
  warnings(p) {
    const w = minWallWarnings({ thickness: p.wall })
    if (p.clearance < 0.15) w.push('Clearance under 0.15 mm often fits too tight on FDM printers.')
    if (p.clearance > 0.4) w.push('Clearance over 0.4 mm will give a loose, rattly lid.')
    if (p.lipHeight > p.height - p.wall) w.push('Lip is taller than the box cavity — it will bottom out.')
    return w
  },
}
