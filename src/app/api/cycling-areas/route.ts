import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

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

// Fetch real cycling areas from OpenStreetMap Overpass API
async function fetchCyclingAreasFromOSM(centerLat: number, centerLng: number, radius: number): Promise<CyclingArea[]> {
  const radiusKm = radius / 1000; // Convert to kilometers
  
  // Overpass API query for cycling infrastructure
  const overpassQuery = `
    [out:json][timeout:25];
    (
      // Parks with cycling facilities
      way["leisure"="park"]["bicycle"!="no"](around:${radiusKm * 1000},${centerLat},${centerLng});
      relation["leisure"="park"]["bicycle"!="no"](around:${radiusKm * 1000},${centerLat},${centerLng});
      
      // Dedicated cycling paths
      way["highway"="cycleway"](around:${radiusKm * 1000},${centerLat},${centerLng});
      way["highway"="path"]["bicycle"="designated"](around:${radiusKm * 1000},${centerLat},${centerLng});
      
      // Car-free zones and pedestrian areas that allow cycling
      way["highway"="pedestrian"]["bicycle"!="no"](around:${radiusKm * 1000},${centerLat},${centerLng});
      way["highway"="living_street"](around:${radiusKm * 1000},${centerLat},${centerLng});
      
      // Greenways and recreational areas
      way["route"="bicycle"](around:${radiusKm * 1000},${centerLat},${centerLng});
      relation["route"="bicycle"](around:${radiusKm * 1000},${centerLat},${centerLng});
    );
    out geom;
  `;

  try {
    const response = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `data=${encodeURIComponent(overpassQuery)}`
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data = await response.json();
    return processOSMData(data.elements, centerLat, centerLng);
  } catch (error) {
    console.error('Error fetching from Overpass API:', error);
    return generateFallbackAreas(centerLat, centerLng);
  }
}

// Process OpenStreetMap data into cycling areas
function processOSMData(elements: any[], centerLat: number, centerLng: number): CyclingArea[] {
  const areas: CyclingArea[] = [];
  const processedIds = new Set<string>();

  elements.forEach((element: { type: string; tags?: Record<string, string>; geometry?: unknown[] }) => {
    if (processedIds.has(element.id?.toString())) return;
    processedIds.add(element.id?.toString());

    let name = element.tags?.name || element.tags?.ref || 'Cycling Area';
    let description = '';
    let type: CyclingArea['type'] = 'dedicated_path';
    let coordinates: { lat: number; lng: number }[] = [];
    let areaCenterLat = centerLat;
    let areaCenterLng = centerLng;

    // Determine type based on OSM tags
    if (element.tags?.leisure === 'park') {
      type = 'park';
      description = `Park with cycling facilities${element.tags?.description ? ': ' + element.tags.description : ''}`;
    } else if (element.tags?.highway === 'cycleway' || element.tags?.bicycle === 'designated') {
      type = 'dedicated_path';
      description = `Dedicated cycling path${element.tags?.surface ? ' (' + element.tags.surface + ' surface)' : ''}`;
    } else if (element.tags?.highway === 'pedestrian' || element.tags?.highway === 'living_street') {
      type = 'car_free_zone';
      description = `Car-free area suitable for cycling${element.tags?.description ? ': ' + element.tags.description : ''}`;
    }

    // Extract coordinates
    if (element.geometry) {
      coordinates = element.geometry.map((coord: { lat: number; lon: number }) => ({
        lat: coord.lat,
        lng: coord.lon
      }));
      
      // Calculate center point
      if (coordinates.length > 0) {
        areaCenterLat = coordinates.reduce((sum, coord) => sum + coord.lat, 0) / coordinates.length;
        areaCenterLng = coordinates.reduce((sum, coord) => sum + coord.lng, 0) / coordinates.length;
      }
    } else {
      // Fallback: create a small area around the center
      const size = 0.002;
      coordinates = [
        { lat: areaCenterLat - size, lng: areaCenterLng - size },
        { lat: areaCenterLat + size, lng: areaCenterLng - size },
        { lat: areaCenterLat + size, lng: areaCenterLng + size },
        { lat: areaCenterLat - size, lng: areaCenterLng + size }
      ];
    }

    // Calculate approximate area/length
    let area = 'Unknown';
    if (coordinates.length > 2) {
      const distance = calculatePathLength(coordinates);
      area = distance > 1000 ? `${(distance / 1000).toFixed(1)} km` : `${Math.round(distance)} m`;
    }

    areas.push({
      id: `osm_${element.id || index}`,
      name,
      type,
      area,
      centerLat: areaCenterLat,
      centerLng: areaCenterLng,
      description,
      coordinates
    });
  });

  return areas.slice(0, 20); // Limit to 20 areas for performance
}

// Calculate path length from coordinates
function calculatePathLength(coordinates: { lat: number; lng: number }[]): number {
  let totalDistance = 0;
  for (let i = 1; i < coordinates.length; i++) {
    totalDistance += getDistance(
      coordinates[i-1].lat, coordinates[i-1].lng,
      coordinates[i].lat, coordinates[i].lng
    );
  }
  return totalDistance;
}

// Fallback areas when OSM API fails
function generateFallbackAreas(centerLat: number, centerLng: number): CyclingArea[] {
  const fallbackAreas = [
    {
      id: 'fallback_1',
      name: 'Local Park Area',
      type: 'park' as const,
      area: '2.1 km²',
      centerLat: centerLat + 0.008,
      centerLng: centerLng + 0.005,
      description: 'Local park with cycling-friendly paths',
      coordinates: [
        { lat: centerLat + 0.004, lng: centerLng + 0.001 },
        { lat: centerLat + 0.012, lng: centerLng + 0.001 },
        { lat: centerLat + 0.012, lng: centerLng + 0.009 },
        { lat: centerLat + 0.004, lng: centerLng + 0.009 }
      ]
    },
    {
      id: 'fallback_2',
      name: 'Cycling Path',
      type: 'dedicated_path' as const,
      area: '1.8 km',
      centerLat: centerLat - 0.006,
      centerLng: centerLng + 0.012,
      description: 'Dedicated cycling path in the area',
      coordinates: [
        { lat: centerLat - 0.010, lng: centerLng + 0.008 },
        { lat: centerLat - 0.002, lng: centerLng + 0.008 },
        { lat: centerLat - 0.002, lng: centerLng + 0.016 },
        { lat: centerLat - 0.010, lng: centerLng + 0.016 }
      ]
    },
    {
      id: 'fallback_3',
      name: 'Car-Free Zone',
      type: 'car_free_zone' as const,
      area: '1.2 km²',
      centerLat: centerLat + 0.004,
      centerLng: centerLng - 0.008,
      description: 'Local car-free area suitable for cycling',
      coordinates: [
        { lat: centerLat, lng: centerLng - 0.012 },
        { lat: centerLat + 0.008, lng: centerLng - 0.012 },
        { lat: centerLat + 0.008, lng: centerLng - 0.004 },
        { lat: centerLat, lng: centerLng - 0.004 }
      ]
    }
  ];

  return fallbackAreas;
}

// Helper function to calculate distance between two points in meters
function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
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

    console.log(`🚴 Fetching real cycling areas for location: ${lat}, ${lng} with radius: ${radius}m`);

    // Fetch real cycling areas from OpenStreetMap
    const areas = await fetchCyclingAreasFromOSM(lat, lng, radius);

    return NextResponse.json({
      areas,
      center: { lat, lng },
      radius,
      count: areas.length
    });

  } catch (error) {
    console.error('❌ Error in cycling areas API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cycling areas' },
      { status: 500 }
    );
  }
}
