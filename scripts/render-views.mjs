// Dev QA tool: renders each preset to an SVG with four orthographic-ish views
// (front, side, top, isometric) using a painter's-algorithm triangle fill.
// Run: node scripts/render-views.mjs [outDir]
import fs from 'node:fs'
import path from 'node:path'
import { presets, defaultParams } from '../src/presets/index.js'

const outDir = process.argv[2] ?? 'previews'
fs.mkdirSync(outDir, { recursive: true })

function triangles(geom) {
  const tris = []
  for (const poly of geom.polygons) {
    const v = poly.vertices
    for (let i = 1; i < v.length - 1; i++) tris.push([v[0], v[i], v[i + 1]])
  }
  return tris
}

const VIEWS = {
  front: (p) => [p[0], -p[2], p[1]], // look along -Y: x right, z up
  side: (p) => [p[1], -p[2], p[0]], // look along +X
  top: (p) => [p[0], -p[1], -p[2]], // look down -Z
  iso: (p) => {
    const a = Math.PI / 4
    const b = Math.atan(1 / Math.SQRT2)
    const x1 = p[0] * Math.cos(a) - p[1] * Math.sin(a)
    const y1 = p[0] * Math.sin(a) + p[1] * Math.cos(a)
    return [x1, -(p[2] * Math.cos(b) - y1 * Math.sin(b)), y1 * Math.cos(b) + p[2] * Math.sin(b)]
  },
}

function renderView(tris, project, size) {
  const projected = tris.map((t) => {
    const pts = t.map(project)
    const depth = (pts[0][2] + pts[1][2] + pts[2][2]) / 3
    // shade from the 2D-projected normal (cheap lambert-ish)
    const [a, b, c] = pts
    const cross = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])
    return { pts, depth, front: cross < 0 }
  })
  projected.sort((p, q) => p.depth - q.depth)

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const t of projected)
    for (const [x, y] of t.pts.map((p) => [p[0], p[1]])) {
      minX = Math.min(minX, x); maxX = Math.max(maxX, x)
      minY = Math.min(minY, y); maxY = Math.max(maxY, y)
    }
  const s = size / Math.max(maxX - minX, maxY - minY, 1)
  const ox = (size - (maxX - minX) * s) / 2 - minX * s
  const oy = (size - (maxY - minY) * s) / 2 - minY * s

  let out = ''
  const depths = projected.map((t) => t.depth)
  const dMin = Math.min(...depths), dMax = Math.max(...depths)
  for (const t of projected) {
    const shade = 90 + Math.round(((t.depth - dMin) / (dMax - dMin || 1)) * 120)
    const fill = t.front ? `rgb(${shade},${shade + 10},${shade + 20})` : `rgb(${shade - 30},${shade - 25},${shade - 15})`
    const pts = t.pts.map((p) => `${(p[0] * s + ox).toFixed(1)},${(p[1] * s + oy).toFixed(1)}`).join(' ')
    out += `<polygon points="${pts}" fill="${fill}" stroke="rgba(0,0,0,0.18)" stroke-width="0.4"/>`
  }
  return out
}

for (const preset of presets) {
  const geom = preset.build(defaultParams(preset))
  const tris = triangles(geom)
  const S = 340
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${S * 4 + 50}" height="${S + 40}" style="background:#1a1e26">`
  let x = 10
  for (const [name, project] of Object.entries(VIEWS)) {
    svg += `<g transform="translate(${x},30)">${renderView(tris, project, S)}</g>`
    svg += `<text x="${x + S / 2}" y="20" fill="#ccc" font-family="sans-serif" font-size="14" text-anchor="middle">${name}</text>`
    x += S + 10
  }
  svg += '</svg>'
  fs.writeFileSync(path.join(outDir, `${preset.id}.svg`), svg)
  console.log(`rendered ${preset.id} (${tris.length} tris)`)
}
