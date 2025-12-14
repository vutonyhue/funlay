import { useEffect, useState } from 'react';
import { isNative, platform, initCapacitor } from '@/lib/capacitorInit';

export const useNativeFeatures = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [pushPermission, setPushPermission] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      await initCapacitor();
      setIsInitialized(true);
    };

    if (isNative) {
      init();
    } else {
      setIsInitialized(true);
    }
  }, []);

  // Listen for wallet deep links
  useEffect(() => {
    const handleWalletDeepLink = (event: CustomEvent) => {
      console.log('Wallet deep link event:', event.detail);
      // Handle wallet connection from deep link
    };

    window.addEventListener('wallet-deeplink', handleWalletDeepLink as EventListener);
    
    return () => {
      window.removeEventListener('wallet-deeplink', handleWalletDeepLink as EventListener);
    };
  }, []);

  return {
    isNative,
    platform,
    isInitialized,
    pushPermission,
  };
};
