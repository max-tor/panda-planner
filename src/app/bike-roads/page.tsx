import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import BikeRoadsMap from "@/components/bike-roads/BikeRoadsMap";
import GoogleMapsProvider from "@/components/shared/GoogleMapsProvider";

export default async function BikeRoadsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🚴 Bike Roads & Paths
        </h1>
        <p className="text-gray-600">
          Discover bike-friendly routes and cycling paths within 80km of your location
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <GoogleMapsProvider>
          <BikeRoadsMap />
        </GoogleMapsProvider>
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-800 mb-2">📍 Coverage Area</h3>
          <div className="text-sm text-gray-600">
            <p>• 80km radius from your location</p>
            <p>• Real-time bike infrastructure</p>
            <p>• Dedicated cycling routes</p>
            <p>• Safe path recommendations</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-800 mb-2">🛡️ Safety Tips</h3>
          <div className="text-sm text-gray-600">
            <p>• Always wear a helmet</p>
            <p>• Check traffic conditions</p>
            <p>• Use bike lights at night</p>
            <p>• Follow local cycling laws</p>
          </div>
        </div>
      </div>
    </div>
  );
}
