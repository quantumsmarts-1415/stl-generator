// Live 3D preview. JSCAD builds parts Z-up on the "bed" (z = 0); the model
// group is rotated so that maps onto Three's Y-up world, with a grid at y = 0.
import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import { geom3ToBufferGeometry } from '../lib/jscadToThree.js'

function CameraRig({ presetId, size }) {
  const { camera } = useThree()
  useEffect(() => {
    const d = Math.max(size * 1.6, 25)
    camera.position.set(d * 0.7, d * 0.8, d)
    camera.lookAt(0, 0, 0)
  }, [presetId]) // re-frame only when the preset changes, not on every tweak
  return null
}

function Model({ geom }) {
  const geometry = useMemo(() => (geom ? geom3ToBufferGeometry(geom) : null), [geom])
  const prev = useRef(null)
  useEffect(() => {
    if (prev.current && prev.current !== geometry) prev.current.dispose()
    prev.current = geometry
    return () => geometry && geometry.dispose()
  }, [geometry])
  if (!geometry) return null
  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh geometry={geometry}>
        <meshStandardMaterial color="#8fa3b8" metalness={0.55} roughness={0.35} />
      </mesh>
    </group>
  )
}

export default function Viewport({ geom, presetId, size, error }) {
  return (
    <div className="viewport">
      <Canvas camera={{ fov: 40, near: 0.1, far: 2000, position: [40, 45, 55] }}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[60, 90, 50]} intensity={1.1} />
        <directionalLight position={[-50, 40, -60]} intensity={0.35} />
        <Model geom={geom} />
        <Grid
          args={[300, 300]}
          cellSize={5}
          sectionSize={25}
          cellColor="#556070"
          sectionColor="#6b7a8f"
          fadeDistance={280}
          infiniteGrid
        />
        <CameraRig presetId={presetId} size={size} />
        <OrbitControls makeDefault enableDamping dampingFactor={0.1} />
      </Canvas>
      {error && (
        <div className="viewport-error">Couldn’t build this shape: {error}</div>
      )}
    </div>
  )
}
