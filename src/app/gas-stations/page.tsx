"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import GoogleMapsProvider from "@/components/shared/GoogleMapsProvider";

// Dynamically import the map component to avoid SSR issues
const GasStationMap = dynamic(() => import("@/components/gas-stations/GasStationMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-96">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  ),
});

export default function GasStationsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Gas Stations Near You
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Find nearby gas stations with current fuel prices
        </p>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
        <GoogleMapsProvider>
          <GasStationMap />
        </GoogleMapsProvider>
      </div>
    </div>
  );
}
