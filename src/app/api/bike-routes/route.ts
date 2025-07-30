import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

interface BikeRoute {
  id: string;
  name: string;
  type: 'bike_lane';
  difficulty: 'easy' | 'moderate' | 'hard';
  distance: string;
  lat: number;
  lng: number;
  description: string;
}

// Mock bike routes data generator
function generateBikeRoutes(centerLat: number, centerLng: number, radius: number): BikeRoute[] {
  const routes: BikeRoute[] = [];
  
  // Convert radius from meters to degrees (rough approximation)
  const radiusDegrees = radius / 111000; // 1 degree ≈ 111km
  
  const routeTemplates = [
    {
      name: 'Market Street Bike Lane',
      type: 'bike_lane' as const,
      difficulty: 'easy' as const,
      distance: '5.2 km',
      description: 'Protected bike lane through downtown area'
    },
    {
      name: 'Twin Peaks Challenge',
      type: 'bike_lane' as const,
      difficulty: 'hard' as const,
      distance: '4.2 km',
      description: 'Challenging climb to Twin Peaks with panoramic city views'
    },
    {
      name: 'Great Highway Bike Lane',
      type: 'bike_lane' as const,
      difficulty: 'moderate' as const,
      distance: '7.1 km',
      description: 'Coastal bike lane with ocean views and wind challenges'
    },
    {
      name: 'Wiggle Route',
      type: 'bike_lane' as const,
      difficulty: 'moderate' as const,
      distance: '3.7 km',
      description: 'Popular commuter route avoiding steep hills'
    },
    {
      name: 'Valencia Street Bike Lane',
      type: 'bike_lane' as const,
      difficulty: 'easy' as const,
      distance: '4.8 km',
      description: 'Protected bike lane through the Mission District'
    },
    {
      name: 'Polk Street Bike Lane',
      type: 'bike_lane' as const,
      difficulty: 'moderate' as const,
      distance: '3.1 km',
      description: 'Urban bike lane connecting downtown to Russian Hill'
    },
    {
      name: 'Howard Street Bike Lane',
      type: 'bike_lane' as const,
      difficulty: 'easy' as const,
      distance: '2.9 km',
      description: 'Protected eastbound bike lane through SOMA'
    },
    {
      name: 'Folsom Street Bike Lane',
      type: 'bike_lane' as const,
      difficulty: 'easy' as const,
      distance: '3.4 km',
      description: 'Westbound bike lane parallel to Howard Street'
    },
    {
      name: 'JFK Drive Bike Lane',
      type: 'bike_lane' as const,
      difficulty: 'easy' as const,
      distance: '2.7 km',
      description: 'Car-free bike lane through Golden Gate Park'
    },
    {
      name: 'Page Street Bike Lane',
      type: 'bike_lane' as const,
      difficulty: 'moderate' as const,
      distance: '4.5 km',
      description: 'Protected bike lane from downtown to the Sunset'
    },
    {
      name: 'Oak Street Bike Lane',
      type: 'bike_lane' as const,
      difficulty: 'moderate' as const,
      distance: '4.3 km',
      description: 'Eastbound bike lane parallel to Page Street'
    },
    {
      name: 'Fell Street Bike Lane',
      type: 'bike_lane' as const,
      difficulty: 'moderate' as const,
      distance: '4.1 km',
      description: 'Westbound bike lane connecting to Golden Gate Park'
    }
  ];

  // Generate routes within the radius
  routeTemplates.forEach((template, index) => {
    // Generate random position within radius
    const angle = Math.random() * 2 * Math.PI;
    const distance = Math.random() * radiusDegrees * 0.8; // Stay within 80% of radius
    
    const lat = centerLat + distance * Math.cos(angle);
    const lng = centerLng + distance * Math.sin(angle);

    routes.push({
      id: `route_${index + 1}`,
      lat,
      lng,
      ...template
    });
  });

  return routes;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '37.7749');
    const lng = parseFloat(searchParams.get('lng') || '-122.4194');
    const radius = parseInt(searchParams.get('radius') || '80000');

    console.log(`🚴 Generating bike routes for location: ${lat}, ${lng} with radius: ${radius}m`);

    // Generate mock bike routes
    const routes = generateBikeRoutes(lat, lng, radius);

    return NextResponse.json({
      routes,
      center: { lat, lng },
      radius,
      count: routes.length
    });

  } catch (error) {
    console.error('❌ Error in bike routes API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bike routes' },
      { status: 500 }
    );
  }
}
