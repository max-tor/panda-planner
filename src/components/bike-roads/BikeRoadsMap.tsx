'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Import Leaflet components dynamically to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Polygon = dynamic(() => import('react-leaflet').then(mod => mod.Polygon), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false });

interface CyclingArea {
  id: string;
  name: string;
  type: 'park' | 'dedicated_path' | 'car_free_zone';
  area: string;
  centerLat: number;
  centerLng: number;
  description: string;
  coordinates: { lat: number; lng: number }[];
}

const defaultCenter: [number, number] = [37.7749, -122.4194]; // San Francisco

// Fix Leaflet default markers
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

// Custom icons for different area types
const createCustomIcon = (type: CyclingArea['type']) => {
  if (typeof window === 'undefined') return null;
  
  const iconMap = {
    park: '🌳',
    dedicated_path: '🛤️',
    car_free_zone: '🚫🚗'
  };
  
  return L.divIcon({
    html: `<div style="background: white; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border: 2px solid #333; font-size: 14px;">${iconMap[type]}</div>`,
    className: 'custom-cycling-icon',
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

// User location icon
const getUserLocationIcon = () => {
  if (typeof window === 'undefined') return null;
  
  return L.divIcon({
    html: `<div style="background: #4285f4; border-radius: 50%; width: 20px; height: 20px; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);"></div>`,
    className: 'user-location-icon',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

export default function BikeRoadsMap() {
  const [userLocation, setUserLocation] = useState<[number, number]>(defaultCenter);
  const [cyclingAreas, setCyclingAreas] = useState<CyclingArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<CyclingArea | null>(null);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'detecting' | 'success' | 'failed'>('detecting');
  const [mapReady, setMapReady] = useState(false);
  const [hasRealLocation, setHasRealLocation] = useState(false);

  const getLocation = useCallback(async () => {
    try {
      console.log('🔍 Starting geolocation for bike roads...');
      setLocationStatus('detecting');
      
      // Check geolocation permission
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      console.log('📍 Geolocation permission:', permission.state);
      
      if (permission.state === 'denied') {
        setError("Geolocation permission denied. Please enable location permissions in your browser settings and refresh the page.");
        setUserLocation(defaultCenter);
        setLocationStatus('failed');
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 60000,
        });
      });

      const newLocation: [number, number] = [
        position.coords.latitude,
        position.coords.longitude,
      ];
      console.log('✅ User location detected for bike roads:', newLocation);
      setUserLocation(newLocation);
      setLocationStatus('success');
      setHasRealLocation(true);
      setError(null);

    } catch (error: any) {
      console.error('❌ Geolocation error for bike roads:', error);
      let errorMessage = "Unable to get your location. ";
      
      // Handle GeolocationPositionError codes
      if (error && typeof error.code === 'number') {
        switch (error.code) {
          case 1: // PERMISSION_DENIED
            errorMessage += "Please enable location permissions and refresh the page.";
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMessage += "Location information is unavailable.";
            break;
          case 3: // TIMEOUT
            errorMessage += "Location request timed out.";
            break;
          default:
            errorMessage += "An unknown error occurred.";
            break;
        }
      } else {
        errorMessage += "Please check your browser settings and try again.";
      }
      
      setError(errorMessage);
      setUserLocation(defaultCenter);
      setLocationStatus('failed');
      setHasRealLocation(false);
    }
  }, []);

  const retryLocation = useCallback(() => {
    setError(null);
    getLocation();
  }, [getLocation]);

  // Fetch cycling areas when user location changes
  useEffect(() => {
    const fetchCyclingAreas = async () => {
      // Only fetch if we have a real user location or if location detection failed
      if (!hasRealLocation && locationStatus !== 'failed') return;
      
      setLoadingAreas(true);
      try {
        const radius = 80000; // 80km radius
        console.log(`🚴 Fetching cycling areas for location: ${userLocation[0]}, ${userLocation[1]}`);
        const response = await fetch(
          `/api/cycling-areas?lat=${userLocation[0]}&lng=${userLocation[1]}&radius=${radius}`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch cycling areas');
        }
        
        const data = await response.json();
        setCyclingAreas(data.areas || []);
        console.log(`🚴 Loaded ${data.areas?.length || 0} cycling areas`);
      } catch (error) {
        console.error('Error fetching cycling areas:', error);
        setError('Failed to load cycling areas');
      } finally {
        setLoadingAreas(false);
      }
    };

    fetchCyclingAreas();
  }, [userLocation, hasRealLocation, locationStatus]);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  const getAreaColor = (type: CyclingArea['type']) => {
    switch (type) {
      case 'park':
        return '#4CAF50'; // Green
      case 'dedicated_path':
        return '#2196F3'; // Blue
      case 'car_free_zone':
        return '#FF9800'; // Orange
      default:
        return '#9E9E9E'; // Gray
    }
  };

  // Set map ready after component mounts
  useEffect(() => {
    setMapReady(true);
  }, []);

  // Show loading screen while detecting location or fetching areas
  const isLoading = !mapReady || locationStatus === 'detecting' || (hasRealLocation && loadingAreas);
  
  if (isLoading) {
    let loadingMessage = 'Loading map...';
    if (locationStatus === 'detecting') {
      loadingMessage = 'Detecting your location...';
    } else if (loadingAreas) {
      loadingMessage = 'Finding cycling areas near you...';
    }
    
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin text-3xl mb-3">🚴</div>
          <div className="text-gray-700 font-medium">{loadingMessage}</div>
          {locationStatus === 'detecting' && (
            <div className="text-sm text-gray-500 mt-2">Please allow location access for the best experience</div>
          )}
          {loadingAreas && (
            <div className="text-sm text-gray-500 mt-2">Searching OpenStreetMap for cycling infrastructure...</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="h-96 w-full rounded-lg overflow-hidden border">
        <MapContainer
          center={userLocation}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          

          
          {/* User location marker */}
          {getUserLocationIcon() && (
            <Marker position={userLocation} icon={getUserLocationIcon()!}>
              <Popup>
                <div className="text-center">
                  <div className="font-semibold">📍 Your Location</div>
                  <div className="text-sm text-gray-600">Cycling areas within 80km</div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* 80km radius circle */}
          <Circle
            center={userLocation}
            radius={80000}
            pathOptions={{
              color: '#4285f4',
              opacity: 0.3,
              weight: 2,
              fillColor: '#4285f4',
              fillOpacity: 0.1,
            }}
          />

          {/* Cycling area polygons and markers */}
          {cyclingAreas.map((area) => {
            const polygonCoords: [number, number][] = area.coordinates.map(coord => [coord.lat, coord.lng]);
            const centerCoords: [number, number] = [area.centerLat, area.centerLng];
            
            return (
              <React.Fragment key={area.id}>
                <Polygon
                  positions={polygonCoords}
                  pathOptions={{
                    fillColor: getAreaColor(area.type),
                    fillOpacity: 0.3,
                    color: getAreaColor(area.type),
                    opacity: 0.8,
                    weight: 2,
                  }}
                  eventHandlers={{
                    click: () => setSelectedArea(area),
                  }}
                />
                
                {/* Center marker for each area */}
                {createCustomIcon(area.type) && (
                  <Marker
                    position={centerCoords}
                    icon={createCustomIcon(area.type)!}
                    eventHandlers={{
                      click: () => setSelectedArea(area),
                    }}
                  >
                  <Popup>
                    <div className="p-2 max-w-xs">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{area.type === 'park' ? '🌳' : area.type === 'dedicated_path' ? '🛤️' : '🚫🚗'}</span>
                        <h3 className="font-semibold text-sm">{area.name}</h3>
                      </div>
                      <p className="text-xs text-gray-600 mb-2">{area.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="bg-gray-100 px-2 py-1 rounded">{area.area}</span>
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${area.centerLat},${area.centerLng}&travelmode=bicycling`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          🚴 Directions
                        </a>
                      </div>
                    </div>
                    </Popup>
                  </Marker>
                )}
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>

      {/* Status indicators */}
      {error && cyclingAreas.length === 0 && !loadingAreas && (
        <div className="absolute bottom-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded text-sm">
          ⚠️ {error}
        </div>
      )}

      {locationStatus === 'failed' && !loadingAreas && (
        <div className="absolute bottom-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded text-sm">
          ⚠️ Location detection failed. Showing default area. 
          <button 
            onClick={() => window.location.reload()}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Success indicator */}
      {hasRealLocation && cyclingAreas.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-sm">
          ✅ Found {cyclingAreas.length} cycling areas near your location
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <h4 className="font-semibold text-gray-800 text-sm mb-2">🚫🚗 Car-Free Cycling Areas</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: '#4CAF50' }}
            ></div>
            <span>🌳 Parks</span>
          </div>
          <div className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: '#2196F3' }}
            ></div>
            <span>🛤️ Dedicated Paths</span>
          </div>
          <div className="flex items-center">
            <div 
              className="w-3 h-3 rounded-full mr-2" 
              style={{ backgroundColor: '#FF9800' }}
            ></div>
            <span>🚫🚗 Car-Free Zones</span>
          </div>
        </div>
        
        <div className="mt-3 pt-2 border-t border-gray-200">
          <div className="flex items-center text-xs text-gray-600">
            <span>🚴 Your Location</span>
          </div>
          <div className="flex items-center text-xs text-gray-600 mt-1">
            <span>⭕ 80km Coverage</span>
          </div>
        </div>
      </div>
    </div>
  );
}
