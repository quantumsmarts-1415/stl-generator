// One-click binary STL export of a JSCAD geom3, straight from the browser.
import stlSerializer from '@jscad/stl-serializer'

export function downloadStl(geom, filename) {
  const rawData = stlSerializer.serialize({ binary: true }, geom)
  const blob = new Blob(rawData, { type: 'model/stl' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.stl') ? filename : `${filename}.stl`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
