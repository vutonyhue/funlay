import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.53abc96fe8d144f6a34977f6b110041f',
  appName: 'FUN Play: Web3 AI Social',
  webDir: 'dist',
  server: {
    url: 'https://53abc96f-e8d1-44f6-a349-77f6b110041f.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#00E7FF',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#00E7FF',
    },
  },
  ios: {
    contentInset: 'automatic',
    allowsLinkPreview: true,
    scheme: 'funplay',
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
