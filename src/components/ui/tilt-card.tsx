'use client';

import { useRef, useCallback, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  intensity?: number;
  glareEffect?: boolean;
}

export function TiltCard({ children, className, intensity = 12, glareEffect = true }: TiltCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;

    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

    if (glareRef.current && glareEffect) {
      const dist = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2) / Math.sqrt(centerX ** 2 + centerY ** 2);
      glareRef.current.style.opacity = `${dist * 0.15}`;
      glareRef.current.style.background = `radial-gradient(circle at ${(x / rect.width) * 100}% ${(y / rect.height) * 100}%, rgba(255,255,255,0.25) 0%, transparent 70%)`;
    }
  }, [intensity, glareEffect]);

  const handleMouseLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    if (glareRef.current) {
      glareRef.current.style.opacity = '0';
    }
  }, []);

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn('relative transition-transform duration-200 ease-out', className)}
      style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
    >
      {children}
      {glareEffect && (
        <div
          ref={glareRef}
          className="absolute inset-0 rounded-[inherit] pointer-events-none transition-opacity duration-200"
          style={{ opacity: 0, zIndex: 10 }}
        />
      )}
    </div>
  );
}
