'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import { Event, Lesson, Class, Subject, User } from '@/lib/db/schema';
import { useAcademicCalendar } from '@/lib/hooks/useAcademicCalendar';

// Function to lighten a hex color
function lightenColor(color: string, amount: number = 0.7): string {
  if (!color || !color.startsWith('#')) return color;
  
  const hex = color.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // Lighten by blending with white
  const lightenedR = Math.round(r + (255 - r) * amount);
  const lightenedG = Math.round(g + (255 - g) * amount);
  const lightenedB = Math.round(b + (255 - b) * amount);
  
  return `#${lightenedR.toString(16).padStart(2, '0')}${lightenedG.toString(16).padStart(2, '0')}${lightenedB.toString(16).padStart(2, '0')}`;
}

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, BookOpen, Users, X, Edit, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ColorPicker } from '@/components/ui/color-picker';
import { LessonModal } from '@/components/lesson-modal';

interface DayCalendarProps {
  className?: string;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  color: string;
  type: 'lesson' | 'event' | 'holiday';
  class?: string;
  location?: string;
  description?: string;
  holiday?: any;
  isMultiDay?: boolean;
  startDateStr?: string;
  endDateStr?: string;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export function DayCalendar({ className, currentDate, onDateChange }: DayCalendarProps) {
  const [editingLesson, setEditingLesson] = useState<CalendarEvent | null>(null);
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Fetch data
  const { data: events } = useSWR<Event[]>('/api/events', fetcher);
  const { data: lessons } = useSWR<Lesson[]>('/api/lessons', fetcher);
  const { data: classes } = useSWR<Class[]>('/api/classes', fetcher);
  const { data: subjects } = useSWR<Subject[]>('/api/subjects', fetcher);
  const { data: user } = useSWR<User>('/api/user', fetcher);

  // Academic calendar hook for holidays
  const { getHolidayEvents } = useAcademicCalendar();
  const holidayEvents = getHolidayEvents();

  // Auto-scroll to 8am when component mounts or date changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (timelineRef.current) {
        // 8am is at 8 hours * 5rem per hour = 40rem from top
        const scrollTo8am = 8 * 5 * 16; // 8 hours * 5rem/hour * 16px/rem
        timelineRef.current.scrollTop = scrollTo8am;
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentDate]);

  const calendarEvents = useMemo(() => {
    if (!events || !lessons || !classes || !subjects || 
        !Array.isArray(events) || !Array.isArray(lessons) || 
        !Array.isArray(classes) || !Array.isArray(subjects)) {
      return [];
    }

    const dateStr = currentDate.toISOString().split('T')[0];
    const allEvents: CalendarEvent[] = [];

    // Add events for the current date
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate.toISOString().split('T')[0] === dateStr;
    });

    dayEvents.forEach(event => {
      allEvents.push({
        id: `event-${event.id}`,
        title: event.title,
        startTime: new Date(`${event.date}T${event.startTime || '09:00'}`),
        endTime: new Date(`${event.date}T${event.endTime || '10:00'}`),
        color: event.color || '#6B7280',
        type: 'event',
        description: event.description,
        location: event.location
      });
    });

    // Add lessons for the current date
    const dayLessons = lessons.filter(lesson => {
      const lessonDate = new Date(lesson.startTime);
      return lessonDate.toISOString().split('T')[0] === dateStr;
    });

    dayLessons.forEach(lesson => {
      const lessonClass = classes.find(c => c.id === lesson.classId);
      const lessonSubject = subjects.find(s => s.id === lesson.subjectId);
      
      allEvents.push({
        id: `lesson-${lesson.id}`,
        title: lesson.title,
        startTime: new Date(lesson.startTime),
        endTime: new Date(lesson.endTime),
        color: lesson.color || lessonSubject?.color || lessonClass?.color || '#6B7280',
        type: 'lesson',
        class: lessonClass?.name,
        location: lesson.location || 'Classroom',
        description: lesson.description
      });
    });

    // Add holiday events for the current date
    const dayHolidays = holidayEvents.filter(holiday => {
      if (holiday.isMultiDay && holiday.startDateStr && holiday.endDateStr) {
        const currentDateStr = currentDate.toISOString().split('T')[0];
        return currentDateStr >= holiday.startDateStr && currentDateStr <= holiday.endDateStr;
      }
      
      const holidayDate = new Date(holiday.startTime);
      return holidayDate.toISOString().split('T')[0] === dateStr;
    });

    dayHolidays.forEach(holiday => {
      allEvents.push({
        id: `holiday-${holiday.id}`,
        title: holiday.title,
        startTime: holiday.startTime,
        endTime: holiday.endTime,
        color: holiday.color || '#10b981',
        type: 'holiday',
        description: holiday.description
      });
    });

    return allEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [events, lessons, classes, subjects, currentDate, holidayEvents]);

  if (!events || !lessons || !classes || !subjects || !user) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className={`flex flex-1 ${className}`}>
        {/* Scrollable timeline and time column */}
        <div className="flex-1 flex flex-col mr-4">
          <div ref={timelineRef} className="flex-auto overflow-y-auto min-h-0 flex flex-row">
            {/* Time column */}
            <div className="sticky left-0 z-10 w-16 flex-none bg-white ring-1 ring-gray-100" />
            {/* Event timeline */}
            <div className="flex-1 relative isolate">
              <div 
                className="grid grid-cols-1 divide-y divide-gray-100"
                style={{ gridTemplateRows: 'repeat(48, minmax(5rem, 1fr))' }}
              >
                <div className="row-end-1 h-7"></div>
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} style={{ gridRow: `${i + 1} / span 1` }}>
                    {i % 2 === 0 && (
                      <div className="sticky left-0 z-20 -mt-2.5 -ml-16 w-16 pr-2 text-right text-xs/5 text-gray-400">
                        {i === 0
                          ? '12AM'
                          : i / 2 === 12
                          ? '12PM'
                          : i / 2 > 12
                          ? `${Math.floor(i / 2) - 12}PM`
                          : `${Math.floor(i / 2)}AM`}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* Events using the same grid system as timetable setup */}
              <ol
                className="absolute inset-0 grid grid-cols-1"
                style={{ gridTemplateRows: '1.75rem repeat(288, minmax(0, 1fr)) auto' }}
              >
                {calendarEvents.map(event => {
                  const startHour = event.startTime.getHours();
                  const startMinute = event.startTime.getMinutes();
                  const endHour = event.endTime.getHours();
                  const endMinute = event.endTime.getMinutes();
                  
                  // Use the same calculation as timetable setup: 5-minute intervals
                  const startRow = (startHour * 12 + startMinute / 5) + 2; // +2 for header
                  const endRow = (endHour * 12 + endMinute / 5) + 2;
                  const duration = Math.max(2, endRow - startRow); // Minimum 2 intervals (10 minutes)
                  
                  return (
                    <li
                      key={event.id}
                      className="relative mt-px flex ml-2"
                      style={{
                        gridRow: `${startRow} / span ${duration}`,
                        gridColumn: '1 / span 1'
                      }}
                    >
                      <div className="group absolute inset-0 flex flex-col text-xs transition-colors bg-white border border-gray-200 shadow-sm hover:shadow-md rounded-md z-10 overflow-hidden px-2">
                        {/* Content */}
                        <div className="flex-1 min-w-0 py-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xs font-medium truncate flex-1">{event.title}</div>
                            <div className="flex space-x-1 ml-2 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 bg-white/80 hover:bg-white"
                                onClick={e => {
                                  e.stopPropagation();
                                  if (event.type === 'lesson') {
                                    setEditingLesson(event);
                                  } else {
                                    setViewingEvent(event);
                                  }
                                }}
                                title="Edit"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-600 flex items-center mb-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(event.startTime, 'H:mm')} - {format(event.endTime, 'H:mm')}
                          </div>
                          
                          {/* Show class/subject info */}
                          <div className="space-y-1">
                            {event.type === 'lesson' && event.class && (
                              <div className="flex items-center text-xs">
                                <Users className="h-3 w-3 mr-1 text-blue-500" />
                                <span 
                                  className="font-medium"
                                  style={{ color: event.color || '#3b82f6' }}
                                >
                                  {event.class}
                                </span>
                              </div>
                            )}
                            {event.location && (
                              <div className="flex items-center text-xs text-gray-500">
                                <MapPin className="h-3 w-3 mr-1" />
                                <span>{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
        
        {/* Mini Calendar */}
        <div className="w-80 border-l border-gray-200 flex-shrink-0">
          <div className="p-4">
            <div className="text-center">Mini Calendar Placeholder</div>
          </div>
        </div>
      </div>
      
      {/* Lesson Modal */}
      {editingLesson && (
        <LessonModal
          open={true}
          onClose={() => setEditingLesson(null)}
          onSave={async (data) => {
            // Handle save logic
            setEditingLesson(null);
          }}
          initialData={{
            title: editingLesson.title,
            timetableSlotId: undefined,
            classId: undefined,
            subjectId: undefined,
            date: editingLesson.startTime.toISOString().split('T')[0],
            lessonPlan: editingLesson.description || '',
            color: editingLesson.color || '#6B7280',
          }}
        />
      )}
    </>
  );
}
