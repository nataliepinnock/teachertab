import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { events } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { eq, and } from 'drizzle-orm';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const eventId = parseInt(resolvedParams.id);
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    const body = await request.json();
    const { title, description, location, startTime, endTime, allDay } = body;

    if (!title || !startTime) {
      return NextResponse.json(
        { error: 'Title and start time are required' },
        { status: 400 }
      );
    }

    // For all-day events, if no end time is provided, use the start time
    let finalEndTime = endTime;
    if (allDay && !endTime) {
      finalEndTime = startTime;
    }

    // Check if the event belongs to the user
    const existingEvent = await db.query.events.findFirst({
      where: and(
        eq(events.id, eventId),
        eq(events.userId, session.user.id)
      ),
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const [updatedEvent] = await db
      .update(events)
      .set({
        title,
        description,
        location,
        startTime: new Date(startTime),
        endTime: new Date(finalEndTime),
        allDay: allDay ? 1 : 0,
      })
      .where(
        and(
          eq(events.id, eventId),
          eq(events.userId, session.user.id)
        )
      )
      .returning();

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const resolvedParams = await params;
    const eventId = parseInt(resolvedParams.id);
    if (isNaN(eventId)) {
      return NextResponse.json({ error: 'Invalid event ID' }, { status: 400 });
    }

    // Check if the event belongs to the user
    const existingEvent = await db.query.events.findFirst({
      where: and(
        eq(events.id, eventId),
        eq(events.userId, session.user.id)
      ),
    });

    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    await db
      .delete(events)
      .where(
        and(
          eq(events.id, eventId),
          eq(events.userId, session.user.id)
        )
      );

    return NextResponse.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
} 