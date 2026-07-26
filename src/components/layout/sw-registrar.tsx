'use client';
import { useEffect } from 'react';
import { registerSW } from '@/lib/register-sw';

export function SWRegistrar() {
  useEffect(() => {
    registerSW();
  }, []);
  return null;
}
