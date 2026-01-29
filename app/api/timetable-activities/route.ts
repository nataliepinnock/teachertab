import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { timetableActivities } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUser } from '@/lib/db/queries';

// GET /api/timetable-activities - Get all timetable activities for the user
export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const activities = await db
      .select()
      .from(timetableActivities)
      .where(eq(timetableActivities.userId, user.id));

    return NextResponse.json(activities);
  } catch (error) {
    console.error('Error fetching timetable activities:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch timetable activities', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/timetable-activities - Create a new timetable activity
export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
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

    if (!timetableSlotId || !activityType || !title || !dayOfWeek) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if an activity already exists for this timetable slot
    const existingActivity = await db
      .select()
      .from(timetableActivities)
      .where(
        and(
          eq(timetableActivities.timetableSlotId, parseInt(timetableSlotId)),
          eq(timetableActivities.userId, user.id)
        )
      )
      .limit(1);

    if (existingActivity.length > 0) {
      return NextResponse.json(
        { error: 'This timetable slot already has an activity assigned. Please edit or delete the existing activity first.' },
        { status: 400 }
      );
    }

    const newActivity = await db
      .insert(timetableActivities)
      .values({
        userId: user.id,
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
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 });
    }

    // Verify the activity belongs to the user
    const existingActivity = await db
      .select()
      .from(timetableActivities)
      .where(and(eq(timetableActivities.id, id), eq(timetableActivities.userId, user.id)))
      .limit(1);

    if (existingActivity.length === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
    }

    // If timetableSlotId is being changed, check if the new slot already has an activity
    if (updateData.timetableSlotId && updateData.timetableSlotId !== existingActivity[0].timetableSlotId) {
      const conflictingActivity = await db
        .select()
        .from(timetableActivities)
        .where(
          and(
            eq(timetableActivities.timetableSlotId, parseInt(updateData.timetableSlotId)),
            eq(timetableActivities.userId, user.id)
          )
        )
        .limit(1);

      if (conflictingActivity.length > 0) {
        return NextResponse.json(
          { error: 'The selected timetable slot already has an activity assigned. Please choose a different slot or delete the existing activity first.' },
          { status: 400 }
        );
      }
    }

    // Handle date conversion and type conversion for updateData
    const processedUpdateData: any = { ...updateData };
    
    // Convert timetableSlotId to integer if present
    if (processedUpdateData.timetableSlotId !== undefined) {
      processedUpdateData.timetableSlotId = parseInt(processedUpdateData.timetableSlotId);
    }
    
    // Convert weekNumber to integer if present
    if (processedUpdateData.weekNumber !== undefined) {
      processedUpdateData.weekNumber = parseInt(processedUpdateData.weekNumber) || 1;
    }
    
    // Convert dates
    if (processedUpdateData.startDate) {
      processedUpdateData.startDate = new Date(processedUpdateData.startDate);
    }
    if (processedUpdateData.endDate) {
      processedUpdateData.endDate = new Date(processedUpdateData.endDate);
    }
    
    // Remove userId if present (shouldn't be in update data)
    delete processedUpdateData.userId;

    const updatedActivity = await db
      .update(timetableActivities)
      .set({
        ...processedUpdateData,
        updatedAt: new Date()
      })
      .where(and(eq(timetableActivities.id, id), eq(timetableActivities.userId, user.id)))
      .returning();

    return NextResponse.json(updatedActivity[0]);
  } catch (error) {
    console.error('Error updating timetable activity:', error);
    return NextResponse.json({ error: 'Failed to update timetable activity' }, { status: 500 });
  }
}

// DELETE /api/timetable-activities - Delete a timetable activity
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 });
    }

    const deletedActivity = await db
      .delete(timetableActivities)
      .where(and(eq(timetableActivities.id, parseInt(id)), eq(timetableActivities.userId, user.id)))
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
