import React, { createContext, useContext, useEffect, useState } from 'react';

declare global {
  interface Window {
    isNexusNative?: boolean;
  }
}

interface NexusNativeContextType {
  isNative: boolean;
}

const NexusNativeContext = createContext<NexusNativeContextType>({ isNative: false });

export const NexusNativeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    // Check for injected variable or user agent string silently
    const isNexus = window.isNexusNative === true || navigator.userAgent.includes("NexusApp");
    
    setIsNative(isNexus);

    if (isNexus) {
      document.body.classList.add('is-native-app');
    } else {
      document.body.classList.remove('is-native-app');
    }
  }, []);

  return (
    <NexusNativeContext.Provider value={{ isNative }}>
      {children}
    </NexusNativeContext.Provider>
  );
};

export function useNexusNative() {
  return useContext(NexusNativeContext);
}
