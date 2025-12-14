import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { PushNotifications } from '@capacitor/push-notifications';

// Check if running on native platform
export const isNative = Capacitor.isNativePlatform();
export const platform = Capacitor.getPlatform();

// Initialize native features
export const initCapacitor = async () => {
  if (!isNative) return;

  try {
    // Hide splash screen after app loads
    await SplashScreen.hide();

    // Set status bar style
    if (platform === 'android') {
      await StatusBar.setBackgroundColor({ color: '#00E7FF' });
    }
    await StatusBar.setStyle({ style: Style.Dark });

    // Handle deep links for wallet connections
    App.addListener('appUrlOpen', ({ url }) => {
      console.log('Deep link received:', url);
      handleDeepLink(url);
    });

    // Handle back button on Android
    App.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        App.exitApp();
      }
    });

    // Initialize push notifications
    await initPushNotifications();

  } catch (error) {
    console.error('Capacitor initialization error:', error);
  }
};

// Handle deep links from MetaMask/Bitget Wallet
const handleDeepLink = (url: string) => {
  // Parse the URL and handle wallet callbacks
  if (url.includes('wc:') || url.includes('metamask') || url.includes('bitget')) {
    // Trigger wallet connection event
    window.dispatchEvent(new CustomEvent('wallet-deeplink', { detail: { url } }));
  }
};

// Initialize push notifications
const initPushNotifications = async () => {
  try {
    // Request permission
    const permStatus = await PushNotifications.requestPermissions();
    
    if (permStatus.receive === 'granted') {
      // Register for push notifications
      await PushNotifications.register();
    }

    // Handle push notification received
    PushNotifications.addListener('pushNotificationReceived', notification => {
      console.log('Push notification received:', notification);
      
      // Show Rich Rich Rich notification with Angel
      window.dispatchEvent(new CustomEvent('push-notification', { 
        detail: notification 
      }));
    });

    // Handle notification tap
    PushNotifications.addListener('pushNotificationActionPerformed', notification => {
      console.log('Push notification action:', notification);
      
      // Navigate to relevant page based on notification data
      const data = notification.notification.data;
      if (data?.type === 'tip') {
        window.location.href = '/wallet';
      } else if (data?.type === 'subscribe') {
        window.location.href = '/studio';
      } else if (data?.type === 'comment') {
        window.location.href = data?.videoId ? `/watch/${data.videoId}` : '/';
      }
    });

    // Get FCM token for push notifications
    PushNotifications.addListener('registration', token => {
      console.log('Push registration token:', token.value);
      // Save token to Supabase for sending push notifications
      savePushToken(token.value);
    });

  } catch (error) {
    console.error('Push notification init error:', error);
  }
};

// Save push token to database
const savePushToken = async (token: string) => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Store push token in user's profile or separate table
      console.log('Saving push token for user:', user.id, token);
      // You can add a push_tokens table to store these
    }
  } catch (error) {
    console.error('Error saving push token:', error);
  }
};

// Open wallet app for mobile deep linking
export const openWalletApp = (walletType: 'metamask' | 'bitget', wcUri?: string) => {
  if (!isNative) return false;

  let deepLink = '';
  
  if (walletType === 'metamask') {
    if (wcUri) {
      deepLink = `metamask://wc?uri=${encodeURIComponent(wcUri)}`;
    } else {
      deepLink = 'metamask://';
    }
  } else if (walletType === 'bitget') {
    if (wcUri) {
      deepLink = `bitkeep://wc?uri=${encodeURIComponent(wcUri)}`;
    } else {
      deepLink = 'bitkeep://';
    }
  }

  if (deepLink) {
    window.location.href = deepLink;
    return true;
  }
  
  return false;
};

// Check if specific wallet app is installed
export const isWalletAppInstalled = async (walletType: 'metamask' | 'bitget'): Promise<boolean> => {
  if (!isNative) return false;
  
  // On native, we can try to open and see if it works
  // For now, assume installed if on native platform
  return true;
};
