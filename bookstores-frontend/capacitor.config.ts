import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.app',
  appName: 'KyivBookstores',
  webDir: 'build',

  // ←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←←
  server: {
    androidScheme: 'http',     // ← КРИТИЧНО ВАЖЛИВО
    cleartext: true,           // ← дозволяє незахищений HTTP
  },

  android: {
    allowMixedContent: true,   // ← дозволяє змішаний контент
    adjustResize: true,
  },

  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;