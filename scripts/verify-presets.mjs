// Sanity harness: builds every preset at its defaults, checks the geometry,
// bounding box, hole subtraction and binary STL serialization.
// Run with: node scripts/verify-presets.mjs
import modeling from '@jscad/modeling'
import stlSerializer from '@jscad/stl-serializer'
import { presets, defaultParams } from '../src/presets/index.js'

const { measureBoundingBox, measureVolume } = modeling.measurements

let failures = 0

for (const preset of presets) {
  const params = defaultParams(preset)
  try {
    const geom = preset.build(params)
    const [min, max] = measureBoundingBox(geom)
    const dims = [max[0] - min[0], max[1] - min[1], max[2] - min[2]]
    const volume = measureVolume(geom)
    const stl = stlSerializer.serialize({ binary: true }, geom)
    const bytes = stl.reduce((n, buf) => n + (buf.byteLength ?? buf.length), 0)
    const triangles = (bytes - 84) / 50

    const checks = []
    if (!(volume > 0)) checks.push('volume <= 0')
    if (!dims.every((d) => d > 0)) checks.push('degenerate bbox')
    if (!(triangles >= 4)) checks.push('too few triangles')
    // Hole check: rebuilding without the hole must yield a larger volume.
    if (params.holeDiameter !== undefined && params.holeDiameter > 0) {
      const solidNoHole = preset.build({ ...params, holeDiameter: 0 })
      if (!(measureVolume(solidNoHole) > volume + 0.1)) checks.push('hole did not subtract')
    }

    if (checks.length) {
      failures++
      console.log(`FAIL ${preset.id}: ${checks.join('; ')}`)
    } else {
      console.log(
        `ok   ${preset.id.padEnd(18)} ${dims.map((d) => d.toFixed(1)).join(' x ')} mm, vol ${volume.toFixed(0)} mm³, ${triangles} tris, ${(bytes / 1024).toFixed(1)} KB STL`
      )
    }
  } catch (e) {
    failures++
    console.log(`FAIL ${preset.id}: threw — ${e.message}`)
  }
}

process.exit(failures ? 1 : 0)
