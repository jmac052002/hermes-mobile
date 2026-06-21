// mobile/app.config.ts
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Hermes',
  slug: 'hermes-mobile',
  version: '1.0.0',
  orientation: 'portrait',
  scheme: 'hermes',
  userInterfaceStyle: 'dark',
  platforms: ['android'],
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundColor: '#0a0a0a',
    },
    package: 'com.jmac052002.hermes',
    usesCleartextTraffic: true,
    networkSecurityConfig: './assets/network_security_config.xml',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    hermesBaseUrl: process.env.HERMES_BASE_URL ?? 'https://dashboard.josephsdctlabtraining.com',
    router: {
      origin: false,
    },
    eas: {
      projectId: 'ac4483aa-b893-4cf0-9846-56aa246a347f',
    },
  },
});
