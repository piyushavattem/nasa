import { Canvas, useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { Points } from 'three'

function DustPoints() {
  const points = useRef<Points>(null)
  const { positions, colors } = useMemo(() => {
    const count = 420
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    let seed = 9137
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (random() - 0.5) * 18
      positions[i * 3 + 1] = (random() - 0.5) * 10
      positions[i * 3 + 2] = (random() - 0.5) * 8
      const infrared = random()
      colors[i * 3] = infrared > 0.55 ? 1 : 0.55
      colors[i * 3 + 1] = infrared > 0.55 ? 0.62 : 0.82
      colors[i * 3 + 2] = infrared > 0.55 ? 0.38 : 1
    }
    return { positions, colors }
  }, [])
  useFrame((_, delta) => {
    if (points.current) {
      points.current.rotation.y += delta * 0.012
      points.current.rotation.x += delta * 0.003
    }
  })
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial vertexColors size={0.035} transparent opacity={0.72} sizeAttenuation depthWrite={false} />
    </points>
  )
}

export default function HeroAtmosphere({ active }: { active: boolean }) {
  return (
    <Canvas className="hero-atmosphere" aria-hidden="true" frameloop={active ? 'always' : 'never'} dpr={[1, 1.2]} camera={{ position: [0, 0, 5], fov: 55 }} gl={{ alpha: true, antialias: false, powerPreference: 'low-power' }}>
      <DustPoints />
    </Canvas>
  )
}
