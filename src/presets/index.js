// Preset registry. To add a new shape: create a file exporting a preset
// object ({ id, name, category, description, params, build, warnings }) and
// add it to this list.
import { boxWithLid } from './boxWithLid.js'
import { nestedBoxes } from './nestedBoxes.js'
import { phoneStand } from './phoneStand.js'
import { phoneCase } from './phoneCase.js'
import { dragon } from './dragon.js'

export const presets = [boxWithLid, nestedBoxes, phoneStand, phoneCase, dragon]

export function defaultParams(preset) {
  const out = {}
  for (const p of preset.params) out[p.key] = p.default
  return out
}
