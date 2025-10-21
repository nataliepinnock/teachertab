import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { classes, lessons, timetableEntries } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userClasses = await db
      .select()
      .from(classes)
      .where(eq(classes.userId, user.id))
      .orderBy(classes.name);

    return Response.json(userClasses || []);
  } catch (error) {
    console.error('Error fetching classes:', error);
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
    const { name, numberOfStudents, notes, color } = body;

    if (!name) {
      return Response.json({ error: 'Name is required' }, { status: 400 });
    }

    const [newClass] = await db
      .insert(classes)
      .values({
        userId: user.id,
        name,
        numberOfStudents: numberOfStudents || 0,
        notes: notes || null,
        color: color || null,
      })
      .returning();

    return Response.json(newClass, { status: 201 });
  } catch (error) {
    console.error('Error creating class:', error);
    return Response.json({ error: 'Failed to create class' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, numberOfStudents, notes, color } = body;

    if (!id || !name) {
      return Response.json({ error: 'ID and name are required' }, { status: 400 });
    }

    // Verify the class belongs to the user
    const existingClass = await db
      .select()
      .from(classes)
      .where(and(eq(classes.id, id), eq(classes.userId, user.id)))
      .limit(1);

    if (existingClass.length === 0) {
      return Response.json({ error: 'Class not found' }, { status: 404 });
    }

    const [updatedClass] = await db
      .update(classes)
      .set({
        name,
        numberOfStudents: numberOfStudents || 0,
        notes: notes || null,
        color: color || null,
      })
      .where(and(eq(classes.id, id), eq(classes.userId, user.id)))
      .returning();

    return Response.json(updatedClass);
  } catch (error) {
    console.error('Error updating class:', error);
    return Response.json({ error: 'Failed to update class' }, { status: 500 });
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
      return Response.json({ error: 'Class ID is required' }, { status: 400 });
    }

    const classId = parseInt(id, 10);
    if (isNaN(classId) || classId <= 0) {
      return Response.json({ error: 'Invalid class ID' }, { status: 400 });
    }

    // Verify the class belongs to the user
    const existingClass = await db
      .select()
      .from(classes)
      .where(and(eq(classes.id, classId), eq(classes.userId, user.id)))
      .limit(1);

    if (existingClass.length === 0) {
      return Response.json({ error: 'Class not found' }, { status: 404 });
    }

    // Use a transaction to ensure all operations succeed or fail together
    await db.transaction(async (tx) => {
      // First, delete all lessons associated with this class
      await tx
        .delete(lessons)
        .where(and(eq(lessons.classId, classId), eq(lessons.userId, user.id)));

      // Update timetable entries to remove the class reference (set to null)
      await tx
        .update(timetableEntries)
        .set({ classId: null })
        .where(and(eq(timetableEntries.classId, classId), eq(timetableEntries.userId, user.id)));

      // Finally, delete the class itself
      await tx
        .delete(classes)
        .where(and(eq(classes.id, classId), eq(classes.userId, user.id)));
    });

    return Response.json({ message: 'Class deleted successfully' });
  } catch (error) {
    console.error('Error deleting class:', error);
    return Response.json({ error: 'Failed to delete class' }, { status: 500 });
  }
} 