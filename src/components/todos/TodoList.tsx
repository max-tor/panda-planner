"use client";

import TodoItem from "./TodoItem";
import { useTodos } from "@/contexts/TodoContext";

export default function TodoList() {
  const { todos, loading, error } = useTodos();

  if (loading) {
    return (
      <div className="mt-8 flex justify-center">
        <div className="animate-pulse text-lg">Loading todos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-8 p-4 bg-red-50 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  if (todos.length === 0) {
    return (
      <div className="mt-8 p-6 text-center border border-gray-200 dark:border-gray-800 rounded-lg">
        <p className="text-gray-500 dark:text-gray-400">No todos yet. Add one to get started!</p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      {todos.map((todo) => (
        <TodoItem 
          key={todo.id} 
          todo={todo}
        />
      ))}
    </div>
  );
}
