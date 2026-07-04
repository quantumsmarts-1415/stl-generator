// A set of open boxes sized so each one nests inside the previous
// (Russian-doll style), printed side by side.
import modeling from '@jscad/modeling'
import { minWallWarnings } from '../lib/printability.js'

const { cuboid } = modeling.primitives
const { subtract, union } = modeling.booleans
const { translate } = modeling.transforms

function openBox(W, D, H, t, cx) {
  return subtract(
    cuboid({ size: [W, D, H], center: [cx, 0, H / 2] }),
    cuboid({ size: [W - 2 * t, D - 2 * t, H], center: [cx, 0, t + H / 2] })
  )
}

export const nestedBoxes = {
  id: 'nested-boxes',
  name: 'Nested Boxes',
  category: 'Boxes',
  description: 'Open boxes that stack inside each other, largest to smallest.',
  params: [
    { key: 'count', label: 'Number of boxes', min: 2, max: 5, step: 1, default: 3, unit: '' },
    { key: 'width', label: 'Largest width', min: 40, max: 160, step: 1, default: 80, unit: 'mm' },
    { key: 'depth', label: 'Largest depth', min: 30, max: 160, step: 1, default: 60, unit: 'mm' },
    { key: 'height', label: 'Largest height', min: 15, max: 100, step: 1, default: 40, unit: 'mm' },
    { key: 'wall', label: 'Wall thickness', min: 1, max: 4, step: 0.1, default: 2, unit: 'mm' },
    { key: 'clearance', label: 'Nesting clearance (per side)', min: 0.1, max: 1, step: 0.05, default: 0.3, unit: 'mm' },
  ],
  build(p) {
    const gap = 8
    const boxes = []
    let { width: w, depth: d, height: h } = p
    let cursor = 0
    for (let i = 0; i < p.count; i++) {
      if (w <= 3 * p.wall + 2 || d <= 3 * p.wall + 2 || h <= p.wall + 4) break
      boxes.push(openBox(w, d, h, p.wall, cursor + w / 2))
      cursor += w + gap
      // next box must fit through the previous box's inner opening
      w = w - 2 * p.wall - 2 * p.clearance
      d = d - 2 * p.wall - 2 * p.clearance
      h = h - 5
    }
    const span = cursor - gap
    return translate([-span / 2, 0, 0], union(...boxes))
  },
  warnings(p) {
    const w = minWallWarnings({ thickness: p.wall })
    // how many actually fit?
    let count = 0
    let { width: bw, depth: bd, height: bh } = p
    for (let i = 0; i < p.count; i++) {
      if (bw <= 3 * p.wall + 2 || bd <= 3 * p.wall + 2 || bh <= p.wall + 4) break
      count++
      bw -= 2 * p.wall + 2 * p.clearance
      bd -= 2 * p.wall + 2 * p.clearance
      bh -= 5
    }
    if (count < p.count) {
      w.push(`Only ${count} boxes fit at these dimensions — increase the largest size or thin the walls.`)
    }
    return w
  },
}
