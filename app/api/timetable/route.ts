import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { timetableEntries } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userTimetableEntries = await db
      .select()
      .from(timetableEntries)
      .where(eq(timetableEntries.userId, user.id))
      .orderBy(timetableEntries.dayOfWeek, timetableEntries.period);

    return Response.json(userTimetableEntries || []);
  } catch (error) {
    console.error('Error fetching timetable entries:', error);
    return Response.json([], { status: 500 });
  }
} 