'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Calendar, Clock, MapPin, BookOpen, Users, X, MoreHorizontal, Edit, Trash2, Plus, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import useSWR, { mutate } from 'swr';
import { Event, Lesson, Class, Subject, User } from '@/lib/db/schema';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { LessonModal } from '@/components/lesson-modal';
import { EventModal as EventEditModal } from '@/components/event-modal';
import { TimetableActivityModal } from '@/components/timetable-activity-modal';
import { useAcademicCalendar } from '@/lib/hooks/useAcademicCalendar';
import { isWeekFullyCoveredByHolidays } from '@/lib/utils/academic-calendar';
import { getCardStyle, getCardClassName, getBorderColorWithOpacity } from '@/lib/utils/card-styles';
import { getLocalizedTerms, getLocalizedHolidayType, getLocalizedTerm } from '@/lib/utils/localization';

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
    // Don't throw errors for auth-related status codes (401, 403)
    // These are expected when user isn't authenticated yet and are handled gracefully
    if (res.status === 401 || res.status === 403) {
      // Return empty array for auth errors - they're handled gracefully by the components
      return [];
    }
    
    const error: any = new Error(`An error occurred while fetching the data: ${res.status} ${res.statusText}`);
    error.status = res.status;
    
    // Try to parse error response as JSON, but handle cases where it might not be JSON
    try {
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const text = await res.text();
        if (text) {
          error.info = JSON.parse(text);
        }
      }
    } catch (parseError) {
      // If parsing fails, just use the status text
      error.info = { message: res.statusText || 'Unknown error' };
    }
    
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
  color?: string;
  allDay?: boolean;
  lessonIds?: number[]; // For grouped lessons
  isMultiDay?: boolean;
  startDateStr?: string;
  endDateStr?: string;
  timetableSlotId?: number; // For timetable slot reference
  planCompleted?: boolean; // Whether the lesson plan is completed
  isUnfinished?: boolean; // Flag for unfinished lessons from timetable entries
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
  cardStyle?: string;
}

function DraggableEvent({ 
  event, 
  user, 
  onEdit,
  cardStyle = 'classic'
}: { 
  event: CalendarEvent, 
  user: User,
  onEdit: (event: CalendarEvent) => void,
  cardStyle?: string
}) {
  const styleConfig = getCardStyle(cardStyle);
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: event.id,
    data: { event },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 1000,
  } : undefined;

  // Handle toggle completed status
  const handleToggleCompleted = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!event.lessonIds || event.lessonIds.length === 0) return;
    
    const newCompletedStatus = !event.planCompleted;
    
    try {
      // Update all lessons in the group
      const updatePromises = event.lessonIds.map(async (lessonId) => {
        const response = await fetch(`/api/lessons`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: lessonId,
            planCompleted: newCompletedStatus ? 1 : 0,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to update lesson ${lessonId}`);
        }
      });

      await Promise.all(updatePromises);
      
      // Refresh data
      mutate('/api/lessons');
    } catch (error) {
      alert('Error updating lesson status. Please try again.');
    }
  };

  // Apply drag listeners only to outer container, not the clickable inner div
  const dragListeners = listeners || {};

  return (
    <div 
      ref={setNodeRef} 
      style={{...style, height: '100%', minHeight: '100%', width: '100%', overflow: 'hidden'}} 
      {...attributes}
    >
      <div 
        className={`${getCardClassName(styleConfig)} ${event.isUnfinished ? 'border-dashed' : 'border-solid'}`}
        style={{
          backgroundColor: event.isUnfinished
            ? lightenColor(event.color || '#FCD34D', 0.7) // Much lighter background for unplanned
            : (event.color 
                ? (event.type === 'lesson' && event.planCompleted 
                    ? lightenColor(event.color, styleConfig.backgroundOpacity - 0.1) // Muted color for completed lessons (vibrant)
                    : lightenColor(event.color, styleConfig.backgroundOpacity + 0.35)) // Normal color for incomplete (old pale version)
                : '#F9FAFB'),
          borderColor: event.isUnfinished
            ? darkenColor(event.color || '#FCD34D', 0.2) // Darker border for unplanned (more visible)
            : (getBorderColorWithOpacity(
                event.color || '#FCD34D',
                false,
                event.type === 'lesson' && event.planCompleted || false,
                styleConfig
              ) || (event.color ? `${event.color}AA` : '#374151')),
          borderStyle: event.isUnfinished ? 'dashed' : 'solid',
          opacity: event.isUnfinished ? 0.6 : 1, // More faded for unplanned
          color: event.isUnfinished 
            ? '#1F2937' // Dark gray for better readability on light backgrounds
            : undefined, // Use default text color for planned lessons
          transform: 'translateZ(0)'
        }}
        onClick={(e) => {
          e.stopPropagation();
          onEdit(event);
        }}
      >
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <div className="flex-1 min-w-0">
                {event.type === 'lesson' ? (
                  // For lessons, show different content based on whether it's unplanned
                  event.isUnfinished ? (
                    // For unplanned lessons, show class/subject/room
                    <>
                      {(() => {
                        const textColor = '#1F2937'; // Grey text for unplanned lessons
                        return (
                          <>
                            <div 
                              className="text-xs font-semibold truncate"
                              style={{ color: textColor }}
                            >
                              {(user.colorPreference === 'subject') ? (event.subject || '') : (event.class || '')}
                            </div>
                            
                            {/* Show both class and subject for unplanned lessons */}
                            <div 
                              className="text-xs truncate"
                              style={{ color: textColor }}
                            >
                              {(user.colorPreference === 'subject') ? (event.class || '') : (event.subject || '')}
                            </div>
                            
                            {/* Room */}
                            {event.location && (
                              <div className="flex items-center text-xs">
                                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" style={{ color: textColor }} />
                                <span className="truncate" style={{ color: textColor }}>{event.location}</span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </>
                  ) : (
                    // For planned lessons, show in priority order based on teacher type
                    <>
                      {/* Primary: Subject, Title, Room | Secondary: Class, Title, Room */}
                      {(() => {
                        const bgColor = event.color ? lightenColor(event.color, event.planCompleted ? 0.2 : 0.4) : '#F9FAFB';
                        const textColor = getContrastTextColor(bgColor, event.color);
                        return (
                          <>
                            <div 
                              className="text-xs font-semibold truncate"
                              style={{ color: textColor }}
                            >
                              {(user.colorPreference === 'subject') ? (event.subject || '') : (event.class || '')}
                            </div>
                            
                            {/* Title (second priority) */}
                            <div 
                              className="text-xs truncate"
                              style={{ color: textColor }}
                            >
                              {event.title}
                            </div>
                            
                            {/* Room (third priority) */}
                            {event.location && (
                              <div className="flex items-center text-xs">
                                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" style={{ color: textColor }} />
                                <span className="truncate" style={{ color: textColor }}>{event.location}</span>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )
                ) : event.type === 'activity' ? (
                  // For activities, show title and activity type
                  <>
                      {(() => {
                        const bgColor = event.color ? lightenColor(event.color, 0.4) : '#F9FAFB';
                        const textColor = getContrastTextColor(bgColor, event.color);
                      return (
                        <>
                          <div 
                            className="text-xs font-semibold truncate"
                            style={{ color: textColor }}
                          >
                            {event.title}
                          </div>
                          {event.activityType && (
                            <div 
                              className="text-xs truncate"
                              style={{ color: textColor }}
                            >
                              {event.activityType}
                            </div>
                          )}
                          {event.location && (
                            <div className="flex items-center text-xs">
                              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" style={{ color: textColor }} />
                              <span className="truncate" style={{ color: textColor }}>{event.location}</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </>
                ) : (
                  // For events, show only title
                  <div 
                    className="text-xs font-semibold truncate"
                    style={{ 
                      color: getContrastTextColor(
                        event.color ? lightenColor(event.color, 0.4) : '#F9FAFB',
                        event.color
                      )
                    }}
                  >
                    {event.title}
                  </div>
                )}
          </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function WeekCalendar({ onAddEvent, className = '', currentDate: externalCurrentDate, onDateChange, cardStyle = 'solid' }: WeekCalendarProps) {
  const [currentDate, setCurrentDate] = useState(externalCurrentDate || new Date());
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editingLesson, setEditingLesson] = useState<CalendarEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [editingHoliday, setEditingHoliday] = useState<CalendarEvent | null>(null);
  const [editingActivity, setEditingActivity] = useState<any | null>(null);
  const [view, setView] = useState<'week' | 'month'>('week');
  
  const container = useRef<HTMLDivElement>(null);
  const containerNav = useRef<HTMLDivElement>(null);
  const containerOffset = useRef<HTMLDivElement>(null);
  const gridAreaRef = useRef<HTMLDivElement>(null);
  
  const { data: events, error: eventsError } = useSWR<Event[]>('/api/events', fetcher);
  
  const { data: lessons, error: lessonsError } = useSWR<LessonWithSlot[]>('/api/lessons', fetcher);
  const { data: classes, error: classesError } = useSWR<Class[]>('/api/classes', fetcher);
  const { data: subjects, error: subjectsError } = useSWR<Subject[]>('/api/subjects', fetcher);
  const { data: holidays, error: holidaysError } = useSWR<any[]>('/api/holidays', fetcher);
  const { data: user, error: userError } = useSWR<User>('/api/user', fetcher);
  const { data: timetableEntries, error: timetableEntriesError } = useSWR<any[]>('/api/timetable', fetcher);
  const { data: timetableSlots, error: timetableSlotsError } = useSWR<any[]>('/api/timetable-slots', fetcher);
  const { data: timetableActivities, mutate: mutateTimetableActivities } = useSWR<any[]>('/api/timetable-activities', fetcher);
  
  // Academic calendar hook for week number calculation
  const { getWeekNumberForDate, activeAcademicYear, holidays: academicHolidays } = useAcademicCalendar();
  
  // Memoize academicHolidays to prevent unnecessary re-renders
  const stableAcademicHolidays = useMemo(() => academicHolidays, [academicHolidays]);
  
  // Memoize activeAcademicYear to prevent unnecessary re-renders
  const stableActiveAcademicYear = useMemo(() => activeAcademicYear, [
    activeAcademicYear?.id,
    activeAcademicYear?.startDate,
    activeAcademicYear?.endDate,
    activeAcademicYear?.isActive
  ]);
  
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
      mutate('/api/lessons');
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
      mutate('/api/events');
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

  // Update internal state when external date changes
  useEffect(() => {
    if (externalCurrentDate) {
      setCurrentDate(externalCurrentDate);
    }
  }, [externalCurrentDate]);

  // Auto-scroll to 7am when component mounts or date changes
  useEffect(() => {
    const scrollTo7am = () => {
      if (container.current) {
        // The week view uses a grid with 48 rows (one for each half hour)
        // 7am = 14 rows from midnight (7 hours * 2 rows per hour)
        // Each row is 2.4rem tall (minmax(2.4rem, 1fr))
        const rowsTo7am = 14;
        const scrollPosition = rowsTo7am * 2.4 * 16; // 14 rows * 2.4rem/row * 16px/rem
        container.current.scrollTop = scrollPosition;
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
    const dates = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      return date;
    });
    return dates;
  }, [currentDate]);

  // Create a stable string representation of weekDates for dependency tracking
  const weekDatesKey = useMemo(() => {
    return weekDates.map(d => d.toISOString().split('T')[0]).join(',');
  }, [weekDates]);

  // Use ref to track previous events to prevent unnecessary updates
  const previousEventsRef = useRef<string>('');
  
  // This effect will initialize and update the calendar events state
  // when the data from SWR changes.
  useEffect(() => {
    // Initialize empty array - we'll build events from available data
    const initialEvents: CalendarEvent[] = [];
    
    // Process activities FIRST - they don't depend on events/lessons/classes/subjects
    // This ensures activities show even if other data is still loading
    const slotsWithActivities = new Set<number>();
    
    if (timetableActivities && timetableSlots) {
      weekDates.forEach(date => {
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
          
          // Debug: Log the raw values before comparison
          const rawActivityDayOfWeek = activity.dayOfWeek;
          const rawCurrentDayOfWeek = dayOfWeek;
          
          const dayMatches = activityDayOfWeek === currentDayOfWeekLower;
          // Activities must match the exact week number they're assigned to (both must be non-null)
          const weekMatches = currentWeekNumberNum !== null && activityWeekNumber === currentWeekNumberNum;
          const hasSlotId = !!activity.timetableSlotId;
          
          const shouldMatch = hasSlotId && dayMatches && weekMatches;
          
          
          // Match if dayOfWeek matches and weekNumber matches
          if (shouldMatch) {
            slotsWithActivities.add(activity.timetableSlotId);
            
            const slot = timetableSlots.find(s => s.id === activity.timetableSlotId);
            if (slot) {
              const dateStr = date.toISOString().split('T')[0];
              const [startHour, startMinute] = slot.startTime.split(':').map(Number);
              const [endHour, endMinute] = slot.endTime.split(':').map(Number);
              
              const startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startHour, startMinute);
              const endTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), endHour, endMinute);
              
              
              initialEvents.push({
                id: `activity-${activity.id}-${dateStr}`,
                title: activity.title || 'Untitled Activity',
                type: 'activity' as const,
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
      });
    }
    
    // Process lessons only if data is available
    if (lessons && classes && subjects) {
      // Group lessons by title, class, subject, and date
      const lessonGroups = new Map<string, any[]>();
      
      lessons.forEach(lesson => {
      const lessonDate = new Date(lesson.date);
      if (lessonDate >= weekDates[0] && lessonDate <= weekDates[6]) {
        // If skipHolidayWeeks is enabled, check if the week is fully covered by holidays
        if (stableActiveAcademicYear?.skipHolidayWeeks === 1 && stableAcademicHolidays) {
          if (isWeekFullyCoveredByHolidays(lessonDate, stableAcademicHolidays)) {
            // Skip this lesson - it's in a fully covered holiday week
            return;
          }
        }
        
        const lClassInfo = classes.find(c => c.id === lesson.classId);
        const lSubjectInfo = subjects.find(s => s.id === lesson.subjectId);
        
        // Create a key for grouping: title + class + subject + date
        const groupKey = `${lesson.title}|${lClassInfo?.name || ''}|${lSubjectInfo?.name || ''}|${lesson.date}`;
        
        if (!lessonGroups.has(groupKey)) {
          lessonGroups.set(groupKey, []);
        }
        lessonGroups.get(groupKey)!.push(lesson);
      }
    });
    
    // Track which timetable slots have actual lessons for each date
    const lessonsBySlotAndDate = new Map<string, Set<number>>(); // key: "date-slotId", value: Set of lesson IDs
    lessons.forEach(lesson => {
      const lessonDate = new Date(lesson.date);
      if (lessonDate >= weekDates[0] && lessonDate <= weekDates[6]) {
        const dateStr = lesson.date;
        const key = `${dateStr}-${lesson.timetableSlotId}`;
        if (!lessonsBySlotAndDate.has(key)) {
          lessonsBySlotAndDate.set(key, new Set());
        }
        lessonsBySlotAndDate.get(key)!.add(lesson.id);
      }
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
      
      const lClassInfo = classes.find(c => c.id === firstLesson.classId);
      const lSubjectInfo = subjects.find(s => s.id === firstLesson.subjectId);
      
      const lDatePart = firstLesson.date.split('T')[0];
      const [lYear, lMonth, lDay] = lDatePart.split('-').map(Number);
      
      // Use start time from first lesson and end time from last lesson
      const [lStartHour, lStartMinute] = (firstLesson.slotStartTime || '09:00').split(':').map(Number);
      const [lEndHour, lEndMinute] = (lastLesson.slotEndTime || '10:00').split(':').map(Number);
      
      const lStartTime = new Date(lYear, lMonth - 1, lDay, lStartHour, lStartMinute);
      const lEndTime = new Date(lYear, lMonth - 1, lDay, lEndHour, lEndMinute);
      
      // Create a single event for the grouped lessons
          initialEvents.push({
        id: `lesson-group-${firstLesson.id}`, // Use first lesson ID for the group
        title: firstLesson.title,
            type: 'lesson',
        startTime: lStartTime,
        endTime: lEndTime,
        location: 'Classroom',
        description: firstLesson.lessonPlan || undefined,
        class: lClassInfo?.name || undefined,
        subject: lSubjectInfo?.name || undefined,
        color: firstLesson.color || (user?.colorPreference === 'subject' 
          ? (lSubjectInfo?.color || '#6B7280')
          : (lClassInfo?.color || '#6B7280')),
            allDay: false,
        // Store the individual lesson IDs for reference
        lessonIds: groupLessons.map(l => l.id),
        planCompleted: Boolean(firstLesson.planCompleted),
      });
      });
    }

    // Process events only if data is available
    if (events) {
      events.forEach(event => {
      const eventDate = new Date(event.startTime);
      // Normalize dates to start of day for comparison
      const eventDateNormalized = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      const weekStartNormalized = new Date(weekDates[0].getFullYear(), weekDates[0].getMonth(), weekDates[0].getDate());
      const weekEndNormalized = new Date(weekDates[6].getFullYear(), weekDates[6].getMonth(), weekDates[6].getDate());
      
      if (eventDateNormalized >= weekStartNormalized && eventDateNormalized <= weekEndNormalized) {
        const eventStartDate = new Date(event.startTime);
        const eventEndDate = new Date(event.endTime);
        const startDateStr = eventStartDate.toISOString().split('T')[0];
        const endDateStr = eventEndDate.toISOString().split('T')[0];
        const isMultiDay = startDateStr !== endDateStr;
        
        initialEvents.push({
          id: `event-${event.id}`,
          title: event.title,
          type: 'event',
          startTime: new Date(event.startTime.toString()),
          endTime: new Date(event.endTime.toString()),
          location: event.location || undefined,
          description: event.description || undefined,
          color: event.color || '#6B7280',
          allDay: !!(event as any).allDay,
          isMultiDay,
          startDateStr,
          endDateStr,
        });
      }
      });
    }

    // Process holidays only if data is available
    if (holidays) {
      holidays.forEach(holiday => {
      const holidayStartDate = new Date(holiday.startDate);
      const holidayEndDate = new Date(holiday.endDate);
      
      // Normalize dates to start of day for comparison
      const holidayStartNormalized = new Date(holidayStartDate.getFullYear(), holidayStartDate.getMonth(), holidayStartDate.getDate());
      const holidayEndNormalized = new Date(holidayEndDate.getFullYear(), holidayEndDate.getMonth(), holidayEndDate.getDate());
      const weekStartNormalized = new Date(weekDates[0].getFullYear(), weekDates[0].getMonth(), weekDates[0].getDate());
      const weekEndNormalized = new Date(weekDates[6].getFullYear(), weekDates[6].getMonth(), weekDates[6].getDate());
      
      // Check if holiday overlaps with current week
      if (holidayStartNormalized <= weekEndNormalized && holidayEndNormalized >= weekStartNormalized) {
        const startDateStr = holiday.startDate;
        const endDateStr = holiday.endDate;
        const isMultiDay = startDateStr !== endDateStr;
        
        initialEvents.push({
          id: `holiday-${holiday.id}`,
          title: holiday.name,
          type: 'holiday',
          startTime: holidayStartDate,
          endTime: holidayEndDate,
          location: undefined,
          description: undefined,
          color: holiday.color || '#10b981',
          allDay: true,
          isMultiDay,
          startDateStr,
          endDateStr,
        });
      }
      });
    }

    // Generate unfinished lessons from timetable entries (only if data is available)

    // Activities are already processed above, slotsWithActivities is already defined

    // Generate unfinished lessons from timetable entries (but skip slots that have activities)
    if (timetableEntries && timetableSlots) {
      weekDates.forEach(date => {
        const dateStr = date.toISOString().split('T')[0];
        
        // If skipHolidayWeeks is enabled, check if the week is fully covered by holidays
        if (stableActiveAcademicYear?.skipHolidayWeeks === 1 && stableAcademicHolidays) {
          if (isWeekFullyCoveredByHolidays(date, stableAcademicHolidays)) {
            // Skip generating unfinished lessons for this day - it's in a fully covered holiday week
            return;
          }
        }
        
        const dayOfWeek = new Intl.DateTimeFormat('en-GB', { weekday: 'long' }).format(date);
        const weekNumber = getWeekNumberForDate(date);
        
        // Find timetable entries for this day and week
        const entriesForDay = timetableEntries.filter(entry => 
          entry.dayOfWeek === dayOfWeek && 
          entry.weekNumber === weekNumber
        );
        
        // Track which slots already have lessons
        const lessonsBySlotAndDate = new Set(
          (lessons || [])
            .filter(lesson => lesson.timetableSlotId && lesson.date === dateStr)
            .map(lesson => `${dateStr}-${lesson.timetableSlotId}`)
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
              const classInfo = classes?.find(c => c.id === entry.classId);
              const subjectInfo = subjects?.find(s => s.id === entry.subjectId);
              
              const [startHour, startMinute] = slot.startTime.split(':').map(Number);
              const [endHour, endMinute] = slot.endTime.split(':').map(Number);
              
              const startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startHour, startMinute);
              const endTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), endHour, endMinute);
              
              // Create title based on teacher type
              const title = (user?.colorPreference === 'subject')
                ? `${subjectInfo?.name || 'Subject'} - ${classInfo?.name || 'Class'}`
                : `${classInfo?.name || 'Class'} - ${subjectInfo?.name || 'Subject'}`;
              
              const unfinishedLesson = {
                id: `unfinished-lesson-${dateStr}-${entry.timetableSlotId}`,
                title: title,
                type: 'lesson' as const,
                startTime: startTime,
                endTime: endTime,
                location: entry.room || undefined,
                description: undefined,
                class: classInfo?.name || undefined,
                subject: subjectInfo?.name || undefined,
                color: (user?.colorPreference === 'subject'
                  ? (subjectInfo?.color || '#6B7280')
                  : (classInfo?.color || '#6B7280')),
                allDay: false,
                lessonIds: [], // Empty array indicates this is an unfinished lesson
                isUnfinished: true, // Flag to indicate this is an unfinished lesson
                timetableSlotId: entry.timetableSlotId,
              };
              initialEvents.push(unfinishedLesson);
            }
            // If entry has no classId/subjectId:
            // - If there's an activity, it's already shown above (added first)
            // - If there's no activity, don't create anything (slot is hidden)
          }
        });
      });
    }

    // Debug logging
    const activityEvents = initialEvents.filter(e => e.type === 'activity');
    
    // Create a stable string representation of events to compare
    // Include color so that color preference changes trigger updates
    const eventsKey = JSON.stringify(initialEvents.map(e => ({
      id: e.id,
      type: e.type,
      startTime: e.startTime.toISOString(),
      endTime: e.endTime.toISOString(),
      color: e.color
    })));
    
    // Only update state if events actually changed
    if (previousEventsRef.current !== eventsKey) {
      previousEventsRef.current = eventsKey;
      setCalendarEvents(initialEvents);
    }

  }, [events, lessons, classes, subjects, holidays, weekDatesKey, timetableEntries, timetableSlots, timetableActivities, user, stableActiveAcademicYear, stableAcademicHolidays]);

  const allDayEvents = useMemo(() => {
    const allDay = calendarEvents.filter(event => event.allDay);
    // Debug logging only in development
    if (process.env.NODE_ENV === 'development') {
    }
    return allDay;
  }, [calendarEvents]);

  const timedEvents = useMemo(() => {
    return calendarEvents.filter(event => !event.allDay);
  }, [calendarEvents]);

  // If there is any all-day event spanning multiple days in view, reserve an extra header row
  const hasSpanningAllDayInView = useMemo(() => {
    if (!allDayEvents || allDayEvents.length === 0) return false;
    // treat as spanning if start and end date differ
    return allDayEvents.some(ev => {
      try {
        const start = new Date(ev.startTime);
        const end = new Date(ev.endTime);
        const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());
        return endDate.getTime() > startDate.getTime();
      } catch {
        return false;
      }
    });
  }, [allDayEvents]);


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
    const duration = Math.max(1, endRow - startRow);
    
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
                            ? 'rounded-full bg-blue-600 text-white'
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
                            ? 'rounded-full bg-blue-600 text-white'
                            : 'text-gray-900'
                        }`}>
                          {date.getDate()}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="hidden sm:flex border-t border-gray-100 overflow-hidden" style={{ height: `${Math.max(2.25, (Math.max(...Object.values((() => {
                // Calculate max events on any single day
                const renderedEvents = new Set<string>();
                const eventsByDay: { [dayIndex: number]: number } = {};
                
                allDayEvents.forEach((event) => {
                  if (renderedEvents.has(event.id)) return;
                  
                  const eventStart = new Date(event.startTime);
                  const eventEnd = new Date(event.endTime);
                  eventStart.setHours(0, 0, 0, 0);
                  eventEnd.setHours(0, 0, 0, 0);
                  
                  const weekStart = new Date(weekDates[0]);
                  const weekEnd = new Date(weekDates[6]);
                  weekStart.setHours(0, 0, 0, 0);
                  weekEnd.setHours(0, 0, 0, 0);
                  
                  const overlaps = eventStart <= weekEnd && eventEnd >= weekStart;
                  if (overlaps) {
                    renderedEvents.add(event.id);
                    
                    const weekStart2 = new Date(weekDates[0]);
                    weekStart2.setHours(0, 0, 0, 0);
                    
                    let startCol = 0;
                    for (let i = 0; i < weekDates.length; i++) {
                      const dayDate = new Date(weekDates[i]);
                      dayDate.setHours(0, 0, 0, 0);
                      if (dayDate.getTime() === eventStart.getTime() || (eventStart < weekStart2 && i === 0)) {
                        startCol = i;
                        break;
                      }
                      if (dayDate > eventStart) {
                        startCol = Math.max(0, i - 1);
                        break;
                      }
                    }
                    
                    eventsByDay[startCol] = (eventsByDay[startCol] || 0) + 1;
                  }
                });
                
                return eventsByDay;
              })())) || 1) * 1.5 + 1)}rem` }}>
                <div className="w-14 flex-none flex items-center justify-center py-1 text-center text-xs font-semibold text-gray-500 border-r border-gray-100">
                  <span>All-day</span>
                </div>
                <div className="flex-auto relative">
                  <div className="grid grid-cols-7 divide-x divide-gray-100 h-full">
                    {weekDates.map((date, dateIndex) => (
                      <div key={dateIndex} className="relative py-1" />
                    ))}
                  </div>
                  {/* Render all-day events with absolute positioning to span multiple days */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                    <div className="relative h-full py-1 overflow-hidden z-0">
                      {(() => {
                        const renderedEvents = new Set<string>();
                        
                        // Group events by their starting day to calculate stacking
                        const eventsByDay: { [dayIndex: number]: number } = {};
                        
                        const eventsToRender = allDayEvents.filter((event) => {
                          // Only render each multi-day event once (on its first day in the week)
                          if (renderedEvents.has(event.id)) return false;
                          
                          // Check if event overlaps with current week
                          const eventStart = new Date(event.startTime);
                          const eventEnd = new Date(event.endTime);
                          eventStart.setHours(0, 0, 0, 0);
                          eventEnd.setHours(0, 0, 0, 0);
                          
                          const weekStart = new Date(weekDates[0]);
                          const weekEnd = new Date(weekDates[6]);
                          weekStart.setHours(0, 0, 0, 0);
                          weekEnd.setHours(0, 0, 0, 0);
                          
                          const overlaps = eventStart <= weekEnd && eventEnd >= weekStart;
                          if (overlaps) {
                            renderedEvents.add(event.id);
                          }
                          return overlaps;
                        });
                        
                        // Calculate stacking for each day
                        eventsToRender.forEach((event) => {
                          const eventStart = new Date(event.startTime);
                          eventStart.setHours(0, 0, 0, 0);
                          
                          const weekStart = new Date(weekDates[0]);
                          weekStart.setHours(0, 0, 0, 0);
                          
                          // Find which column the event starts in
                          let startCol = 0;
                          for (let i = 0; i < weekDates.length; i++) {
                            const dayDate = new Date(weekDates[i]);
                            dayDate.setHours(0, 0, 0, 0);
                            if (dayDate.getTime() === eventStart.getTime() || (eventStart < weekStart && i === 0)) {
                              startCol = i;
                              break;
                            }
                            if (dayDate > eventStart) {
                              startCol = Math.max(0, i - 1);
                              break;
                            }
                          }
                          
                          eventsByDay[startCol] = (eventsByDay[startCol] || 0) + 1;
                        });
                        
                        // Now render events with proper stacking
                        const eventStackCounts: { [dayIndex: number]: number } = {};
                        
                        
                        return eventsToRender.map((event) => {
                          // Calculate which day columns this event spans
                          const eventStart = new Date(event.startTime);
                          const eventEnd = new Date(event.endTime);
                          eventStart.setHours(0, 0, 0, 0);
                          eventEnd.setHours(0, 0, 0, 0);
                          
                          const weekStart = new Date(weekDates[0]);
                          weekStart.setHours(0, 0, 0, 0);
                          
                          // Find which column the event starts in
                          let startCol = 0;
                          for (let i = 0; i < weekDates.length; i++) {
                            const dayDate = new Date(weekDates[i]);
                            dayDate.setHours(0, 0, 0, 0);
                            if (dayDate.getTime() === eventStart.getTime() || (eventStart < weekStart && i === 0)) {
                              startCol = i;
                              break;
                            }
                            if (dayDate > eventStart) {
                              startCol = Math.max(0, i - 1);
                              break;
                            }
                          }
                          
                          // Find which column the event ends in
                          let endCol = 6;
                          for (let i = weekDates.length - 1; i >= 0; i--) {
                            const dayDate = new Date(weekDates[i]);
                            dayDate.setHours(0, 0, 0, 0);
                            if (dayDate.getTime() === eventEnd.getTime()) {
                              endCol = i;
                              break;
                            }
                            if (dayDate < eventEnd) {
                              endCol = Math.min(6, i);
                              break;
                            }
                          }
                          
                          const spanCols = endCol - startCol + 1;
                          const leftPercent = (startCol / 7) * 100;
                          const widthPercent = (spanCols / 7) * 100;
                          
                          // Calculate vertical position based on how many events are on this day
                          const stackIndex = eventStackCounts[startCol] || 0;
                          eventStackCounts[startCol] = stackIndex + 1;
                          
                          return (
                            <div
                              key={event.id}
                              className={`group absolute flex items-center rounded-lg text-xs/5 border-2 pointer-events-auto`}
                              style={{
                                backgroundColor: event.color || '#6B7280',
                                borderColor: event.color || '#6B7280',
                                left: `${leftPercent}%`,
                                width: `calc(${widthPercent}% - 0.5rem)`,
                                top: `${stackIndex * 1.4}rem`,
                                height: '1.4rem',
                                marginLeft: '0.25rem',
                                marginRight: '0.25rem',
                                maxHeight: '1.4rem',
                                overflow: 'hidden'
                              }}
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
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
                                    setSelectedEvent(event);
                                  }
                                }}
                                className="flex-1 min-w-0 text-left px-2 py-1"
                              >
                                <div className="flex items-center gap-1 min-w-0 flex-auto">
                                  <p className="truncate font-semibold" style={{ 
                      color: getContrastTextColor(
                        event.color || '#F3F4F6',
                        event.color
                      )
                                  }}>
                                    {event.title}
                                    {event.isMultiDay && event.startDateStr && event.endDateStr && (
                                      <span className="ml-1 opacity-75 text-xs font-normal">
                                        ({new Date(event.startDateStr).getDate()}-{new Date(event.endDateStr).getDate()})
                                      </span>
                                    )}
                                  </p>
                                  {event.isRecurring && (
                                    <Repeat className="h-3 w-3 flex-shrink-0 opacity-60" style={{ 
                      color: getContrastTextColor(
                        event.color || '#F3F4F6',
                        event.color
                      )
                                    }} />
                                  )}
                                </div>
                              </button>
                              <div className="flex space-x-1 pr-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 hover:opacity-80"
                                  style={{
                                    backgroundColor: event.color || '#E5E7EB',
                                    color: getContrastTextColor(event.color || '#E5E7EB', event.color)
                                  }}
                                  onClick={e => {
                                    e.stopPropagation();
                                    if (event.type === 'holiday') {
                                      setEditingHoliday(event);
                                    } else if (event.type === 'lesson') {
                                      setEditingLesson(event);
                                    } else {
                                      setEditingEvent(event);
                                    }
                                  }}
                                  title="Edit"
                                >
                                  <Edit className="h-2 w-2" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-4 w-4 p-0 hover:opacity-80"
                                  style={{
                                    backgroundColor: event.color || '#E5E7EB',
                                    color: getContrastTextColor(event.color || '#E5E7EB', event.color)
                                  }}
                                  onClick={e => {
                                    e.stopPropagation();
                                    if (confirm(`Are you sure you want to delete this ${event.type}?`)) {
                                      if (event.type === 'holiday') {
                                        handleDeleteHoliday(event);
                                      } else if (event.type === 'lesson') {
                                        handleDeleteLesson(event);
                                      } else {
                                        handleDeleteEvent(event);
                                      }
                                    }
                                  }}
                                  title="Delete"
                                >
                                  <Trash2 className="h-2 w-2" />
                                </Button>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-auto relative z-10">
              <div className="sticky left-0 z-10 w-14 flex-none bg-white border-r-2 border-gray-200" />
              <div ref={gridAreaRef} className="grid flex-auto grid-cols-1 grid-rows-1">
                {/* Horizontal lines */}
                <div
                  className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
                  style={{ gridTemplateRows: 'repeat(48, minmax(2.4rem, 1fr))' }}
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
                <div className="col-start-1 col-end-2 row-start-1 hidden grid-cols-7 grid-rows-1 divide-x divide-gray-200 sm:grid sm:grid-cols-7">
                  <div className="col-start-1 row-span-full border-r border-gray-200" />
                  <div className="col-start-2 row-span-full border-r border-gray-200" />
                  <div className="col-start-3 row-span-full border-r border-gray-200" />
                  <div className="col-start-4 row-span-full border-r border-gray-200" />
                  <div className="col-start-5 row-span-full border-r border-gray-200" />
                  <div className="col-start-6 row-span-full border-r border-gray-200" />
                  <div className="col-start-7 row-span-full" />
                </div>


                {/* Events */}
                <ol
                  className="col-start-1 col-end-2 row-start-1 grid grid-cols-1 sm:grid-cols-7"
                  style={{ gridTemplateRows: `${hasSpanningAllDayInView ? '16.15rem' : '1.75rem'} repeat(288, 0.4rem) auto` }}
                >
                  {(() => {
                  // Group events by day first
                  const eventsByDay = new Map<number, CalendarEvent[]>();
                  timedEvents.forEach(event => {
                    const dayOfWeek = event.startTime.getDay();
                    const dayColumn = dayOfWeek === 0 ? 7 : dayOfWeek; // Sunday = 7, Monday = 1, etc.
                    
                    if (!eventsByDay.has(dayColumn)) {
                      eventsByDay.set(dayColumn, []);
                    }
                    eventsByDay.get(dayColumn)!.push(event);
                  });

                  // Process each day's events for overlaps
                  const processedEvents: Array<CalendarEvent & { startRow: number; endRow: number; duration: number; column: number; totalColumns: number; dayColumn: number }> = [];
                  
                  eventsByDay.forEach((dayEvents, dayColumn) => {
                    // Calculate positions for this day's events
                    const eventsWithPositions = dayEvents.map(event => {
                      const position = getEventGridPosition(event);
                      return {
                        ...event,
                        startRow: position.startRow + (hasSpanningAllDayInView ? 36 : 0), // 36 rows = 3 card heights (36 * 0.4rem = 14.4rem)
                        endRow: position.startRow + position.duration,
                        duration: position.duration,
                        column: 0,
                        totalColumns: 1,
                        dayColumn
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
                          // Check if they overlap (true overlap, not just touching at boundaries)
                          if (current.startRow < other.endRow && current.endRow > other.startRow && 
                              !(current.endRow === other.startRow || current.startRow === other.endRow)) {
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
                      
                    processedEvents.push(...eventsWithPositions);
                    });

                  return processedEvents.map(event => (
                      <li 
                        key={event.id} 
                      className="relative mt-px flex" 
                        style={{ 
                        gridRow: `${event.startRow} / span ${event.duration}`,
                        gridColumn: `${event.dayColumn} / span 1`,
                        marginLeft: `${event.column * (100 / event.totalColumns)}%`,
                        width: `${100 / event.totalColumns}%`,
                        paddingRight: '2px', // Small gap between columns
                        overflow: 'hidden' // Prevent overflow into next column
                      }}
                    >
                      <DraggableEvent 
                        event={event} 
                        user={user}
                        cardStyle={cardStyle}
                        onEdit={(event) => {
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
                          }
                        }}
                      />
                      </li>
                    ));
                  })()}
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

        {/* Lesson Modal */}
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
            mode={editingLesson.isUnfinished && (!editingLesson.lessonIds || editingLesson.lessonIds.length === 0) ? "add" : "edit"}
            isUnfinished={editingLesson.isUnfinished}
            onClose={() => setEditingLesson(null)}
            onDelete={async (data) => {
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
            }}
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
                await mutate('/api/lessons');
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
          <EventEditModal
            isOpen={true}
            mode="edit"
            onClose={() => setEditingEvent(null)}
            onEventAdded={() => {
                        mutate('/api/events');
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
                    <input
                      type="color"
                      name="color"
                      defaultValue={editingHoliday.color || '#10b981'}
                      className="w-full h-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
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
    </DndContext>
  );
} 