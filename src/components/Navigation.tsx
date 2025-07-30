"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Navigation() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  
  // Only show authentication state after component is mounted on the client
  // This prevents hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);
  
  const isLoading = status === "loading";
  const isAuthenticated = mounted && status === "authenticated";

  return (
    <nav className="w-full flex justify-between items-center py-4 px-6 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center">
        <Link href="/" className="flex items-center">
          <Image
            className="dark:invert"
            src="/panda.png"
            alt="Panda logo"
            width={100}
            height={20}
            priority
          />
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {isLoading ? (
          <div className="h-8 w-24 bg-gray-200 dark:bg-gray-800 animate-pulse rounded"></div>
        ) : isAuthenticated ? (
          <div className="flex items-center gap-4">
            <span className="text-sm">
              Hello, {session?.user?.name || session?.user?.email}
            </span>
            <Link
              href="/todos"
              className="text-sm px-4 py-2 rounded-full bg-white text-black hover:bg-gray-600 hover:text-white border border-gray-200 transition-colors"
            >
              ✍🏻 My Todos
            </Link>
            <Link
              href="/gas-stations"
              className="text-sm px-4 py-2 rounded-full bg-white text-black hover:bg-gray-600 hover:text-white border border-gray-200 transition-colors"
            >
              ⛽ Gas Stations
            </Link>
            <Link 
              href="/air-quality" 
              className="text-sm px-4 py-2 rounded-full bg-white text-black hover:bg-gray-600 hover:text-white border border-gray-200 transition-colors"
            >
              🌬️ Air Quality
            </Link>
            <Link 
              href="/bike-roads" 
              className="text-sm px-4 py-2 rounded-full bg-white text-black hover:bg-gray-600 hover:text-white border border-gray-200 transition-colors"
            >
              🚴 Bike Roads
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-sm px-4 py-2 bg-gray-100 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/auth/signin"
              className="text-sm px-4 py-2 rounded-full border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/signup"
              className="text-sm px-4 py-2 rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
