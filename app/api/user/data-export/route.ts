import { eq, isNull, and } from 'drizzle-orm';
import { db } from '@/lib/db/drizzle';
import { 
  users, 
  classes, 
  subjects, 
  timetableSlots, 
  timetableEntries, 
  timetableActivities,
  lessons, 
  tasks, 
  events, 
  academicYears, 
  holidays 
} from '@/lib/db/schema';
import { getUser } from '@/lib/db/queries';

// Helper function to convert array of objects to CSV
function arrayToCSV(data: any[]): string {
  if (!data || data.length === 0) {
    return 'No data available';
  }

  // Get all unique keys from all objects
  const allKeys = new Set<string>();
  data.forEach(obj => {
    Object.keys(obj).forEach(key => allKeys.add(key));
  });
  const headers = Array.from(allKeys);

  // Create CSV rows
  const rows = [
    headers.join(','), // Header row
    ...data.map(obj => {
      return headers.map(header => {
        const value = obj[header];
        if (value === null || value === undefined) {
          return '';
        }
        // Escape commas and quotes in values
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    })
  ];

  return rows.join('\n');
}

export async function GET() {
  const user = await getUser();
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch all user data
    const [
      userData,
      userClasses,
      userSubjects,
      userTimetableSlots,
      userTimetableEntries,
      userTimetableActivities,
      userLessons,
      userTasks,
      userEvents,
      userAcademicYears,
      userHolidays,
    ] = await Promise.all([
      // User account data (excluding password hash)
      db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          teachingPhase: users.teachingPhase,
          colorPreference: users.colorPreference,
          timetableCycle: users.timetableCycle,
          location: users.location,
          stripeCustomerId: users.stripeCustomerId,
          planName: users.planName,
          subscriptionStatus: users.subscriptionStatus,
          marketingEmails: users.marketingEmails,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1),
      
      // Classes
      db
        .select()
        .from(classes)
        .where(eq(classes.userId, user.id)),
      
      // Subjects
      db
        .select()
        .from(subjects)
        .where(eq(subjects.userId, user.id)),
      
      // Timetable slots
      db
        .select()
        .from(timetableSlots)
        .where(eq(timetableSlots.userId, user.id)),
      
      // Timetable entries
      db
        .select()
        .from(timetableEntries)
        .where(eq(timetableEntries.userId, user.id)),
      
      // Timetable activities
      db
        .select()
        .from(timetableActivities)
        .where(eq(timetableActivities.userId, user.id)),
      
      // Lessons
      db
        .select()
        .from(lessons)
        .where(eq(lessons.userId, user.id)),
      
      // Tasks (excluding deleted)
      db
        .select()
        .from(tasks)
        .where(and(
          eq(tasks.userId, user.id),
          isNull(tasks.deletedAt)
        )),
      
      // Events
      db
        .select()
        .from(events)
        .where(eq(events.userId, user.id)),
      
      // Academic years
      db
        .select()
        .from(academicYears)
        .where(eq(academicYears.userId, user.id)),
      
      // Holidays
      db
        .select()
        .from(holidays)
        .where(eq(holidays.userId, user.id)),
    ]);

    // Build CSV content with all data sections
    const csvSections: string[] = [];
    
    // Add export info
    csvSections.push('=== EXPORT INFO ===');
    csvSections.push(arrayToCSV([{
      'Export Date': new Date().toISOString(),
      'User Email': user.email,
      'User Name': user.name || '',
    }]));
    csvSections.push('');

    // Add all data sections
    if (userData.length > 0) {
      csvSections.push('=== ACCOUNT ===');
      csvSections.push(arrayToCSV(userData));
      csvSections.push('');
    }
    if (userClasses.length > 0) {
      csvSections.push('=== CLASSES ===');
      csvSections.push(arrayToCSV(userClasses));
      csvSections.push('');
    }
    if (userSubjects.length > 0) {
      csvSections.push('=== SUBJECTS ===');
      csvSections.push(arrayToCSV(userSubjects));
      csvSections.push('');
    }
    if (userTimetableSlots.length > 0) {
      csvSections.push('=== TIMETABLE SLOTS ===');
      csvSections.push(arrayToCSV(userTimetableSlots));
      csvSections.push('');
    }
    if (userTimetableEntries.length > 0) {
      csvSections.push('=== TIMETABLE ENTRIES ===');
      csvSections.push(arrayToCSV(userTimetableEntries));
      csvSections.push('');
    }
    if (userTimetableActivities.length > 0) {
      csvSections.push('=== TIMETABLE ACTIVITIES ===');
      csvSections.push(arrayToCSV(userTimetableActivities));
      csvSections.push('');
    }
    if (userLessons.length > 0) {
      csvSections.push('=== LESSONS ===');
      csvSections.push(arrayToCSV(userLessons));
      csvSections.push('');
    }
    if (userTasks.length > 0) {
      csvSections.push('=== TASKS ===');
      csvSections.push(arrayToCSV(userTasks));
      csvSections.push('');
    }
    if (userEvents.length > 0) {
      csvSections.push('=== EVENTS ===');
      csvSections.push(arrayToCSV(userEvents));
      csvSections.push('');
    }
    if (userAcademicYears.length > 0) {
      csvSections.push('=== ACADEMIC YEARS ===');
      csvSections.push(arrayToCSV(userAcademicYears));
      csvSections.push('');
    }
    if (userHolidays.length > 0) {
      csvSections.push('=== HOLIDAYS ===');
      csvSections.push(arrayToCSV(userHolidays));
      csvSections.push('');
    }

    // Combine all sections into a single CSV
    const csvContent = csvSections.join('\n');

    // Return as CSV file with proper headers for download
    const filename = `teachertab-data-export-${new Date().toISOString().split('T')[0]}.csv`;
    
    return new Response(csvContent, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    return Response.json({ error: 'Failed to export data' }, { status: 500 });
  }
}

