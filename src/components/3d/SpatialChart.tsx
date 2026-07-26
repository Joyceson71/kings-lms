'use client';

import React, { useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

interface ChartData {
  label: string;
  value: number;
  color: string;
}

interface SpatialChartProps {
  data: ChartData[];
  maxValue: number;
}

function Bar3D({ data, index, total, maxValue }: { data: ChartData; index: number; total: number; maxValue: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHover] = useState(false);
  
  // Calculate position
  const spacing = 1.5;
  const startX = -((total - 1) * spacing) / 2;
  const xPos = startX + index * spacing;
  
  // Height proportional to value, with a minimum height
  const targetHeight = Math.max((data.value / maxValue) * 4, 0.1);
  const yPos = targetHeight / 2;

  useFrame((state, delta) => {
    if (meshRef.current) {
      // Animate scale Y for entrance
      meshRef.current.scale.y = THREE.MathUtils.lerp(meshRef.current.scale.y, 1, delta * 4);
      
      // Hover effect: slight lift and scale
      const targetZ = hovered ? 0.5 : 0;
      meshRef.current.position.z = THREE.MathUtils.lerp(meshRef.current.position.z, targetZ, delta * 6);
    }
  });

  return (
    <group position={[xPos, yPos, 0]}>
      <mesh
        ref={meshRef}
        scale={[1, 0.01, 1]} // Start flat for animation
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={(e) => { e.stopPropagation(); setHover(false); document.body.style.cursor = 'auto'; }}
      >
        <boxGeometry args={[1, targetHeight, 1]} />
        <meshPhysicalMaterial 
          color={data.color}
          roughness={0.2}
          metalness={0.8}
          clearcoat={1}
          emissive={hovered ? data.color : '#000000'}
          emissiveIntensity={hovered ? 0.5 : 0}
        />
      </mesh>
      
      {/* Value Label (Top) */}
      <Html position={[0, targetHeight / 2 + 0.3, 0]} center style={{ pointerEvents: 'none', transition: 'all 0.2s', opacity: hovered ? 1 : 0.7, transform: hovered ? 'scale(1.2)' : 'scale(1)' }}>
        <div className="bg-background/80 backdrop-blur border border-border px-2 py-1 rounded-lg shadow-xl font-bold text-foreground text-xs whitespace-nowrap">
          {data.value}
        </div>
      </Html>
      
      {/* Category Label (Bottom) */}
      <Html position={[0, -targetHeight / 2 - 0.4, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
          {data.label}
        </div>
      </Html>
    </group>
  );
}

export function SpatialChart({ data, maxValue }: SpatialChartProps) {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas camera={{ position: [0, 3, 6], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
        <pointLight position={[-5, 5, -5]} intensity={0.5} color="#818cf8" />
        
        <group position={[0, -1.5, 0]}>
          {data.map((item, index) => (
            <Bar3D 
              key={item.label} 
              data={item} 
              index={index} 
              total={data.length} 
              maxValue={maxValue} 
            />
          ))}
          
          {/* Ground Plane (Glass/Mirror effect) */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#0a0a1a" roughness={0.1} metalness={0.8} transparent opacity={0.5} />
          </mesh>
          <ContactShadows position={[0, 0, 0]} opacity={0.4} scale={15} blur={1.5} far={4} color="#000000" />
        </group>
        
        <OrbitControls 
          enablePan={false} 
          enableZoom={false}
          minPolarAngle={Math.PI / 4} 
          maxPolarAngle={Math.PI / 2.1} 
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
        />
        <Environment preset="city" />
      </Canvas>
      <div className="absolute top-2 right-2 flex items-center gap-1.5 text-[10px] text-muted-foreground bg-background/40 backdrop-blur px-2 py-1 rounded-full border border-border">
        <span>Drag to rotate</span>
      </div>
    </div>
  );
}
