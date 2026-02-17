import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sharespace.app',
  appName: 'Sharespace',
  webDir: 'public',
  server: {
    // ⚠️ REPLACE THIS WITH YOUR PRODUCTION URL (e.g., https://your-app.vercel.app) ⚠️
    // Local development: "http://192.168.1.x:3000" (ensure your phone is on the same wifi)
    url: 'https://sharedspacesoi.com/',
    cleartext: true,
    androidScheme: 'https'
  }
};

export default config;
