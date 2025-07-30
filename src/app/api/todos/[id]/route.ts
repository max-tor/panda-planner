import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/auth";

const prisma = new PrismaClient();

// GET /api/todos/[id] - Get a specific todo
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be signed in to view this todo" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const todo = await prisma.todo.findUnique({
      where: {
        id,
      },
    });

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    // Check if the todo belongs to the current user
    if (todo.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have permission to view this todo" },
        { status: 403 }
      );
    }

    return NextResponse.json(todo);
  } catch (error) {
    console.error("Error fetching todo:", error);
    return NextResponse.json(
      { error: "Failed to fetch todo" },
      { status: 500 }
    );
  }
}

// PATCH /api/todos/[id] - Update a todo
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be signed in to update a todo" },
        { status: 401 }
      );
    }

    const { id } = await params;
    // Check if the todo exists and belongs to the user
    const existingTodo = await prisma.todo.findUnique({
      where: {
        id,
      },
    });

    if (!existingTodo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    if (existingTodo.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have permission to update this todo" },
        { status: 403 }
      );
    }

    const { title, description, completed } = await request.json();

    // Update the todo
    const updatedTodo = await prisma.todo.update({
      where: {
        id,
      },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(completed !== undefined && { completed }),
      },
    });

    return NextResponse.json(updatedTodo);
  } catch (error) {
    console.error("Error updating todo:", error);
    return NextResponse.json(
      { error: "Failed to update todo" },
      { status: 500 }
    );
  }
}

// DELETE /api/todos/[id] - Delete a todo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "You must be signed in to delete a todo" },
        { status: 401 }
      );
    }

    const { id } = await params;
    // Check if the todo exists and belongs to the user
    const existingTodo = await prisma.todo.findUnique({
      where: {
        id,
      },
    });

    if (!existingTodo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    if (existingTodo.userId !== session.user.id) {
      return NextResponse.json(
        { error: "You do not have permission to delete this todo" },
        { status: 403 }
      );
    }

    // Delete the todo
    await prisma.todo.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: "Todo deleted successfully" });
  } catch (error) {
    console.error("Error deleting todo:", error);
    return NextResponse.json(
      { error: "Failed to delete todo" },
      { status: 500 }
    );
  }
}
