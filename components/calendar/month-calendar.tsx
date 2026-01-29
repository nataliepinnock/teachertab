'use client';

import { useState, useMemo, useEffect } from 'react';
import useSWR, { mutate } from 'swr';
import { Event, Lesson, Class, Subject, User } from '@/lib/db/schema';
import { useAcademicCalendar } from '@/lib/hooks/useAcademicCalendar';
import { isWeekFullyCoveredByHolidays } from '@/lib/utils/academic-calendar';
import { getCardStyle, getCardClassName, getBorderColorWithOpacity } from '@/lib/utils/card-styles';

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

// Function to calculate relative luminance (brightness) of a color
function getLuminance(color: string): number {
  if (!color || !color.startsWith('#')) return 0.5; // Default to medium brightness
  
  const hex = color.slice(1);
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  
  // Apply gamma correction
  const [rLinear, gLinear, bLinear] = [r, g, b].map(val => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  
  // Calculate relative luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

// Function to darken a hex color
function darkenColor(color: string, amount: number = 0.3): string {
  if (!color || !color.startsWith('#')) return color;
  
  const hex = color.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  // Darken by reducing RGB values
  const darkenedR = Math.round(r * (1 - amount));
  const darkenedG = Math.round(g * (1 - amount));
  const darkenedB = Math.round(b * (1 - amount));
  
  return `#${darkenedR.toString(16).padStart(2, '0')}${darkenedG.toString(16).padStart(2, '0')}${darkenedB.toString(16).padStart(2, '0')}`;
}

// Function to calculate contrast ratio between two colors (WCAG standard)
function getContrastRatio(color1: string, color2: string): number {
  const lum1 = getLuminance(color1);
  const lum2 = getLuminance(color2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

// Function to get high-contrast text color that meets WCAG AA standards (4.5:1 minimum)
function getContrastTextColor(backgroundColor: string, originalColor?: string): string {
  // Test both white and dark text options
  const whiteContrast = getContrastRatio(backgroundColor, '#FFFFFF');
  const darkGrayContrast = getContrastRatio(backgroundColor, '#1F2937');
  
  // WCAG AA requires 4.5:1 contrast ratio for normal text
  const wcagAA = 4.5;
  
  // Check which option meets WCAG AA and has better contrast
  const whiteMeetsAA = whiteContrast >= wcagAA;
  const darkMeetsAA = darkGrayContrast >= wcagAA;
  
  if (whiteMeetsAA && darkMeetsAA) {
    // Both meet standards, choose the one with better contrast
    return whiteContrast > darkGrayContrast ? '#FFFFFF' : '#1F2937';
  } else if (whiteMeetsAA) {
    // Only white meets standards
    return '#FFFFFF';
  } else if (darkMeetsAA) {
    // Only dark meets standards
    return '#1F2937';
  } else {
    // Neither meets standards, but choose the better one
    // Prefer dark text as it's generally more readable
    return darkGrayContrast > whiteContrast ? '#1F2937' : '#FFFFFF';
  }
}
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, BookOpen, Users, X, Edit, Trash2, Plus, Repeat } from 'lucide-react';
import { ColorPicker } from '@/components/ui/color-picker';
import { LessonModal } from '@/components/lesson-modal';
import { TimetableActivityModal } from '@/components/timetable-activity-modal';

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
  type: 'lesson' | 'event' | 'holiday' | 'activity';
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
  activityId?: number; // For timetable activities
  activityType?: string; // 'meeting', 'duty', 'planning', etc.
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
  cardStyle?: string;
}

export function MonthCalendar({ onAddEvent, className = '', currentDate: externalCurrentDate, onDateChange, onViewChange, showEventsOnly = false, cardStyle = 'solid' }: MonthCalendarProps) {
  const [currentDate, setCurrentDate] = useState(externalCurrentDate || new Date());
  
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [editingLesson, setEditingLesson] = useState<CalendarEvent | null>(null);
  const [editingHoliday, setEditingHoliday] = useState<CalendarEvent | null>(null);
  const [editingActivity, setEditingActivity] = useState<any | null>(null);
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);

  const { data: events, error: eventsError } = useSWR<Event[]>('/api/events', fetcher);
  const { data: lessons, error: lessonsError } = useSWR<LessonWithSlot[]>('/api/lessons', fetcher);
  const { data: classes, error: classesError } = useSWR<Class[]>('/api/classes', fetcher);
  const { data: subjects, error: subjectsError } = useSWR<Subject[]>('/api/subjects', fetcher);
  const { data: user, error: userError } = useSWR<User>('/api/user', fetcher);
  const { data: timetableEntries } = useSWR<any[]>('/api/timetable', fetcher);
  const { data: timetableSlots } = useSWR<any[]>('/api/timetable-slots', fetcher);
  const { data: timetableActivities, mutate: mutateTimetableActivities } = useSWR<any[]>('/api/timetable-activities', fetcher);
  
  // Academic calendar hook for week number calculation
  const { getWeekNumberForDate, activeAcademicYear, getHolidayEvents, holidays } = useAcademicCalendar();
  
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
    
    // Calculate the visible calendar grid range (includes days from adjacent months)
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDay = firstDayOfMonth.getDay();
    const startOffset = startDay === 0 ? 6 : startDay - 1; // Monday is start
    const visibleStart = new Date(year, month, 1 - startOffset);
    visibleStart.setHours(0, 0, 0, 0);
    
    const endDay = lastDayOfMonth.getDay();
    const endOffset = endDay === 0 ? 0 : 7 - endDay;
    const visibleEnd = new Date(year, month + 1, endOffset);
    visibleEnd.setHours(23, 59, 59, 999);


    lessons.forEach((lesson, index) => {
      const lClassInfo = classes.find(c => c.id === lesson.classId);
      const lSubjectInfo = subjects.find(s => s.id === lesson.subjectId);
      
      if (lClassInfo && lSubjectInfo && lesson.date) {
        // Only create calendar events for lessons that fall within the current month view
        const lessonDate = new Date(lesson.date);
        if (lessonDate >= monthStart && lessonDate <= monthEnd) {
          // If skipHolidayWeeks is enabled, check if the week is fully covered by holidays
          if (activeAcademicYear?.skipHolidayWeeks === 1 && holidays) {
            if (isWeekFullyCoveredByHolidays(lessonDate, holidays)) {
              // Skip this lesson - it's in a fully covered holiday week
              return;
            }
          }
          
          const lessonColor = lesson.color || lSubjectInfo.color || '#4F46E5';
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
      
      // Check if event overlaps with visible calendar grid (includes adjacent month days)
      if (startDate <= visibleEnd && endDate >= visibleStart) {
        // Create individual events for each day the event spans
        // Start from the actual event start date, not limited to month view
        const currentDate = new Date(startDate);
        const lastDate = new Date(endDate);
        
        while (currentDate <= lastDate) {
          // Only create events for days that are visible in the calendar grid (includes adjacent months)
          const currentDateNormalized = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
          if (currentDateNormalized >= visibleStart && currentDateNormalized <= visibleEnd) {
            // Debug logging only in development
            if (process.env.NODE_ENV === 'development') {
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
      
      // Check if holiday overlaps with visible calendar grid (includes adjacent month days)
      if (startDate <= visibleEnd && endDate >= visibleStart) {
        // Create individual events for each day the holiday spans
        // Start from the actual holiday start date, not limited to month view
        const currentDate = new Date(startDate);
        const lastDate = new Date(endDate);
        
        while (currentDate <= lastDate) {
          // Only create events for days that are visible in the calendar grid (includes adjacent months)
          const currentDateNormalized = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
          if (currentDateNormalized >= visibleStart && currentDateNormalized <= visibleEnd) {
            // Debug logging only in development
            if (process.env.NODE_ENV === 'development') {
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
      
      // First, add all activities for each day/week (before processing timetable entries)
      const slotsWithActivities = new Set<number>();
      if (timetableActivities && timetableSlots) {
        for (let day = 1; day <= monthEnd.getDate(); day++) {
          const date = new Date(year, month, day);
          date.setHours(12, 0, 0, 0);
          const dateStr = date.toISOString().split('T')[0];
          const dayOfWeek = new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(date);
          const weekNumber = getWeekNumberForDate(date);
          
          timetableActivities.forEach(activity => {
            // Normalize dayOfWeek for comparison
            const activityDayOfWeek = (activity.dayOfWeek || '').toLowerCase().trim();
            const currentDayOfWeekLower = (dayOfWeek || '').toLowerCase().trim();
            
            // Normalize weekNumber for comparison
            const activityWeekNumber = activity.weekNumber != null 
              ? (typeof activity.weekNumber === 'string' ? parseInt(activity.weekNumber) : activity.weekNumber)
              : 1;
            // If weekNumber is null (outside academic year), don't match - activities should only show within academic year
            const currentWeekNumberNum = weekNumber != null 
              ? (typeof weekNumber === 'string' ? parseInt(weekNumber) : weekNumber)
              : null;
            
            // Match if dayOfWeek matches and weekNumber matches exactly (both must be non-null)
            // Activities must match the exact week number they're assigned to
            if (activity.timetableSlotId && 
                activityDayOfWeek === currentDayOfWeekLower && 
                currentWeekNumberNum !== null &&
                activityWeekNumber === currentWeekNumberNum) {
              slotsWithActivities.add(activity.timetableSlotId);
              
              const slot = timetableSlots.find(s => s.id === activity.timetableSlotId);
              if (slot) {
                const [startHour, startMinute] = slot.startTime.split(':').map(Number);
                const [endHour, endMinute] = slot.endTime.split(':').map(Number);
                
                const startTime = new Date(year, month, day, startHour, startMinute);
                const endTime = new Date(year, month, day, endHour, endMinute);
                
                initialEvents.push({
                  id: `activity-${activity.id}-${dateStr}`,
                  title: activity.title || 'Untitled Activity',
                  type: 'activity',
                  startTime: startTime,
                  endTime: endTime,
                  color: (activity.color && activity.color.trim()) || '#8B5CF6',
                  location: activity.location || undefined,
                  description: activity.description || activity.notes || undefined,
                  allDay: false,
                  activityId: activity.id,
                  activityType: activity.activityType,
                  timetableSlotId: activity.timetableSlotId,
                });
              }
            }
          });
        }
      }

      // Generate unfinished lessons for each day in the month (but skip slots that have activities)
      for (let day = 1; day <= monthEnd.getDate(); day++) {
        const date = new Date(year, month, day);
        date.setHours(12, 0, 0, 0);
        const dateStr = date.toISOString().split('T')[0];
        
        // If skipHolidayWeeks is enabled, check if the week is fully covered by holidays
        if (activeAcademicYear?.skipHolidayWeeks === 1 && holidays) {
          if (isWeekFullyCoveredByHolidays(date, holidays)) {
            // Skip generating unfinished lessons for this day - it's in a fully covered holiday week
            continue;
          }
        }
        
        const dayOfWeek = new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(date);
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
            // Skip if this slot has an activity (activities are already added above)
            if (slotsWithActivities.has(entry.timetableSlotId)) {
              return;
            }
            
            const slot = timetableSlots.find(s => s.id === entry.timetableSlotId);
            if (!slot) return;
            
            // Only create unfinished lesson if there's a class or subject assigned
            if (entry.classId || entry.subjectId) {
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
            // If entry has no classId/subjectId:
            // - If there's an activity, it's already shown above (added first)
            // - If there's no activity, don't create anything (slot is hidden)
          }
        });
      }
    }
    
    // Combine all events including processed holidays
    const allEvents = [...initialEvents, ...processedHolidayEvents];

    setCalendarEvents(allEvents);

  }, [events, lessons, classes, subjects, currentDate, getHolidayEvents, timetableEntries, timetableSlots, timetableActivities, user, getWeekNumberForDate, activeAcademicYear, holidays]);

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
      date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues - consistent with current month dates
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
      date.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues - consistent with current month dates
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

  const numRows = Math.ceil(monthGrid.length / 7);
  
  return (
    <div className={`flex h-full flex-col ${className}`}>
      <div className="flex-1 overflow-hidden shadow-lg rounded-xl border-2 border-gray-200 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="sticky top-0 z-10 grid grid-cols-7 gap-px border-b border-gray-300 bg-gray-200 text-center text-xs font-semibold leading-6 text-gray-700 flex-shrink-0">
            <div className="bg-white py-2">Mon</div>
            <div className="bg-white py-2">Tue</div>
            <div className="bg-white py-2">Wed</div>
            <div className="bg-white py-2">Thu</div>
            <div className="bg-white py-2">Fri</div>
            <div className="bg-white py-2">Sat</div>
            <div className="bg-white py-2">Sun</div>
          </div>
          
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            <div className="flex-1 grid grid-cols-7 gap-px bg-gray-200 min-h-0" style={{ gridTemplateRows: `repeat(${numRows}, 1fr)` }}>
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
              
              // If skipHolidayWeeks is enabled, don't show week label during fully covered holiday weeks
              const shouldShowWeekLabel = weekNumber && date.getDay() === 1 && (
                !activeAcademicYear?.skipHolidayWeeks || 
                !holidays || 
                !isWeekFullyCoveredByHolidays(date, holidays)
              );

              return (
                <div
                  key={dayIdx}
                  className={`relative h-full bg-white px-2 py-2 flex flex-col ${
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
                        isToday(date) ? 'bg-blue-600 text-white hover:bg-blue-700' : ''
                      }`}
                    >
                      {date.getDate()}
                    </button>
                    {/* Week Number Indicator - show on Mondays within academic year, but not during fully covered holiday weeks */}
                    {shouldShowWeekLabel && (
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
                          className={`${getCardClassName(getCardStyle(cardStyle))} items-start min-w-0 ${event.isUnfinished ? 'border-dashed' : 'border-solid'}`}
                          style={{
                            backgroundColor: (() => {
                              const styleConfig = getCardStyle(cardStyle);
                              return event.isUnfinished
                                ? lightenColor(event.color || '#FCD34D', 0.7) // Much lighter background for unplanned
                                : (event.color 
                                    ? (event.type === 'lesson' && event.planCompleted 
                                        ? lightenColor(event.color, styleConfig.backgroundOpacity - 0.1) // Muted color for completed lessons (vibrant)
                                        : lightenColor(event.color, styleConfig.backgroundOpacity + 0.35)) // Normal color for incomplete (old pale version)
                                    : '#F3F4F6');
                            })(),
                            borderColor: (() => {
                              const styleConfig = getCardStyle(cardStyle);
                            return event.isUnfinished
                              ? darkenColor(event.color || '#FCD34D', 0.2) // Darker border for unplanned (more visible)
                              : (getBorderColorWithOpacity(
                                  event.color || '#FCD34D',
                                  false,
                                  event.type === 'lesson' && event.planCompleted || false,
                                  styleConfig
                                ) || (event.color ? `${event.color}AA` : '#374151'));
                          })(),
                          borderStyle: event.isUnfinished ? 'dashed' : 'solid',
                          opacity: event.isUnfinished ? 0.6 : 1, // More faded for unplanned
                          color: event.isUnfinished 
                            ? '#1F2937' // Dark gray for better readability on light backgrounds
                            : undefined, // Use default text color for planned lessons
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
                            } else if (event.type === 'activity') {
                              // Find the activity data
                              const activity = timetableActivities?.find(a => a.id === event.activityId);
                              if (activity) {
                                setEditingActivity(activity);
                              }
                            } else {
                              setViewingEvent(event);
                            }
                          }}
                        >
                          <div className="flex items-center gap-1 w-full min-w-0 overflow-hidden">
                            <p 
                              className="font-bold text-xs truncate flex-1 min-w-0 leading-tight" 
                              style={{ 
                                color: event.isUnfinished
                                  ? '#1F2937' // Grey text for unplanned lessons
                                  : getContrastTextColor(
                                      event.color ? lightenColor(event.color, event.planCompleted ? 0.2 : 0.4) : '#F3F4F6',
                                      event.color || '#FCD34D'
                                    ),
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
                              <Repeat className="h-3 w-3 flex-shrink-0 opacity-60" style={{ 
                                color: event.isUnfinished
                                  ? '#1F2937' // Grey text for unplanned lessons
                                  : getContrastTextColor(
                                      event.color || '#F3F4F6',
                                      event.color || '#FCD34D'
                                    )
                              }} />
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
              // Try to find class and subject IDs by name if available
              let classId = '';
              let subjectId = '';
              
              if (editingLesson.class && classes) {
                const matchingClass = classes.find(c => c.name === editingLesson.class);
                classId = matchingClass?.id?.toString() || '';
              }
              
              if (editingLesson.subject && subjects) {
                const matchingSubject = subjects.find(s => s.name === editingLesson.subject);
                subjectId = matchingSubject?.id?.toString() || '';
              }
              
              return {
                title: editingLesson.title,
                timetableSlotIds: editingLesson.isUnfinished && editingLesson.timetableSlotId ? [editingLesson.timetableSlotId.toString()] : [],
                classId: classId || undefined,
                subjectId: subjectId || undefined,
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
              title: firstLesson?.title || editingLesson.title,
              timetableSlotIds: timetableSlotIds,
              classId: classId,
              subjectId: subjectId,
              date: firstLesson?.date || editingLesson.startTime.toISOString().split('T')[0],
              lessonPlan: firstLesson?.lessonPlan || editingLesson.description || '',
              color: firstLesson?.color || editingLesson.color || '#6B7280',
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

      {/* Activity Modal */}
      {editingActivity && (
        <TimetableActivityModal
          open={true}
          onClose={() => setEditingActivity(null)}
          onSave={async (data: any) => {
            try {
              const isEditing = editingActivity.id;
              const url = '/api/timetable-activities';
              const method = isEditing ? 'PUT' : 'POST';

              // Prepare the request body
              const requestBody: any = {
                ...data,
              };

              if (isEditing) {
                // For editing, include the ID and ensure timetableSlotId is included
                requestBody.id = editingActivity.id;
                // Don't override timetableSlotId if it's already in data (from modal)
                if (!requestBody.timetableSlotId) {
                  requestBody.timetableSlotId = editingActivity.timetableSlotId;
                }
              } else {
                // For creating, include timetableSlotId and ensure required fields
                requestBody.timetableSlotId = editingActivity.timetableSlotId;
              }

              const response = await fetch(url, {
                method,
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody),
              });

              if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errorMessage = errorData.error || `Failed to ${isEditing ? 'update' : 'create'} activity`;
                throw new Error(errorMessage);
              }

              mutateTimetableActivities();
              setEditingActivity(null);
            } catch (error) {
              console.error('Error saving activity:', error);
              alert(`Error ${editingActivity.id ? 'updating' : 'creating'} activity. Please try again.`);
            }
          }}
          onDelete={async (id: number) => {
            try {
              const response = await fetch(`/api/timetable-activities?id=${id}`, {
                method: 'DELETE',
              });

              if (!response.ok) {
                throw new Error('Failed to delete activity');
              }

              mutateTimetableActivities();
              setEditingActivity(null);
            } catch (error) {
              console.error('Error deleting activity:', error);
              throw error;
            }
          }}
          mode={editingActivity.id ? 'edit' : 'add'}
          initialData={editingActivity}
          slotData={timetableSlots?.find(s => s.id === editingActivity.timetableSlotId) ? {
            dayOfWeek: editingActivity.dayOfWeek,
            weekNumber: editingActivity.weekNumber,
            startTime: timetableSlots.find(s => s.id === editingActivity.timetableSlotId)?.startTime || '',
            endTime: timetableSlots.find(s => s.id === editingActivity.timetableSlotId)?.endTime || '',
            label: timetableSlots.find(s => s.id === editingActivity.timetableSlotId)?.label || '',
          } : undefined}
        />
      )}
    </div>
  );
} 