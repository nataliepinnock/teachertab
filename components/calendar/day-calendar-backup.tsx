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
  
  const newR = Math.round(r + (255 - r) * amount);
  const newG = Math.round(g + (255 - g) * amount);
  const newB = Math.round(b + (255 - b) * amount);
  
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// Function to detect if two events overlap or are adjacent
function eventsOverlap(event1: CalendarEvent, event2: CalendarEvent): boolean {
  // Check for true overlap OR adjacent events (one ends when another starts)
  return event1.startTime < event2.endTime && event2.startTime <= event1.endTime;
}

// Simple positioning - each event takes full width for now
function calculateEventPositioning(events: CalendarEvent[]): Map<string, { column: number; totalColumns: number; width: number; left: number }> {
  const positioning = new Map();
  
  // For now, just give each event full width
  // We can add overlap detection later if needed
  events.forEach(event => {
    positioning.set(event.id, {
      column: 0,
      totalColumns: 1,
      width: 98, // 98% to leave some margin
      left: 1    // 1% left margin
    });
  });
  
  return positioning;
}
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, BookOpen, Users, X, Edit, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { ColorPicker } from '@/components/ui/color-picker';
import { LessonModal } from '@/components/lesson-modal';

// NOTE: Much of this is duplicated from other calendar components.
// In a real application, you'd want to abstract this shared logic.

// Function to determine if a color is dark (should use white text)
function isColorDark(color: string): boolean {
  // Convert hex to RGB
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  // Calculate luminance using the formula: 0.299*R + 0.587*G + 0.114*B
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Very aggressive threshold - use white text for most colors
  // This ensures maximum readability across all color backgrounds
  return luminance < 0.8;
}

interface LessonWithSlot extends Lesson {
  slotStartTime?: string;
  slotEndTime?: string;
  className?: string;
  subjectName?: string;
  room?: string;
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error: any = new Error('An error occurred while fetching the data.');
    error.info = await res.json();
    error.status = res.status;
    throw error;
  }
  return res.json();
};

interface CalendarEvent {
  id: string;
  title: string;
  type: 'lesson' | 'event' | 'holiday';
  startTime: Date;
  endTime: Date;
  location?: string;
  description?: string;
  class?: string;
  subject?: string;
  classId?: number;
  subjectId?: number;
  color?: string;
  allDay?: boolean;
  holiday?: any; // For holiday-specific data
  isMultiDay?: boolean; // For multi-day events
  startDateStr?: string; // For date comparison
  endDateStr?: string; // For date comparison
}

interface DayCalendarProps {
  className?: string;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

function MiniMonthCalendar({ selectedDate, onDateChange }: { selectedDate: Date, onDateChange: (date: Date) => void }) {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  useEffect(() => {
    setCurrentMonthDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

  const monthGrid = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const days = [];
    const startDay = firstDayOfMonth.getDay();
    const startOffset = startDay === 0 ? 6 : startDay - 1;

    for (let i = startOffset; i > 0; i--) {
      const date = new Date(firstDayOfMonth);
      date.setDate(date.getDate() - i);
      days.push({ date, isCurrentMonth: false });
    }
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    const endDay = lastDayOfMonth.getDay();
    const endOffset = endDay === 0 ? 0 : 7 - endDay;
    for (let i = 1; i <= endOffset; i++) {
      const date = new Date(lastDayOfMonth);
      date.setDate(date.getDate() + i);
      days.push({ date, isCurrentMonth: false });
    }
    return days;
  }, [currentMonthDate]);
  
  const isSelected = (date: Date) => date.toDateString() === selectedDate.toDateString();
  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

  return (
    <div className="text-center">
      <div className="flex items-center justify-between pb-4">
        <button onClick={() => setCurrentMonthDate(new Date(currentMonthDate.setMonth(currentMonthDate.getMonth() - 1)))}>‹</button>
        <h3 className="font-semibold">{currentMonthDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
        <button onClick={() => setCurrentMonthDate(new Date(currentMonthDate.setMonth(currentMonthDate.getMonth() + 1)))}>›</button>
      </div>
      <div className="grid grid-cols-7 text-xs leading-6 text-gray-500">
        <div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div><div>S</div>
      </div>
      <div className="grid grid-cols-7 mt-2 text-sm">
        {monthGrid.map(({ date, isCurrentMonth }, i) => (
          <button
            key={i}
            onClick={() => onDateChange(date)}
            className={`py-1.5 ${!isCurrentMonth ? 'text-gray-400' : ''} ${isSelected(date) ? 'bg-indigo-600 text-white rounded-full' : ''} ${!isSelected(date) && isToday(date) ? 'text-indigo-600' : ''}`}
          >
            {date.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DayCalendar({ className, currentDate, onDateChange }: DayCalendarProps) {
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editingLesson, setEditingLesson] = useState<CalendarEvent | null>(null);
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  const { data: events, error: eventsError } = useSWR<Event[]>('/api/events', fetcher);
  const { data: lessons, error: lessonsError } = useSWR<LessonWithSlot[]>('/api/lessons', fetcher);
  const { data: classes, error: classesError } = useSWR<Class[]>('/api/classes', fetcher);
  const { data: subjects, error: subjectsError } = useSWR<Subject[]>('/api/subjects', fetcher);
  const { data: user, error: userError } = useSWR<User>('/api/user', fetcher);
  
  // Use academic calendar hook for week numbers and holidays
  const { getWeekNumberForDate, activeAcademicYear, getHolidayEvents } = useAcademicCalendar();

  // Auto-scroll to 8am when component mounts or date changes
  useEffect(() => {
    // Add a small delay to ensure the component is fully rendered
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
        !Array.isArray(classes) || !Array.isArray(subjects)) return [];

    const allEvents: CalendarEvent[] = [];
    const todayStr = currentDate.toDateString();

    console.log('Day calendar - Processing events for date:', todayStr);
    console.log('Day calendar - Total lessons available:', lessons.length);
    console.log('Day calendar - Total events available:', events.length);

    lessons.forEach((lesson, index) => {
      // Only show lessons that have an actual scheduled date and match the current date
      if (lesson.date) {
        const lessonDate = new Date(lesson.date);
        if (lessonDate.toDateString() === todayStr) {
          const classInfo = classes.find(c => c.id === lesson.classId);
          const subjectInfo = subjects.find(s => s.id === lesson.subjectId);
          const lessonColor = lesson.color || subjectInfo?.color || '#4F46E5';
          
          console.log(`Day calendar - Creating lesson ${index + 1}:`, {
            id: lesson.id,
            title: lesson.title,
            date: lesson.date,
            color: lessonColor
          });
          
          allEvents.push({
            id: `lesson-${lesson.id}`,
            title: lesson.title,
            type: 'lesson',
            startTime: new Date(lesson.date + 'T' + (lesson.slotStartTime || '09:00')),
            endTime: new Date(lesson.date + 'T' + (lesson.slotEndTime || '10:00')),
            location: lesson.room || 'Classroom',
            description: lesson.lessonPlan || undefined,
            class: classInfo?.name,
            subject: subjectInfo?.name,
            color: lessonColor,
            classId: lesson.classId,
            subjectId: lesson.subjectId,
          });
        }
      }
    });

    events.forEach((event, index) => {
      console.log(`Event ${index + 1}:`, {
        id: event.id,
        title: event.title,
        startTime: event.startTime,
        endTime: event.endTime,
        color: event.color || '#8B5CF6',
        startTimeType: typeof event.startTime,
        startTimeParsed: new Date(event.startTime)
      });
      
      // Handle different date formats - some events might have string dates, others Date objects
      let eventDate: Date;
      try {
        eventDate = new Date(event.startTime);
        // Check if the date is valid
        if (isNaN(eventDate.getTime())) {
          console.warn(`Event ${event.id} has invalid startTime:`, event.startTime);
          return; // Skip this event
        }
      } catch (error) {
        console.warn(`Event ${event.id} has unparseable startTime:`, event.startTime, error);
        return; // Skip this event
      }
      
      if (eventDate.toDateString() === todayStr) {
        console.log(`Event ${event.id} is for today, adding to calendar`);
        const eventColor = event.color || '#8B5CF6';
        
        allEvents.push({
          id: `event-${event.id}`,
          title: event.title,
          type: 'event',
          startTime: eventDate,
          endTime: new Date(event.endTime),
          location: event.location || undefined,
          description: event.description || undefined,
          color: eventColor,
        });
      } else {
        console.log(`Event ${event.id} is NOT for today:`, {
          eventDate: eventDate.toDateString(),
          todayStr,
          isToday: eventDate.toDateString() === todayStr
        });
      }
    });

    // Get holiday events for today (inclusive of start and end dates)
    const holidayEvents = getHolidayEvents().filter(holiday => {
      if (holiday.startDateStr && holiday.endDateStr) {
        const holidayStart = new Date(holiday.startDateStr);
        const holidayEnd = new Date(holiday.endDateStr);
        
        // Set time to ensure proper comparison
        holidayStart.setHours(0, 0, 0, 0);
        holidayEnd.setHours(23, 59, 59, 999);
        
        const currentDateStart = new Date(currentDate);
        currentDateStart.setHours(0, 0, 0, 0);
        
        // Check if current date falls within the holiday range (inclusive)
        return currentDateStart >= holidayStart && currentDateStart <= holidayEnd;
      }
      
      // Fallback for holidays without string dates
      const holidayStart = new Date(holiday.startTime);
      const holidayEnd = new Date(holiday.endTime);
      return holidayStart.toDateString() === todayStr || 
             (holidayStart <= currentDate && holidayEnd >= currentDate);
    });

    // Combine all events including holidays
    const finalEvents = [...allEvents, ...holidayEvents];

    console.log('Day calendar - Total events created:', finalEvents.length, '(including', holidayEvents.length, 'holidays)');
    return finalEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [events, lessons, classes, subjects, currentDate, getHolidayEvents]);

  if (eventsError || lessonsError || classesError || subjectsError || userError) {
    return <div>Error loading data</div>;
  }
  
  if (!events || !lessons || !classes || !subjects || !user) {
    return <div>Loading...</div>; // Or a proper skeleton loader
  }

  return (
    <>
    <div className={`flex flex-1 ${className}`}>
      {/* Scrollable timeline and time column */}
      <div className="flex-1 flex flex-col mr-4">
        <div ref={timelineRef} className="flex-auto overflow-y-auto min-h-0 flex flex-row">
          {/* Time column - now integrated into the grid */}
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
              {(() => {
                return calendarEvents.map(event => {
                  const startHour = event.startTime.getHours();
                  const startMinute = event.startTime.getMinutes();
                  const endHour = event.endTime.getHours();
                  const endMinute = event.endTime.getMinutes();
                  
                  // Use the same calculation as timetable setup: 5-minute intervals
                  // Total rows = 24 hours * 12 (5-min intervals) = 288
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
                            {event.startTime ? format(event.startTime, 'H:mm') : 'Time TBD'} - {event.endTime ? format(event.endTime, 'H:mm') : 'TBD'}
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
                });
              })()}
              </ol>
            </div>
          </div>
        </div>
      </div>
      {/* Mini Calendar */}
      <div className="w-80 border-l border-gray-200 flex-shrink-0">
        <div className="p-4">
          <MiniMonthCalendar selectedDate={currentDate} onDateChange={onDateChange} />
        </div>
      </div>
      
    {/* Event View Modal */}
      {viewingEvent && viewingEvent.type === 'event' && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  {viewingEvent.title}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setViewingEvent(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-2" />
                {viewingEvent.startTime.toLocaleString('en-GB', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })} - {viewingEvent.endTime.toLocaleString('en-GB', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              
              {viewingEvent.location && (
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {viewingEvent.location}
                </div>
              )}
              
              {viewingEvent.description && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Description</h4>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{viewingEvent.description}</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => {
                  setEditingEvent(viewingEvent);
                  setViewingEvent(null);
                }}>
                  Edit
                </Button>
                <Button onClick={() => setViewingEvent(null)}>Close</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Modal */}
      {editingEvent && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  {editingEvent.type === 'lesson' ? (
                    <BookOpen className="h-5 w-5 mr-2" />
                  ) : (
                    <Calendar className="h-5 w-5 mr-2" />
                  )}
                  Edit {editingEvent.type === 'lesson' ? 'Lesson' : 'Event'}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setEditingEvent(null)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title Field */}
              <div>
                <label className="text-sm font-medium text-gray-700">Title</label>
                <input
                  type="text"
                  value={editingEvent.title}
                  onChange={(e) => setEditingEvent(prev => prev ? { ...prev, title: e.target.value } : null)}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Date and Time Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={editingEvent.startTime.toISOString().split('T')[0]}
                    onChange={(e) => {
                      const newDate = new Date(e.target.value);
                      const currentTime = editingEvent.startTime;
                      const newStartTime = new Date(newDate);
                      newStartTime.setHours(currentTime.getHours(), currentTime.getMinutes());
                      
                      const duration = editingEvent.endTime.getTime() - editingEvent.startTime.getTime();
                      const newEndTime = new Date(newStartTime.getTime() + duration);
                      
                      setEditingEvent(prev => prev ? {
                        ...prev,
                        startTime: newStartTime,
                        endTime: newEndTime
                      } : null);
                    }}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Start Time</label>
                  <input
                    type="time"
                    value={editingEvent.startTime.toTimeString().slice(0, 5)}
                    onChange={(e) => {
                      const [hours, minutes] = e.target.value.split(':').map(Number);
                      const newStartTime = new Date(editingEvent.startTime);
                      newStartTime.setHours(hours, minutes);
                      
                      const duration = editingEvent.endTime.getTime() - editingEvent.startTime.getTime();
                      const newEndTime = new Date(newStartTime.getTime() + duration);
                      
                      setEditingEvent(prev => prev ? {
                        ...prev,
                        startTime: newStartTime,
                        endTime: newEndTime
                      } : null);
                    }}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* End Time Field */}
              <div>
                <label className="text-sm font-medium text-gray-700">End Time</label>
                <input
                  type="time"
                  value={editingEvent.endTime.toTimeString().slice(0, 5)}
                  onChange={(e) => {
                    const [hours, minutes] = e.target.value.split(':').map(Number);
                    const newEndTime = new Date(editingEvent.endTime);
                    newEndTime.setHours(hours, minutes);
                    
                    setEditingEvent(prev => prev ? {
                      ...prev,
                      endTime: newEndTime
                    } : null);
                  }}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Location Field (for events) */}
              {editingEvent.type === 'event' && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    value={editingEvent.location || ''}
                    onChange={(e) => setEditingEvent(prev => prev ? { ...prev, location: e.target.value } : null)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>
              )}

              {/* Description Field */}
              <div>
                <label className="text-sm font-medium text-gray-700">
                  {editingEvent.type === 'lesson' ? 'Lesson Plan' : 'Description'}
                </label>
                <textarea
                  value={editingEvent.description || ''}
                  onChange={(e) => setEditingEvent(prev => prev ? { ...prev, description: e.target.value } : null)}
                  rows={3}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              {/* Color Field */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-700">Choose Color</span>
                <div className="relative">
                  <ColorPicker
                    value={editingEvent.color || '#6B7280'}
                    onChange={(color: string) => {
                      setEditingEvent(prev => prev ? { ...prev, color } : null);
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2 pt-2">
                <Button 
                  onClick={async () => {
                    try {
                      if (editingEvent.type === 'event') {
                        // For events, update via PATCH API
                        const eventId = editingEvent.id.replace('event-', '');
                        console.log('Updating event via API:', { eventId, event: editingEvent });
                        
                        const response = await fetch('/api/events', {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            id: eventId,
                            title: editingEvent.title,
                            startTime: editingEvent.startTime.toISOString(),
                            endTime: editingEvent.endTime.toISOString(),
                            location: editingEvent.location,
                            description: editingEvent.description,
                            color: editingEvent.color,
                          }),
                        });

                        if (!response.ok) {
                          throw new Error('Failed to update event');
                        }

                        const updatedEvent = await response.json();
                        console.log('Event updated successfully:', updatedEvent);
                        
                        // Close the modal
                        setEditingEvent(null);
                        
                        // Refresh the data
                        mutate('/api/events');
                      } else {
                        // For lessons, open the lesson edit modal
                        setEditingLesson(editingEvent);
                        setEditingEvent(null);
                      }
                    } catch (error) {
                      console.error('Error updating event:', error);
                      alert('Failed to update event. Please try again.');
                    }
                  }}
                  className="flex-1"
                >
                  Save Changes
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setEditingEvent(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lesson Edit Modal */}
      {editingLesson && (
        <LessonModal
          isOpen={true}
          onClose={() => setEditingLesson(null)}
          onSave={async (updatedLesson) => {
            try {
              // Update the lesson via API
              const lessonId = editingLesson.id.replace('lesson-', '');
              const response = await fetch(`/api/lessons/${lessonId}`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedLesson),
              });

              if (!response.ok) {
                throw new Error('Failed to update lesson');
              }

              // Close the modal and refresh data
              setEditingLesson(null);
              mutate('/api/lessons');
            } catch (error) {
              console.error('Error updating lesson:', error);
              alert('Failed to update lesson. Please try again.');
            }
          }}
          mode="edit"
          initialData={{
            id: editingLesson.id.replace('lesson-', ''),
            title: editingLesson.title,
            classId: editingLesson.classId,
            subjectId: editingLesson.subjectId,
            date: editingLesson.startTime.toISOString().split('T')[0],
            lessonPlan: editingLesson.description || '',
            color: editingLesson.color || '#6B7280',
          }}
        />
      )}
    </>
  );
}