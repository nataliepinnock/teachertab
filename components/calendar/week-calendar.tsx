'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, BookOpen, Users, X, MoreHorizontal } from 'lucide-react';
import useSWR from 'swr';
import { Event, Lesson, Class, Subject, User } from '@/lib/db/schema';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';

// Extended lesson type with timetable slot data from API
interface LessonWithSlot extends Lesson {
  slotStartTime?: string;
  slotEndTime?: string;
  slotLabel?: string;
  slotPeriod?: number;
  slotWeekNumber?: number;
  className?: string;
  classColor?: string;
  subjectName?: string;
  subjectColor?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    const error: any = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object.
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }

  return res.json();
};

interface CalendarEvent {
  id: string;
  title: string;
  type: 'lesson' | 'event';
  startTime: Date;
  endTime: Date;
  location?: string;
  description?: string;
  class?: string;
  subject?: string;
  color?: string;
  allDay?: boolean;
}

function EventModal({ event, onClose }: { event: CalendarEvent; onClose: () => void }) {
  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              {event.type === 'lesson' ? (
                <BookOpen className="h-5 w-5 mr-2" />
              ) : (
                <Calendar className="h-5 w-5 mr-2" />
              )}
              {event.title}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center text-sm text-gray-600">
            <Clock className="h-4 w-4 mr-2" />
            {formatDateTime(event.startTime)} - {formatDateTime(event.endTime)}
          </div>
          
          {event.location && (
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-2" />
              {event.location}
            </div>
          )}
          
          {event.type === 'lesson' && event.class && (
            <div className="flex items-center text-sm text-gray-600">
              <Users className="h-4 w-4 mr-2" />
              {event.class}
            </div>
          )}
          
          {event.type === 'lesson' && event.subject && (
            <div className="flex items-center text-sm text-gray-600">
              <BookOpen className="h-4 w-4 mr-2" />
              {event.subject}
            </div>
          )}
          
          {event.description && (
            <div>
              <h4 className="font-medium text-sm mb-2">Description</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}
          
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CalendarSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-none items-center justify-between border-b border-gray-200 px-6 py-4">
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
        <div className="flex items-center space-x-2">
          <div className="h-9 w-20 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-9 w-9 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </header>
      <div className="isolate flex flex-auto flex-col overflow-auto bg-white">
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
}

interface WeekCalendarProps {
  onAddEvent?: () => void;
  className?: string;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
}

function DraggableEvent({ event, user }: { event: CalendarEvent, user: User }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: event.id,
    data: { event },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
  } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <button
        onClick={() => { /* we might need to handle click separately from drag */ }}
        className="group absolute inset-1 flex flex-col overflow-y-auto rounded-lg p-2 text-xs/5 transition-colors"
        style={{
          backgroundColor: `${event.color}1A`, // ~10% opacity
          borderLeft: `4px solid ${event.color}`,
        }}
      >
        <p className="order-1 font-semibold text-gray-900 truncate">{event.title}</p>
        {event.type === 'lesson' && (
          <p className="text-gray-500 truncate">
            {user.teacherType === 'primary' ? event.subject : event.class}
          </p>
        )}
      </button>
    </div>
  );
}

export function WeekCalendar({ onAddEvent, className = '', currentDate: externalCurrentDate, onDateChange }: WeekCalendarProps) {
  const [currentDate, setCurrentDate] = useState(externalCurrentDate || new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [view, setView] = useState<'week' | 'month'>('week');
  
  const container = useRef<HTMLDivElement>(null);
  const containerNav = useRef<HTMLDivElement>(null);
  const containerOffset = useRef<HTMLDivElement>(null);
  const gridAreaRef = useRef<HTMLDivElement>(null);
  
  const { data: events, error: eventsError } = useSWR<Event[]>('/api/events', fetcher);
  const { data: lessons, error: lessonsError } = useSWR<LessonWithSlot[]>('/api/lessons', fetcher);
  const { data: classes, error: classesError } = useSWR<Class[]>('/api/classes', fetcher);
  const { data: subjects, error: subjectsError } = useSWR<Subject[]>('/api/subjects', fetcher);
  const { data: user, error: userError } = useSWR<User>('/api/user', fetcher);

  // Update internal state when external date changes
  useEffect(() => {
    if (externalCurrentDate) {
      setCurrentDate(externalCurrentDate);
    }
  }, [externalCurrentDate]);

  // Notify parent when internal date changes
  const updateDate = (newDate: Date) => {
    setCurrentDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
  };

  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    return start;
  };

  const weekDates = useMemo(() => {
    const start = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
  }, [currentDate]);

  // This effect will initialize and update the calendar events state
  // when the data from SWR changes.
  useEffect(() => {
    if (!events || !lessons || !classes || !subjects) {
      setCalendarEvents([]);
      return;
    }

    const initialEvents: CalendarEvent[] = [];
    
    lessons.forEach(lesson => {
      const lessonDate = new Date(lesson.date);
      if (lessonDate >= weekDates[0] && lessonDate <= weekDates[6]) {
        const lClassInfo = classes.find(c => c.id === lesson.classId);
        const lSubjectInfo = subjects.find(s => s.id === lesson.subjectId);
        
        const lDatePart = lesson.date.split('T')[0];
        const [lYear, lMonth, lDay] = lDatePart.split('-').map(Number);
        const [lStartHour, lStartMinute] = (lesson.slotStartTime || '09:00').split(':').map(Number);
        const [lEndHour, lEndMinute] = (lesson.slotEndTime || '10:00').split(':').map(Number);
  
        const lStartTime = new Date(lYear, lMonth - 1, lDay, lStartHour, lStartMinute);
        const lEndTime = new Date(lYear, lMonth - 1, lDay, lEndHour, lEndMinute);
        
        initialEvents.push({
          id: `lesson-${lesson.id}`,
          title: lesson.title,
          type: 'lesson',
          startTime: lStartTime,
          endTime: lEndTime,
          location: 'Classroom',
          description: lesson.lessonPlan || undefined,
          class: lClassInfo?.name || undefined,
          subject: lSubjectInfo?.name || undefined,
          color: lSubjectInfo?.color || '#4F46E5',
          allDay: false,
        });
      }
    });

    events.forEach(event => {
      initialEvents.push({
        id: `event-${event.id}`,
        title: event.title,
        type: 'event',
        startTime: new Date(event.startTime.toString()),
        endTime: new Date(event.endTime.toString()),
        location: event.location || undefined,
        description: event.description || undefined,
        color: '#8B5CF6',
        allDay: !!(event as any).allDay,
      });
    });

    setCalendarEvents(initialEvents);

  }, [events, lessons, classes, subjects, weekDates]);

  const allDayEvents = useMemo(() => {
    return calendarEvents.filter(event => event.allDay);
  }, [calendarEvents]);

  const timedEvents = useMemo(() => {
    return calendarEvents.filter(event => !event.allDay);
  }, [calendarEvents]);

  function handleDragEnd({ active, delta }: any) {
    const eventId = active.id;
    const { event } = active.data.current;

    const gridArea = gridAreaRef.current;
    if (!gridArea) return;

    // Calculate rem to pixels for the header offset
    const remInPixels = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const headerHeightInPixels = 1.75 * remInPixels;

    const dayWidth = gridArea.offsetWidth / 7;
    // The usable height for events is the total height minus the all-day header
    const calendarHeight = gridArea.offsetHeight - headerHeightInPixels;
    const minuteHeight = calendarHeight / (24 * 60);

    // Calculate the change in days and minutes
    const daysDragged = Math.round(delta.x / dayWidth);

    // Snap to nearest 15 minutes
    const rawMinutesDragged = delta.y / minuteHeight;
    const minutesDragged = Math.round(rawMinutesDragged / 15) * 15;

    // Update the event's start and end times
    const newStartTime = new Date(event.startTime);
    newStartTime.setDate(newStartTime.getDate() + daysDragged);
    newStartTime.setMinutes(newStartTime.getMinutes() + minutesDragged);

    const duration = event.endTime.getTime() - event.startTime.getTime();
    const newEndTime = new Date(newStartTime.getTime() + duration);

    // Optimistically update the UI
    setCalendarEvents(prevEvents => 
      prevEvents.map(e => 
        e.id === eventId 
          ? { ...e, startTime: newStartTime, endTime: newEndTime }
          : e
      )
    );

    // TODO: Persist the changes to the database via an API call
    console.log(`Event ${eventId} moved. New start time: ${newStartTime}`);
    // Example API call:
    // fetch(`/api/lessons/${eventId.split('-')[1]}`, {
    //   method: 'PATCH',
    //   body: JSON.stringify({ startTime: newStartTime, endTime: newEndTime }),
    // });
  }

  const getEventGridPosition = (event: CalendarEvent) => {
    const startHour = event.startTime.getHours();
    const startMinute = event.startTime.getMinutes();
    const endHour = event.endTime.getHours();
    const endMinute = event.endTime.getMinutes();
    
    // The grid is divided into 5-minute intervals. 1.75rem is for all-day header.
    // Total rows = 24 hours * 12 (5-min intervals) = 288
    const startRow = (startHour * 12 + startMinute / 5) + 2; // +2 to account for header row
    const endRow = (endHour * 12 + endMinute / 5) + 2;
    const duration = endRow - startRow;
    
    // getDay() returns 0 for Sunday, 1 for Monday, etc.
    // We want Monday to be column 1, and Sunday to be column 7.
    let dayColumn = event.startTime.getDay();
    if (dayColumn === 0) {
      dayColumn = 7; // Sunday
    }
    
    return { startRow, duration, dayColumn };
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    updateDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    updateDate(newDate);
  };

  const goToToday = () => {
    updateDate(new Date());
  };

  // Handle loading state
  if (!events || !lessons || !classes || !subjects || !user) {
    return <CalendarSkeleton />;
  }

  // Handle error state
  if (eventsError || lessonsError || classesError || subjectsError || userError) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Failed to load calendar data</p>
        </div>
      </div>
    );
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className={`flex h-full flex-col ${className}`}>
        <div ref={container} className="flex-1 overflow-auto bg-white">
          <div className="flex w-full flex-none flex-col">
            <div
              ref={containerNav}
              className="sticky top-0 z-30 flex-none bg-white shadow-sm ring-1 ring-black/5"
            >
              <div className="grid grid-cols-7 text-sm/6 text-gray-500 sm:hidden">
                {weekDates.map((date, index) => (
                  <button key={index} type="button" className="flex flex-col items-center pt-2 pb-3">
                    {date.toLocaleDateString('en-GB', { weekday: 'short' }).charAt(0)}{' '}
                    <span className={`mt-1 flex h-8 w-8 items-center justify-center font-semibold ${
                      date.toDateString() === new Date().toDateString()
                        ? 'rounded-full bg-indigo-600 text-white'
                        : 'text-gray-900'
                    }`}>
                      {date.getDate()}
                    </span>
                  </button>
                ))}
              </div>

              <div className="hidden sm:flex">
                <div className="w-14 flex-none" />
                <div className="flex-auto grid grid-cols-7 divide-x divide-gray-100 border-r border-gray-100 text-sm/6 text-gray-500">
                  {weekDates.map((date, index) => (
                    <div key={index} className="flex items-center justify-center py-3">
                      <span className="flex items-baseline">
                        {date.toLocaleDateString('en-GB', { weekday: 'short' })}{' '}
                        <span className={`ml-1.5 flex h-8 w-8 items-center justify-center font-semibold ${
                          date.toDateString() === new Date().toDateString()
                            ? 'rounded-full bg-indigo-600 text-white'
                            : 'text-gray-900'
                        }`}>
                          {date.getDate()}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden sm:flex border-t border-gray-100 min-h-[2.25rem]">
                <div className="w-14 flex-none flex items-center justify-center py-1 text-center text-xs font-semibold text-gray-500 border-r border-gray-100">
                  <span>All-day</span>
                </div>
                <div className="flex-auto grid grid-cols-7 divide-x divide-gray-100">
                  {weekDates.map((date, dateIndex) => (
                    <div key={dateIndex} className="relative flex flex-col gap-1 py-1">
                      {allDayEvents
                        .filter(
                          (event) => new Date(event.startTime).toDateString() === date.toDateString()
                        )
                        .map((event) => (
                          <button
                            key={event.id}
                            onClick={() => setSelectedEvent(event)}
                            className="group mx-1 flex items-center rounded-lg text-xs/5"
                            style={{
                              backgroundColor: `${event.color}1A`, // ~10% opacity
                              borderLeft: `4px solid ${event.color}`,
                            }}
                          >
                            <p className="min-w-0 flex-auto truncate px-2 py-1 font-semibold text-gray-900">
                              {event.title}
                            </p>
                          </button>
                        ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-auto">
              <div className="sticky left-0 z-10 w-14 flex-none bg-white ring-1 ring-gray-100" />
              <div ref={gridAreaRef} className="grid flex-auto grid-cols-1 grid-rows-1">
                {/* Horizontal lines */}
                <div
                  className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
                  style={{ gridTemplateRows: 'repeat(48, minmax(2rem, 1fr))' }}
                >
                  <div ref={containerOffset} className="row-end-1 h-7"></div>
                  {Array.from({ length: 48 }).map((_, i) => (
                    <div key={i} style={{ gridRow: `${i + 1} / span 1` }}>
                      <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                        {i % 2 === 0
                          ? i === 0
                            ? '12AM'
                            : i === 24
                            ? '12PM'
                            : i < 24
                            ? `${i / 2}AM`
                            : `${(i - 24) / 2}PM`
                          : ''}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Vertical lines */}
                <div className="col-start-1 col-end-2 row-start-1 hidden grid-cols-7 grid-rows-1 divide-x divide-gray-100 sm:grid sm:grid-cols-7">
                  <div className="col-start-1 row-span-full" />
                  <div className="col-start-2 row-span-full" />
                  <div className="col-start-3 row-span-full" />
                  <div className="col-start-4 row-span-full" />
                  <div className="col-start-5 row-span-full" />
                  <div className="col-start-6 row-span-full" />
                  <div className="col-start-7 row-span-full" />
                </div>

                {/* Events */}
                <ol
                  className="col-start-1 col-end-2 row-start-1 grid grid-cols-1 sm:grid-cols-7"
                  style={{ gridTemplateRows: '1.75rem repeat(288, minmax(0, 1fr)) auto' }}
                >
                  {timedEvents.map((event) => {
                    const position = getEventGridPosition(event);
                    return (
                      <li 
                        key={event.id} 
                        className="relative mt-px flex" 
                        style={{ 
                          gridRow: `${position.startRow} / span ${position.duration}`,
                          gridColumn: `${position.dayColumn} / span 1`
                        }}
                      >
                        <DraggableEvent event={event} user={user} />
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          </div>
        </div>

        {selectedEvent && (
          <EventModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </div>
    </DndContext>
  );
} 