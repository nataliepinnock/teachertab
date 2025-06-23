import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db/drizzle';
import { events } from '@/lib/db/schema';
import { getSession } from '@/lib/auth/session';
import { eq } from 'drizzle-orm';

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
    const { title, description, location, startTime, endTime, allDay } = body;

    if (!title || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Title, start time, and end time are required' },
        { status: 400 }
      );
    }

    const [newEvent] = await db
      .insert(events)
      .values({
        userId: session.user.id,
        title,
        description,
        location,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        allDay: allDay ? 1 : 0,
      })
      .returning();

    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    console.error('Error creating event:', error);
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
} 