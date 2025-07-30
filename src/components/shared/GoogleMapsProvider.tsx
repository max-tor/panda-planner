"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { LoadScript } from '@react-google-maps/api';

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: Error | null;
}

const GoogleMapsContext = createContext<GoogleMapsContextType>({
  isLoaded: false,
  loadError: null,
});

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
};

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

export default function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<Error | null>(null);

  const handleLoad = () => {
    console.log('🗺️ Google Maps API loaded successfully');
    setIsLoaded(true);
    setLoadError(null);
  };

  const handleError = (error: Error) => {
    console.error('❌ Google Maps API error:', error);
    setLoadError(error);
    setIsLoaded(false);
  };

  return (
    <GoogleMapsContext.Provider value={{ isLoaded, loadError }}>
      <LoadScript
        googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
        preventGoogleFontsLoading
        loadingElement={<div>Loading Maps...</div>}
        id="google-maps-script"
        onLoad={handleLoad}
        onError={handleError}
      >
        {children}
      </LoadScript>
    </GoogleMapsContext.Provider>
  );
}
