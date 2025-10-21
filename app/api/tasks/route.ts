import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { tasks } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, user.id))
      .orderBy(tasks.dueDate, tasks.createdAt);

    return Response.json(userTasks || []);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return Response.json([], { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, dueDate, priority, tags, color } = body;

    if (!title || !title.trim()) {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }

    const newTask = await db
      .insert(tasks)
      .values({
        userId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'medium',
        tags: tags || null,
        color: color || null,
        completed: 0,
      })
      .returning();

    return Response.json(newTask[0], { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return Response.json({ error: 'Failed to create task' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, title, description, dueDate, priority, tags, color } = body;

    if (!id) {
      return Response.json({ error: 'Task ID is required' }, { status: 400 });
    }
    if (!title || !title.trim()) {
      return Response.json({ error: 'Title is required' }, { status: 400 });
    }

    // Verify the task belongs to the user
    const existingTask = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
      .limit(1);

    if (existingTask.length === 0) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    const updatedTask = await db
      .update(tasks)
      .set({
        title: title.trim(),
        description: description?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'medium',
        tags: tags || null,
        color: color || null,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();

    return Response.json(updatedTask[0]);
  } catch (error) {
    console.error('Error updating task:', error);
    return Response.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, completed } = body;

    if (!id) {
      return Response.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Verify the task belongs to the user
    const existingTask = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, user.id)))
      .limit(1);

    if (existingTask.length === 0) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    const updatedTask = await db
      .update(tasks)
      .set({
        completed: completed ? 1 : 0,
        updatedAt: new Date(),
      })
      .where(eq(tasks.id, id))
      .returning();

    return Response.json(updatedTask[0]);
  } catch (error) {
    console.error('Error updating task completion:', error);
    return Response.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'Task ID is required' }, { status: 400 });
    }

    // Verify the task belongs to the user
    const existingTask = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, parseInt(id)), eq(tasks.userId, user.id)))
      .limit(1);

    if (existingTask.length === 0) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }

    // Delete the task
    await db
      .delete(tasks)
      .where(eq(tasks.id, parseInt(id)));

    return Response.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    return Response.json({ error: 'Failed to delete task' }, { status: 500 });
  }
} 