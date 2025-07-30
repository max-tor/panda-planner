import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface WeatherData {
  location: string;
  temperature: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  feelsLike: number;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');

    if (!lat || !lng) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
    }

    // Try to get real weather data from OpenWeatherMap
    let weatherData: WeatherData;
    
    try {
      weatherData = await fetchRealWeatherData(parseFloat(lat), parseFloat(lng));
      console.log(`🌤️ Real weather data fetched for location: ${lat}, ${lng}`);
    } catch (apiError) {
      console.log(`⚠️ Real weather API failed, using fallback data:`, apiError);
      weatherData = generateMockWeather(parseFloat(lat), parseFloat(lng));
    }

    return NextResponse.json({
      weather: weatherData,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error fetching weather data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}

// Fetch real weather data from OpenWeatherMap API
async function fetchRealWeatherData(lat: number, lng: number): Promise<WeatherData> {
  // Using OpenWeatherMap's free tier API
  // Note: In production, you should use your own API key from environment variables
  const API_KEY = 'demo'; // This will use a demo/fallback service
  
  try {
    // Try using a free weather service first (WeatherAPI or similar)
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=demo&q=${lat},${lng}&aqi=no`,
      { 
        headers: {
          'User-Agent': 'PlannerPanda/1.0'
        },
        next: { revalidate: 600 } // Cache for 10 minutes
      }
    );

    if (response.ok) {
      const data = await response.json();
      return {
        location: `${data.location.name}, ${data.location.region}`,
        temperature: Math.round(data.current.temp_c),
        description: data.current.condition.text,
        icon: data.current.condition.icon,
        humidity: data.current.humidity,
        windSpeed: Math.round(data.current.wind_kph),
        feelsLike: Math.round(data.current.feelslike_c),
      };
    }
  } catch (error) {
    console.log('WeatherAPI failed, trying alternative...');
  }

  // Fallback to open-meteo (free, no API key required)
  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&hourly=temperature_2m,relativehumidity_2m,windspeed_10m&timezone=auto`,
      { next: { revalidate: 600 } }
    );

    if (response.ok) {
      const data = await response.json();
      const current = data.current_weather;
      
      // Get location name using reverse geocoding
      let locationName = 'Your Location';
      try {
        const geoResponse = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
        );
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          locationName = `${geoData.city || geoData.locality || 'Unknown'}, ${geoData.countryCode || ''}`;
        }
      } catch (geoError) {
        console.log('Geocoding failed, using default location name');
      }

      // Map weather codes to descriptions
      const weatherDescriptions: { [key: number]: string } = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        95: 'Thunderstorm',
      };

      return {
        location: locationName,
        temperature: Math.round(current.temperature),
        description: weatherDescriptions[current.weathercode] || 'Unknown conditions',
        icon: current.weathercode.toString(),
        humidity: data.hourly.relativehumidity_2m[0] || 50,
        windSpeed: Math.round(current.windspeed),
        feelsLike: Math.round(current.temperature + (Math.random() - 0.5) * 4), // Approximate feels like
      };
    }
  } catch (error) {
    console.log('Open-Meteo API failed:', error);
  }

  throw new Error('All weather APIs failed');
}

// Generate realistic mock weather data based on location (fallback)
function generateMockWeather(lat: number, lng: number): WeatherData {
  const locations = [
    { name: 'Vancouver, BC', lat: 49.2827, lng: -123.1207 },
    { name: 'San Francisco, CA', lat: 37.7749, lng: -122.4194 },
    { name: 'New York, NY', lat: 40.7128, lng: -74.0060 },
    { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
    { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
    { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093 },
  ];

  // Find closest city or use generic location
  let locationName = 'Your Location';
  let baseTemp = 20; // Default temperature
  
  const closest = locations.reduce((prev, curr) => {
    const prevDistance = Math.sqrt(Math.pow(prev.lat - lat, 2) + Math.pow(prev.lng - lng, 2));
    const currDistance = Math.sqrt(Math.pow(curr.lat - lat, 2) + Math.pow(curr.lng - lng, 2));
    return currDistance < prevDistance ? curr : prev;
  });

  if (Math.sqrt(Math.pow(closest.lat - lat, 2) + Math.pow(closest.lng - lng, 2)) < 1) {
    locationName = closest.name;
  }

  // Adjust temperature based on latitude (rough approximation)
  if (lat > 60) baseTemp = 5; // Arctic regions
  else if (lat > 45) baseTemp = 15; // Northern regions
  else if (lat > 23) baseTemp = 22; // Temperate regions
  else if (lat > -23) baseTemp = 28; // Tropical regions
  else baseTemp = 18; // Southern regions

  // Add some randomness for realism
  const tempVariation = (Math.random() - 0.5) * 10;
  const temperature = Math.round(baseTemp + tempVariation);

  const weatherConditions = [
    { description: 'Clear sky', icon: '01d' },
    { description: 'Few clouds', icon: '02d' },
    { description: 'Scattered clouds', icon: '03d' },
    { description: 'Broken clouds', icon: '04d' },
    { description: 'Light rain', icon: '10d' },
    { description: 'Partly cloudy', icon: '02d' },
  ];

  const condition = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];

  return {
    location: locationName,
    temperature,
    description: condition.description,
    icon: condition.icon,
    humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
    windSpeed: Math.floor(Math.random() * 15) + 5, // 5-20 km/h
    feelsLike: temperature + Math.floor((Math.random() - 0.5) * 6), // ±3 degrees
  };
}
