'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, Html, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

// ─── 3D Glowing Orb ──────────────────────────────────────────────
function GlowingOrb() {
  const meshRef = React.useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += delta * 0.5;
      meshRef.current.rotation.x += delta * 0.2;
    }
  });

  return (
    <Float speed={4} rotationIntensity={2} floatIntensity={2}>
      <mesh ref={meshRef} scale={1.5}>
        <icosahedronGeometry args={[1, 2]} />
        <meshPhysicalMaterial
          color="#818cf8"
          emissive="#4f46e5"
          emissiveIntensity={2}
          wireframe
          transparent
          opacity={0.8}
        />
      </mesh>
      {/* Inner solid core */}
      <mesh scale={1.2}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshPhysicalMaterial
          color="#312e81"
          roughness={0.1}
          metalness={1}
          transmission={0.5}
          thickness={1}
        />
      </mesh>
    </Float>
  );
}

export function WelcomeSequence({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    // Automatically dismiss after 3.5 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-background overflow-hidden"
    >
      <div className="absolute inset-0 w-full h-full">
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} color="#818cf8" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#c084fc" />
          
          <GlowingOrb />
          
          <ContactShadows position={[0, -2, 0]} opacity={0.5} scale={10} blur={2} far={4} color="#000000" />
          <Environment preset="city" />
          
          <Html center position={[0, -3.5, 0]}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-center whitespace-nowrap"
            >
              <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 tracking-tighter" style={{ fontFamily: "'Outfit', sans-serif" }}>
                KINGS EC
              </h1>
              <p className="text-sm md:text-base text-muted-foreground font-medium tracking-widest mt-2 uppercase">
                Learning Management System
              </p>
            </motion.div>
          </Html>
        </Canvas>
      </div>
      
      {/* Skip Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        onClick={onComplete}
        className="absolute bottom-10 px-6 py-2 rounded-full text-xs font-semibold text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 transition-all"
      >
        Skip Intro
      </motion.button>
    </motion.div>
  );
}
