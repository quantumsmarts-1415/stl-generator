// Printability checks shown as non-blocking warnings in the UI.
// Rule of thumb for FDM/Teleport-style printing: keep walls >= 1 mm.
export const MIN_WALL_MM = 1.0

export function minWallWarnings(p) {
  const warnings = []
  if (p.thickness !== undefined && p.thickness < MIN_WALL_MM) {
    warnings.push(
      `Thickness ${p.thickness.toFixed(1)} mm is below the recommended minimum wall of ${MIN_WALL_MM} mm — may print fragile or fail.`
    )
  }
  return warnings
}

/** Warn when the material bridge between a hole edge and the part edge is thin. */
export function holeLigamentWarning(ligamentMm, label = 'hole') {
  if (ligamentMm < MIN_WALL_MM) {
    return [
      `Only ${Math.max(0, ligamentMm).toFixed(1)} mm of material between the ${label} and the part edge (recommended ≥ ${MIN_WALL_MM} mm).`,
    ]
  }
  return []
}
