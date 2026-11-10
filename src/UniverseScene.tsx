import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls, Stars } from '@react-three/drei'
import { useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import type { SkyObject } from './types'

function glowTexture(inner: string, outer: string) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(128, 128, 6, 128, 128, 128)
  gradient.addColorStop(0, inner)
  gradient.addColorStop(0.22, outer)
  gradient.addColorStop(0.55, `${outer}55`)
  gradient.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 256, 256)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function NebulaField() {
  const group = useRef<THREE.Group>(null)
  const textures = useMemo(() => [
    glowTexture('#ffe7c4', '#ff6b4a'),
    glowTexture('#d7f4ff', '#4f7dff'),
    glowTexture('#f4d4ff', '#9b4dff'),
    glowTexture('#fff1c9', '#ff9a4a'),
  ], [])
  useFrame((_, delta) => {
    if (group.current) group.current.rotation.z += delta * 0.008
  })
  return (
    <group ref={group}>
      {textures.map((map, index) => (
        <sprite key={index} position={[[-4.2, 1.1, -6], [3.8, -1.4, -7], [0.4, 2.4, -8], [-1.8, -2.2, -5.5]][index] as [number, number, number]} scale={[7.4, 4.2, 1]}>
          <spriteMaterial map={map} transparent opacity={0.38} depthWrite={false} blending={THREE.AdditiveBlending} />
        </sprite>
      ))}
    </group>
  )
}

function MilkyWayBand() {
  const texture = useMemo(() => glowTexture('#fff6e8', '#c9a07a'), [])
  return (
    <mesh rotation={[0.18, 0, -0.42]} position={[0, -0.2, -9]}>
      <planeGeometry args={[28, 4.8]} />
      <meshBasicMaterial map={texture} transparent opacity={0.28} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  )
}

function CosmicObject({ item, selected, onSelect }: { item: SkyObject; selected?: string; onSelect: (id: string) => void }) {
  const group = useRef<THREE.Group>(null)
  const isSelected = selected === item.id
  const position: [number, number, number] = item.id === 'cosmic-web'
    ? [0.15, 0.05, -2.8]
    : [item.scene[0] * 1.35, item.scene[1] * 1.2, item.scene[2] * 0.7]
  const halo = useMemo(() => glowTexture('#fff8ee', item.tint), [item.tint])

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * (isSelected ? 0.18 : 0.06)
  })

  return (
    <group ref={group} position={position} onClick={(event) => { event.stopPropagation(); onSelect(item.id) }} onPointerOver={() => { document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'auto' }}>
      <sprite scale={isSelected ? [2.8, 2.8, 1] : [2.1, 2.1, 1]}>
        <spriteMaterial map={halo} transparent opacity={isSelected ? 0.95 : 0.62} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
      {item.id === 'andromeda' && (
        <mesh rotation={[1.15, 0.2, 0.4]} scale={[1.7, 0.42, 1.7]}>
          <sphereGeometry args={[0.38, 48, 32]} />
          <meshStandardMaterial color="#f4e4c8" emissive={item.tint} emissiveIntensity={isSelected ? 1.6 : 0.85} roughness={0.45} metalness={0.05} />
        </mesh>
      )}
      {item.id === 'orion-nebula' && (
        <mesh>
          <sphereGeometry args={[0.46, 32, 32]} />
          <meshStandardMaterial color="#8ef7ff" emissive="#67e8f9" emissiveIntensity={isSelected ? 1.8 : 0.9} roughness={0.8} transparent opacity={0.86} />
        </mesh>
      )}
      {item.id === 'pleiades' && Array.from({ length: 7 }, (_, index) => {
        const angle = (index / 7) * Math.PI * 2
        return (
          <mesh key={index} position={[Math.cos(angle) * 0.28, Math.sin(angle) * 0.16, Math.sin(angle * 1.7) * 0.08]}>
            <sphereGeometry args={[0.045, 12, 12]} />
            <meshBasicMaterial color="#fff4d2" />
          </mesh>
        )
      })}
      {item.id === 'cosmic-web' && (
        <mesh rotation={[0.4, 0.8, 0.2]}>
          <torusGeometry args={[0.72, 0.018, 8, 48]} />
          <meshBasicMaterial color={item.tint} transparent opacity={0.55} />
        </mesh>
      )}
      {item.id !== 'pleiades' && (
        <mesh>
          <sphereGeometry args={[isSelected ? 0.22 : 0.16, 24, 24]} />
          <meshStandardMaterial color="#fff7ea" emissive={item.tint} emissiveIntensity={isSelected ? 2.2 : 1.1} roughness={0.3} />
        </mesh>
      )}
      <pointLight color={item.tint} intensity={isSelected ? 4.2 : 1.8} distance={5} />
      <Html distanceFactor={13} position={[0, 0.55, 0]} center>
        <button className={`scene-label planet-label ${isSelected ? 'selected' : ''}`} onClick={event => { event.stopPropagation(); onSelect(item.id) }}>{item.name}</button>
      </Html>
    </group>
  )
}

function Drift({ children }: { children: ReactNode }) {
  const group = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (!group.current) return
    group.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.05) * 0.08
    group.current.position.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.08
  })
  return <group ref={group}>{children}</group>
}

function GalaxyField({ onSelect, onOpenPlanets }: { onSelect: (id: string) => void; onOpenPlanets: () => void }) {
  const stars = useMemo(() => {
    const armCount = 5, perArm = 1550, bulgeCount = 1100
    const positions = new Float32Array((armCount * perArm + bulgeCount) * 3)
    const colors = new Float32Array(positions.length)
    let seed = 8191
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }
    let cursor = 0
    for (let arm = 0; arm < armCount; arm++) for (let i = 0; i < perArm; i++) {
      const t = Math.pow(random(), 0.68), radius = 0.5 + t * 7.2
      const theta = arm * Math.PI * 2 / armCount + t * 5.1 + (random() - 0.5) * 0.3
      positions[cursor] = Math.cos(theta) * radius
      positions[cursor + 1] = (random() - 0.5) * (0.12 + t * 0.22)
      positions[cursor + 2] = Math.sin(theta) * radius
      const warm = random() < 0.57
      colors[cursor] = warm ? 1 : 0.45 + random() * 0.3
      colors[cursor + 1] = warm ? 0.68 + random() * 0.2 : 0.68 + random() * 0.25
      colors[cursor + 2] = warm ? 0.42 : 1
      cursor += 3
    }
    for (let i = 0; i < bulgeCount; i++) {
      const theta = random() * Math.PI * 2, radius = Math.pow(random(), 2) * 1.5
      positions[cursor] = Math.cos(theta) * radius
      positions[cursor + 1] = (random() - 0.5) * 0.62
      positions[cursor + 2] = Math.sin(theta) * radius
      colors[cursor] = 1; colors[cursor + 1] = 0.76; colors[cursor + 2] = 0.52
      cursor += 3
    }
    return { positions, colors }
  }, [])
  return <group rotation={[-0.08, 0, 0.1]}>
    <points><bufferGeometry><bufferAttribute attach="attributes-position" args={[stars.positions, 3]}/><bufferAttribute attach="attributes-color" args={[stars.colors, 3]}/></bufferGeometry><pointsMaterial vertexColors size={0.038} sizeAttenuation transparent opacity={0.92} depthWrite={false} blending={THREE.AdditiveBlending}/></points>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]}><circleGeometry args={[1.15, 64]}/><meshBasicMaterial color="#f4bd73" transparent opacity={0.16} blending={THREE.AdditiveBlending} depthWrite={false}/></mesh>
    <mesh rotation={[0, 0, 0.18]}><boxGeometry args={[2.5, 0.13, 0.42]}/><meshBasicMaterial color="#ffcf91" transparent opacity={0.18} blending={THREE.AdditiveBlending}/></mesh>
    <mesh><sphereGeometry args={[0.47, 32, 32]}/><meshBasicMaterial color="#ffe4af" transparent opacity={0.78} blending={THREE.AdditiveBlending}/></mesh>
    <Html distanceFactor={16} position={[0, 0.72, 0]} center><button className="scene-label galaxy-label" onClick={event => { event.stopPropagation(); onSelect('milky-way') }}>MILKY WAY · BARRED SPIRAL</button></Html>
    <Html distanceFactor={11} position={[0.4, 0.18, 0.08]} center><span className="galaxy-core-label">GALACTIC CENTER</span></Html>
    <mesh position={[-4.1, 0.11, -1.5]} onClick={event => { event.stopPropagation(); onOpenPlanets() }}><sphereGeometry args={[0.1, 18, 18]}/><meshBasicMaterial color="#78b9ff"/><Html distanceFactor={10} position={[0, 0.28, 0]} center><button className="scene-label solar-marker" onClick={event => { event.stopPropagation(); onOpenPlanets() }}>OUR SOLAR SYSTEM <small>ORION SPUR · OPEN THE PLANETS</small></button></Html></mesh>
    <OrbitControls enablePan enableZoom minDistance={7} maxDistance={22} rotateSpeed={0.45} zoomSpeed={0.6}/>
  </group>
}

const planetStyle = [
  { color:'#a7a29d', radius:0.075 }, { color:'#e8c18e', radius:0.11 }, { color:'#4e91e8', radius:0.115 }, { color:'#d86d4d', radius:0.09 },
  { color:'#d9ae80', radius:0.29 }, { color:'#e2cf9a', radius:0.25 }, { color:'#87d5d0', radius:0.18 }, { color:'#5878df', radius:0.18 },
]
function SolarSystem({ objects, selected, onSelect }: { objects: SkyObject[]; selected?: string; onSelect: (id:string)=>void }) {
  const planetNames=['mercury','venus','earth','mars','jupiter','saturn','uranus','neptune']
  const planets=planetNames.map(id=>objects.find(object=>object.id===id)).filter((item):item is SkyObject=>Boolean(item))
  return <group>
    <ambientLight intensity={0.2}/><pointLight position={[0,0,0]} intensity={3.8} distance={14} color="#ffe0a3"/>
    <mesh><sphereGeometry args={[0.48, 40, 40]}/><meshBasicMaterial color="#ffd27d"/></mesh>
    <mesh><sphereGeometry args={[0.75, 24, 24]}/><meshBasicMaterial color="#ffb94c" transparent opacity={0.1} blending={THREE.AdditiveBlending}/></mesh>
    {planets.map((planet,index)=>{
      const radius=1.05+index*0.56, angle=0.55+index*0.79, x=Math.cos(angle)*radius, z=Math.sin(angle)*radius, style=planetStyle[index]
      return <group key={planet.id}>
        <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.015,0]}><ringGeometry args={[radius-0.006,radius+0.006,128]}/><meshBasicMaterial color={selected===planet.id?'#b6a4ff':'#738098'} transparent opacity={selected===planet.id?0.75:0.25} side={THREE.DoubleSide}/></mesh>
        <group position={[x,0,z]} onClick={event=>{event.stopPropagation();onSelect(planet.id)}}>
        <mesh><sphereGeometry args={[style.radius,32,32]}/><meshStandardMaterial color={style.color} emissive={style.color} emissiveIntensity={selected===planet.id?0.35:0.08} roughness={0.75}/></mesh>
        {planet.id==='saturn'&&<mesh rotation={[Math.PI/2.5,0,0]}><torusGeometry args={[0.39,0.045,8,64]}/><meshBasicMaterial color="#e7d4a5" transparent opacity={0.82}/></mesh>}
        <Html distanceFactor={12} position={[0,style.radius+0.22,0]} center><button className={`scene-label planet-label ${selected===planet.id?'selected':''}`} onClick={event=>{event.stopPropagation();onSelect(planet.id)}}>{planet.name}</button></Html>
        </group>
      </group>
    })}
    <Stars radius={80} depth={55} count={3500} factor={3} saturation={0.4} fade speed={0.15}/>
    <OrbitControls enablePan enableZoom minDistance={5} maxDistance={18} rotateSpeed={0.42} zoomSpeed={0.58}/>
  </group>
}

export default function UniverseScene({ objects, selected, onSelect, onOpenPlanets = () => onSelect('earth'), view = 'solar' }: { objects: SkyObject[]; selected?: string; onSelect: (id: string) => void; onOpenPlanets?: () => void; view?: 'galaxy'|'solar'|'catalog' }) {
  return (
    <Canvas fallback={<div className="scene-fallback"><OrbitFallback /><b>3D rendering is unavailable</b><span>Use the object list below to continue exploring.</span></div>} camera={{ position: view==='galaxy'?[0,10.5,11]:view==='solar'?[0,7.7,12.4]:[0,0.35,7.6], fov: view==='solar'?48:52 }} dpr={[1, 1.7]} gl={{ antialias: true, alpha: false }}>
      <color attach="background" args={['#020308']} />
      <fog attach="fog" args={['#05070e', 8, 28]} />
      {view==='galaxy' ? <><ambientLight intensity={0.12}/><Stars radius={100} depth={65} count={4200} factor={3} saturation={0.3} fade speed={0.08}/><GalaxyField onSelect={onSelect} onOpenPlanets={onOpenPlanets}/></> : view==='solar' ? <SolarSystem objects={objects} selected={selected} onSelect={onSelect}/> : <><ambientLight intensity={0.18}/><pointLight position={[6, 3, 4]} intensity={1.4} color="#8fb7ff"/><pointLight position={[-5, -2, 2]} intensity={0.9} color="#ff8a5b"/><Stars radius={90} depth={50} count={5200} factor={3.6} saturation={0.35} fade speed={0.35}/><Drift><MilkyWayBand/><NebulaField/>{objects.map(item=><CosmicObject key={item.id} item={item} selected={selected} onSelect={onSelect}/>)}</Drift><OrbitControls enablePan enableZoom minDistance={3.2} maxDistance={14} rotateSpeed={0.42} zoomSpeed={0.62} autoRotate autoRotateSpeed={0.28}/></>}
    </Canvas>
  )
}

function OrbitFallback() { return <span className="fallback-orbit" aria-hidden="true">✳</span> }
