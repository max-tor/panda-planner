"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { GoogleMap, Marker, InfoWindow, Circle } from "@react-google-maps/api";
import { useGoogleMaps } from "@/components/shared/GoogleMapsProvider";

interface AirQualityData {
  id: string;
  location: string;
  lat: number;
  lng: number;
  aqi: number;
  pollutants: {
    pm25: number;
    pm10: number;
    o3: number;
    no2: number;
    so2: number;
    co: number;
  };
  lastUpdated: string;
  category: string;
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
  styles: [
    {
      "stylers": [
        { "saturation": -100 },
        { "lightness": 10 }
      ]
    }
  ],
};

// Helper function to get AQI color based on value (EPA standard colors)
const getAQIColor = (aqi: number): string => {
  if (aqi <= 50) return "#00C851"; // Good - Bright Green
  if (aqi <= 100) return "#FFD700"; // Moderate - Gold (more visible than bright yellow)
  if (aqi <= 150) return "#FF8C00"; // Unhealthy for Sensitive - Dark Orange
  if (aqi <= 200) return "#DC143C"; // Unhealthy - Crimson Red
  if (aqi <= 300) return "#9932CC"; // Very Unhealthy - Dark Orchid
  return "#8B0000"; // Hazardous - Dark Red
};

// Helper function to get AQI category
const getAQICategory = (aqi: number): string => {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
};

export default function AirQualityMap() {
  const [airQualityData, setAirQualityData] = useState<AirQualityData[]>([]);
  const [selectedStation, setSelectedStation] = useState<AirQualityData | null>(null);
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

  // Get user's current location
  useEffect(() => {
    const getLocation = async () => {
      console.log('🔍 Starting geolocation detection for air quality...');
      
      if (navigator.geolocation) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          console.log('📍 Geolocation permission state:', permission.state);
          
          if (permission.state === 'denied') {
            console.log('❌ Geolocation permission denied');
            setError("Geolocation permission denied. Please enable location permissions in your browser settings and refresh the page.");
            setUserLocation(defaultCenter);
            return;
          }

          console.log('🎯 Requesting current position...');
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
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
                timeout: 15000,
                maximumAge: 60000,
              }
            );
          });
          
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          
          console.log('🎉 Location successfully detected:', newLocation);
          setUserLocation(newLocation);
          setError(null);
          
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
      
      setLoading(false);
    };

    getLocation();
  }, []);

  // Fetch air quality data based on user location
  useEffect(() => {
    const fetchAirQualityData = async () => {
      if (!userLocation) return;

      try {
        console.log('🌬️ Fetching air quality data for:', userLocation);
        const response = await fetch(`/api/air-quality?lat=${userLocation.lat}&lng=${userLocation.lng}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch air quality data');
        }
        
        const data = await response.json();
        setAirQualityData(data);
        console.log('✅ Air quality data loaded:', data.length, 'stations');
      } catch (err) {
        console.error('❌ Error fetching air quality data:', err);
        setError(err instanceof Error ? err.message : "Failed to load air quality data");
        // Set mock data for demonstration
        setAirQualityData(generateMockAirQualityData(userLocation));
      } finally {
        setLoading(false);
      }
    };

    if (userLocation) {
      fetchAirQualityData();
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
      
      hideCloseButton();
      const timeout = setTimeout(hideCloseButton, 100);
      
      return () => clearTimeout(timeout);
    }
  }, [selectedStation]);

  const onMapClick = useCallback(() => {
    setSelectedStation(null);
  }, []);

  const onMarkerClick = useCallback((station: AirQualityData) => {
    setSelectedStation(station);
    
    // Pan the map to center the selected station
    if (mapRef.current) {
      const stationPosition = { lat: station.lat, lng: station.lng };
      mapRef.current.panTo(stationPosition);
      
      setTimeout(() => {
        const offsetPosition = {
          lat: station.lat + 0.002,
          lng: station.lng
        };
        mapRef.current?.panTo(offsetPosition);
      }, 300);
    }
  }, []);

  // Generate mock air quality data for demonstration
  const generateMockAirQualityData = (center: google.maps.LatLngLiteral): AirQualityData[] => {
    const stations: AirQualityData[] = [];
    const numStations = 15;
    
    for (let i = 0; i < numStations; i++) {
      // Generate random positions within 200km radius (roughly 1.8 degrees)
      const angle = Math.random() * 2 * Math.PI;
      const radius = Math.random() * 1.8;
      const lat = center.lat + radius * Math.cos(angle);
      const lng = center.lng + radius * Math.sin(angle);
      
      // Generate realistic AQI values
      const aqi = Math.floor(Math.random() * 200) + 10;
      
      stations.push({
        id: `station-${i + 1}`,
        location: `Air Quality Station ${i + 1}`,
        lat,
        lng,
        aqi,
        pollutants: {
          pm25: Math.floor(Math.random() * 50) + 5,
          pm10: Math.floor(Math.random() * 80) + 10,
          o3: Math.floor(Math.random() * 100) + 20,
          no2: Math.floor(Math.random() * 60) + 10,
          so2: Math.floor(Math.random() * 30) + 5,
          co: Math.floor(Math.random() * 15) + 2,
        },
        lastUpdated: `${Math.floor(Math.random() * 3) + 1} hours ago`,
        category: getAQICategory(aqi),
      });
    }
    
    return stations;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && airQualityData.length === 0) {
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
          zoom={10}
          options={mapOptions}
          onClick={onMapClick}
          onLoad={(map) => {
            mapRef.current = map;
            console.log('🗺️ Air Quality Map loaded');
          }}
        >
          {/* User location marker */}
          <Marker
            position={userLocation || defaultCenter}
            icon={{
              url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="14" fill="#FFFFFF" stroke="#3B82F6" stroke-width="2"/>
                  <text x="16" y="20" text-anchor="middle" fill="#3B82F6" font-size="16">📍</text>
                </svg>
              `),
              scaledSize: typeof window !== 'undefined' && window.google ? new window.google.maps.Size(32, 32) : undefined,
            }}
            title="Your Location"
          />

          {/* 200km radius circle */}
          {userLocation && (
            <Circle
              center={userLocation}
              radius={200000} // 200km in meters
              options={{
                fillColor: '#3B82F6',
                fillOpacity: 0.1,
                strokeColor: '#3B82F6',
                strokeOpacity: 0.3,
                strokeWeight: 2,
              }}
            />
          )}

          {/* Air quality station markers */}
          {airQualityData.map((station) => (
            <Marker
              key={station.id}
              position={{ lat: station.lat, lng: station.lng }}
              onClick={() => onMarkerClick(station)}
              icon={{
                url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="14" fill="${getAQIColor(station.aqi)}" stroke="#FFFFFF" stroke-width="2"/>
                    <text x="16" y="20" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${station.aqi}</text>
                  </svg>
                `),
                scaledSize: typeof window !== 'undefined' && window.google ? new window.google.maps.Size(32, 32) : undefined,
              }}
              title={`${station.location} - AQI: ${station.aqi}`}
            />
          ))}

          {/* Info window for selected station */}
          {selectedStation && (
            <InfoWindow
              position={{ lat: selectedStation.lat, lng: selectedStation.lng }}
              onCloseClick={() => setSelectedStation(null)}
              options={{
                pixelOffset: new window.google.maps.Size(0, -40),
                disableAutoPan: true,
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
                
                <h3 className="font-bold text-base mb-1 text-gray-900 pr-8">{selectedStation.location}</h3>
                <div className="flex items-center mb-2">
                  <div 
                    className="w-4 h-4 rounded-full mr-2" 
                    style={{ backgroundColor: getAQIColor(selectedStation.aqi) }}
                  ></div>
                  <span className="text-sm font-semibold">AQI: {selectedStation.aqi} - {selectedStation.category}</span>
                </div>
                
                <div className="space-y-1">
                  <h4 className="font-semibold text-xs text-gray-800">Pollutant Levels (μg/m³):</h4>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    <div className="flex justify-between bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-700">PM2.5:</span>
                      <span className="font-semibold">{selectedStation.pollutants.pm25}</span>
                    </div>
                    <div className="flex justify-between bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-700">PM10:</span>
                      <span className="font-semibold">{selectedStation.pollutants.pm10}</span>
                    </div>
                    <div className="flex justify-between bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-700">O3:</span>
                      <span className="font-semibold">{selectedStation.pollutants.o3}</span>
                    </div>
                    <div className="flex justify-between bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-700">NO2:</span>
                      <span className="font-semibold">{selectedStation.pollutants.no2}</span>
                    </div>
                    <div className="flex justify-between bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-700">SO2:</span>
                      <span className="font-semibold">{selectedStation.pollutants.so2}</span>
                    </div>
                    <div className="flex justify-between bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-700">CO:</span>
                      <span className="font-semibold">{selectedStation.pollutants.co}</span>
                    </div>
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mt-2 border-t pt-1">
                  Updated {selectedStation.lastUpdated}
                </p>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>

      {/* Legend */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <h4 className="font-semibold text-sm mb-2">Air Quality Index</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: "#00C851" }}></div>
            <span>Good (0-50)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: "#FFD700" }}></div>
            <span>Moderate (51-100)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: "#FF8C00" }}></div>
            <span>Unhealthy for Sensitive (101-150)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: "#DC143C" }}></div>
            <span>Unhealthy (151-200)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: "#9932CC" }}></div>
            <span>Very Unhealthy (201-300)</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: "#8B0000" }}></div>
            <span>Hazardous (301+)</span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t text-xs text-gray-600">
          <div className="flex items-center">
            <div className="w-3 h-3 border-2 border-blue-500 rounded-full mr-2 bg-blue-100"></div>
            <span>200km Monitoring Radius</span>
          </div>
        </div>
      </div>

      {/* Status indicators */}
      {error && airQualityData.length === 0 && (
        <div className="absolute bottom-4 left-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded text-sm">
          ⚠️ {error}
        </div>
      )}
    </div>
  );
}
