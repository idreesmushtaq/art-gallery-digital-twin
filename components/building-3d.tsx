"use client"

import { Suspense } from "react"
import { Canvas } from "@react-three/fiber"
import { OrbitControls, PerspectiveCamera, Environment, useGLTF } from "@react-three/drei"

export default function Building3D() {
  return (
    <Canvas className="w-full h-full" shadows>
      <PerspectiveCamera position={[8, 5, 8]} fov={60} makeDefault />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={3}
        maxDistance={20}
        maxPolarAngle={Math.PI / 2}
      />
      <Environment preset="city" />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <hemisphereLight intensity={0.3} groundColor="#444444" />
      <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={0.5} castShadow />

      {/* Building Model with Loading Fallback */}
      <Suspense fallback={<LoadingFallback />}>
        <BuildingModel />
      </Suspense>

      {/* Ground Plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.1} roughness={0.8} />
      </mesh>
    </Canvas>
  )
}

function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#60a5fa" wireframe />
    </mesh>
  )
}

function BuildingModel() {
  // Load the GLB model from Vercel Blob
  const { scene } = useGLTF("https://yvt4zt8otzn0p90m.public.blob.vercel-storage.com/vr_art_gallery.glb")

  return (
    <primitive
      object={scene}
      scale={1}
      position={[0, 0, 0]}
      castShadow
      receiveShadow
    />
  )
}

// Preload the model for better performance

