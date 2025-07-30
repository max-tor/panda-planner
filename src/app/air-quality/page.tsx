import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AirQualityMap from "@/components/air-quality/AirQualityMap";
import GoogleMapsProvider from "@/components/shared/GoogleMapsProvider";

export default async function AirQualityPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Air Quality Monitor
        </h1>
        <p className="text-gray-600">
          View real-time air quality data for your area and surrounding 200km radius
        </p>
      </div>
      
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <GoogleMapsProvider>
          <AirQualityMap />
        </GoogleMapsProvider>
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-800 mb-2">Air Quality Index (AQI)</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <div className="w-4 h-4 bg-green-500 rounded mr-2" style={{ backgroundColor: 'rgb(34 197 94)' }}></div>
              <span>0-50: Good</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-yellow-500 rounded mr-2" style={{ backgroundColor: 'rgb(234 179 8)' }}></div>
              <span>51-100: Moderate</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-orange-500 rounded mr-2" style={{ backgroundColor: 'rgb(249 115 22)' }}></div>
              <span>101-150: Unhealthy for Sensitive</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-500 rounded mr-2" style={{ backgroundColor: 'rgb(239 68 68)' }}></div>
              <span>151-200: Unhealthy</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-purple-500 rounded mr-2" style={{ backgroundColor: 'rgb(168 85 247)' }}></div>
              <span>201-300: Very Unhealthy</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-red-900 rounded mr-2" style={{ backgroundColor: 'rgb(127 29 29)' }}></div>
              <span>301+: Hazardous</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-800 mb-2">Pollutants Monitored</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• PM2.5 (Fine Particulate Matter)</li>
            <li>• PM10 (Coarse Particulate Matter)</li>
            <li>• O3 (Ozone)</li>
            <li>• NO2 (Nitrogen Dioxide)</li>
            <li>• SO2 (Sulfur Dioxide)</li>
            <li>• CO (Carbon Monoxide)</li>
          </ul>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold text-gray-800 mb-2">Health Recommendations</h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Good (0-50):</strong> Air quality is satisfactory</p>
            <p><strong>Moderate (51-100):</strong> Acceptable for most people</p>
            <p><strong>Unhealthy for Sensitive (101-150):</strong> Sensitive groups should limit outdoor activities</p>
            <p><strong>Unhealthy (151+):</strong> Everyone should limit outdoor activities</p>
          </div>
        </div>
      </div>
    </div>
  );
}
