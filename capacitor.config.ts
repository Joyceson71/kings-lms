import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kingslms.app',
  appName: 'Kings LMS',
  webDir: 'public',
  server: {
    url: 'https://kings-lms.vercel.app',
    cleartext: false,
    androidScheme: 'https',
    // Only allow navigation within the Supabase auth domain.
    // Everything else stays inside the WebView.
    allowNavigation: ['vkusqelpzpaocnwaawkw.supabase.co'],
  },
};

export default config;
