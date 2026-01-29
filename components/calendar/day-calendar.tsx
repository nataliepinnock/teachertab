'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import { Event, Lesson, Class, Subject, User } from '@/lib/db/schema';
import { useAcademicCalendar } from '@/lib/hooks/useAcademicCalendar';
import { isWeekFullyCoveredByHolidays } from '@/lib/utils/academic-calendar';
import { getCardStyle, getCardClassName, getBorderColorWithOpacity } from '@/lib/utils/card-styles';
import { getLocalizedHolidayType, getLocalizedTerm } from '@/lib/utils/localization';
import { Button } from '@/components/ui/button';

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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock, MapPin, BookOpen, Users, X, Edit, ChevronLeft, ChevronRight, Plus, Trash2, Repeat, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { ColorPicker } from '@/components/ui/color-picker';
import { LessonModal } from '@/components/lesson-modal';
import { TimetableActivityModal } from '@/components/timetable-activity-modal';
import { EventModal } from '@/components/event-modal';

interface DayCalendarProps {
  className?: string;
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onAddEvent?: () => void;
  cardStyle?: string;
}

interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  color: string;
  type: 'lesson' | 'event' | 'holiday' | 'activity';
  class?: string;
  subject?: string;
  location?: string;
  description?: string;
  holiday?: any;
  isMultiDay?: boolean;
  startDateStr?: string;
  endDateStr?: string;
  allDay?: boolean;
  lessonIds?: number[]; // For grouped lessons
  isUnfinished?: boolean; // Flag for unfinished lessons from timetable entries
  timetableSlotId?: number; // For unfinished lessons
  planCompleted?: boolean; // Whether the lesson plan is completed
  isRecurring?: boolean; // Whether this is a recurring event
  recurrenceType?: string; // Type of recurrence
  activityId?: number; // For timetable activities
  activityType?: string; // 'meeting', 'duty', 'planning', etc.
}

// Type for lessons with timetable slot data
interface LessonWithSlot {
  id: number;
  title: string;
  date: string;
  color: string | null;
  classId: number | null;
  className: string | null;
  classColor: string | null;
  subjectId: number | null;
  subjectName: string | null;
  subjectColor: string | null;
  timetableSlotId: number | null;
  slotStartTime: string | null;
  slotEndTime: string | null;
  room: string | null;
  lessonPlan: string | null;
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

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
            className={`py-1.5 ${!isCurrentMonth ? 'text-gray-400' : ''} ${isSelected(date) ? 'bg-blue-600 text-white rounded-full' : ''} ${!isSelected(date) && isToday(date) ? 'text-blue-600' : ''}`}
          >
            {date.getDate()}
          </button>
        ))}
      </div>
    </div>
  );
}

export function DayCalendar({ className, currentDate, onDateChange, onAddEvent, cardStyle = 'solid' }: DayCalendarProps) {
  const [editingLesson, setEditingLesson] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editingHoliday, setEditingHoliday] = useState<CalendarEvent | null>(null);
  const [editingActivity, setEditingActivity] = useState<any | null>(null);
  const [viewingEvent, setViewingEvent] = useState<CalendarEvent | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // Fetch data
  const { data: events, mutate: mutateEvents } = useSWR<Event[]>('/api/events', fetcher);
  const { data: lessons, mutate: mutateLessons } = useSWR<LessonWithSlot[]>('/api/lessons', fetcher);
  const { data: classes } = useSWR<Class[]>('/api/classes', fetcher);
  const { data: subjects } = useSWR<Subject[]>('/api/subjects', fetcher);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const { data: timetableEntries } = useSWR<any[]>('/api/timetable', fetcher);
  const { data: timetableSlots } = useSWR<any[]>('/api/timetable-slots', fetcher);
  const { data: timetableActivities } = useSWR<any[]>('/api/timetable-activities', fetcher);
  

  // Academic calendar hook for holidays
  const { getHolidayEvents, getWeekNumberForDate, activeAcademicYear, holidays: academicHolidays } = useAcademicCalendar();
  
  const holidayEvents = getHolidayEvents();

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
      mutateLessons();
    } catch (error) {
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
      mutateEvents();
    } catch (error) {
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
      alert('Error deleting holiday. Please try again.');
    }
  };

  // Auto-scroll to 7am when component mounts or date changes
  useEffect(() => {
    const scrollTo7am = () => {
      if (timelineRef.current) {
        // We have 288 rows (5min each) in the background grid = 24 hours
        // Each 5-min slot is 0.5rem tall
        // 7am = 84 five-minute slots from midnight (7 * 12)
        const slotsTo7am = 84; // 84 five-minute slots to reach 7am
        const scrollPosition = slotsTo7am * 0.5 * 16; // 84 slots * 0.5rem/slot * 16px/rem
        timelineRef.current.scrollTop = scrollPosition;
        return true;
      } else {
        return false;
      }
    };

    // Try multiple times with increasing delays
    const attemptScroll = (attempt: number) => {
      if (attempt > 5) return; // Give up after 5 attempts
      
      const delay = attempt * 200; // 200ms, 400ms, 600ms, etc.
      setTimeout(() => {
        const success = scrollTo7am();
        if (!success) {
          attemptScroll(attempt + 1);
        }
      }, delay);
    };

    attemptScroll(1);
  }, [currentDate]);

  const calendarEvents = useMemo(() => {
    if (!events || !lessons || !classes || !subjects || 
        !Array.isArray(events) || !Array.isArray(lessons) || 
        !Array.isArray(classes) || !Array.isArray(subjects)) {
      return { timedEvents: [], allDayEvents: [] };
    }
    

    // Use local date formatting to avoid timezone issues
    const dateStr = currentDate.getFullYear() + '-' + 
      String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + 
      String(currentDate.getDate()).padStart(2, '0');
    const timedEvents: CalendarEvent[] = [];
    const allDayEvents: CalendarEvent[] = [];
    
    // Get day of week and week number for activity matching
    const dayOfWeek = new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(currentDate);
    const weekNumber = getWeekNumberForDate(currentDate);
    
    
    // First, add all activities for this day/week (before processing timetable entries)
    const slotsWithActivities = new Set<number>();
    if (timetableActivities && timetableSlots) {
      timetableActivities.forEach(activity => {
        // Normalize dayOfWeek for comparison - handle both full names and abbreviations
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
        
        // Activities must match the exact week number they're assigned to (both must be non-null)
        const weekMatches = currentWeekNumberNum !== null && activityWeekNumber === currentWeekNumberNum;
        
        
        // Match if dayOfWeek matches and weekNumber matches exactly
        if (activity.timetableSlotId && 
            activityDayOfWeek === currentDayOfWeekLower && 
            weekMatches) {
          slotsWithActivities.add(activity.timetableSlotId);
          
          const slot = timetableSlots.find(s => s.id === activity.timetableSlotId);
          if (slot) {
            const [startHour, startMinute] = slot.startTime.split(':').map(Number);
            const [endHour, endMinute] = slot.endTime.split(':').map(Number);
            
            const startTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), startHour, startMinute);
            const endTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), endHour, endMinute);
            
            
            timedEvents.push({
              id: `activity-${activity.id}`,
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

    // Add events for the current date
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      const eventDateStr = eventDate.getFullYear() + '-' + 
        String(eventDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(eventDate.getDate()).padStart(2, '0');
      return eventDateStr === dateStr;
    });

    dayEvents.forEach(event => {
      const eventData = {
        id: `event-${event.id}`,
        title: event.title,
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
        color: event.color || '#6B7280',
        type: 'event' as const,
        description: event.description || undefined,
        location: event.location || undefined,
        allDay: Boolean(event.allDay)
      };

      if (event.allDay) {
        allDayEvents.push(eventData);
      } else {
        timedEvents.push(eventData);
      }
    });

    // Add lessons for the current date
    let dayLessons = lessons.filter(lesson => {
      // Handle date comparison without timezone conversion
      if (typeof lesson.date === 'string' && lesson.date.includes('T')) {
        // If it's a full ISO string, extract just the date part
        return lesson.date.split('T')[0] === dateStr;
      } else {
        // If it's already a date string (YYYY-MM-DD), compare directly
        return lesson.date === dateStr;
      }
    });
    
    // If skipHolidayWeeks is enabled, filter out lessons in fully covered holiday weeks
    if (activeAcademicYear?.skipHolidayWeeks === 1 && academicHolidays) {
      dayLessons = dayLessons.filter(lesson => {
        const lessonDate = new Date(lesson.date);
        return !isWeekFullyCoveredByHolidays(lessonDate, academicHolidays);
      });
    }



    // Group lessons by title, class, subject for the same date
    const lessonGroups = new Map<string, any[]>();
    
    dayLessons.forEach(lesson => {
      // Create a key for grouping: title + class + subject
      const groupKey = `${lesson.title}|${lesson.className || ''}|${lesson.subjectName || ''}`;
      
      if (!lessonGroups.has(groupKey)) {
        lessonGroups.set(groupKey, []);
      }
      lessonGroups.get(groupKey)!.push(lesson);
    });
    
    // Process each group of lessons
    lessonGroups.forEach((groupLessons, groupKey) => {
      if (groupLessons.length === 0) return;
      
      // Sort lessons by start time
      groupLessons.sort((a, b) => {
        const aStart = a.slotStartTime || '09:00';
        const bStart = b.slotStartTime || '09:00';
        return aStart.localeCompare(bStart);
      });
      
      // Get the first and last lesson for time range
      const firstLesson = groupLessons[0];
      const lastLesson = groupLessons[groupLessons.length - 1];
      
      // Use start time from first lesson and end time from last lesson
      const startTimeStr = firstLesson.slotStartTime || '09:00';
      const endTimeStr = lastLesson.slotEndTime || '10:00';
      
      // Extract just the date part to avoid timezone issues
      const dateOnly = typeof firstLesson.date === 'string' && firstLesson.date.includes('T') 
        ? firstLesson.date.split('T')[0] 
        : firstLesson.date;
      
      // Create dates in local timezone to avoid timezone issues
      const [startHour, startMin] = startTimeStr.split(':').map(Number);
      const [endHour, endMin] = endTimeStr.split(':').map(Number);
      
      // Create dates in local timezone
      const startTime = new Date(dateOnly + 'T00:00:00');
      startTime.setHours(startHour, startMin, 0, 0);
      
      const endTime = new Date(dateOnly + 'T00:00:00');
      endTime.setHours(endHour, endMin, 0, 0);
      
      
      
      // Create a single event for the grouped lessons
      timedEvents.push({
        id: `lesson-group-${firstLesson.id}`,
        title: firstLesson.title,
        startTime,
        endTime,
        color: firstLesson.color || firstLesson.subjectColor || firstLesson.classColor || '#6B7280',
        type: 'lesson',
        class: firstLesson.className || undefined,
        subject: firstLesson.subjectName || undefined,
        location: firstLesson.room || 'Classroom',
        description: firstLesson.lessonPlan || undefined,
        lessonIds: groupLessons.map(l => l.id),
        planCompleted: Boolean(firstLesson.planCompleted),
      });
    });

    // Add holiday events for the current date
    const dayHolidays = holidayEvents.filter(holiday => {
      if (holiday.isMultiDay && holiday.startDateStr && holiday.endDateStr) {
        return dateStr >= holiday.startDateStr && dateStr <= holiday.endDateStr;
      }
      
      const holidayDate = new Date(holiday.startTime);
      const holidayDateStr = holidayDate.getFullYear() + '-' + 
        String(holidayDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(holidayDate.getDate()).padStart(2, '0');
      return holidayDateStr === dateStr;
    });

    dayHolidays.forEach(holiday => {
      const holidayData = {
        id: `holiday-${holiday.id}`,
        title: holiday.title,
        startTime: holiday.startTime,
        endTime: holiday.endTime,
        color: holiday.color || '#10b981',
        type: 'holiday' as const,
        description: holiday.description,
        allDay: true  // Holidays are typically all-day
      };

      allDayEvents.push(holidayData);
    });

    // Generate unfinished lessons from timetable entries (but skip slots that have activities)
    if (timetableEntries && timetableSlots) {
      // If skipHolidayWeeks is enabled, check if the week is fully covered by holidays
      if (activeAcademicYear?.skipHolidayWeeks === 1 && academicHolidays) {
        if (isWeekFullyCoveredByHolidays(currentDate, academicHolidays)) {
          // Skip generating unfinished lessons for this day - it's in a fully covered holiday week
        } else {
          // Find timetable entries for this day and week
          const entriesForDay = timetableEntries.filter(entry => 
            entry.dayOfWeek === dayOfWeek && 
            entry.weekNumber === weekNumber
          );

          // Track which slots already have lessons
          const lessonsBySlot = new Set(lessons.map(l => l.timetableSlotId).filter(id => id));
          
          entriesForDay.forEach(entry => {
            // Check if there's already a lesson for this slot
            if (!lessonsBySlot.has(entry.timetableSlotId)) {
              // Skip if this slot has an activity (activities are already added above)
              if (slotsWithActivities.has(entry.timetableSlotId)) {
                return;
              }
              
              const slot = timetableSlots.find(s => s.id === entry.timetableSlotId);
              if (!slot) return;
              
              // If there's a class or subject assigned, create an unfinished lesson
              if (entry.classId || entry.subjectId) {
                const classInfo = classes.find(c => c.id === entry.classId);
                const subjectInfo = subjects.find(s => s.id === entry.subjectId);
                
                const [startHour, startMinute] = slot.startTime.split(':').map(Number);
                const [endHour, endMinute] = slot.endTime.split(':').map(Number);
                
                const startTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), startHour, startMinute);
                const endTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), endHour, endMinute);
                
                // Create title based on teacher type
                const title = (user?.colorPreference === 'subject')
                  ? `${subjectInfo?.name || 'Subject'} - ${classInfo?.name || 'Class'}`
                  : `${classInfo?.name || 'Class'} - ${subjectInfo?.name || 'Subject'}`;
                
                timedEvents.push({
                  id: `unfinished-lesson-${dateStr}-${entry.timetableSlotId}`,
                  title: title,
                  type: 'lesson',
                  startTime: startTime,
                  endTime: endTime,
                  color: (user?.colorPreference === 'subject'
                    ? (subjectInfo?.color || '#6B7280')
                    : (classInfo?.color || '#6B7280')),
                  class: classInfo?.name || undefined,
                  subject: subjectInfo?.name || undefined,
                  location: entry.room || undefined,
                  allDay: false,
                  lessonIds: [], // Empty array indicates this is an unfinished lesson
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
    }


    return {
      timedEvents: timedEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime()),
      allDayEvents: allDayEvents.sort((a, b) => a.title.localeCompare(b.title))
    };
  }, [events, lessons, classes, subjects, currentDate, holidayEvents, timetableEntries, timetableSlots, timetableActivities, user, getWeekNumberForDate, activeAcademicYear, academicHolidays]);
  
  if (!events || !lessons || !classes || !subjects || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* All-day events section - fixed at top */}
      {calendarEvents.allDayEvents.length > 0 && (
        <div className="flex-none border-b border-gray-200 bg-gray-50">
          <div className="flex">
            <div className="w-16 flex-none flex items-center justify-center py-2 text-center text-xs font-semibold text-gray-500 border-r border-gray-200">
              <span>All-day</span>
            </div>
            <div className="flex-auto py-2 px-4 mr-4">
              <div className="flex flex-col gap-1">
                {calendarEvents.allDayEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`flex items-center rounded-lg text-xs p-2 text-left border-2 group cursor-pointer`}
                    className={`${event.isUnfinished ? 'border-dashed' : 'border-solid'}`}
                    style={{
                      backgroundColor: event.isUnfinished
                        ? lightenColor(event.color || '#FCD34D', 0.7) // Much lighter background for unplanned
                        : (event.color 
                            ? (event.type === 'lesson' && event.planCompleted 
                                ? lightenColor(event.color, 0.2) // Muted color for completed lessons (vibrant)
                                : lightenColor(event.color, 0.4)) // Normal color for incomplete (old pale version)
                            : '#F3F4F6'),
                      borderColor: event.isUnfinished 
                        ? darkenColor(event.color || '#FCD34D', 0.2) // Darker border for unplanned (more visible)
                        : (event.color 
                            ? (event.type === 'lesson' && event.planCompleted 
                                ? `${event.color}CC` // Slightly transparent border for completed
                                : `${event.color}AA`) // More transparent border for incomplete
                            : '#374151'),
                      borderStyle: event.isUnfinished ? 'dashed' : 'solid',
                      opacity: event.isUnfinished ? 0.6 : 1, // More faded for unplanned
                      color: event.isUnfinished 
                        ? '#1F2937' // Dark gray for better readability on light backgrounds
                        : undefined // Use default text color for planned lessons
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
                    {(() => {
                      const bgColor = event.isUnfinished
                        ? lightenColor(event.color || '#FCD34D', 0.25)
                        : (event.color ? lightenColor(event.color, event.planCompleted ? 0.2 : 0.4) : '#F3F4F6');
                      const textColor = event.isUnfinished 
                        ? '#1F2937' // Grey text for unplanned lessons
                        : getContrastTextColor(bgColor, event.color || '#FCD34D');
                      return (
                        <>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <p className="font-bold text-xs truncate" style={{ color: textColor }}>
                              {event.type === 'lesson' && event.isUnfinished 
                                ? `${(user?.colorPreference === 'subject') ? (event.subject || '') : (event.class || '')}${(user?.colorPreference === 'subject') ? (event.class ? ` - ${event.class}` : '') : (event.subject ? ` - ${event.subject}` : '')}` || `Untitled ${event.type}`
                                : (event.title || `Untitled ${event.type}`)
                              }
                            </p>
                            {event.isRecurring && (
                              <Repeat className="h-3 w-3 flex-shrink-0 opacity-60" style={{ color: textColor }} />
                            )}
                          </div>
                          {event.location && (
                            <span className="ml-2 text-xs" style={{ color: textColor }}>
                              • {event.location}
                            </span>
                          )}
                        </>
                      );
                    })()}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scrollable timeline and time column - takes remaining space */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col mr-4">
        <div ref={timelineRef} className="flex-auto overflow-y-auto min-h-0 flex flex-row">
          {/* Time column */}
          <div className="sticky left-0 z-10 w-16 flex-none bg-white ring-1 ring-gray-100">
            <div 
              className="grid grid-cols-1"
              style={{ gridTemplateRows: '1.75rem repeat(288, 0.5rem)' }}
            >
              <div className="row-end-1 h-7"></div>
              {Array.from({ length: 288 }).map((_, i) => {
                // Each row represents 5 minutes
                // Array index 0 = 12:00 AM at grid row 2, Array index 1 = 12:05 AM at grid row 3, etc.
                // 12 five-minute slots per hour (12 * 24 = 288 total rows)
                const hour = Math.floor(i / 12);
                const minute = (i % 12) * 5;
                
                let timeLabel;
                if (hour === 0) {
                  timeLabel = '12AM';
                } else if (hour === 12) {
                  timeLabel = '12PM';
                } else if (hour > 12) {
                  timeLabel = `${hour - 12}PM`;
                } else {
                  timeLabel = `${hour}AM`;
                }
                
                // Only show labels at the top of each hour (when minute = 0)
                const shouldShowLabel = minute === 0;
                
                return (
                  <div key={i} className="flex items-start justify-end pr-2 h-2" style={{ gridRow: `${i + 2} / span 1` }}>
                    {shouldShowLabel && (
                      <div className="text-xs text-gray-400 leading-none -mt-1">
                        {timeLabel}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Event timeline */}
          <div className="flex-1 relative isolate">
              <div 
                className="grid grid-cols-1"
                style={{ gridTemplateRows: '1.75rem repeat(288, 0.5rem)' }}
              >
                <div className="row-end-1 h-7"></div>
                {Array.from({ length: 288 }).map((_, i) => {
                  // Show grid lines every 30 minutes (every 6 rows) for cleaner appearance
                  // Array index 0 = 12:00 AM at grid row 2, Array index 6 = 12:30 AM at grid row 8, etc.
                  const shouldShowLine = i % 6 === 0;
                  return (
                    <div 
                      key={i} 
                      style={{ 
                        gridRow: `${i + 2} / span 1`,
                        borderTop: shouldShowLine ? '1px solid #e5e7eb' : 'none'
                      }} 
                    />
                  );
                })}
            </div>
              {/* Timed events using the same grid system as timetable setup */}
              <ol
                className="absolute inset-0 grid grid-cols-1"
                style={{ gridTemplateRows: '1.75rem repeat(288, 0.5rem)' }}
              >
              {(() => {
                // Calculate overlaps and positions for timed events only
                const eventsWithPositions = calendarEvents.timedEvents.map(event => {
                const startHour = event.startTime.getHours();
                const startMinute = event.startTime.getMinutes();
                const endHour = event.endTime.getHours();
                const endMinute = event.endTime.getMinutes();
                
                  
                  // Use 5-minute slots to match the time column
                  // Row 1 = header row (1.75rem), Row 2 = 12:00 AM, Row 3 = 12:05 AM, etc.
                  // 12 five-minute slots per hour (12 * 24 = 288 total rows)
                  
                  // Convert time to rows: hours * 12 + minutes/5, then add 2 for header
                  // Array index 0 = grid row 2, so we need +2
                  // For 8:30 AM: (8 * 12 + 30/5) + 2 = (96 + 6) + 2 = 104
                  // For 8:50 AM: (8 * 12 + 50/5) + 2 = (96 + 10) + 2 = 108
                  // For 10:00 AM: (10 * 12 + 0/5) + 2 = (120 + 0) + 2 = 122
                  
                  const startRow = (startHour * 12 + Math.floor(startMinute / 5)) + 6;
                  const endRow = (endHour * 12 + Math.floor(endMinute / 5)) + 6;
                  
                  
                  // Calculate fractional offset within the 5-minute slot
                  const startMinuteOffset = startMinute % 5;
                  const endMinuteOffset = endMinute % 5;
                  const duration = Math.max(1, endRow - startRow);
                  
                  // Calculate expected time for debugging
                  const expectedHour = Math.floor((startRow - 6) / 12);
                  const expectedMinute = ((startRow - 6) % 12) * 5;
                  const expectedTime = `${expectedHour === 0 ? 12 : expectedHour > 12 ? expectedHour - 12 : expectedHour}:${expectedMinute.toString().padStart(2, '0')}${expectedHour >= 12 ? 'PM' : 'AM'}`;
                  

                  
                  return {
                    ...event,
                    startRow,
                    endRow,
                    duration,
                    column: 0,
                    totalColumns: 1,
                    startMinuteOffset,
                    endMinuteOffset
                  };
                });

                // Sort by start time to process overlaps correctly
                eventsWithPositions.sort((a, b) => a.startRow - b.startRow);

                // Calculate overlaps and assign columns
                for (let i = 0; i < eventsWithPositions.length; i++) {
                  const current = eventsWithPositions[i];
                  const overlappingEvents = [current];
                  
                  // Find all overlapping events
                  for (let j = 0; j < eventsWithPositions.length; j++) {
                    if (i !== j) {
                      const other = eventsWithPositions[j];
                      // Check if they overlap
                      if (current.startRow < other.endRow && current.endRow > other.startRow) {
                        overlappingEvents.push(other);
                      }
                    }
                  }
                  
                  // Sort overlapping events: lessons first (left), then events (right)
                  overlappingEvents.sort((a, b) => {
                    // Lessons (type: 'lesson') come first (left side)
                    if (a.type === 'lesson' && b.type !== 'lesson') return -1;
                    if (b.type === 'lesson' && a.type !== 'lesson') return 1;
                    // Within same type, sort by start time
                    return a.startRow - b.startRow;
                  });
                  
                  // Assign columns to overlapping events
                  overlappingEvents.forEach((event, index) => {
                    event.column = index;
                    event.totalColumns = overlappingEvents.length;
                  });
                }

                return eventsWithPositions.map(event => {
                  // For now, position events at exact grid lines without fractional offset
                  // This ensures perfect alignment with the time labels
                  
                  return (
                    <li
                      key={event.id}
                      className="relative"
                      style={{
                        gridRow: `${event.startRow} / span ${event.duration}`,
                        gridColumn: '1 / span 1',
                        marginLeft: `${event.column * (100 / event.totalColumns)}%`,
                        width: `${100 / event.totalColumns}%`,
                        paddingRight: '2px' // Small gap between columns
                      }}
                    >
                      <div 
                        className={`${getCardClassName(getCardStyle(cardStyle))} w-full ${event.isUnfinished ? 'border-dashed' : 'border-solid'}`}
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
                          height: '100%',
                          marginTop: '-3px'
                        }}
                        onClick={() => {
                          if (event.type === 'activity') {
                            // Find the activity data
                            const activity = timetableActivities?.find(a => a.id === event.activityId);
                            if (activity) {
                              setEditingActivity(activity);
                            }
                          } else if (event.type === 'lesson') {
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
                        {/* Content */}
                        <div className="flex-1 min-w-0 py-0.5">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 flex-shrink-0 min-w-0 flex items-center gap-1">
                              {(() => {
                                const textColor = event.isUnfinished 
                                  ? '#1F2937' // Grey text for unplanned lessons
                                  : getContrastTextColor(
                                      event.isUnfinished
                                        ? (event.color || '#FCD34D')
                                        : (event.color || '#F3F4F6'),
                                      event.color || '#FCD34D'
                                    );
                                return (
                                  <>
                                    <div 
                                      className="text-xs font-bold truncate flex-1 flex-shrink-0 min-w-0"
                                      style={{ color: textColor }}
                                    >
                                      {event.type === 'lesson' && event.isUnfinished 
                                        ? `${(user?.colorPreference === 'subject') ? (event.subject || '') : (event.class || '')}${(user?.colorPreference === 'subject') ? (event.class ? ` - ${event.class}` : '') : (event.subject ? ` - ${event.subject}` : '')}` || `Untitled ${event.type}`
                                        : (event.title || `Untitled ${event.type}`)
                                      }
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                          </div>
      
              
                          {/* Show class/subject info */}
                          <div className="space-y-1">
                            {(() => {
                                const textColor = event.isUnfinished 
                                  ? '#1F2937' // Grey text for unplanned lessons
                                  : getContrastTextColor(
                                      event.isUnfinished
                                        ? (event.color || '#FCD34D')
                                        : (event.color || '#F3F4F6'),
                                      event.color || '#FCD34D'
                                    );
                              return (
                                <>
                                  {event.type === 'lesson' && event.class && (
                                    <div className="flex items-center text-xs">
                                      <Users className="h-3 w-3 mr-1" style={{ color: textColor }} />
                                      <span 
                                        className="font-medium"
                                        style={{ color: textColor }}
                                      >
                                        {event.class}
                                      </span>
                                    </div>
                                  )}
                                  {event.location && (
                                    <div className="flex items-center text-xs">
                                      <MapPin className="h-3 w-3 mr-1" style={{ color: textColor }} />
                                      <span style={{ color: textColor }}>{event.location}</span>
                                    </div>
                                  )}
                                </>
                              );
                            })()}
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

      {/* Lesson Modal */}
      {editingLesson && !lessons && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <p>Loading lesson data...</p>
          </div>No
        </div>
      )}
      {editingLesson && lessons && (
        <LessonModal
          isOpen={true}
          mode={editingLesson.isUnfinished ? "add" : "edit"}
          isUnfinished={editingLesson.isUnfinished}
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
              const { timetableSlotIds, planCompleted, ...baseLessonData } = data;
              
              if (!timetableSlotIds || timetableSlotIds.length === 0) {
                alert(`Error: No ${getLocalizedTerm(user?.location, 'timetableSlot').toLowerCase()}s selected. Please select at least one slot.`);
                return;
              }
              
              const lessonPromises = timetableSlotIds.map(async (slotId: string) => {
                // Ensure planCompleted is properly converted to 0 or 1
                const planCompletedValue = planCompleted === true || planCompleted === 1 ? 1 : 0;
                const lessonData = {
                  ...baseLessonData,
                  timetableSlotId: slotId,
                  planCompleted: planCompletedValue,
                };
                
                const response = await fetch('/api/lessons', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(lessonData),
                });
                
                if (!response.ok) {
                  const errorText = await response.text();
                  throw new Error(`Failed to create lesson for slot ${slotId}: ${errorText}`);
                }
                return await response.json();
              });
              
              await Promise.all(lessonPromises);

              // Refresh data
              await mutateLessons();
              setEditingLesson(null);
            } catch (error) {
              if (error instanceof Error) {
                alert(`Error saving lesson: ${error.message}`);
              } else {
                alert('Error updating lesson. Please check the console for details.');
              }
              throw error; // Re-throw to let the modal handle it
            }
          }}
          initialData={(() => {
            const lessonIds = editingLesson.lessonIds;
            const matchingLessons = lessons?.filter(lesson => lessonIds?.includes(lesson.id)) || [];
            const firstLesson = matchingLessons[0];

            // Try to get timetable slot IDs from lessons data
            // For unfinished lessons, use the timetableSlotId directly
            let timetableSlotIds: string[] = [];
            if (editingLesson.isUnfinished && editingLesson.timetableSlotId) {
              timetableSlotIds = [editingLesson.timetableSlotId.toString()];
            } else if (lessonIds && lessonIds.length > 0 && matchingLessons.length > 0) {
              // For regular lessons, get all unique timetable slot IDs from matching lessons
              const slotIds = matchingLessons
                .map(lesson => lesson.timetableSlotId?.toString())
                .filter((id): id is string => Boolean(id));
              timetableSlotIds = [...new Set(slotIds)]; // Remove duplicates
            }

            // For unfinished lessons, we need to map class and subject names to IDs
            let classId = '';
            let subjectId = '';
            
            if (editingLesson.isUnfinished) {
              // Find class ID by name
              const matchingClass = classes?.find(c => c.name === editingLesson.class);
              classId = matchingClass?.id?.toString() || '';
              
              // Find subject ID by name
              const matchingSubject = subjects?.find(s => s.name === editingLesson.subject);
              subjectId = matchingSubject?.id?.toString() || '';
            } else {
              // For regular lessons, use the IDs from the lesson data
              classId = firstLesson?.classId?.toString() || '';
              subjectId = firstLesson?.subjectId?.toString() || '';
            }

            const initialData = {
              // For unfinished lessons, don't populate title from timetable - let user enter their own
              title: editingLesson.isUnfinished ? '' : (firstLesson?.title || editingLesson.title || ''),
              timetableSlotIds: timetableSlotIds,
              classId: classId,
              subjectId: subjectId,
              date: firstLesson?.date || editingLesson.startTime.toISOString().split('T')[0],
              lessonPlan: firstLesson?.lessonPlan || editingLesson.description || '',
              color: firstLesson?.color || editingLesson.color || '#6B7280',
              planCompleted: firstLesson?.planCompleted || editingLesson.planCompleted || false,
            };
            
            return initialData;
          })()}
        />
      )}

      {/* Event Modal */}
      {editingEvent && (
        <EventModal
          isOpen={true}
          mode="edit"
          onClose={() => setEditingEvent(null)}
          onEventAdded={() => {
            mutateEvents();
            setEditingEvent(null);
          }}
          event={{
            id: parseInt(editingEvent.id.replace('event-', '')),
            title: editingEvent.title,
            description: editingEvent.description || '',
            location: editingEvent.location || '',
            startTime: editingEvent.startTime,
            endTime: editingEvent.endTime,
            allDay: editingEvent.allDay ? 1 : 0,
            color: editingEvent.color || '#6B7280',
            userId: user?.id || 0,
            isRecurring: editingEvent.isRecurring ? 1 : 0,
            recurrenceType: editingEvent.recurrenceType || null,
            recurrenceEndDate: null,
            parentEventId: null,
          }}
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
                      <option value="half_term">{getLocalizedHolidayType(user?.location, 'half_term')}</option>
                      <option value="term_break">{getLocalizedHolidayType(user?.location, 'term_break')}</option>
                      <option value="inset_day">{getLocalizedHolidayType(user?.location, 'inset_day')}</option>
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

      {/* Viewing Event Modal */}
      {viewingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {viewingEvent.type === 'activity'
                    ? (viewingEvent.title || 'Untitled Activity')
                    : viewingEvent.type === 'lesson' && viewingEvent.isUnfinished 
                    ? `${(user?.colorPreference === 'subject') ? viewingEvent.subject : viewingEvent.class} - ${(user?.colorPreference === 'subject') ? viewingEvent.class : viewingEvent.subject}` || `Untitled ${viewingEvent.type}`
                    : (viewingEvent.title || `Untitled ${viewingEvent.type}`)
                  }
                </h2>
                <button
                  onClick={() => setViewingEvent(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Event Type Badge */}
                <div className="flex items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    {viewingEvent.type === 'lesson' && <BookOpen className="h-3 w-3 mr-1" />}
                    {viewingEvent.type === 'activity' && <Briefcase className="h-3 w-3 mr-1" />}
                    {viewingEvent.type === 'event' && <Calendar className="h-3 w-3 mr-1" />}
                    {viewingEvent.type === 'holiday' && <Calendar className="h-3 w-3 mr-1" />}
                    {viewingEvent.type === 'activity' ? (viewingEvent.activityType || 'activity') : viewingEvent.type}
                  </span>
                </div>

                {/* Time Information */}

                {/* Location */}
                {viewingEvent.location && (
                  <div className="flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    {viewingEvent.location}
                  </div>
                )}

                {/* Activity Type for activities */}
                {viewingEvent.type === 'activity' && viewingEvent.activityType && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Briefcase className="h-4 w-4 mr-2" />
                    <span className="capitalize">{viewingEvent.activityType.replace('_', ' ')}</span>
                  </div>
                )}

                {/* Class/Subject for lessons */}
                {viewingEvent.type === 'lesson' && viewingEvent.class && (
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    {viewingEvent.class}
                    {viewingEvent.subject && ` - ${viewingEvent.subject}`}
                  </div>
                )}

                {/* Description */}
                {viewingEvent.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{viewingEvent.description}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2 mt-6 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (viewingEvent.type === 'activity') {
                      const activity = timetableActivities?.find(a => a.id === viewingEvent.activityId);
                      if (activity) {
                        setEditingActivity(activity);
                        setViewingEvent(null);
                      }
                    } else if (viewingEvent.type === 'lesson') {
                      setEditingLesson(viewingEvent);
                      setViewingEvent(null);
                    } else if (viewingEvent.type === 'event') {
                      setEditingEvent(viewingEvent);
                      setViewingEvent(null);
                    } else if (viewingEvent.type === 'holiday') {
                      setEditingHoliday(viewingEvent);
                      setViewingEvent(null);
                    }
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete this ${viewingEvent.type}?`)) {
                      if (viewingEvent.type === 'lesson') {
                        handleDeleteLesson(viewingEvent);
                      } else if (viewingEvent.type === 'event') {
                        handleDeleteEvent(viewingEvent);
                      } else if (viewingEvent.type === 'holiday') {
                        handleDeleteHoliday(viewingEvent);
                      }
                      setViewingEvent(null);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
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
                // Don't send userId for updates - API gets it from session
              } else {
                // For creating, include timetableSlotId and ensure required fields
                requestBody.timetableSlotId = editingActivity.timetableSlotId;
                // Don't send userId for creates - API gets it from session
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
