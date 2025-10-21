import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { academicYears, holidays } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get academic years with their holidays
    const userAcademicYears = await db
      .select({
        id: academicYears.id,
        userId: academicYears.userId,
        name: academicYears.name,
        startDate: academicYears.startDate,
        endDate: academicYears.endDate,
        weekCycleStartDate: academicYears.weekCycleStartDate,
        skipHolidayWeeks: academicYears.skipHolidayWeeks,
        isActive: academicYears.isActive,
        createdAt: academicYears.createdAt,
        updatedAt: academicYears.updatedAt,
      })
      .from(academicYears)
      .where(eq(academicYears.userId, user.id))
      .orderBy(academicYears.startDate);

    return Response.json(userAcademicYears || []);
  } catch (error) {
    console.error('Error fetching academic years:', error);
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
    const { name, startDate, endDate, weekCycleStartDate, isActive, skipHolidayWeeks } = body;

    if (!name || !startDate || !endDate || !weekCycleStartDate) {
      return Response.json({ error: 'Name, start date, end date, and week cycle start date are required' }, { status: 400 });
    }

    // If this is being set as active, deactivate other academic years
    if (isActive) {
      await db
        .update(academicYears)
        .set({ isActive: 0 })
        .where(eq(academicYears.userId, user.id));
    }

    const [newAcademicYear] = await db
      .insert(academicYears)
      .values({
        userId: user.id,
        name,
        startDate,
        endDate,
        weekCycleStartDate,
        skipHolidayWeeks: skipHolidayWeeks !== undefined ? (skipHolidayWeeks ? 1 : 0) : 1,
        isActive: isActive ? 1 : 0,
      })
      .returning();

    return Response.json(newAcademicYear, { status: 201 });
  } catch (error) {
    console.error('Error creating academic year:', error);
    return Response.json({ error: 'Failed to create academic year' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, name, startDate, endDate, weekCycleStartDate, isActive, skipHolidayWeeks } = body;

    if (!id || !name || !startDate || !endDate || !weekCycleStartDate) {
      return Response.json({ error: 'ID, name, start date, end date, and week cycle start date are required' }, { status: 400 });
    }

    // Verify the academic year belongs to the user
    const existingYear = await db
      .select()
      .from(academicYears)
      .where(and(eq(academicYears.id, id), eq(academicYears.userId, user.id)))
      .limit(1);

    if (existingYear.length === 0) {
      return Response.json({ error: 'Academic year not found' }, { status: 404 });
    }

    // If this is being set as active, deactivate other academic years
    if (isActive) {
      await db
        .update(academicYears)
        .set({ isActive: 0 })
        .where(eq(academicYears.userId, user.id));
    }

    const [updatedYear] = await db
      .update(academicYears)
      .set({
        name,
        startDate,
        endDate,
        weekCycleStartDate,
        skipHolidayWeeks: skipHolidayWeeks !== undefined ? (skipHolidayWeeks ? 1 : 0) : 1,
        isActive: isActive ? 1 : 0,
        updatedAt: new Date(),
      })
      .where(and(eq(academicYears.id, id), eq(academicYears.userId, user.id)))
      .returning();

    return Response.json(updatedYear);
  } catch (error) {
    console.error('Error updating academic year:', error);
    return Response.json({ error: 'Failed to update academic year' }, { status: 500 });
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
      return Response.json({ error: 'Academic year ID is required' }, { status: 400 });
    }

    const yearId = parseInt(id, 10);
    if (isNaN(yearId) || yearId <= 0) {
      return Response.json({ error: 'Invalid academic year ID' }, { status: 400 });
    }

    // Verify the academic year belongs to the user
    const existingYear = await db
      .select()
      .from(academicYears)
      .where(and(eq(academicYears.id, yearId), eq(academicYears.userId, user.id)))
      .limit(1);

    if (existingYear.length === 0) {
      return Response.json({ error: 'Academic year not found' }, { status: 404 });
    }

    // Use a transaction to delete holidays and academic year
    await db.transaction(async (tx) => {
      // First, delete all holidays associated with this academic year
      await tx
        .delete(holidays)
        .where(and(eq(holidays.academicYearId, yearId), eq(holidays.userId, user.id)));

      // Then, delete the academic year
      await tx
        .delete(academicYears)
        .where(and(eq(academicYears.id, yearId), eq(academicYears.userId, user.id)));
    });

    return Response.json({ message: 'Academic year deleted successfully' });
  } catch (error) {
    console.error('Error deleting academic year:', error);
    return Response.json({ error: 'Failed to delete academic year' }, { status: 500 });
  }
}
