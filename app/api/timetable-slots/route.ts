import { eq, and, ne } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { timetableSlots, lessons, timetableEntries, classes, subjects } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { z } from 'zod';

// Validation schema for timetable slot
const timetableSlotSchema = z.object({
  dayOfWeek: z.string().min(1).max(10),
  weekNumber: z.number().min(1).max(2),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  label: z.string().min(1).max(100),
});

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userTimetableSlots = await db
      .select()
      .from(timetableSlots)
      .where(eq(timetableSlots.userId, user.id))
      .orderBy(timetableSlots.dayOfWeek, timetableSlots.weekNumber, timetableSlots.startTime);

    return Response.json(userTimetableSlots || []);
  } catch (error) {
    console.error('Error fetching timetable slots:', error);
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
    const validatedData = timetableSlotSchema.parse(body);

    // Check if a slot with the same day, week, startTime, and endTime already exists
    const existingSlot = await db
      .select()
      .from(timetableSlots)
      .where(
        and(
          eq(timetableSlots.userId, user.id),
          eq(timetableSlots.dayOfWeek, validatedData.dayOfWeek),
          eq(timetableSlots.weekNumber, validatedData.weekNumber),
          eq(timetableSlots.startTime, validatedData.startTime),
          eq(timetableSlots.endTime, validatedData.endTime)
        )
      )
      .limit(1);

    if (existingSlot.length > 0) {
      return Response.json(
        { error: 'A slot for this day, week, and time already exists' },
        { status: 400 }
      );
    }

    const newSlot = await db
      .insert(timetableSlots)
      .values({
        userId: user.id,
        ...validatedData,
      })
      .returning();

    return Response.json(newSlot[0], { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Error creating timetable slot:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return Response.json({ error: 'Slot ID is required' }, { status: 400 });
    }

    const validatedData = timetableSlotSchema.parse(updateData);

    // Check if the slot belongs to the user
    const existingSlot = await db
      .select()
      .from(timetableSlots)
      .where(and(eq(timetableSlots.id, id), eq(timetableSlots.userId, user.id)))
      .limit(1);

    if (existingSlot.length === 0) {
      return Response.json({ error: 'Slot not found' }, { status: 404 });
    }

    // Check if another slot with the same label, day, and week already exists (excluding current slot)
    const conflictingSlot = await db
      .select()
      .from(timetableSlots)
      .where(
        and(
          eq(timetableSlots.userId, user.id),
          eq(timetableSlots.label, validatedData.label),
          eq(timetableSlots.dayOfWeek, validatedData.dayOfWeek),
          eq(timetableSlots.weekNumber, validatedData.weekNumber),
          ne(timetableSlots.id, id)
        )
      )
      .limit(1);

    if (conflictingSlot.length > 0) {
      return Response.json(
        { error: 'A slot with this label, day, and week already exists' },
        { status: 400 }
      );
    }

    const updatedSlot = await db
      .update(timetableSlots)
      .set(validatedData)
      .where(and(eq(timetableSlots.id, id), eq(timetableSlots.userId, user.id)))
      .returning();

    if (updatedSlot.length === 0) {
      return Response.json({ error: 'Slot not found' }, { status: 404 });
    }

    return Response.json(updatedSlot[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid data', details: error.errors }, { status: 400 });
    }
    console.error('Error updating timetable slot:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
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
    const force = searchParams.get('force') === 'true';

    console.log('DELETE request for timetable slot:', { id, force, userId: user.id });

    if (!id) {
      return Response.json({ error: 'Slot ID is required' }, { status: 400 });
    }

    const slotId = parseInt(id, 10);
    if (isNaN(slotId) || slotId <= 0) {
      return Response.json({ error: 'Invalid slot ID' }, { status: 400 });
    }

    console.log('Parsed slot ID:', slotId);

    // Check if the slot belongs to the user
    const existingSlot = await db
      .select()
      .from(timetableSlots)
      .where(and(eq(timetableSlots.id, slotId), eq(timetableSlots.userId, user.id)))
      .limit(1);

    console.log('Existing slot found:', existingSlot.length > 0);

    if (existingSlot.length === 0) {
      return Response.json({ error: 'Slot not found' }, { status: 404 });
    }

    // Check if any lessons or timetable entries for this user reference this slot
    const lessonsUsingSlot = await db
      .select({
        id: lessons.id,
        title: lessons.title,
        date: lessons.date,
        className: classes.name,
        subjectName: subjects.name,
      })
      .from(lessons)
      .leftJoin(classes, eq(lessons.classId, classes.id))
      .leftJoin(subjects, eq(lessons.subjectId, subjects.id))
      .where(and(eq(lessons.timetableSlotId, slotId), eq(lessons.userId, user.id)));

    const entriesUsingSlot = await db
      .select({
        id: timetableEntries.id,
        className: classes.name,
        subjectName: subjects.name,
        room: timetableEntries.room,
      })
      .from(timetableEntries)
      .leftJoin(classes, eq(timetableEntries.classId, classes.id))
      .leftJoin(subjects, eq(timetableEntries.subjectId, subjects.id))
      .where(and(eq(timetableEntries.timetableSlotId, slotId), eq(timetableEntries.userId, user.id)));

    console.log('Dependencies found:', { 
      lessonsCount: lessonsUsingSlot.length, 
      entriesCount: entriesUsingSlot.length 
    });

    if ((lessonsUsingSlot.length > 0 || entriesUsingSlot.length > 0) && !force) {
      return Response.json({
        error: 'Cannot remove time slot: it contains lesson plans and class schedules that need to be cleared first.',
        canForce: true,
        dependencies: {
          lessonsCount: lessonsUsingSlot.length,
          entriesCount: entriesUsingSlot.length,
          lessons: lessonsUsingSlot,
          entries: entriesUsingSlot,
        }
      }, { status: 409 });
    }

    // If force, delete all lessons and timetable entries referencing this slot
    if (force) {
      console.log('Force deleting dependencies...');
      const deletedLessons = await db
        .delete(lessons)
        .where(eq(lessons.timetableSlotId, slotId))
        .returning();
      
      const deletedEntries = await db
        .delete(timetableEntries)
        .where(eq(timetableEntries.timetableSlotId, slotId))
        .returning();

      console.log('Deleted dependencies:', { 
        lessonsDeleted: deletedLessons.length, 
        entriesDeleted: deletedEntries.length 
      });
    }

    console.log('Deleting timetable slot...');
    const deletedSlot = await db
      .delete(timetableSlots)
      .where(and(eq(timetableSlots.id, slotId), eq(timetableSlots.userId, user.id)))
      .returning();

    console.log('Slot deletion result:', { deletedCount: deletedSlot.length });

    return Response.json({ message: 'Time slot and associated content removed successfully' });
  } catch (error) {
    console.error('Error deleting timetable slot:', { error, url: request.url, userId: user.id });
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
} 