import { db } from '@/lib/db/drizzle';
import { timetableSlots, timetableEntries, classes, subjects } from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';
import { eq } from 'drizzle-orm';

export async function POST() {
  const user = await getUser();
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Creating test timetable data for user:', user.id);
    
    // First, let's check if we have classes and subjects
    const existingClasses = await db.select().from(classes).where(eq(classes.userId, user.id)).limit(1);
    const existingSubjects = await db.select().from(subjects).where(eq(subjects.userId, user.id)).limit(1);
    
    if (existingClasses.length === 0 || existingSubjects.length === 0) {
      return Response.json({ error: 'No classes or subjects found. Please create some first.' }, { status: 400 });
    }
    
    const classId = existingClasses[0].id;
    const subjectId = existingSubjects[0].id;
    
    console.log('Using class:', existingClasses[0].name, 'and subject:', existingSubjects[0].name);
    
    // Create test timetable slots for Week 1
    const week1Slots = [
      { dayOfWeek: 'Monday', weekNumber: 1, startTime: '09:00', endTime: '10:00', label: 'Period 1' },
      { dayOfWeek: 'Monday', weekNumber: 1, startTime: '10:00', endTime: '11:00', label: 'Period 2' },
      { dayOfWeek: 'Tuesday', weekNumber: 1, startTime: '09:00', endTime: '10:00', label: 'Period 1' },
      { dayOfWeek: 'Tuesday', weekNumber: 1, startTime: '10:00', endTime: '11:00', label: 'Period 2' },
      { dayOfWeek: 'Wednesday', weekNumber: 1, startTime: '09:00', endTime: '10:00', label: 'Period 1' },
    ];
    
    // Create test timetable slots for Week 2
    const week2Slots = [
      { dayOfWeek: 'Monday', weekNumber: 2, startTime: '09:00', endTime: '10:00', label: 'Period 1' },
      { dayOfWeek: 'Monday', weekNumber: 2, startTime: '10:00', endTime: '11:00', label: 'Period 2' },
      { dayOfWeek: 'Tuesday', weekNumber: 2, startTime: '09:00', endTime: '10:00', label: 'Period 1' },
      { dayOfWeek: 'Tuesday', weekNumber: 2, startTime: '10:00', endTime: '11:00', label: 'Period 2' },
      { dayOfWeek: 'Wednesday', weekNumber: 2, startTime: '09:00', endTime: '10:00', label: 'Period 1' },
    ];
    
    const allSlots = [...week1Slots, ...week2Slots];
    
    // Insert timetable slots
    const createdSlots = await db.insert(timetableSlots).values(
      allSlots.map(slot => ({
        userId: user.id,
        ...slot
      }))
    ).returning();
    
    console.log('Created', createdSlots.length, 'timetable slots');
    
    // Create some timetable entries (assign classes/subjects to some slots)
    const entries = [
      { slotId: createdSlots[0].id, classId, subjectId, room: 'Room A' },
      { slotId: createdSlots[2].id, classId, subjectId, room: 'Room B' },
      { slotId: createdSlots[4].id, classId, subjectId, room: 'Room C' },
      // Leave some slots unassigned to create unfinished lessons
    ];
    
    const createdEntries = await db.insert(timetableEntries).values(
      entries.map(entry => ({
        userId: user.id,
        timetableSlotId: entry.slotId,
        classId: entry.classId,
        subjectId: entry.subjectId,
        dayOfWeek: createdSlots.find(s => s.id === entry.slotId)?.dayOfWeek,
        weekNumber: createdSlots.find(s => s.id === entry.slotId)?.weekNumber,
        room: entry.room,
        startDate: '2025-09-01',
        endDate: '2026-07-31'
      }))
    ).returning();
    
    console.log('Created', createdEntries.length, 'timetable entries');
    
    return Response.json({ 
      message: 'Test timetable data created successfully!',
      slotsCreated: createdSlots.length,
      entriesCreated: createdEntries.length
    });
    
  } catch (error) {
    console.error('Error creating test timetable:', error);
    return Response.json({ error: 'Failed to create test timetable data' }, { status: 500 });
  }
}
