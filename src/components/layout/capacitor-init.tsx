'use client';

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

export function CapacitorInit() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      const initCapacitor = async () => {
        try {
          // Configure Status Bar
          await StatusBar.setStyle({ style: Style.Dark });
          if (Capacitor.getPlatform() === 'android') {
            await StatusBar.setBackgroundColor({ color: '#0a0a0b' });
          }
          
          // Hide Splash Screen after React has hydrated
          await SplashScreen.hide();
        } catch (error) {
          console.error('Failed to initialize Capacitor plugins', error);
        }
      };

      initCapacitor();
    }
  }, []);

  return null;
}
