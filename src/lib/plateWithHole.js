// Shared builder for flat "blank" plates: a (optionally rounded) rectangle or
// disc, extruded to a thickness, with an optional through-hole for a ring/cord.
// All units are millimetres. Parts sit on z = 0 (print bed).
import modeling from '@jscad/modeling'

const { primitives, booleans, extrusions, transforms } = modeling
const { rectangle, roundedRectangle, cylinder } = primitives
const { subtract } = booleans
const { extrudeLinear } = extrusions
const { translate } = transforms

const EPS = 0.05

/** Clamp a corner radius so JSCAD's roundedRectangle stays valid. */
export function clampCornerRadius(radius, length, width) {
  const max = Math.min(length, width) / 2 - EPS
  return Math.max(0, Math.min(radius, max))
}

/** Extrude a (rounded) rectangle of length x width to the given thickness. */
export function roundedPlate({ length, width, thickness, cornerRadius = 0 }) {
  const r = clampCornerRadius(cornerRadius, length, width)
  const shape =
    r > 0
      ? roundedRectangle({ size: [length, width], roundRadius: r, segments: 48 })
      : rectangle({ size: [length, width] })
  return extrudeLinear({ height: thickness }, shape)
}

/**
 * Drill a vertical through-hole into a solid.
 * @param solid geom3 to drill
 * @param x,y   hole centre in the XY plane
 * @param diameter hole diameter
 * @param thickness part thickness (hole is made taller to guarantee a clean cut)
 */
export function drillHole(solid, { x, y, diameter, thickness }) {
  if (diameter <= 0) return solid
  const bit = cylinder({
    radius: diameter / 2,
    height: thickness * 4,
    center: [x, y, thickness / 2],
    segments: 48,
  })
  return subtract(solid, bit)
}

/** Centre a solid on X/Y (leaves Z alone). */
export function centerXY(solid) {
  return translate([0, 0, 0], solid) // plates built here are already XY-centred
}
