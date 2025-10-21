'use client';

import { useState, useMemo, useEffect } from 'react';
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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, BookOpen, Users, X, Edit, Trash2, Plus, Repeat } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';
import { LessonModal } from '@/components/lesson-modal';

// NOTE: A lot of this is duplicated from WeekCalendar.
// In a real application, you'd want to abstract the shared logic.

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

// Extended lesson type with timetable slot data from API
interface LessonWithSlot extends Lesson {
  slotStartTime?: string;
  slotEndTime?: string;
  slotLabel?: string;
  slotWeekNumber?: number;
  className?: string;
  classColor?: string;
  subjectName?: string;
  subjectColor?: string;
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
  isUnfinished?: boolean; // Flag for unfinished lessons from timetable entries
  timetableSlotId?: number; // For unfinished lessons
  lessonIds?: number[]; // For grouped lessons
  planCompleted?: boolean; // Whether the lesson plan is completed
  isRecurring?: boolean; // Whether this is a recurring event
  recurrenceType?: string; // Type of recurrence
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
      <div className="isolate flex flex-auto flex-col overflow-auto bg-white">
        <div className="h-96 bg-gray-200 rounded animate-pulse"></div>
      </div>
    </div>
  );
}

interface MonthCalendarProps {
  onAddEvent?: () => void;
  className?: string;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  onViewChange?: (view: 'day' | 'week' | 'month') => void;
  showEventsOnly?: boolean;
}

export function MonthCalendar({ onAddEvent, className = '', currentDate: externalCurrentDate, onDateChange, onViewChange, showEventsOnly = false }: MonthCalendarProps) {
  const [currentDate, setCurrentDate] = useState(externalCurrentDate || new Date());
  
  // Debug logging
  console.log('MonthCalendar showEventsOnly prop:', showEventsOnly, '(true = Events Only, false = Lessons & Events)');
  
  // Watch for prop changes
  useEffect(() => {
    console.log('MonthCalendar showEventsOnly prop changed to:', showEventsOnly, '(true = Events Only, false = Lessons & Events)');
  }, [showEventsOnly]);
  
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [editingLesson, setEditingLesson] = useState<CalendarEvent | null>(null);
  const [editingHoliday, setEditingHoliday] = useState<CalendarEvent | null>(null);
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);
  const [isCreatingTestData, setIsCreatingTestData] = useState(false);

  const { data: events, error: eventsError } = useSWR<Event[]>('/api/events', fetcher);
  const { data: lessons, error: lessonsError } = useSWR<LessonWithSlot[]>('/api/lessons', fetcher);
  const { data: classes, error: classesError } = useSWR<Class[]>('/api/classes', fetcher);
  const { data: subjects, error: subjectsError } = useSWR<Subject[]>('/api/subjects', fetcher);
  const { data: user, error: userError } = useSWR<User>('/api/user', fetcher);
  const { data: timetableEntries } = useSWR<any[]>('/api/timetable', fetcher);
  const { data: timetableSlots } = useSWR<any[]>('/api/timetable-slots', fetcher);
  
  // Academic calendar hook for week number calculation
  const { getWeekNumberForDate, activeAcademicYear, getHolidayEvents } = useAcademicCalendar();
  
  // Create test timetable data
  const createTestTimetableData = async () => {
    setIsCreatingTestData(true);
    try {
      const response = await fetch('/api/test-timetable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Test timetable data created:', result);
        // Refresh the data
        mutate('/api/timetable');
        mutate('/api/timetable-slots');
        mutate('/api/lessons');
        mutate('/api/events');
      } else {
        const error = await response.json();
        console.error('Failed to create test data:', error);
      }
    } catch (error) {
      console.error('Error creating test data:', error);
    } finally {
      setIsCreatingTestData(false);
    }
  };

  // Delete functions
  const handleDeleteLesson = async (event: CalendarEvent) => {
    if (!event.lessonIds || event.lessonIds.length === 0) {
      return;
    }

    try {
      // Delete all lessons in the group
      const deletePromises = event.lessonIds.map(async (lessonId) => {
        const response = await fetch(`/api/lessons?id=${lessonId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error(`Failed to delete lesson ${lessonId}`);
        }
      });

      await Promise.all(deletePromises);
      
      // Refresh data
      window.location.reload(); // Simple refresh for month calendar
    } catch (error) {
      console.error('Error deleting lessons:', error);
      alert('Error deleting lessons. Please try again.');
    }
  };

  const handleDeleteEvent = async (event: CalendarEvent) => {
    try {
      // Extract event ID from the calendar event ID
      const eventId = event.id.replace('event-', '');
      
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      // Refresh data
      window.location.reload(); // Simple refresh for month calendar
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Error deleting event. Please try again.');
    }
  };

  const handleUpdateHoliday = async (holidayData: any) => {
    try {
      // Extract holiday ID from the calendar event ID
      const holidayId = editingHoliday?.id.replace('holiday-', '');
      
      const response = await fetch('/api/holidays', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: holidayId,
          ...holidayData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update holiday');
      }

      // Refresh holidays data
      mutate('/api/holidays');
      setEditingHoliday(null);
    } catch (error) {
      console.error('Error updating holiday:', error);
      alert('Error updating holiday. Please try again.');
    }
  };

  const handleDeleteHoliday = async (event: CalendarEvent) => {
    try {
      // Extract holiday ID from the calendar event ID
      const holidayId = event.id.replace('holiday-', '');
      
      const response = await fetch('/api/holidays', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: holidayId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete holiday');
      }

      // Refresh holidays data
      mutate('/api/holidays');
    } catch (error) {
      console.error('Error deleting holiday:', error);
      alert('Error deleting holiday. Please try again.');
    }
  };

  // Update internal state when external date changes
  useEffect(() => {
    if (externalCurrentDate) {
      setCurrentDate(externalCurrentDate);
    }
  }, [externalCurrentDate]);
  
  // Create calendar events from lessons, events, and holidays
  useEffect(() => {
    if (!events || !lessons || !classes || !subjects || 
        !Array.isArray(events) || !Array.isArray(lessons) || 
        !Array.isArray(events) || !Array.isArray(classes) || !Array.isArray(subjects)) {
      setCalendarEvents([]);
      return;
    }

    const initialEvents: CalendarEvent[] = [];

    // Get the start and end of the current month view
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    // Debug logging only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Month calendar - Month view range:', { 
        monthStart: monthStart.toDateString(), 
        monthEnd: monthEnd.toDateString(),
        totalLessons: lessons.length,
        totalEvents: events.length
      });
    }

    lessons.forEach((lesson, index) => {
      const lClassInfo = classes.find(c => c.id === lesson.classId);
      const lSubjectInfo = subjects.find(s => s.id === lesson.subjectId);
      
      if (lClassInfo && lSubjectInfo && lesson.date) {
        // Only create calendar events for lessons that fall within the current month view
        const lessonDate = new Date(lesson.date);
        if (lessonDate >= monthStart && lessonDate <= monthEnd) {
          const lessonColor = lesson.color || lSubjectInfo.color || '#4F46E5';
          // Debug logging only in development
          if (process.env.NODE_ENV === 'development') {
            console.log(`Month calendar - Creating lesson ${index + 1}:`, {
              id: lesson.id,
              title: lesson.title,
              date: lesson.date,
              color: lessonColor
            });
          }
          
          initialEvents.push({
            id: `lesson-${lesson.id}`,
            title: lesson.title,
            type: 'lesson',
            startTime: new Date(lesson.date + 'T' + (lesson.slotStartTime || '09:00')),
            endTime: new Date(lesson.date + 'T' + (lesson.slotEndTime || '10:00')),
            location: lesson.room || 'Classroom',
            description: lesson.lessonPlan || undefined,
            class: lClassInfo.name,
            subject: lSubjectInfo.name,
            color: lessonColor,
            allDay: false,
            classId: lesson.classId,
            subjectId: lesson.subjectId,
            planCompleted: Boolean(lesson.planCompleted),
          });
        }
      }
    });

    events.forEach((event, index) => {
      // Debug logging only in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Event ${index + 1}:`, {
          id: event.id,
          title: event.title,
          startTime: event.startTime,
          endTime: event.endTime,
          color: event.color || '#8B5CF6',
          startTimeType: typeof event.startTime,
          startTimeParsed: new Date(event.startTime)
        });
      }
      
      // Handle different date formats - some events might have string dates, others Date objects
      let eventStartDate: Date;
      let eventEndDate: Date;
      try {
        eventStartDate = new Date(event.startTime);
        eventEndDate = new Date(event.endTime);
        // Check if the dates are valid
        if (isNaN(eventStartDate.getTime()) || isNaN(eventEndDate.getTime())) {
          console.warn(`Event ${event.id} has invalid dates:`, event.startTime, event.endTime);
          return; // Skip this event
        }
      } catch (error) {
        console.warn(`Event ${event.id} has unparseable dates:`, event.startTime, event.endTime, error);
        return; // Skip this event
      }
      
      // Normalize dates to start of day for comparison
      const startDate = new Date(eventStartDate.getFullYear(), eventStartDate.getMonth(), eventStartDate.getDate());
      const endDate = new Date(eventEndDate.getFullYear(), eventEndDate.getMonth(), eventEndDate.getDate());
      
      // Check if event overlaps with current month view
      if (startDate <= monthEnd && endDate >= monthStart) {
        // Create individual events for each day the event spans
        // Start from the actual event start date, not limited to month view
        const currentDate = new Date(startDate);
        const lastDate = new Date(endDate);
        
        while (currentDate <= lastDate) {
          // Only create events for days that are visible in the current month view
          if (currentDate >= monthStart && currentDate <= monthEnd) {
            // Debug logging only in development
            if (process.env.NODE_ENV === 'development') {
              console.log(`Creating individual event for day:`, currentDate.toDateString());
            }
            
            // Create a new event for this specific day
            const dayStartTime = new Date(currentDate);
            const dayEndTime = new Date(currentDate);
            
            // If this is the first day, use the original start time
            if (currentDate.getTime() === startDate.getTime()) {
              dayStartTime.setHours(eventStartDate.getHours(), eventStartDate.getMinutes(), eventStartDate.getSeconds());
            } else {
              // For subsequent days, start at midnight
              dayStartTime.setHours(0, 0, 0);
            }
            
            // If this is the last day, use the original end time
            if (currentDate.getTime() === endDate.getTime()) {
              dayEndTime.setHours(eventEndDate.getHours(), eventEndDate.getMinutes(), eventEndDate.getSeconds());
            } else {
              // For previous days, end at 23:59:59
              dayEndTime.setHours(23, 59, 59);
            }
            
            initialEvents.push({
              id: `event-${event.id}-${currentDate.toISOString().split('T')[0]}`,
              title: event.title,
              type: 'event',
              startTime: dayStartTime,
              endTime: dayEndTime,
              location: event.location || undefined,
              description: event.description || undefined,
              color: event.color || '#8B5CF6',
              allDay: Boolean(event.allDay),
            });
          }
          
          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else {
        // Debug logging only in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Event ${event.id} is NOT in month range:`, {
            startDate: startDate.toDateString(),
            endDate: endDate.toDateString(),
            monthStart: monthStart.toDateString(),
            monthEnd: monthEnd.toDateString(),
            isInRange: startDate <= monthEnd && endDate >= monthStart
          });
        }
      }
    });

    // Get holiday events and process them for multi-day display
    const rawHolidayEvents = getHolidayEvents();
    const processedHolidayEvents: CalendarEvent[] = [];
    
    rawHolidayEvents.forEach((holiday, index) => {
      // Debug logging only in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`Holiday ${index + 1}:`, {
          id: holiday.id,
          title: holiday.title,
          startTime: holiday.startTime,
          endTime: holiday.endTime,
          isMultiDay: holiday.isMultiDay,
          startDateStr: holiday.startDateStr,
          endDateStr: holiday.endDateStr
        });
      }
      
      // Handle different date formats - some holidays might have string dates, others Date objects
      let holidayStartDate: Date;
      let holidayEndDate: Date;
      try {
        holidayStartDate = new Date(holiday.startTime);
        holidayEndDate = new Date(holiday.endTime);
        // Check if the dates are valid
        if (isNaN(holidayStartDate.getTime()) || isNaN(holidayEndDate.getTime())) {
          console.warn(`Holiday ${holiday.id} has invalid dates:`, holiday.startTime, holiday.endTime);
          return; // Skip this holiday
        }
      } catch (error) {
        console.warn(`Holiday ${holiday.id} has unparseable dates:`, holiday.startTime, holiday.endTime, error);
        return; // Skip this holiday
      }
      
      // Normalize dates to start of day for comparison
      const startDate = new Date(holidayStartDate.getFullYear(), holidayStartDate.getMonth(), holidayStartDate.getDate());
      const endDate = new Date(holidayEndDate.getFullYear(), holidayEndDate.getMonth(), holidayEndDate.getDate());
      
      // Check if holiday overlaps with current month view
      if (startDate <= monthEnd && endDate >= monthStart) {
        // Create individual events for each day the holiday spans
        // Start from the actual holiday start date, not limited to month view
        const currentDate = new Date(startDate);
        const lastDate = new Date(endDate);
        
        while (currentDate <= lastDate) {
          // Only create events for days that are visible in the current month view
          if (currentDate >= monthStart && currentDate <= monthEnd) {
            // Debug logging only in development
            if (process.env.NODE_ENV === 'development') {
              console.log(`Creating individual holiday event for day:`, currentDate.toDateString());
            }
            
            // Create a new event for this specific day
            const dayStartTime = new Date(currentDate);
            const dayEndTime = new Date(currentDate);
            
            // If this is the first day, use the original start time
            if (currentDate.getTime() === startDate.getTime()) {
              dayStartTime.setHours(holidayStartDate.getHours(), holidayStartDate.getMinutes(), holidayStartDate.getSeconds());
            } else {
              // For subsequent days, start at midnight
              dayStartTime.setHours(0, 0, 0);
            }
            
            // If this is the last day, use the original end time
            if (currentDate.getTime() === endDate.getTime()) {
              dayEndTime.setHours(holidayEndDate.getHours(), holidayEndDate.getMinutes(), holidayEndDate.getSeconds());
            } else {
              // For previous days, end at 23:59:59
              dayEndTime.setHours(23, 59, 59);
            }
            
            processedHolidayEvents.push({
              id: `holiday-${holiday.id}-${currentDate.toISOString().split('T')[0]}`,
              title: holiday.title,
              type: 'holiday',
              startTime: dayStartTime,
              endTime: dayEndTime,
              location: holiday.location || undefined,
              description: holiday.description || undefined,
              color: holiday.color || '#10b981',
              allDay: Boolean(holiday.allDay),
              holiday: holiday.holiday,
            });
          }
          
          // Move to next day
          currentDate.setDate(currentDate.getDate() + 1);
        }
      } else {
        // Debug logging only in development
        if (process.env.NODE_ENV === 'development') {
          console.log(`Holiday ${holiday.id} is NOT in month range:`, {
            startDate: startDate.toDateString(),
            endDate: endDate.toDateString(),
            monthStart: monthStart.toDateString(),
            monthEnd: monthEnd.toDateString(),
            isInRange: startDate <= monthEnd && endDate >= monthStart
          });
        }
      }
    });
    
    // Generate unfinished lessons from timetable entries
    if (timetableEntries && timetableSlots) {
      // Track which slots already have lessons for each date
      const lessonsBySlotAndDate = new Map<string, Set<number>>();
      lessons.forEach(lesson => {
        const lessonDate = new Date(lesson.date);
        if (lessonDate >= monthStart && lessonDate <= monthEnd) {
          const dateStr = lesson.date;
          const key = `${dateStr}-${lesson.timetableSlotId}`;
          if (!lessonsBySlotAndDate.has(key)) {
            lessonsBySlotAndDate.set(key, new Set());
          }
          lessonsBySlotAndDate.get(key)!.add(lesson.id);
        }
      });
      
      // Generate unfinished lessons for each day in the month
      for (let day = 1; day <= monthEnd.getDate(); day++) {
        const date = new Date(year, month, day);
        date.setHours(12, 0, 0, 0);
        const dateStr = date.toISOString().split('T')[0];
        const dayOfWeek = date.toLocaleDateString('en-GB', { weekday: 'long' });
        const weekNumber = getWeekNumberForDate(date);
        
        // Find timetable entries for this day and week
        const entriesForDay = timetableEntries.filter(entry => 
          entry.dayOfWeek === dayOfWeek && 
          entry.weekNumber === weekNumber
        );
        
        entriesForDay.forEach(entry => {
          // Check if there's already a lesson for this slot and date
          const key = `${dateStr}-${entry.timetableSlotId}`;
          const hasLesson = lessonsBySlotAndDate.has(key);
          
          if (!hasLesson) {
            // Create an unfinished lesson event
            const slot = timetableSlots.find(s => s.id === entry.timetableSlotId);
            if (!slot) return;
            
            const classInfo = classes.find(c => c.id === entry.classId);
            const subjectInfo = subjects.find(s => s.id === entry.subjectId);
            
            const [startHour, startMinute] = slot.startTime.split(':').map(Number);
            const [endHour, endMinute] = slot.endTime.split(':').map(Number);
            
            const startTime = new Date(year, month, day, startHour, startMinute);
            const endTime = new Date(year, month, day, endHour, endMinute);
            
            // Create title based on teacher type
            const title = user?.teacherType === 'primary' 
              ? `${subjectInfo?.name || 'Subject'} - ${classInfo?.name || 'Class'}`
              : `${classInfo?.name || 'Class'} - ${subjectInfo?.name || 'Subject'}`;
            
            initialEvents.push({
              id: `unfinished-lesson-${dateStr}-${entry.timetableSlotId}`,
              title: title,
              type: 'lesson',
              startTime: startTime,
              endTime: endTime,
              location: entry.room || undefined,
              description: undefined,
              class: classInfo?.name || undefined,
              subject: subjectInfo?.name || undefined,
              color: subjectInfo?.color || classInfo?.color || '#D1D5DB',
              allDay: false,
              classId: entry.classId || undefined,
              subjectId: entry.subjectId || undefined,
              isUnfinished: true, // Flag to indicate this is an unfinished lesson
              timetableSlotId: entry.timetableSlotId,
            });
          }
        });
      }
    }
    
    // Combine all events including processed holidays
    const allEvents = [...initialEvents, ...processedHolidayEvents];

    // Debug logging only in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Month calendar - Total events created:', allEvents.length, '(including', processedHolidayEvents.length, 'processed holidays)');
    }
    setCalendarEvents(allEvents);

  }, [events, lessons, classes, subjects, currentDate, getHolidayEvents, timetableEntries, timetableSlots, user, getWeekNumberForDate]);

  const monthGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const daysInMonth = [];

    // Add days from previous month
    const startDay = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday
    const startOffset = startDay === 0 ? 6 : startDay - 1; // We want Monday to be the start

    for (let i = startOffset; i > 0; i--) {
      const date = new Date(firstDayOfMonth);
      date.setDate(date.getDate() - i);
      daysInMonth.push({ date, isCurrentMonth: false });
    }

    // Add days of the current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const date = new Date(year, month, i);
      date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
      daysInMonth.push({ date, isCurrentMonth: true });
    }

    // Add days from next month
    const endDay = lastDayOfMonth.getDay();
    const endOffset = endDay === 0 ? 0 : 7 - endDay;

    for (let i = 1; i <= endOffset; i++) {
      const date = new Date(lastDayOfMonth);
      date.setDate(date.getDate() + i);
      daysInMonth.push({ date, isCurrentMonth: false });
    }
    
    return daysInMonth;
  }, [currentDate]);

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  if (eventsError || lessonsError || classesError || subjectsError || userError) {
    return <div>Error loading data</div>;
  }

  return (
    <div className={`flex h-full flex-col ${className}`}>
      <div className="flex-1 overflow-hidden shadow-lg rounded-xl border-2 border-gray-200">
        <div className="h-full overflow-y-auto">
          <div className="grid grid-cols-7 gap-px border-b border-gray-300 bg-gray-200 text-center text-xs font-semibold leading-6 text-gray-700">
            <div className="bg-white py-2">Mon</div>
            <div className="bg-white py-2">Tue</div>
            <div className="bg-white py-2">Wed</div>
            <div className="bg-white py-2">Thu</div>
            <div className="bg-white py-2">Fri</div>
            <div className="bg-white py-2">Sat</div>
            <div className="bg-white py-2">Sun</div>
          </div>
          
          {/* Test Data Button */}
          {(!timetableEntries || timetableEntries.length === 0) && (
            <div className="flex justify-center py-4 border-b border-gray-100 bg-yellow-50">
              <Button
                onClick={createTestTimetableData}
                disabled={isCreatingTestData}
                size="lg"
                variant="default"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
              >
                {isCreatingTestData ? 'Creating...' : '🚀 Create Test Timetable Data'}
              </Button>
            </div>
          )}
          
          <div className="relative grid grid-cols-7 grid-rows-5 gap-px bg-gray-200">
            {monthGrid.map(({ date, isCurrentMonth }, dayIdx) => {
              // Get all events for this day (now all events are single-day)
              let eventsForDay = calendarEvents
                .filter(event => {
                  const eventDate = new Date(event.startTime);
                  const currentDateStr = date.toDateString();
                  
                  return eventDate.toDateString() === currentDateStr;
                });
              
              // Apply events-only filter if enabled
              if (showEventsOnly) {
                const beforeCount = eventsForDay.length;
                const eventTypes = eventsForDay.map(e => e.type);
                console.log(`Before filtering: ${beforeCount} events with types:`, eventTypes);
                eventsForDay = eventsForDay.filter(event => event.type === 'event' || event.type === 'holiday');
                const afterCount = eventsForDay.length;
                console.log(`After filtering: ${afterCount} events only (showEventsOnly: ${showEventsOnly})`);
              }
              
              eventsForDay = eventsForDay.sort((a, b) => {
                  // All-day events first
                  if (a.allDay && !b.allDay) return -1;
                  if (!a.allDay && b.allDay) return 1;
                  
                  // Within same type (all-day or timed), sort by start time
                  return a.startTime.getTime() - b.startTime.getTime();
                });
              
              // Get week number for this date
              const weekNumber = activeAcademicYear ? getWeekNumberForDate(date) : null;
              

              return (
                <div
                  key={dayIdx}
                  className={`relative min-h-[10rem] bg-white px-2 py-2 ${
                    isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        if (onDateChange) {
                          onDateChange(date);
                        }
                        if (onViewChange) {
                          onViewChange('day');
                        }
                      }}
                      className={`flex h-6 w-6 items-center justify-center rounded-full font-semibold hover:bg-gray-100 transition-colors ${
                        isToday(date) ? 'bg-indigo-600 text-white hover:bg-indigo-700' : ''
                      }`}
                    >
                      {date.getDate()}
                    </button>
                    {/* Week Number Indicator - show on all Mondays within academic year */}
                    {weekNumber && date.getDay() === 1 && (
                      <div className={`px-1 py-0.5 rounded text-xs font-medium ${
                        weekNumber === 1 
                          ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                          : 'bg-green-50 text-green-600 border border-green-200'
                      }`}>
                        W{weekNumber}
                      </div>
                    )}
                  </div>
                  {eventsForDay.length > 0 && (
                    <ol className="mt-1 space-y-0.5 overflow-hidden">
                      {eventsForDay.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          className={`group flex w-full items-start rounded-md p-1 text-left text-xs border-2 min-w-0 cursor-pointer overflow-hidden`}
                          style={{
                            backgroundColor: event.isUnfinished
                              ? lightenColor(event.color || '#FCD34D', 0.98)
                              : (event.color ? lightenColor(event.color, 0.8) : '#F3F4F6'),
                            borderColor: event.isUnfinished 
                              ? `${event.color || '#FCD34D'}50`
                              : (event.color ? `${event.color}CC` : '#374151'),
                            minHeight: '1.5rem',
                            maxHeight: '2rem'
                          }}
                          onClick={() => {
                            if (event.type === 'lesson') {
                              setEditingLesson(event);
                            } else if (event.type === 'event') {
                              setEditingEvent(event);
                            } else if (event.type === 'holiday') {
                              setEditingHoliday(event);
                            } else {
                              setViewingEvent(event);
                            }
                          }}
                        >
                          <div className="flex items-center gap-1 w-full min-w-0 overflow-hidden">
                            <p 
                              className="font-bold text-xs truncate flex-1 min-w-0 leading-tight" 
                              style={{ 
                                color: event.color && event.color !== '#6B7280' ? `${event.color}E6` : '#111827',
                                wordBreak: 'break-word',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                              title={event.type === 'lesson' && event.isUnfinished 
                                ? `${user?.teacherType === 'primary' ? (event.subject || '') : (event.class || '')}${user?.teacherType === 'primary' ? (event.class ? ` - ${event.class}` : '') : (event.subject ? ` - ${event.subject}` : '')}` || `Untitled ${event.type}`
                                : (event.title || `Untitled ${event.type}`)
                              }
                            >
                              {event.type === 'lesson' && event.isUnfinished 
                                ? `${user?.teacherType === 'primary' ? (event.subject || '') : (event.class || '')}${user?.teacherType === 'primary' ? (event.class ? ` - ${event.class}` : '') : (event.subject ? ` - ${event.subject}` : '')}` || `Untitled ${event.type}`
                                : (event.title || `Untitled ${event.type}`)
                              }
                            </p>
                            {event.isRecurring && (
                              <Repeat className="h-3 w-3 flex-shrink-0 opacity-60" style={{ color: event.color && event.color !== '#6B7280' ? `${event.color}E6` : '#111827' }} />
                            )}
                          </div>
                        </div>
                      ))}
                      {eventsForDay.length > 3 && (
                        <li className="text-gray-500 mt-1 text-xs pl-1.5 truncate">+ {eventsForDay.length - 3} more</li>
                      )}
                    </ol>
                  )}
                </div>
              );
            })}
            
          </div>
        </div>
      </div>
      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}

      {/* Edit Modals */}
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
                    if (viewingEvent.type === 'holiday') {
                      setEditingHoliday(viewingEvent);
                      setViewingEvent(null);
                    } else {
                      setEditingEvent(viewingEvent);
                      setViewingEvent(null);
                    }
                  }}>
                    Edit
                  </Button>
                  <Button onClick={() => setViewingEvent(null)}>Close</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Event Edit Modal */}
        {editingEvent && editingEvent.type === 'event' && (
          <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Edit Event
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

                {/* Location Field */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Location</label>
                  <input
                    type="text"
                    value={editingEvent.location || ''}
                    onChange={(e) => setEditingEvent(prev => prev ? { ...prev, location: e.target.value } : null)}
                    className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                  />
                </div>

                {/* Description Field */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
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
      {editingLesson && !lessons && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <p>Loading lesson data...</p>
          </div>
        </div>
      )}
      {editingLesson && lessons && (
        <LessonModal
          isOpen={true}
          mode={editingLesson.isUnfinished ? "add" : "edit"}
          onClose={() => setEditingLesson(null)}
          onDelete={!editingLesson.isUnfinished ? async (data) => {
            try {
              if (editingLesson.lessonIds && editingLesson.lessonIds.length > 0) {
                // Delete all lessons in the group
                const deletePromises = editingLesson.lessonIds.map(async (lessonId) => {
                  const response = await fetch(`/api/lessons?id=${lessonId}`, {
                    method: 'DELETE',
                  });
                  if (!response.ok) {
                    throw new Error(`Failed to delete lesson ${lessonId}`);
                  }
                });
                await Promise.all(deletePromises);
                
                // Refresh data
                mutate('/api/lessons');
              }
            } catch (error) {
              console.error('Error deleting lesson:', error);
              alert('Error deleting lesson. Please try again.');
            }
          } : undefined}
          onSave={async (data) => {
            try {
              // For editing, we need to delete the old lessons and create new ones
              // Skip deletion for unfinished lessons (they don't have existing lessons to delete)
              if (!editingLesson.isUnfinished && editingLesson.lessonIds && editingLesson.lessonIds.length > 0) {
                // Delete existing lessons
                const deletePromises = editingLesson.lessonIds.map(async (lessonId) => {
                  const response = await fetch(`/api/lessons?id=${lessonId}`, {
                    method: 'DELETE',
                  });
                  if (!response.ok) {
                    throw new Error(`Failed to delete lesson ${lessonId}`);
                  }
                });
                await Promise.all(deletePromises);
              }

              // Create new lessons with the updated data
              const { timetableSlotIds, ...baseLessonData } = data;
              console.log('🔍 Month Calendar - Creating new lessons with data:', {
                timetableSlotIds,
                baseLessonData,
                data
              });
              
              if (timetableSlotIds && timetableSlotIds.length > 0) {
                const lessonPromises = timetableSlotIds.map(async (slotId: string) => {
                  const lessonData = {
                    ...baseLessonData,
                    timetableSlotId: slotId,
                  };
                  
                  console.log('🔍 Month Calendar - Creating lesson for slot:', slotId, 'with data:', lessonData);
                  
                  const response = await fetch('/api/lessons', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(lessonData),
                  });
                  
                  if (!response.ok) {
                    const errorText = await response.text();
                    console.error('🔍 Month Calendar - Error creating lesson for slot:', slotId, 'Response:', response.status, errorText);
                    throw new Error(`Failed to create lesson for slot ${slotId}: ${errorText}`);
                  }
                  return response.json();
                });
                await Promise.all(lessonPromises);
              }

              // Refresh data
              mutate('/api/lessons');
              setEditingLesson(null);
            } catch (error) {
              console.error('Error updating lesson:', error);
              alert('Error updating lesson. Please try again.');
            }
          }}
          initialData={(() => {
            const lessonIds = editingLesson.lessonIds;
            
            if (!lessons || lessons.length === 0) {
              console.log('🔍 Month Calendar - No lessons data available yet');
              return {
                title: editingLesson.title,
                timetableSlotIds: editingLesson.isUnfinished && editingLesson.timetableSlotId ? [editingLesson.timetableSlotId.toString()] : [],
                classId: editingLesson.class,
                subjectId: editingLesson.subject,
                date: editingLesson.startTime.toISOString().split('T')[0],
                lessonPlan: editingLesson.description || '',
                color: editingLesson.color || '#6B7280',
              };
            }
            
            const matchingLessons = lessons.filter(lesson => lessonIds?.includes(lesson.id));
            const firstLesson = matchingLessons[0];
            
            // Try to get timetable slot IDs from lessons data
            // For unfinished lessons, use the timetableSlotId directly
            let timetableSlotIds: string[] = [];
            if (editingLesson.isUnfinished && editingLesson.timetableSlotId) {
              timetableSlotIds = [editingLesson.timetableSlotId.toString()];
            } else if (lessonIds && matchingLessons.length > 0) {
              timetableSlotIds = matchingLessons
                .map(lesson => lesson.timetableSlotId?.toString() || '')
                .filter(id => id);
            }

            // For unfinished lessons, we need to map class and subject names to IDs
            let classId = '';
            let subjectId = '';
            
            if (editingLesson.isUnfinished) {
              // For unfinished lessons, try to use the stored IDs first, then fall back to name lookup
              classId = (editingLesson as any).classId?.toString() || '';
              subjectId = (editingLesson as any).subjectId?.toString() || '';
              
              // If IDs are not available, look them up by name
              if (!classId && editingLesson.class) {
                const matchingClass = classes?.find(c => c.name === editingLesson.class);
                classId = matchingClass?.id?.toString() || '';
              }
              
              if (!subjectId && editingLesson.subject) {
                const matchingSubject = subjects?.find(s => s.name === editingLesson.subject);
                subjectId = matchingSubject?.id?.toString() || '';
              }
            } else {
              // For regular lessons, use the IDs from the lesson data
              classId = firstLesson?.classId?.toString() || '';
              subjectId = firstLesson?.subjectId?.toString() || '';
            }

            const initialData = {
              title: editingLesson.title,
              timetableSlotIds: timetableSlotIds,
              classId: classId,
              subjectId: subjectId,
              date: editingLesson.startTime.toISOString().split('T')[0],
              lessonPlan: editingLesson.description || '',
              color: editingLesson.color || '#6B7280',
            };
            
            console.log('🔍 Month Calendar Lesson Edit Debug:', {
              editingLesson: editingLesson,
              lessonIds: lessonIds,
              matchingLessons: matchingLessons,
              firstLesson: firstLesson,
              classes: classes,
              subjects: subjects,
              initialData: initialData
            });
            
            return initialData;
          })()}
        />
      )}

      {/* Holiday Edit Modal */}
      {editingHoliday && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Edit Holiday</h2>
                <button
                  onClick={() => setEditingHoliday(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                handleUpdateHoliday({
                  name: formData.get('name'),
                  startDate: formData.get('startDate'),
                  endDate: formData.get('endDate'),
                  type: formData.get('type'),
                  color: formData.get('color'),
                });
              }} className="space-y-4">
                {/* Holiday Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Holiday Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingHoliday.title}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    defaultValue={editingHoliday.startTime.toISOString().split('T')[0]}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    defaultValue={editingHoliday.endTime.toISOString().split('T')[0]}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Holiday Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    name="type"
                    defaultValue="holiday"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="holiday">Holiday</option>
                    <option value="half_term">Half Term</option>
                    <option value="term_break">Term Break</option>
                    <option value="inset_day">INSET Day</option>
                  </select>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <ColorPicker
                    value={editingHoliday.color || '#10b981'}
                    onChange={(color: string) => {
                      // Update the color in the form
                      const colorInput = document.querySelector('input[name="color"]') as HTMLInputElement;
                      if (colorInput) colorInput.value = color;
                    }}
                  />
                  <input type="hidden" name="color" value={editingHoliday.color || '#10b981'} />
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 pt-4 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditingHoliday(null)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 