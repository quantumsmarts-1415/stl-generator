// Low-poly dragon figurine, assembled from chunky primitives: boxy body,
// stepped tail with a spike, angled neck, blocky head, pyramid horns and
// back spikes, and thin swept wings. Deliberately toy-block / minecraft-y —
// constructive geometry can't sculpt an organic dragon.
// All proportions are authored at length = 120 mm and scaled uniformly.
import modeling from '@jscad/modeling'

const { cuboid, cylinderElliptic, polygon } = modeling.primitives
const { union } = modeling.booleans
const { extrudeLinear } = modeling.extrusions
const { translate, rotate, rotateX, rotateZ, mirror, scale } = modeling.transforms

const BASE = 120 // authoring length in mm (nose-to-tail-ish along X)

function pyramid(r, h) {
  return cylinderElliptic({
    height: h,
    startRadius: [r, r],
    endRadius: [0.05, 0.05],
    segments: 4,
    center: [0, 0, h / 2],
  })
}

function wing(size) {
  // bat-wing sail with two points, authored flat in XY then stood up.
  // +x = toward tail after mounting, +y = up. Root edge along x 0..14 at y 0.
  const pts = [
    [0, 0],
    [14, 0],
    [40 * size, 16 * size],
    [30 * size, 22 * size],
    [16 * size, 38 * size],
    [4, 10],
  ]
  return extrudeLinear({ height: 3 }, polygon({ points: pts }))
}

function buildAtBase(wingSize) {
  const parts = []

  // body — spans x [-28, 28], z [14, 40]
  parts.push(cuboid({ size: [56, 26, 26], center: [0, 0, 27] }))

  // legs
  for (const sx of [-1, 1])
    for (const sy of [-1, 1])
      parts.push(cuboid({ size: [9, 8, 16], center: [19 * sx, 9.5 * sy, 8] }))

  // stepped tail + spike
  parts.push(cuboid({ size: [20, 12, 11], center: [-36, 0, 26] }))
  parts.push(cuboid({ size: [16, 9, 9], center: [-49, 0, 30] }))
  parts.push(cuboid({ size: [13, 6, 6], center: [-60, 0, 34] }))
  parts.push(
    translate([-64, 0, 34], rotate([0, -Math.PI / 2, 0], pyramid(4, 12)))
  )

  // neck (leaning forward) + head + snout
  parts.push(translate([24, 0, 48], rotate([0, 0.21, 0], cuboid({ size: [11, 11, 24] }))))
  parts.push(cuboid({ size: [17, 13, 11], center: [30, 0, 58] }))
  parts.push(cuboid({ size: [9, 7, 5.5], center: [41, 0, 56.5] }))

  // horns (tilted back)
  for (const sy of [-1, 1])
    parts.push(translate([26, 3.5 * sy, 62], rotate([0, -0.35, 0], pyramid(2.2, 8))))

  // back spikes along the spine
  for (const x of [12, 0, -12]) parts.push(translate([x, 0, 38], pyramid(3.2, 8)))

  // wings — rooted into the body's top edge, swept toward the tail,
  // canted outward so they flare like open sails
  if (wingSize > 0.05) {
    let sail = wing(wingSize)
    sail = rotateX(Math.PI / 2, sail) // stand up: sail now in XZ, thickness -y
    sail = rotateZ(Math.PI, sail) // sweep toward the tail (-x)
    const left = translate([10, 9, 36], rotateX(-0.55, sail)) // cant tip outward +y
    parts.push(left)
    parts.push(mirror({ normal: [0, 1, 0] }, left))
  }

  return union(...parts)
}

export const dragon = {
  id: 'dragon',
  name: 'Dragon (Low-Poly)',
  category: 'Fun',
  description: 'Chunky toy-block dragon figurine with wings, horns and tail spike.',
  params: [
    { key: 'length', label: 'Overall size', min: 60, max: 220, step: 5, default: 120, unit: 'mm' },
    { key: 'wingSize', label: 'Wing size', min: 0, max: 1.6, step: 0.1, default: 1, unit: '×' },
  ],
  build(p) {
    const s = p.length / BASE
    return scale([s, s, s], buildAtBase(p.wingSize))
  },
  warnings(p) {
    const w = []
    if (p.length < 90) w.push('Below ~90 mm the horns and tail spike get very small — they may print fragile.')
    if (p.wingSize > 1.2) w.push('Large wings are thin — consider printing with supports or a brim.')
    return w
  },
}
