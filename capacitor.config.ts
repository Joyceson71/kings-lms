import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kingslms.app',
  appName: 'Kings LMS',
  webDir: 'public',
  server: {
    url: 'https://kings-lms.vercel.app',
    cleartext: true,
    allowNavigation: ['*']
  }
};

export default config;
