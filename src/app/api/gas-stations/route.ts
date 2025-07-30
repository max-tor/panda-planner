import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";

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

// Mock data - In a real app, you'd integrate with APIs like GasBuddy, AAA, or Google Places
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
  {
    id: "4",
    name: "Arco AM/PM",
    address: "321 Valencia St, San Francisco, CA",
    lat: 37.7449,
    lng: -122.4194,
    prices: { regular: 4.69, premium: 5.09, diesel: 4.99 },
    brand: "Arco",
    lastUpdated: "4 hours ago",
  },
  {
    id: "5",
    name: "Exxon Mobil",
    address: "654 Geary St, San Francisco, CA",
    lat: 37.7749,
    lng: -122.4494,
    prices: { regular: 4.99, premium: 5.39, diesel: 5.29 },
    brand: "Exxon",
    lastUpdated: "1 hour ago",
  },
];

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be signed in to view gas stations" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get("lat") || "37.7749");
    const lng = parseFloat(searchParams.get("lng") || "-122.4194");
    const radius = parseFloat(searchParams.get("radius") || "10"); // km

    // In a real implementation, you would:
    // 1. Use Google Places API to find gas stations near the coordinates
    // 2. Integrate with fuel price APIs (GasBuddy, AAA, etc.)
    // 3. Cache results to avoid excessive API calls
    // 4. Filter by distance using the Haversine formula

    // Generate mock gas stations around the user's actual location
    const adjustedStations = mockGasStations.map((station, index) => {
      // Create a wider spread around user location (about 5km radius)
      const offsetLat = (Math.random() - 0.5) * 0.08; // ~4-5km range
      const offsetLng = (Math.random() - 0.5) * 0.08;
      
      return {
        ...station,
        id: `station_${index}_${lat}_${lng}`, // Unique ID based on location
        lat: lat + offsetLat,
        lng: lng + offsetLng,
        // Update addresses to reflect the area
        address: `${Math.floor(Math.random() * 9999)} ${getRandomStreetName()}, ${getLocationName(lat, lng)}`,
        prices: {
          regular: station.prices.regular ? Math.max(3.50, station.prices.regular + (Math.random() - 0.5) * 0.6) : undefined,
          premium: station.prices.premium ? Math.max(3.80, station.prices.premium + (Math.random() - 0.5) * 0.6) : undefined,
          diesel: station.prices.diesel ? Math.max(3.60, station.prices.diesel + (Math.random() - 0.5) * 0.6) : undefined,
        },
        lastUpdated: getRandomUpdateTime(),
      };
    });

    return NextResponse.json(adjustedStations);
  } catch (error) {
    console.error("Error fetching gas stations:", error);
    return NextResponse.json(
      { error: "Failed to fetch gas stations" },
      { status: 500 }
    );
  }
}

// Helper function to calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

// Helper function to get random street names
function getRandomStreetName(): string {
  const streetNames = [
    "Main St", "Oak Ave", "Pine St", "Maple Dr", "Cedar Rd", "Elm St", 
    "Park Ave", "1st Ave", "2nd Ave", "Broadway", "King St", "Queen St",
    "Victoria Dr", "Commercial Dr", "Granville St", "Robson St", "Davie St"
  ];
  return streetNames[Math.floor(Math.random() * streetNames.length)];
}

// Helper function to get location name based on coordinates
function getLocationName(lat: number, lng: number): string {
  // Simple logic to determine if it's Vancouver area or other
  if (lat > 49.0 && lat < 49.5 && lng > -123.5 && lng < -122.5) {
    const vancouverAreas = ["Vancouver, BC", "Burnaby, BC", "Richmond, BC", "Surrey, BC", "North Vancouver, BC"];
    return vancouverAreas[Math.floor(Math.random() * vancouverAreas.length)];
  }
  return "Your Area";
}

// Helper function to get random update time
function getRandomUpdateTime(): string {
  const times = ["1 hour ago", "2 hours ago", "3 hours ago", "30 minutes ago", "45 minutes ago", "Just now"];
  return times[Math.floor(Math.random() * times.length)];
}
