import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { lessons, classes, subjects, timetableSlots } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const userLessons = await db
      .select({
        id: lessons.id,
        userId: lessons.userId,
        classId: lessons.classId,
        subjectId: lessons.subjectId,
        timetableSlotId: lessons.timetableSlotId,
        title: lessons.title,
        date: lessons.date,
        lessonPlan: lessons.lessonPlan,
        planCompleted: lessons.planCompleted,
        // Related data
        className: classes.name,
        subjectName: subjects.name,
        slotStartTime: timetableSlots.startTime,
        slotEndTime: timetableSlots.endTime,
        slotLabel: timetableSlots.label,
        slotPeriod: timetableSlots.period,
        slotWeekNumber: timetableSlots.weekNumber,
      })
      .from(lessons)
      .leftJoin(classes, eq(lessons.classId, classes.id))
      .leftJoin(subjects, eq(lessons.subjectId, subjects.id))
      .leftJoin(timetableSlots, eq(lessons.timetableSlotId, timetableSlots.id))
      .where(eq(lessons.userId, user.id))
      .orderBy(lessons.date, lessons.id);

    return Response.json(userLessons || []);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return Response.json([], { status: 500 });
  }
} 