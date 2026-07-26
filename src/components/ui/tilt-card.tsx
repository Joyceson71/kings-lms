'use client';

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glareEnable?: boolean;
  holoEffect?: boolean;
}

export function TiltCard({ children, className, glareEnable = true, holoEffect = false }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springConfig = { damping: 20, stiffness: 300, mass: 0.5 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const rotateX = useTransform(springY, [0, 1], [15, -15]);
  const rotateY = useTransform(springX, [0, 1], [-15, 15]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const xPct = clientX / rect.width;
    const yPct = clientY / rect.height;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0.5);
    y.set(0.5);
  };

  // Improved glare calculations based on mouse position
  const glareX = useTransform(springX, [0, 1], [100, -100]);
  const glareY = useTransform(springY, [0, 1], [100, -100]);
  const glareOpacity = useTransform(springY, [0, 1], [0, 0.4]);

  // Holo effects
  const holoBgX = useTransform(springX, [0, 1], [0, 100]);
  const holoBgY = useTransform(springY, [0, 1], [0, 100]);
  const holoOpacity = useTransform(springY, [0, 1], [0, 0.8]);
  
  // Create transformed string values at the top level
  const bgPosX = useTransform(holoBgX, (val) => `${val}%`);
  const bgPosY = useTransform(holoBgY, (val) => `${val}%`);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 1000 }}
      className={cn("relative w-full h-full", className)}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="w-full h-full relative"
      >
        {children}
        
        {glareEnable && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-[100] rounded-[inherit] overflow-hidden mix-blend-overlay"
            style={{
              opacity: glareOpacity,
            }}
          >
            <motion.div 
              className="absolute inset-0 bg-gradient-to-tr from-transparent via-white to-transparent"
              style={{
                x: glareX,
                y: glareY,
                scale: 1.5,
              }}
            />
          </motion.div>
        )}
        
        {holoEffect && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-[110] rounded-[inherit] overflow-hidden mix-blend-color-dodge transition-opacity duration-300"
            style={{
              opacity: isHovered ? holoOpacity : 0,
              backgroundImage: 'linear-gradient(115deg, transparent 20%, rgba(255, 0, 200, 0.5) 30%, rgba(0, 255, 255, 0.5) 45%, rgba(255, 255, 0, 0.5) 60%, transparent 80%)',
              backgroundSize: '250% 250%',
              backgroundPositionX: bgPosX,
              backgroundPositionY: bgPosY,
            }}
          />
        )}
      </motion.div>
    </div>
  );
}
