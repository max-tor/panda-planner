"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GoogleMap, Marker, InfoWindow } from "@react-google-maps/api";
import { useGoogleMaps } from "@/components/shared/GoogleMapsProvider";

interface GasStation {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  prices: {
    regular?: number;
    premium?: number;
    diesel?: number;
  };
  brand: string;
  lastUpdated: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "600px",
};

const defaultCenter = {
  lat: 37.7749, // San Francisco default
  lng: -122.4194,
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
};

export default function GasStationMap() {
  const [gasStations, setGasStations] = useState<GasStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<GasStation | null>(null);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  // Cleanup function for component unmount
  useEffect(() => {
    return () => {
      // Clean up any Google Maps related resources
      if (mapRef.current) {
        mapRef.current = null;
      }
    };
  }, []);

  // Helper function to check if location is in Canada
  const isCanadianLocation = (lat: number, lng: number): boolean => {
    // Rough bounds for Canada
    return lat >= 41.7 && lat <= 83.1 && lng >= -141.0 && lng <= -52.6;
  };

  // Helper function to check if location is in Europe
  const isEuropeanLocation = (lat: number, lng: number): boolean => {
    // Rough bounds for Europe
    return lat >= 35.0 && lat <= 71.0 && lng >= -10.0 && lng <= 40.0;
  };

  // Helper function to format prices based on location
  const formatPrice = (price: number, lat: number, lng: number): string => {
    if (isCanadianLocation(lat, lng)) {
      // Convert USD/gallon to CAD/liter (approximate conversion)
      // 1 gallon = 3.78541 liters, USD to CAD ~1.35 (rough estimate)
      const cadPerLiter = (price * 1.35) / 3.78541;
      return `$${cadPerLiter.toFixed(2)} CAD/L`;
    } else if (isEuropeanLocation(lat, lng)) {
      // Convert USD/gallon to EUR/liter (approximate conversion)
      // 1 gallon = 3.78541 liters, USD to EUR ~0.92 (rough estimate)
      const eurPerLiter = (price * 0.92) / 3.78541;
      return `€${eurPerLiter.toFixed(2)} EUR/L`;
    }
    return `$${price.toFixed(2)} USD/gal`;
  };

  // Get user's current location
  useEffect(() => {
    const getLocation = async () => {
      console.log('🔍 Starting geolocation detection...');
      
      if (navigator.geolocation) {
        try {
          // Fix the permissions query syntax
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          console.log('📍 Geolocation permission state:', permission.state);
          
          if (permission.state === 'denied') {
            console.log('❌ Geolocation permission denied');
            setError("Geolocation permission denied. Please enable location permissions in your browser settings and refresh the page.");
            setUserLocation(defaultCenter);
            return;
          }

          console.log('🎯 Requesting current position...');
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                console.log('✅ Geolocation success:', pos.coords);
                resolve(pos);
              },
              (err) => {
                console.error('❌ Geolocation error:', err);
                reject(err);
              },
              {
                enableHighAccuracy: true,
                timeout: 15000, // Increased timeout
                maximumAge: 60000, // 1 minute cache
              }
            );
          });
          
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          console.log('🎉 Location successfully detected:', newLocation);
          setUserLocation(newLocation);
          setError(null); // Clear any previous error since location was successful
          
          // Pan the map to the new location if map is loaded
          if (mapRef.current) {
            mapRef.current.panTo(newLocation);
            console.log('🗺️ Map centered on detected location:', newLocation);
          }
          
        } catch (error: any) {
          console.error('💥 Geolocation failed:', error);
          
          let errorMessage = "Unable to get your location. ";
          
          if (error.code === 1) { // PERMISSION_DENIED
            errorMessage = "Location access denied. Please enable location permissions in your browser settings and refresh the page.";
            console.log('❌ Permission denied');
          } else if (error.code === 2) { // POSITION_UNAVAILABLE
            errorMessage = "Your location is unavailable. Please check your GPS/WiFi connection and try again.";
            console.log('❌ Position unavailable');
          } else if (error.code === 3) { // TIMEOUT
            errorMessage = "Location request timed out. Please try refreshing the page.";
            console.log('❌ Timeout');
          } else {
            errorMessage = "Location detection failed. Using default location.";
            console.log('❌ Unknown error:', error);
          }
          
          setError(errorMessage);
          setUserLocation(defaultCenter);
        }
      } else {
        console.log('❌ Geolocation not supported');
        setError("Geolocation is not supported by this browser.");
        setUserLocation(defaultCenter);
      }
    };

    getLocation();
  }, []);

  // Fetch gas stations data
  useEffect(() => {
    const fetchGasStations = async () => {
      try {
        setLoading(true);
        setError(null); // Clear any previous errors
        const response = await fetch(`/api/gas-stations?lat=${userLocation?.lat}&lng=${userLocation?.lng}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch gas stations");
        }
        
        const data = await response.json();
        setGasStations(data);
        setError(null); // If we get here, everything worked - clear any errors
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load gas stations");
        // Set mock data for demonstration
        setGasStations(mockGasStations);
      } finally {
        setLoading(false);
      }
    };

    if (userLocation) {
      fetchGasStations();
    }
  }, [userLocation]);

  // Hide Google Maps default close button after InfoWindow renders
  useEffect(() => {
    if (selectedStation) {
      const hideCloseButton = () => {
        const closeButtons = document.querySelectorAll('.gm-style-iw-chr');
        closeButtons.forEach(button => {
          (button as HTMLElement).style.display = 'none';
        });
      };
      
      // Run immediately and also after a short delay to catch dynamically created elements
      hideCloseButton();
      const timeout = setTimeout(hideCloseButton, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [selectedStation]);

  const onMapClick = useCallback(() => {
    setSelectedStation(null);
  }, []);

  const onMarkerClick = useCallback((station: GasStation) => {
    setSelectedStation(station);
    
    // Pan the map to center the selected station with some offset for the info window
    if (mapRef.current) {
      const stationPosition = { lat: station.lat, lng: station.lng };
      mapRef.current.panTo(stationPosition);
      
      // Add a small delay to ensure the pan completes before showing info window
      setTimeout(() => {
        // Adjust the center slightly to account for info window height
        const offsetPosition = {
          lat: station.lat + 0.002, // Offset slightly north to show info window better
          lng: station.lng
        };
        mapRef.current?.panTo(offsetPosition);
      }, 300);
    }
  }, []);

  // Mock data for demonstration
  const mockGasStations: GasStation[] = [
    {
      id: "1",
      name: "Shell Station",
      address: "123 Main St, San Francisco, CA",
      lat: 37.7849,
      lng: -122.4094,
      prices: { regular: 4.89, premium: 5.29, diesel: 5.19 },
      brand: "Shell",
      lastUpdated: "2 hours ago",
    },
    {
      id: "2",
      name: "Chevron",
      address: "456 Market St, San Francisco, CA",
      lat: 37.7649,
      lng: -122.4294,
      prices: { regular: 4.95, premium: 5.35, diesel: 5.25 },
      brand: "Chevron",
      lastUpdated: "1 hour ago",
    },
    {
      id: "3",
      name: "76 Gas Station",
      address: "789 Mission St, San Francisco, CA",
      lat: 37.7549,
      lng: -122.4394,
      prices: { regular: 4.79, premium: 5.19, diesel: 5.09 },
      brand: "76",
      lastUpdated: "3 hours ago",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Only show error UI if there's actually an error AND no gas stations data
  if (error && gasStations.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-gray-600">Showing demo data instead</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Hide default Google Maps InfoWindow close button */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .gm-style-iw-chr {
            display: none !important;
          }
          .gm-style-iw-t::after {
            display: none !important;
          }
          .gm-style-iw .gm-style-iw-chr {
            display: none !important;
          }
          div[role="dialog"] .gm-style-iw-chr {
            display: none !important;
          }
          .gm-style-iw-d .gm-style-iw-chr {
            display: none !important;
          }
        `
      }} />
      <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={userLocation || defaultCenter}
          zoom={13}
          options={mapOptions}
          onClick={onMapClick}
          onLoad={(map) => {
            mapRef.current = map;
            console.log('🗺️ Map loaded');
          }}
        >
          {/* User location marker */}
          <Marker
            position={userLocation || defaultCenter}
            icon={{
              url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="14" fill="#FFFFFF" stroke="#3B82F6" stroke-width="2"/>
                  <text x="16" y="20" text-anchor="middle" fill="#3B82F6" font-size="16">🚗</text>
                </svg>
              `),
              scaledSize: typeof window !== 'undefined' && window.google ? new window.google.maps.Size(32, 32) : undefined,
            }}
            title="Your Location"
          />

          {/* Gas station markers */}
          {gasStations.map((station) => (
            <Marker
              key={station.id}
              position={{ lat: station.lat, lng: station.lng }}
              onClick={() => onMarkerClick(station)}
              icon={{
                url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="14" fill="#EF4444" stroke="#FFFFFF" stroke-width="2"/>
                    <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">⛽</text>
                  </svg>
                `),
                scaledSize: typeof window !== 'undefined' && window.google ? new window.google.maps.Size(32, 32) : undefined,
              }}
            />
          ))}

          {/* Info window for selected station */}
          {selectedStation && (
            <InfoWindow
              position={{ lat: selectedStation.lat, lng: selectedStation.lng }}
              onCloseClick={() => setSelectedStation(null)}
              options={{
                pixelOffset: new window.google.maps.Size(0, -40),
                disableAutoPan: true, // We handle panning manually for better control
                maxWidth: 350,
              }}
            >
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-3 w-80 relative">
                {/* Custom close button */}
                <button
                  onClick={() => setSelectedStation(null)}
                  className="absolute top-2 right-2 w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                  aria-label="Close"
                >
                  ✕
                </button>
                
                <h3 className="font-bold text-base mb-1 text-gray-900 pr-8">{selectedStation.name}</h3>
                <a 
                  href={`https://maps.google.com/maps?q=${encodeURIComponent(selectedStation.address)}&ll=${selectedStation.lat},${selectedStation.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 underline mb-2 block transition-colors"
                  title="Open in Maps for navigation"
                >
                  📍 {selectedStation.address}
                </a>
                
                <div className="space-y-1">
                  <h4 className="font-semibold text-xs text-gray-800">Current Prices:</h4>
                  {selectedStation.prices.regular && (
                    <div className="flex justify-between text-xs bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-700">Regular:</span>
                      <span className="font-semibold text-green-600">
                        {formatPrice(selectedStation.prices.regular, selectedStation.lat, selectedStation.lng)}
                      </span>
                    </div>
                  )}
                  {selectedStation.prices.premium && (
                    <div className="flex justify-between text-xs bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-700">Premium:</span>
                      <span className="font-semibold text-blue-600">
                        {formatPrice(selectedStation.prices.premium, selectedStation.lat, selectedStation.lng)}
                      </span>
                    </div>
                  )}
                  {selectedStation.prices.diesel && (
                    <div className="flex justify-between text-xs bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-700">Diesel:</span>
                      <span className="font-semibold text-orange-600">
                        {formatPrice(selectedStation.prices.diesel, selectedStation.lat, selectedStation.lng)}
                      </span>
                    </div>
                  )}
                </div>
                
                <p className="text-xs text-gray-500 mt-2 border-t pt-1">
                  Updated {selectedStation.lastUpdated}
                </p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg">
        <h4 className="font-semibold text-sm mb-2">Legend</h4>
        <div className="flex items-center space-x-2 text-sm">
          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
          <span>Your Location</span>
        </div>
        <div className="flex items-center space-x-2 text-sm mt-1">
          <div className="w-4 h-4 bg-red-500 rounded-full"></div>
          <span>Gas Stations</span>
        </div>
      </div>

      {/* Status indicator - only show if there's a real error and no data */}
      {error && gasStations.length === 0 && (
        <div className="absolute bottom-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded text-sm">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
