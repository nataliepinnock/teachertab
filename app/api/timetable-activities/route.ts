import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { timetableActivities } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/timetable-activities - Get all timetable activities for the user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || '1'; // Default to user 1 for now
    
    console.log('Fetching timetable activities for userId:', userId);

    const activities = await db
      .select()
      .from(timetableActivities)
      .where(eq(timetableActivities.userId, parseInt(userId)));

    console.log('Found activities:', activities.length);
    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching timetable activities:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    return NextResponse.json({ 
      error: 'Failed to fetch timetable activities', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/timetable-activities - Create a new timetable activity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      timetableSlotId,
      activityType,
      title,
      description,
      location,
      color,
      dayOfWeek,
      weekNumber,
      startDate,
      endDate,
      notes
    } = body;

    if (!userId || !timetableSlotId || !activityType || !title || !dayOfWeek) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newActivity = await db
      .insert(timetableActivities)
      .values({
        userId: parseInt(userId),
        timetableSlotId: parseInt(timetableSlotId),
        activityType,
        title,
        description,
        location,
        color,
        dayOfWeek,
        weekNumber: weekNumber || 1,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        notes
      })
      .returning();

    return NextResponse.json(newActivity[0], { status: 201 });
  } catch (error) {
    console.error('Error creating timetable activity:', error);
    return NextResponse.json({ error: 'Failed to create timetable activity' }, { status: 500 });
  }
}

// PUT /api/timetable-activities - Update a timetable activity
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 });
    }

    // Handle date conversion for updateData
    const processedUpdateData = { ...updateData };
    if (processedUpdateData.startDate) {
      processedUpdateData.startDate = new Date(processedUpdateData.startDate);
    }
    if (processedUpdateData.endDate) {
      processedUpdateData.endDate = new Date(processedUpdateData.endDate);
    }

    const updatedActivity = await db
      .update(timetableActivities)
      .set({
        ...processedUpdateData,
        updatedAt: new Date()
      })
      .where(eq(timetableActivities.id, id))
      .returning();

    if (updatedActivity.length === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    return NextResponse.json(updatedActivity[0]);
  } catch (error) {
    console.error('Error updating timetable activity:', error);
    return NextResponse.json({ error: 'Failed to update timetable activity' }, { status: 500 });
  }
}

// DELETE /api/timetable-activities - Delete a timetable activity
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 });
    }

    const deletedActivity = await db
      .delete(timetableActivities)
      .where(eq(timetableActivities.id, parseInt(id)))
      .returning();

    if (deletedActivity.length === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    console.error('Error deleting timetable activity:', error);
    return NextResponse.json({ error: 'Failed to delete timetable activity' }, { status: 500 });
  }
}
