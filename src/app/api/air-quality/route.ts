import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

// Helper function to get AQI category
const getAQICategory = (aqi: number): string => {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
};

// Generate realistic location names based on coordinates
const generateLocationName = (lat: number, lng: number, index: number): string => {
  const locationTypes = [
    "Environmental Station",
    "Air Quality Monitor",
    "Pollution Sensor",
    "Atmospheric Station",
    "Environmental Sensor",
    "Air Monitor",
    "Climate Station",
    "Pollution Monitor"
  ];
  
  const areas = [
    "Downtown", "Residential Area", "Industrial Zone", "Park Area", 
    "Suburban District", "Commercial Zone", "Waterfront", "City Center",
    "Business District", "Residential Complex", "Green Belt", "Urban Center"
  ];
  
  const locationType = locationTypes[index % locationTypes.length];
  const area = areas[Math.floor(Math.random() * areas.length)];
  
  return `${locationType} - ${area}`;
};

// Generate mock air quality data around a location
const generateAirQualityData = (centerLat: number, centerLng: number): AirQualityData[] => {
  const stations: AirQualityData[] = [];
  const numStations = 20; // More stations for better coverage
  
  for (let i = 0; i < numStations; i++) {
    // Generate random positions within 200km radius (roughly 1.8 degrees)
    const angle = Math.random() * 2 * Math.PI;
    const radius = Math.random() * 1.8; // 200km radius
    const lat = centerLat + radius * Math.cos(angle);
    const lng = centerLng + radius * Math.sin(angle);
    
    // Generate realistic AQI values with some clustering
    let baseAQI = 50; // Default moderate level
    
    // Create some pollution hotspots and clean areas
    if (Math.random() < 0.2) {
      baseAQI = Math.floor(Math.random() * 100) + 100; // Higher pollution areas
    } else if (Math.random() < 0.3) {
      baseAQI = Math.floor(Math.random() * 30) + 10; // Clean areas
    } else {
      baseAQI = Math.floor(Math.random() * 80) + 30; // Normal variation
    }
    
    const aqi = Math.min(300, Math.max(10, baseAQI + Math.floor(Math.random() * 40) - 20));
    
    // Generate correlated pollutant values based on AQI
    const pm25Base = (aqi / 200) * 35; // PM2.5 typically drives AQI
    const pm25 = Math.max(1, Math.floor(pm25Base + Math.random() * 10 - 5));
    
    stations.push({
      id: `aq-station-${i + 1}`,
      location: generateLocationName(lat, lng, i),
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      aqi,
      pollutants: {
        pm25,
        pm10: Math.floor(pm25 * 1.5 + Math.random() * 15),
        o3: Math.floor(Math.random() * 120) + 20,
        no2: Math.floor(Math.random() * 80) + 10,
        so2: Math.floor(Math.random() * 50) + 5,
        co: Math.floor(Math.random() * 20) + 2,
      },
      lastUpdated: `${Math.floor(Math.random() * 6) + 1} hours ago`,
      category: getAQICategory(aqi),
    });
  }
  
  // Sort by AQI to show worst air quality first in any lists
  return stations.sort((a, b) => b.aqi - a.aqi);
};

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "37.7749");
    const lng = parseFloat(searchParams.get("lng") || "-122.4194");

    console.log(`🌬️ Generating air quality data for location: ${lat}, ${lng}`);

    // In a real application, you would call an actual air quality API here
    // For now, we'll generate realistic mock data
    const airQualityData = generateAirQualityData(lat, lng);

    console.log(`✅ Generated ${airQualityData.length} air quality stations`);

    return NextResponse.json(airQualityData);
  } catch (error) {
    console.error("❌ Error in air quality API:", error);
    return NextResponse.json(
      { error: "Failed to fetch air quality data" },
      { status: 500 }
    );
  }
}
