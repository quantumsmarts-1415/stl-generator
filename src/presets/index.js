// Preset registry. To add a new shape: create a file exporting a preset
// object ({ id, name, category, description, params, build, warnings }) and
// add it to this list.
import { boxWithLid } from './boxWithLid.js'
import { nestedBoxes } from './nestedBoxes.js'
import { phoneStand } from './phoneStand.js'
import { phoneCase } from './phoneCase.js'
import { dragon } from './dragon.js'
import { cableClip } from './cableClip.js'
import { headphoneStand } from './headphoneStand.js'
import { adjustableDock } from './adjustableDock.js'
import { penCupOrganizer } from './penCupOrganizer.js'
import { chargerStand } from './chargerStand.js'
import { pegHook } from './pegHook.js'
import { drillBitOrganizer } from './drillBitOrganizer.js'
import { toolRackSlots } from './toolRackSlots.js'
import { stackableBin } from './stackableBin.js'
import { screwdriverHolderBlock } from './screwdriverHolderBlock.js'

export const presets = [boxWithLid, nestedBoxes, phoneStand, phoneCase, dragon, cableClip, headphoneStand, adjustableDock, penCupOrganizer, chargerStand, pegHook, drillBitOrganizer, toolRackSlots, stackableBin, screwdriverHolderBlock]

export function defaultParams(preset) {

  const out = {}
      for (const p of preset.params) out[p.key] = p.default
    return out
}
