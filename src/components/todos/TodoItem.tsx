"use client";

import { useState } from "react";
import { useTodos } from "@/contexts/TodoContext";

interface Todo {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
}

interface TodoItemProps {
  todo: Todo;
}

export default function TodoItem({ todo }: TodoItemProps) {
  const { updateTodo, deleteTodo, toggleComplete } = useTodos();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(todo.title);
  const [editedDescription, setEditedDescription] = useState(todo.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedTitle(todo.title);
    setEditedDescription(todo.description || "");
    setError(null);
  };

  const handleSave = async () => {
    if (!editedTitle.trim()) {
      setError("Title cannot be empty");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      // Use context to update the todo
      await updateTodo(todo.id, {
        title: editedTitle.trim(),
        description: editedDescription.trim() || null,
      });
      
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating todo:", err);
      setError("Failed to update todo. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isEditing) {
    return (
      <div className="p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900">
        <div className="space-y-3">
          <div>
            <label htmlFor={`title-${todo.id}`} className="block text-sm font-medium mb-1">
              Title
            </label>
            <input
              id={`title-${todo.id}`}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
              disabled={isSubmitting}
            />
          </div>
          
          <div>
            <label htmlFor={`description-${todo.id}`} className="block text-sm font-medium mb-1">
              Description (optional)
            </label>
            <textarea
              id={`description-${todo.id}`}
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800"
              disabled={isSubmitting}
            />
          </div>
          
          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}
          
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-lg ${todo.completed ? 'bg-gray-50 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => toggleComplete(todo.id, todo.completed)}
            className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div>
            <h3 className={`font-medium ${todo.completed ? 'line-through text-gray-500 dark:text-gray-400' : ''}`}>
              {todo.title}
            </h3>
            {todo.description && (
              <p className={`mt-1 text-sm ${todo.completed ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}>
                {todo.description}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-400">
              Created: {new Date(todo.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleEdit}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            disabled={todo.completed}
          >
            Edit
          </button>
          <button
            onClick={() => deleteTodo(todo.id)}
            className="text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
