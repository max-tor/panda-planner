'use client';

import React, { useState, useEffect } from 'react';

interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
}

interface WeatherWidgetProps {
  className?: string;
}

export default function WeatherWidget({ className = '' }: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locationStatus, setLocationStatus] = useState<'detecting' | 'success' | 'failed'>('detecting');

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setLocationStatus('detecting');

        // Get user location
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 300000, // 5 minutes
          });
        });

        const { latitude, longitude } = position.coords;
        setLocationStatus('success');

        // Fetch weather data
        const response = await fetch(`/api/weather?lat=${latitude}&lng=${longitude}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }

        const data = await response.json();
        setWeather(data.weather);
        setError(null);

      } catch (error: any) {
        console.error('Weather fetch error:', error);
        setLocationStatus('failed');
        
        if (error.code === 1) {
          setError('Location access denied');
        } else if (error.code === 2) {
          setError('Location unavailable');
        } else if (error.code === 3) {
          setError('Location timeout');
        } else {
          setError('Unable to get weather');
        }

        // Fallback to default location weather
        try {
          const response = await fetch('/api/weather?lat=37.7749&lng=-122.4194'); // San Francisco
          if (response.ok) {
            const data = await response.json();
            setWeather(data.weather);
          }
        } catch (fallbackError) {
          console.error('Fallback weather fetch failed:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  const getWeatherEmoji = (icon: string, description: string) => {
    if (description.toLowerCase().includes('clear')) return '☀️';
    if (description.toLowerCase().includes('cloud')) return '☁️';
    if (description.toLowerCase().includes('rain')) return '🌧️';
    if (description.toLowerCase().includes('snow')) return '❄️';
    if (description.toLowerCase().includes('storm')) return '⛈️';
    if (description.toLowerCase().includes('fog') || description.toLowerCase().includes('mist')) return '🌫️';
    return '🌤️'; // Default
  };

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="animate-spin text-2xl">🌤️</div>
          <div>
            <div className="font-medium text-gray-700">Getting weather...</div>
            <div className="text-sm text-gray-500">
              {locationStatus === 'detecting' ? 'Detecting location...' : 'Loading weather data...'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !weather) {
    return (
      <div className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="text-2xl">🌡️</div>
          <div>
            <div className="font-medium text-gray-700">Weather unavailable</div>
            <div className="text-sm text-gray-500">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{getWeatherEmoji(weather.icon, weather.description)}</div>
          <div>
            <div className="font-semibold text-gray-800 text-lg">
              {weather.temperature}°C
            </div>
            <div className="text-sm text-gray-600 capitalize">
              {weather.description}
            </div>
            <div className="text-xs text-gray-500">
              📍 {weather.location}
            </div>
          </div>
        </div>
        
        <div className="text-right text-sm text-gray-600">
          <div>Feels like {weather.feelsLike}°C</div>
          <div>💧 {weather.humidity}%</div>
          <div>💨 {weather.windSpeed} km/h</div>
        </div>
      </div>
      
      {error && (
        <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
          ⚠️ Using default location due to: {error}
        </div>
      )}
    </div>
  );
}
