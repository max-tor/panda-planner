"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TodoList from "@/components/todos/TodoList";
import TodoForm from "@/components/todos/TodoForm";

export default function TodoPage() {
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
      router.push("/auth/signin?callbackUrl=/todos");
    }
  }, [mounted, status, router]);

  // Show loading state while checking authentication
  if (!mounted || status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-pulse text-lg">Loading...</div>
      </div>
    );
  }

  // Show todo content only if authenticated
  if (status === "authenticated") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8">My Todo List</h1>
        <TodoForm />
        <TodoList />
      </div>
    );
  }

  // This should never be shown due to the redirect effect
  return null;
}
