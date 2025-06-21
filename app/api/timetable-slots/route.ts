import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { timetableSlots } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

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
      .orderBy(timetableSlots.period, timetableSlots.weekNumber);

    return Response.json(userTimetableSlots || []);
  } catch (error) {
    console.error('Error fetching timetable slots:', error);
    return Response.json([], { status: 500 });
  }
} 