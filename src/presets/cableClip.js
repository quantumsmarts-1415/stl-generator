import modeling from '@jscad/modeling'
import { minWallWarnings } from '../lib/printability.js'

const { cuboid, cylinder } = modeling.primitives
const { subtract, union } = modeling.booleans
const { translate, rotate } = modeling.transforms

export const cableClip = {
  id: 'cable-clip',
  name: 'Desk Cable Clip',
  category: 'Desk & Phone Accessories',
  description: 'Snap-on desk-edge cable organizer with a friction-fit channel for one cable.',
  params: [
    { key: 'clipWidth', label: 'Clip width (along desk edge)', min: 8, max: 40, step: 1, default: 16, unit: 'mm' },
    { key: 'deskThickness', label: 'Desk/edge thickness it clamps onto', min: 5, max: 30, step: 0.5, default: 18, unit: 'mm' },
    { key: 'cableDiameter', label: 'Cable channel diameter', min: 2, max: 12, step: 0.5, default: 5, unit: 'mm' },
    { key: 'wall', label: 'Wall thickness', min: 1, max: 4, step: 0.1, default: 2.4, unit: 'mm' },
    { key: 'gapOpening', label: 'Snap-fit gap opening (< cable dia for grip)', min: 1, max: 10, step: 0.5, default: 3.5, unit: 'mm' },
  ],
  build(p) {
    const { clipWidth: W, deskThickness: D, cableDiameter: cd, wall: t, gapOpening: gap } = p

    // C-shaped bracket (in X-Z cross-section) extruded along Y (width W) that hooks
    // over a desk edge of thickness D, plus a cylindrical cable-gripping ring hanging
    // below the bottom arm, with a snap-fit slot so a cable can be pressed in.

    // Back vertical wall: presses against the desk's edge face.
    const backWall = cuboid({
      size: [t, W, D + 2 * t],
      center: [t / 2, 0, (D + 2 * t) / 2],
    })

    const armDepth = cd + 2 * t // how far the arms reach out from the desk edge

    // Top horizontal arm: rests on top of the desk.
    const topArm = cuboid({
      size: [armDepth, W, t],
      center: [armDepth / 2, 0, D + 2 * t - t / 2],
    })

    // Bottom horizontal arm: runs under the desk, carries the cable ring.
    const bottomArm = cuboid({
      size: [armDepth, W, t],
      center: [armDepth / 2, 0, t / 2],
    })

    // Cable-gripping ring hanging from the outward end of the bottom arm.
    // Cylinders extrude along Z by default, so build the ring upright first
    // (its bore axis along Z) then rotate 90 degrees about the Y axis so the
    // bore axis lies along... actually we want the bore along Y (the clip's
    // width direction, so a cable can run the full width through the ring).
    // Build the ring "flat" (bore along Z, ring face in the X-Y plane) then
    // rotate 90 degrees about the X axis to tip the bore over to point along Y.
    const channelOuterR = cd / 2 + t
    const channelCenterX = armDepth - channelOuterR

    const channelOuterUpright = cylinder({ radius: channelOuterR, height: W, center: [0, 0, 0] })
    const channelInnerUpright = cylinder({ radius: cd / 2, height: W + 2, center: [0, 0, 0] })

    // Rotate 90 degrees about X: the cylinder's Z-axis (bore direction) swings
    // over to the Y-axis, so the bore now runs along Y (clip width) as intended,
    // and the ring's flat faces now face +X/-X.
    const channelOuterRotated = rotate([Math.PI / 2, 0, 0], channelOuterUpright)
    const channelInnerRotated = rotate([Math.PI / 2, 0, 0], channelInnerUpright)

    const ringCenterZ = 0 // ring center at z=0, so its top half overlaps/unions with bottomArm (which spans z in [0, t])
    const channelOuter = translate([channelCenterX, 0, ringCenterZ], channelOuterRotated)
    const channelInner = translate([channelCenterX, 0, ringCenterZ], channelInnerRotated)

    // Snap-fit gap: thin slot cut from the underside of the ring so the cable can be pressed in.
    const gapSlot = cuboid({
      size: [gap, W + 2, channelOuterR + cd],
      center: [channelCenterX, 0, -(channelOuterR + cd) / 2],
    })

    const cableRing = subtract(channelOuter, channelInner, gapSlot)

    let bracket = union(backWall, topArm, bottomArm, cableRing)

    // Lowest point is the bottom of the cable ring: ringCenterZ - channelOuterR = -channelOuterR.
    // Translate up so the whole part sits flat on the print bed (z=0).
    bracket = translate([0, 0, channelOuterR], bracket)

    return bracket
  },
  warnings(p) {
    const warnings = minWallWarnings({ thickness: p.wall })
    if (p.gapOpening >= p.cableDiameter) {
      warnings.push('Snap-fit gap opening is >= cable diameter; the cable may not be gripped or retained.')
    }
    if (p.gapOpening < p.cableDiameter * 0.4) {
      warnings.push('Snap-fit gap opening is quite narrow relative to cable diameter; the cable may be hard to press in.')
    }
    if (p.wall < 1.6) {
      warnings.push('Thin walls on a snap-fit clip may crack with repeated flexing; consider 1.6mm+ for durability.')
    }
    return warnings
  },
}
