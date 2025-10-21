import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { events } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';

// Helper function to generate recurring events
function generateRecurringEvents(
  baseEvent: {
    title: string;
    description?: string;
    location?: string;
    startTime: Date;
    endTime: Date;
    allDay: boolean;
    color?: string;
    userId: number;
  },
  recurrenceType: string,
  recurrenceEndDate?: Date
): Array<typeof baseEvent & { recurrenceType: string; isRecurring: boolean; parentEventId?: number }> {
  const recurringEvents = [];
  const startDate = new Date(baseEvent.startTime);
  const endDate = new Date(baseEvent.endTime);
  const duration = endDate.getTime() - startDate.getTime();
  
  let currentDate = new Date(startDate);
  const maxDate = recurrenceEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now if no end date
  
  let eventCount = 0;
  const maxEvents = 100; // Safety limit
  
  while (currentDate <= maxDate && eventCount < maxEvents) {
    const eventStartTime = new Date(currentDate);
    const eventEndTime = new Date(currentDate.getTime() + duration);
    
    recurringEvents.push({
      ...baseEvent,
      startTime: eventStartTime,
      endTime: eventEndTime,
      recurrenceType,
      isRecurring: true,
      parentEventId: undefined, // Will be set after parent is created
    });
    
    // Calculate next occurrence
    switch (recurrenceType) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + 1);
        break;
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7);
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'week1':
        // For 2-week cycle, find next Week 1 occurrence
        // This is a simplified implementation - in practice, you'd need to know the academic calendar
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      case 'week2':
        // For 2-week cycle, find next Week 2 occurrence
        currentDate.setDate(currentDate.getDate() + 14);
        break;
      default:
        break;
    }
    
    eventCount++;
  }
  
  return recurringEvents;
}

export async function GET() {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEvents = await db.query.events.findMany({
      where: eq(events.userId, session.user.id),
      orderBy: (events, { asc }) => [asc(events.startTime)],
    });

    console.log('Events API - Found events:', userEvents.length);
    console.log('Events API - Sample event:', userEvents[0]);
    console.log('Events API - Event fields:', userEvents.length > 0 ? Object.keys(userEvents[0]) : 'No events');

    return NextResponse.json(userEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, location, startTime, endTime, allDay, color, isRecurring, recurrenceType, recurrenceEndDate } = body;

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

    const baseEvent = {
      userId: session.user.id,
      title,
      description,
      location,
      startTime: new Date(startTime),
      endTime: new Date(finalEndTime),
      allDay: allDay ? 1 : 0,
      color: color || null,
    };

    if (isRecurring && recurrenceType) {
      try {
        // Create recurring events
        const recurringEvents = generateRecurringEvents(
          baseEvent,
          recurrenceType,
          recurrenceEndDate ? new Date(recurrenceEndDate) : undefined
        );

        console.log('Events API - Generated recurring events:', { 
          count: recurringEvents.length, 
          recurrenceType,
          baseEvent: { title: baseEvent.title, startTime: baseEvent.startTime }
        });

        // Create the first event as the parent
        const [parentEvent] = await db
          .insert(events)
          .values({
            ...baseEvent,
            isRecurring: 1,
            recurrenceType,
            recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate) : null,
          })
          .returning();

        // Create child events
        const childEvents = recurringEvents.slice(1).map(event => ({
          ...event,
          parentEventId: parentEvent.id,
          isRecurring: 1, // Convert boolean to number for database
        }));

        if (childEvents.length > 0) {
          await db.insert(events).values(childEvents);
        }

        console.log('Events API - Created recurring event series:', { 
          parentId: parentEvent.id, 
          title: parentEvent.title, 
          recurrenceType,
          childCount: childEvents.length 
        });

        return NextResponse.json(parentEvent, { status: 201 });
      } catch (error) {
        console.error('Events API - Error creating recurring events:', error);
        return NextResponse.json(
          { error: 'Failed to create recurring events', details: error.message },
          { status: 500 }
        );
      }
    } else {
      // Create single event
      const [newEvent] = await db
        .insert(events)
        .values({
          ...baseEvent,
          isRecurring: 0,
          recurrenceType: null,
          recurrenceEndDate: null,
        })
        .returning();

      console.log('Events API - Created event:', { id: newEvent.id, title: newEvent.title, color: newEvent.color });

      return NextResponse.json(newEvent, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, title, description, location, startTime, endTime, allDay, color, isRecurring, recurrenceType, recurrenceEndDate } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Verify the event belongs to the user
    const existingEvent = await db.query.events.findFirst({
      where: eq(events.id, parseInt(id)),
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (existingEvent.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this event' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (startTime !== undefined) updateData.startTime = new Date(startTime);
    if (endTime !== undefined) updateData.endTime = new Date(endTime);
    if (allDay !== undefined) updateData.allDay = allDay ? 1 : 0;
    if (color !== undefined) updateData.color = color;
    if (isRecurring !== undefined) updateData.isRecurring = isRecurring ? 1 : 0;
    if (recurrenceType !== undefined) updateData.recurrenceType = recurrenceType;
    if (recurrenceEndDate !== undefined) updateData.recurrenceEndDate = recurrenceEndDate ? new Date(recurrenceEndDate) : null;

    const [updatedEvent] = await db
      .update(events)
      .set(updateData)
      .where(eq(events.id, parseInt(id)))
      .returning();

    console.log('Events API - Updated event:', { 
      id: updatedEvent.id, 
      title: updatedEvent.title, 
      color: updatedEvent.color,
      updatedFields: Object.keys(updateData)
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    return NextResponse.json(
      { error: 'Failed to update event' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Verify the event belongs to the user
    const existingEvent = await db.query.events.findFirst({
      where: eq(events.id, parseInt(id)),
    });

    if (!existingEvent) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    if (existingEvent.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this event' },
        { status: 403 }
      );
    }

    await db
      .delete(events)
      .where(eq(events.id, parseInt(id)));

    console.log('Events API - Deleted event:', { id: parseInt(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting event:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
} 