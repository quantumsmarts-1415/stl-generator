// Convert a JSCAD geom3 into a Three.js BufferGeometry (non-indexed,
// fan-triangulated, flat-shaded via computed vertex normals).
import * as THREE from 'three'

export function geom3ToBufferGeometry(geom) {
  const positions = []
  for (const poly of geom.polygons) {
    const v = poly.vertices
    for (let i = 1; i < v.length - 1; i++) {
      positions.push(v[0][0], v[0][1], v[0][2])
      positions.push(v[i][0], v[i][1], v[i][2])
      positions.push(v[i + 1][0], v[i + 1][1], v[i + 1][2])
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.computeVertexNormals()
  return geometry
}
