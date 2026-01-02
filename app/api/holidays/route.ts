import { eq, and, gte, lte } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { holidays, academicYears, lessons } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

/**
 * Delete all lessons that fall within a holiday date range
 */
async function deleteLessonsForHoliday(userId: number, startDate: string, endDate: string) {
  try {
    // Delete lessons where the date falls within the holiday range
    const deletedLessons = await db
      .delete(lessons)
      .where(
        and(
          eq(lessons.userId, userId),
          gte(lessons.date, startDate),
          lte(lessons.date, endDate)
        )
      )
      .returning({ id: lessons.id });

    if (deletedLessons.length > 0) {
      console.log(`Deleted ${deletedLessons.length} lesson(s) for holiday period ${startDate} to ${endDate}`);
    }
    
    return deletedLessons.length;
  } catch (error) {
    console.error('Error deleting lessons for holiday:', error);
    // Don't throw - we still want to create/update the holiday even if lesson deletion fails
    return 0;
  }
}

export async function GET(request: Request) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academicYearId');

    const whereClause = academicYearId 
      ? and(eq(holidays.userId, user.id), eq(holidays.academicYearId, parseInt(academicYearId)))
      : eq(holidays.userId, user.id);

    const userHolidays = await db
      .select({
        id: holidays.id,
        userId: holidays.userId,
        academicYearId: holidays.academicYearId,
        name: holidays.name,
        startDate: holidays.startDate,
        endDate: holidays.endDate,
        type: holidays.type,
        color: holidays.color,
      })
      .from(holidays)
      .where(whereClause)
      .orderBy(holidays.startDate);

    return Response.json(userHolidays || []);
  } catch (error) {
    console.error('Error fetching holidays:', error);
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
    const { academicYearId, name, startDate, endDate, type, color } = body;

    if (!academicYearId || !name || !startDate || !endDate) {
      return Response.json({ error: 'Academic year ID, name, start date, and end date are required' }, { status: 400 });
    }

    // Verify the academic year belongs to the user
    const academicYear = await db
      .select()
      .from(academicYears)
      .where(and(eq(academicYears.id, academicYearId), eq(academicYears.userId, user.id)))
      .limit(1);

    if (academicYear.length === 0) {
      return Response.json({ error: 'Academic year not found' }, { status: 404 });
    }

    const [newHoliday] = await db
      .insert(holidays)
      .values({
        userId: user.id,
        academicYearId,
        name,
        startDate,
        endDate,
        type: type || 'holiday',
        color: color || null,
      })
      .returning();

    // Delete any lessons that fall on the holiday dates
    const deletedCount = await deleteLessonsForHoliday(user.id, startDate, endDate);

    return Response.json({ ...newHoliday, deletedLessonsCount: deletedCount }, { status: 201 });
  } catch (error) {
    console.error('Error creating holiday:', error);
    return Response.json({ error: 'Failed to create holiday' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, startDate, endDate, type, color } = body;

    if (!id || !name || !startDate || !endDate) {
      return Response.json({ error: 'ID, name, start date, and end date are required' }, { status: 400 });
    }

    // Verify the holiday belongs to the user
    const existingHoliday = await db
      .select()
      .from(holidays)
      .where(and(eq(holidays.id, id), eq(holidays.userId, user.id)))
      .limit(1);

    if (existingHoliday.length === 0) {
      return Response.json({ error: 'Holiday not found' }, { status: 404 });
    }

    const [updatedHoliday] = await db
      .update(holidays)
      .set({
        name,
        startDate,
        endDate,
        type: type || 'holiday',
        color: color || null,
      })
      .where(and(eq(holidays.id, id), eq(holidays.userId, user.id)))
      .returning();

    // Delete any lessons that fall on the updated holiday dates
    const deletedCount = await deleteLessonsForHoliday(user.id, startDate, endDate);

    return Response.json({ ...updatedHoliday, deletedLessonsCount: deletedCount });
  } catch (error) {
    console.error('Error updating holiday:', error);
    return Response.json({ error: 'Failed to update holiday' }, { status: 500 });
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
      return Response.json({ error: 'Holiday ID is required' }, { status: 400 });
    }

    const holidayId = parseInt(id, 10);
    if (isNaN(holidayId) || holidayId <= 0) {
      return Response.json({ error: 'Invalid holiday ID' }, { status: 400 });
    }

    // Verify the holiday belongs to the user
    const existingHoliday = await db
      .select()
      .from(holidays)
      .where(and(eq(holidays.id, holidayId), eq(holidays.userId, user.id)))
      .limit(1);

    if (existingHoliday.length === 0) {
      return Response.json({ error: 'Holiday not found' }, { status: 404 });
    }

    await db
      .delete(holidays)
      .where(and(eq(holidays.id, holidayId), eq(holidays.userId, user.id)));

    return Response.json({ message: 'Holiday deleted successfully' });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    return Response.json({ error: 'Failed to delete holiday' }, { status: 500 });
  }
}
