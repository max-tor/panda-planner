"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import TodoList from "@/components/todos/TodoList";
import TodoForm from "@/components/todos/TodoForm";
import WeatherWidget from "@/components/weather/WeatherWidget";
import { TodoProvider } from "@/contexts/TodoContext";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to sign-in page if not authenticated
  useEffect(() => {
    if (mounted && status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/");
    }
  }, [mounted, status, router]);

  // Show loading state while checking authentication
  if (!mounted || status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Image
          src="/planner-panda.png"
          alt="PlannerPanda logo"
          width={80}
          height={80}
          priority
        />
        <div className="animate-pulse text-lg">Loading your todos...</div>
      </div>
    );
  }
  // Show todo content only if authenticated
  if (status === "authenticated") {
    return (
      <TodoProvider>
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-3 mb-8">
            <Image
              src="/planner-panda.png"
              alt="PlannerPanda logo"
              width={40}
              height={40}
              priority
            />
            <h1 className="text-3xl font-bold">My Todo List</h1>
          </div>
          
          {/* Weather Widget */}
          <WeatherWidget className="mb-6" />
          
          <TodoForm />
          <TodoList />
        </div>
      </TodoProvider>
    );
  }

  // This should never be shown due to the redirect effect
  return null;
}
