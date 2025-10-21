import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { timetableEntries, classes, subjects, timetableSlots } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Optional filter by slotId
    const { searchParams } = new URL(request.url);
    const slotIdParam = searchParams.get('slotId');
    const slotId = slotIdParam ? parseInt(slotIdParam, 10) : null;

    // Get timetable entries with joined class, subject, and slot data
    const baseQuery = db
      .select({
        id: timetableEntries.id,
        userId: timetableEntries.userId,
        classId: timetableEntries.classId,
        subjectId: timetableEntries.subjectId,
        dayOfWeek: timetableEntries.dayOfWeek,
        weekNumber: timetableEntries.weekNumber,
        timetableSlotId: timetableEntries.timetableSlotId,
        startDate: timetableEntries.startDate,
        endDate: timetableEntries.endDate,
        room: timetableEntries.room,
        notes: timetableEntries.notes,
        className: classes.name,
        classColor: classes.color,
        subjectName: subjects.name,
        subjectColor: subjects.color,
        slotLabel: timetableSlots.label,
        slotStartTime: timetableSlots.startTime,
        slotEndTime: timetableSlots.endTime,
      })
      .from(timetableEntries)
      .leftJoin(classes, eq(timetableEntries.classId, classes.id))
      .leftJoin(subjects, eq(timetableEntries.subjectId, subjects.id))
      .leftJoin(timetableSlots, eq(timetableEntries.timetableSlotId, timetableSlots.id))
      .where(eq(timetableEntries.userId, user.id));

    // Apply optional slot filter
    const userTimetableEntries = slotId
      ? await baseQuery.where(and(eq(timetableEntries.userId, user.id), eq(timetableEntries.timetableSlotId, slotId)))
      : await baseQuery.orderBy(timetableEntries.dayOfWeek, timetableEntries.weekNumber);

    return Response.json(userTimetableEntries || []);
  } catch (error) {
    console.error('Error fetching timetable entries:', error);
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
    const { timetableSlotId, classId, subjectId, room, notes } = body;

    if (!timetableSlotId) {
      return Response.json({ error: 'Timetable slot ID is required' }, { status: 400 });
    }

    // Get the timetable slot to extract day and week info
    const slot = await db
      .select()
      .from(timetableSlots)
      .where(and(eq(timetableSlots.id, timetableSlotId), eq(timetableSlots.userId, user.id)))
      .limit(1);

    if (slot.length === 0) {
      return Response.json({ error: 'Timetable slot not found' }, { status: 404 });
    }

    // Check if there's already an entry for this slot
    const existingEntry = await db
      .select()
      .from(timetableEntries)
      .where(and(
        eq(timetableEntries.timetableSlotId, timetableSlotId),
        eq(timetableEntries.userId, user.id)
      ))
      .limit(1);

    if (existingEntry.length > 0) {
      return Response.json({ error: 'This timetable slot already has a class assigned' }, { status: 400 });
    }

    const [newEntry] = await db
      .insert(timetableEntries)
      .values({
        userId: user.id,
        timetableSlotId,
        classId: classId || null,
        subjectId: subjectId || null,
        dayOfWeek: slot[0].dayOfWeek,
        weekNumber: slot[0].weekNumber,
        room: room || null,
        notes: notes || null,
      })
      .returning();

    return Response.json(newEntry, { status: 201 });
  } catch (error) {
    console.error('Error creating timetable entry:', error);
    return Response.json({ error: 'Failed to create timetable entry' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, classId, subjectId, room, notes } = body;

    if (!id) {
      return Response.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    // Verify the entry belongs to the user
    const existingEntry = await db
      .select()
      .from(timetableEntries)
      .where(and(eq(timetableEntries.id, id), eq(timetableEntries.userId, user.id)))
      .limit(1);

    if (existingEntry.length === 0) {
      return Response.json({ error: 'Timetable entry not found' }, { status: 404 });
    }

    const [updatedEntry] = await db
      .update(timetableEntries)
      .set({
        classId: classId || null,
        subjectId: subjectId || null,
        room: room || null,
        notes: notes || null,
      })
      .where(and(eq(timetableEntries.id, id), eq(timetableEntries.userId, user.id)))
      .returning();

    return Response.json(updatedEntry);
  } catch (error) {
    console.error('Error updating timetable entry:', error);
    return Response.json({ error: 'Failed to update timetable entry' }, { status: 500 });
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
      return Response.json({ error: 'Entry ID is required' }, { status: 400 });
    }

    const entryId = parseInt(id, 10);
    if (isNaN(entryId) || entryId <= 0) {
      return Response.json({ error: 'Invalid entry ID' }, { status: 400 });
    }

    // Verify the entry belongs to the user
    const existingEntry = await db
      .select()
      .from(timetableEntries)
      .where(and(eq(timetableEntries.id, entryId), eq(timetableEntries.userId, user.id)))
      .limit(1);

    if (existingEntry.length === 0) {
      return Response.json({ error: 'Timetable entry not found' }, { status: 404 });
    }

    await db
      .delete(timetableEntries)
      .where(and(eq(timetableEntries.id, entryId), eq(timetableEntries.userId, user.id)));

    return Response.json({ message: 'Timetable entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting timetable entry:', error);
    return Response.json({ error: 'Failed to delete timetable entry' }, { status: 500 });
  }
} 