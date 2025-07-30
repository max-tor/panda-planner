"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

export default function ProtectedContent() {
  const { data: session, status } = useSession();
  const [mounted, setMounted] = useState(false);
  
  // Only show the component after it's mounted on the client
  // This prevents hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Don't render anything until the component is mounted on the client
  if (!mounted) {
    return null;
  }
  
  // Check authentication after component is mounted
  if (status !== "authenticated") {
    return null;
  }
  
  return (
    <div className="mt-8 p-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-xl font-bold mb-4">Protected Content</h2>
      <p className="mb-4">
        Welcome, {session?.user?.name || session?.user?.email}! This content is only visible to authenticated users.
      </p>
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md border border-green-200 dark:border-green-800">
        <p className="text-green-800 dark:text-green-400 text-sm">
          You have successfully implemented authentication in your Next.js application!
        </p>
      </div>
    </div>
  );
}
