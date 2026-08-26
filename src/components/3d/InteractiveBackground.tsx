'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useTheme } from 'next-themes';

// Generate random points in a sphere
function generatePoints(count: number, radius: number) {
  const points = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = Math.cbrt(Math.random()) * radius;
    const sinPhi = Math.sin(phi);
    const x = r * sinPhi * Math.cos(theta);
    const y = r * sinPhi * Math.sin(theta);
    const z = r * Math.cos(phi);
    
    points[i * 3] = x;
    points[i * 3 + 1] = y;
    points[i * 3 + 2] = z;
  }
  return points;
}

function Starfield() {
  const ref = useRef<THREE.Points>(null);
  const { theme, systemTheme } = useTheme();
  
  // Create 5000 points
  const points = useMemo(() => generatePoints(5000, 2.5), []);
  
  // Rotation target tracked via ref for performance (no re-render needed)
  const targetRotation = useRef({ x: 0, y: 0 });

  useFrame((state) => {
    if (!ref.current) return;
    
    // Slow continuous rotation
    ref.current.rotation.x -= 0.0005;
    ref.current.rotation.y -= 0.0005;

    // Interactive rotation based on mouse pointer (normalised -1 to +1)
    targetRotation.current.x = state.pointer.y * 0.2;
    targetRotation.current.y = state.pointer.x * 0.2;
    
    // Smooth dampening towards target rotation
    ref.current.rotation.x += (targetRotation.current.x - ref.current.rotation.x) * 0.05;
    ref.current.rotation.y += (targetRotation.current.y - ref.current.rotation.y) * 0.05;
  });

  const isDark = theme === 'dark' || (theme === 'system' && systemTheme === 'dark');
  const particleColor = isDark ? '#a5b4fc' : '#4f46e5'; // Indigo matching primary

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={points} stride={3} frustumCulled={false}>
        <PointMaterial
          transparent
          color={particleColor}
          size={0.015}
          sizeAttenuation={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={isDark ? 0.8 : 0.4}
        />
      </Points>
    </group>
  );
}

export function InteractiveBackground() {
  return (
    <div className="absolute inset-0 z-0 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Starfield />
      </Canvas>
    </div>
  );
}
