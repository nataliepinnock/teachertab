import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { subjects } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { NextRequest } from 'next/server';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userSubjects = await db
      .select()
      .from(subjects)
      .where(eq(subjects.userId, user.id))
      .orderBy(subjects.name);

    return Response.json(userSubjects || []);
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return Response.json([], { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, color, notes } = body;

    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    const newSubject = await db
      .insert(subjects)
      .values({
        userId: user.id,
        name,
        color: color || null,
        notes: notes || null,
      })
      .returning();

    return Response.json(newSubject[0]);
  } catch (error) {
    console.error('Error creating subject:', error);
    return Response.json({ error: 'Failed to create subject' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, color, notes } = body;

    if (!id || !name) {
      return Response.json({ error: 'ID and name are required' }, { status: 400 });
    }

    const updatedSubject = await db
      .update(subjects)
      .set({
        name,
        color: color || null,
        notes: notes || null,
      })
      .where(and(eq(subjects.id, id), eq(subjects.userId, user.id)))
      .returning();

    if (updatedSubject.length === 0) {
      return Response.json({ error: 'Subject not found' }, { status: 404 });
    }

    return Response.json(updatedSubject[0]);
  } catch (error) {
    console.error('Error updating subject:', error);
    return Response.json({ error: 'Failed to update subject' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json({ error: 'Subject ID is required' }, { status: 400 });
    }

    const deletedSubject = await db
      .delete(subjects)
      .where(and(eq(subjects.id, parseInt(id)), eq(subjects.userId, user.id)))
      .returning();

    if (deletedSubject.length === 0) {
      return Response.json({ error: 'Subject not found' }, { status: 404 });
    }

    return Response.json({ message: 'Subject deleted successfully' });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return Response.json({ error: 'Failed to delete subject' }, { status: 500 });
  }
} 