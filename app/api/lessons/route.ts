import { eq, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { lessons, classes, subjects, timetableSlots, timetableEntries } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

export async function GET() {
  const user = await getUser();
  console.log('Lessons API - User:', user ? `ID: ${user.id}, Name: ${user.name}` : 'No user found');
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // First, let's check if there are any lessons at all for this user
    const allLessons = await db
      .select()
      .from(lessons)
      .where(eq(lessons.userId, user.id));
    
    console.log('Lessons API - Raw lessons count:', allLessons.length);
    console.log('Lessons API - Raw lessons:', allLessons);

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
        color: lessons.color,
        // Related data
        className: classes.name,
        classColor: classes.color,
        subjectName: subjects.name,
        subjectColor: subjects.color,
        slotStartTime: timetableSlots.startTime,
        slotEndTime: timetableSlots.endTime,
        slotLabel: timetableSlots.label,
        slotWeekNumber: timetableSlots.weekNumber,
        // Room from timetable allocation
        room: timetableEntries.room,
      })
      .from(lessons)
      .leftJoin(classes, eq(lessons.classId, classes.id))
      .leftJoin(subjects, eq(lessons.subjectId, subjects.id))
      .leftJoin(timetableSlots, eq(lessons.timetableSlotId, timetableSlots.id))
      .leftJoin(timetableEntries, and(
        eq(timetableEntries.timetableSlotId, lessons.timetableSlotId),
        eq(timetableEntries.userId, user.id)
      ))
      .where(eq(lessons.userId, user.id))
      .orderBy(lessons.date, lessons.id);

    console.log('Lessons API - Found lessons with joins:', userLessons.length);
    console.log('Lessons API - Lessons data:', userLessons);
    return Response.json(userLessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return Response.json({ error: 'Failed to fetch lessons' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  console.log('POST /api/lessons called');
  
  const user = await getUser();
  console.log('User authentication result:', user ? `ID: ${user.id}, Name: ${user.name}` : 'No user found');
  
  if (!user) {
    console.log('User not authenticated, returning 401');
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { classId, subjectId, timetableSlotId, title, date, lessonPlan, color } = body;
    
    console.log('Creating lesson with data:', { classId, subjectId, timetableSlotId, title, date, lessonPlan, color, userId: user.id });

    // Validate required fields
    if (!classId || !subjectId || !timetableSlotId || !title || !date) {
      return Response.json({ 
        error: 'Missing required fields: classId, subjectId, timetableSlotId, title, and date are required' 
      }, { status: 400 });
    }

    // Validate that the class, subject, and timetable slot belong to the user
    const [userClass] = await db
      .select()
      .from(classes)
      .where(and(eq(classes.id, parseInt(classId)), eq(classes.userId, user.id)))
      .limit(1);

    if (!userClass) {
      console.log('Class validation failed:', { classId, userId: user.id });
      return Response.json({ error: 'Class not found or does not belong to user' }, { status: 404 });
    }

    const [userSubject] = await db
      .select()
      .from(subjects)
      .where(and(eq(subjects.id, parseInt(subjectId)), eq(subjects.userId, user.id)))
      .limit(1);

    if (!userSubject) {
      console.log('Subject validation failed:', { subjectId, userId: user.id });
      return Response.json({ error: 'Subject not found or does not belong to user' }, { status: 404 });
    }

    const [userTimetableSlot] = await db
      .select()
      .from(timetableSlots)
      .where(and(eq(timetableSlots.id, parseInt(timetableSlotId)), eq(timetableSlots.userId, user.id)))
      .limit(1);

    if (!userTimetableSlot) {
      console.log('Timetable slot validation failed:', { timetableSlotId, userId: user.id });
      return Response.json({ error: 'Timetable slot not found or does not belong to user' }, { status: 404 });
    }

    // Create the new lesson
    console.log('Inserting lesson with values:', {
      userId: user.id,
      classId: parseInt(classId),
      subjectId: parseInt(subjectId),
      timetableSlotId: parseInt(timetableSlotId),
      title,
      date: date,
      lessonPlan: lessonPlan || null,
      planCompleted: 0,
      color: color || null,
    });

    const [newLesson] = await db
      .insert(lessons)
      .values({
        userId: user.id,
        classId: parseInt(classId),
        subjectId: parseInt(subjectId),
        timetableSlotId: parseInt(timetableSlotId),
        title,
        date: date,
        lessonPlan: lessonPlan || null,
        planCompleted: 0,
        color: color || null,
      })
      .returning();

    console.log('Lesson created successfully:', newLesson);
    return Response.json(newLesson, { status: 201 });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return Response.json({ error: 'Failed to create lesson' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, classId, subjectId, timetableSlotId, title, date, lessonPlan, color } = body;

    if (!id) {
      return Response.json({ error: 'Lesson ID is required' }, { status: 400 });
    }

    // Check if lesson exists and belongs to user
    const [existingLesson] = await db
      .select()
      .from(lessons)
      .where(and(eq(lessons.id, parseInt(id)), eq(lessons.userId, user.id)))
      .limit(1);

    if (!existingLesson) {
      return Response.json({ error: 'Lesson not found or does not belong to user' }, { status: 404 });
    }

    // Update the lesson
    const [updatedLesson] = await db
      .update(lessons)
      .set({
        classId: parseInt(classId),
        subjectId: parseInt(subjectId),
        timetableSlotId: parseInt(timetableSlotId),
        title,
        date,
        lessonPlan: lessonPlan || null,
        color: color || null,
      })
      .where(and(eq(lessons.id, parseInt(id)), eq(lessons.userId, user.id)))
      .returning();

    return Response.json(updatedLesson);
  } catch (error) {
    console.error('Error updating lesson:', error);
    return Response.json({ error: 'Failed to update lesson' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, planCompleted } = body;

    if (!id) {
      return Response.json({ error: 'Lesson ID is required' }, { status: 400 });
    }

    // Check if lesson exists and belongs to user
    const [existingLesson] = await db
      .select()
      .from(lessons)
      .where(and(eq(lessons.id, parseInt(id)), eq(lessons.userId, user.id)))
      .limit(1);

    if (!existingLesson) {
      return Response.json({ error: 'Lesson not found or does not belong to user' }, { status: 404 });
    }

    // Update the lesson completion status
    const [updatedLesson] = await db
      .update(lessons)
      .set({
        planCompleted: planCompleted ? 1 : 0,
      })
      .where(and(eq(lessons.id, parseInt(id)), eq(lessons.userId, user.id)))
      .returning();

    return Response.json(updatedLesson);
  } catch (error) {
    console.error('Error updating lesson completion:', error);
    return Response.json({ error: 'Failed to update lesson completion' }, { status: 500 });
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
      return Response.json({ error: 'Lesson ID is required' }, { status: 400 });
    }

    // Check if lesson exists and belongs to user
    const [existingLesson] = await db
      .select()
      .from(lessons)
      .where(and(eq(lessons.id, parseInt(id)), eq(lessons.userId, user.id)))
      .limit(1);

    if (!existingLesson) {
      return Response.json({ error: 'Lesson not found or does not belong to user' }, { status: 404 });
    }

    // Delete the lesson
    await db
      .delete(lessons)
      .where(and(eq(lessons.id, parseInt(id)), eq(lessons.userId, user.id)));

    return Response.json({ message: 'Lesson deleted successfully' });
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return Response.json({ error: 'Failed to delete lesson' }, { status: 500 });
  }
} 