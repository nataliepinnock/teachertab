'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import useSWR, { mutate } from 'swr';
import { Suspense, useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Calendar, 
  CalendarDays,
  ClipboardList, 
  Plus,
  ChevronRight,
  Circle,
  CheckCircle,
  Clock,
  MapPin,
  X
} from 'lucide-react';
import { Event, Lesson, Class, Subject, User } from '@/lib/db/schema';
import { EventModal } from '@/components/event-modal';
import { LessonModal } from '@/components/lesson-modal';
import { TaskModal } from '@/components/task-modal';
import { useAcademicCalendar } from '@/lib/hooks/useAcademicCalendar';
import { isWeekFullyCoveredByHolidays } from '@/lib/utils/academic-calendar';
import { getCardStyle } from '@/lib/utils/card-styles';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function QuickAddButtons() {
  const [showEventModal, setShowEventModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);

  return (
    <>
      <Card className="mb-4 p-4 gap-0">
        <CardHeader className="px-4 pb-0 pt-0">
          <CardTitle className="text-base">Quick Add</CardTitle>
        </CardHeader>
        <CardContent className="px-3 pt-0">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <Button 
              onClick={() => setShowLessonModal(true)}
              className="h-12 flex items-center justify-center gap-2"
            >
              <BookOpen className="h-5 w-5" />
              <span>Add Lesson</span>
            </Button>
            <Button 
              onClick={() => setShowEventModal(true)}
              className="h-12 flex items-center justify-center gap-2"
            >
              <Calendar className="h-5 w-5" />
              <span>Add Event</span>
            </Button>
            <Button 
              onClick={() => setShowTaskModal(true)}
              className="h-12 flex items-center justify-center gap-2"
            >
              <ClipboardList className="h-5 w-5" />
              <span>Add Task</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <EventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        onEventAdded={() => {
          setShowEventModal(false);
          mutate('/api/events');
        }}
        mode="add"
      />

      <LessonModal
        isOpen={showLessonModal}
        onClose={() => setShowLessonModal(false)}
        onSave={async (lessonData) => {
          try {
            const { timetableSlotIds, ...baseLessonData } = lessonData;
            if (timetableSlotIds && timetableSlotIds.length > 0) {
              const lessonPromises = timetableSlotIds.map(async (slotId: string) => {
                const response = await fetch('/api/lessons', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...baseLessonData,
                    timetableSlotId: slotId,
                  }),
                });
                if (!response.ok) throw new Error('Failed to create lesson');
                return response.json();
              });
              await Promise.all(lessonPromises);
            }
            setShowLessonModal(false);
            mutate('/api/lessons');
          } catch (error) {
            throw error;
          }
        }}
        mode="add"
        initialData={{
          date: new Date().toISOString().split('T')[0]
        }}
      />

      <TaskModal
        isOpen={showTaskModal}
        onClose={() => setShowTaskModal(false)}
        onSave={async (taskData) => {
          try {
            const response = await fetch('/api/tasks', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(taskData),
            });
            if (!response.ok) throw new Error('Failed to create task');
            setShowTaskModal(false);
            mutate('/api/tasks');
          } catch (error) {
            throw error;
          }
        }}
        mode="add"
      />
    </>
  );
}

function ToDoListSkeleton() {
  return (
    <Card className="h-full flex flex-col min-h-0">
      <CardHeader className="flex-shrink-0">
        <CardTitle>To-Do List</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ToDoList() {
  const { data: tasks, error, mutate } = useSWR<any[]>('/api/tasks', fetcher);
  const [editingTask, setEditingTask] = useState<any | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  if (!tasks) {
    return <ToDoListSkeleton />;
  }

  if (error) {
    return (
      <Card className="h-full flex flex-col min-h-0">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-orange-600" />
            To-Do List
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
          <p className="text-gray-500">Failed to load tasks</p>
        </CardContent>
      </Card>
    );
  }

  const pendingTasks = tasks
    .filter(task => task.completed === 0)
    .sort((a, b) => {
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    })
    .slice(0, 8);

  const handleToggleComplete = async (taskId: number, currentCompleted: number, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    try {
      const response = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: taskId,
          completed: !currentCompleted,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task completion');
      }

      await mutate();
    } catch (error) {
      // Error updating task completion
    }
  };

  const handleTaskClick = (task: any) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleTaskSave = async () => {
    setShowTaskModal(false);
    setEditingTask(null);
    await mutate();
  };

  const isOverdue = (dueDate: string) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const taskDate = new Date(dueDate);
    taskDate.setHours(0, 0, 0, 0);
    return taskDate < today;
  };

  const isToday = (dueDate: string) => {
    if (!dueDate) return false;
    const today = new Date();
    const taskDate = new Date(dueDate);
    return today.toDateString() === taskDate.toDateString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <>
      <Card className="p-3 h-full flex flex-col min-h-0">
        <CardHeader className="px-3 pb-2 pt-0 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList className="h-4 w-4 text-orange-600" />
              To-Do List
            </CardTitle>
            <Link href="/dashboard/tasks">
              <Button variant="ghost" size="sm" className="text-xs">
                View All
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-3 pt-0 flex-1 min-h-0 flex flex-col">
          {pendingTasks.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium text-sm">No pending tasks</p>
              <p className="text-xs text-gray-400 mt-1">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-1.5 flex-1 overflow-y-auto min-h-0">
              {pendingTasks.map((task) => {
                const isTaskOverdue = task.dueDate && isOverdue(task.dueDate);
                const isTaskToday = task.dueDate && isToday(task.dueDate);
                
                return (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task)}
                    className={`flex items-start gap-2 p-2 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer ${
                      isTaskOverdue ? 'border-red-200 bg-red-50/50' : 'border-gray-200'
                    }`}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleToggleComplete(task.id, task.completed, e)}
                      className="h-5 w-5 p-0 mt-0.5 flex-shrink-0 hover:bg-transparent"
                      title="Mark Complete"
                    >
                      <Circle className="h-4 w-4 text-gray-400" />
                    </Button>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm text-gray-900">{task.title}</h4>
                      {task.dueDate && (
                        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {formatDate(task.dueDate)}
                          </div>
                          {isTaskToday && (
                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                              Today
                            </span>
                          )}
                          {isTaskOverdue && (
                            <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-xs font-medium rounded">
                              Overdue
                            </span>
                          )}
                        </div>
                      )}
                      {task.description && (
                        <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{task.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {editingTask && (
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSave={async (taskData) => {
            try {
              const response = await fetch('/api/tasks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...taskData,
                  id: editingTask.id,
                }),
              });
              if (!response.ok) throw new Error('Failed to update task');
              handleTaskSave();
            } catch (error) {
              throw error;
            }
          }}
          mode="edit"
          initialData={{
            title: editingTask.title,
            description: editingTask.description || '',
            dueDate: editingTask.dueDate ? new Date(editingTask.dueDate).toISOString().slice(0, 16) : '',
            priority: editingTask.priority || 'medium',
            tags: editingTask.tags ? JSON.parse(editingTask.tags).join(', ') : '',
            color: editingTask.color || '#000000',
          }}
        />
      )}
    </>
  );
}

function DayCalendarSkeleton() {
  return (
    <Card className="h-full flex flex-col min-h-0">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Today's Schedule</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className="animate-pulse h-full bg-gray-100 rounded"></div>
      </CardContent>
    </Card>
  );
}

function UpcomingEventsSkeleton() {
  return (
    <Card className="h-full flex flex-col min-h-0">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 min-h-0">
        <div className="animate-pulse space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingEvents() {
  const { data: events, error, mutate } = useSWR<Event[]>('/api/events', fetcher);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);

  if (!events) {
    return <UpcomingEventsSkeleton />;
  }

  if (error) {
    return (
      <Card className="h-full flex flex-col min-h-0">
        <CardHeader className="flex-shrink-0">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-purple-600" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0">
          <p className="text-gray-500">Failed to load events</p>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const upcomingEvents = events
    .filter(event => new Date(event.startTime.toString()) > now)
    .sort((a, b) => new Date(a.startTime.toString()).getTime() - new Date(b.startTime.toString()).getTime())
    .slice(0, 10);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };
  
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEventClick = (event: Event) => {
    setEditingEvent(event);
    setShowEventModal(true);
  };

  const handleEventSave = async () => {
    setShowEventModal(false);
    setEditingEvent(null);
    await mutate();
  };

  const handleEventDelete = async () => {
    if (!editingEvent) return;
    try {
      const response = await fetch(`/api/events/${editingEvent.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete event');
      setShowEventModal(false);
      setEditingEvent(null);
      await mutate();
    } catch (error) {
      alert('Failed to delete event. Please try again.');
    }
  };

  return (
    <>
      <Card className="p-3 h-full flex flex-col min-h-0">
        <CardHeader className="px-3 pb-2 pt-0 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4 text-purple-600" />
              Upcoming Events
            </CardTitle>
            <Link href="/dashboard/calendar">
              <Button variant="ghost" size="sm" className="text-xs">
                View All
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="px-3 pt-0 flex-1 min-h-0 flex flex-col">
          {upcomingEvents.length === 0 ? (
            <div className="text-center py-8">
              <CalendarDays className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium text-sm">No upcoming events</p>
              <p className="text-xs text-gray-400 mt-1">Add events to see them here</p>
            </div>
          ) : (
            <div className="space-y-1.5 flex-1 overflow-y-auto min-h-0">
              {upcomingEvents.map((event) => (
                <div 
                  key={event.id} 
                  onClick={() => handleEventClick(event)}
                  className="flex items-start gap-2 p-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-1.5 flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-gray-900">{event.title}</h4>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {formatDate(event.startTime.toString())}
                      {event.allDay !== 1 && (
                        <>
                          <span className="mx-1">•</span>
                          {formatTime(event.startTime.toString())}
                        </>
                      )}
                    </div>
                    {event.location && (
                      <div className="flex items-center text-xs text-gray-500 mt-0.5">
                        <MapPin className="h-3 w-3 mr-1" />
                        <span className="truncate">{event.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {editingEvent && (
        <EventModal
          isOpen={showEventModal}
          onClose={() => {
            setShowEventModal(false);
            setEditingEvent(null);
          }}
          onEventAdded={handleEventSave}
          mode="edit"
          event={editingEvent}
        />
      )}
    </>
  );
}

// Function to lighten a hex color
function lightenColor(color: string, amount: number = 0.7): string {
  if (!color || !color.startsWith('#')) return color;
  
  const hex = color.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
  const lightenedR = Math.round(r + (255 - r) * amount);
  const lightenedG = Math.round(g + (255 - g) * amount);
  const lightenedB = Math.round(b + (255 - b) * amount);
  
  return `#${lightenedR.toString(16).padStart(2, '0')}${lightenedG.toString(16).padStart(2, '0')}${lightenedB.toString(16).padStart(2, '0')}`;
}

// Function to calculate relative luminance
function getLuminance(color: string): number {
  if (!color || !color.startsWith('#')) return 0.5;
  
  const hex = color.slice(1);
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  
  const [rLinear, gLinear, bLinear] = [r, g, b].map(val => {
    return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

// Function to darken a hex color
function darkenColor(color: string, amount: number = 0.3): string {
  if (!color || !color.startsWith('#')) return color;
  
  const hex = color.slice(1);
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  
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
  allDay?: boolean;
  planCompleted?: boolean;
  isUnfinished?: boolean;
  timetableSlotId?: number;
}

function DayCalendarView() {
  const currentDate = new Date();
  const { data: events } = useSWR<Event[]>('/api/events', fetcher);
  const { data: lessons } = useSWR<any[]>('/api/lessons', fetcher);
  const { data: classes } = useSWR<Class[]>('/api/classes', fetcher);
  const { data: subjects } = useSWR<Subject[]>('/api/subjects', fetcher);
  const { data: timetableSlots } = useSWR<any[]>('/api/timetable-slots', fetcher);
  const { data: timetableActivities } = useSWR<any[]>('/api/timetable-activities', fetcher);
  const { data: timetableEntries } = useSWR<any[]>('/api/timetable', fetcher);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const { getHolidayEvents, getWeekNumberForDate, activeAcademicYear, holidays: academicHolidays } = useAcademicCalendar();
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingLesson, setEditingLesson] = useState<CalendarEvent | null>(null);
  const [showLessonModal, setShowLessonModal] = useState(false);

  const holidayEvents = getHolidayEvents();

  // Get today's date string
  const dateStr = currentDate.getFullYear() + '-' + 
    String(currentDate.getMonth() + 1).padStart(2, '0') + '-' + 
    String(currentDate.getDate()).padStart(2, '0');

  // Get day of week
  const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][currentDate.getDay()];
  const weekNumber = getWeekNumberForDate(currentDate);

  // Process events for today
  const todayEvents = useMemo(() => {
    if (!events || !lessons || !classes || !subjects || !Array.isArray(events) || !Array.isArray(lessons) || !Array.isArray(classes) || !Array.isArray(subjects)) {
      return [];
    }

    const calendarEvents: CalendarEvent[] = [];
    const slotsWithActivities = new Set<number>();

    // Add events for today
    const dayEvents = events.filter(event => {
      const eventDate = new Date(event.startTime);
      const eventDateStr = eventDate.getFullYear() + '-' + 
        String(eventDate.getMonth() + 1).padStart(2, '0') + '-' + 
        String(eventDate.getDate()).padStart(2, '0');
      return eventDateStr === dateStr;
    });

    dayEvents.forEach(event => {
      calendarEvents.push({
        id: `event-${event.id}`,
        title: event.title,
        startTime: new Date(event.startTime),
        endTime: new Date(event.endTime),
        color: event.color || '#6B7280',
        type: 'event',
        description: event.description || undefined,
        location: event.location || undefined,
        allDay: Boolean(event.allDay)
      });
    });

    // Add lessons for today
    let dayLessons = lessons.filter(lesson => {
      if (!lesson.date) return false;
      const lessonDateStr = typeof lesson.date === 'string' && lesson.date.includes('T')
        ? lesson.date.split('T')[0]
        : lesson.date;
      return lessonDateStr === dateStr;
    });

    // Filter out lessons in fully covered holiday weeks if enabled
    if (activeAcademicYear?.skipHolidayWeeks === 1 && academicHolidays) {
      dayLessons = dayLessons.filter(lesson => {
        const lessonDate = new Date(lesson.date);
        return !isWeekFullyCoveredByHolidays(lessonDate, academicHolidays);
      });
    }

    // Group lessons by title, class, subject
    const lessonGroups = new Map<string, any[]>();
    
    dayLessons.forEach(lesson => {
      // Lessons from API already have className, subjectName, slotStartTime, slotEndTime, etc.
      const className = lesson.className || '';
      const subjectName = lesson.subjectName || '';
      const groupKey = `${lesson.title}|${className}|${subjectName}`;
      if (!lessonGroups.has(groupKey)) {
        lessonGroups.set(groupKey, []);
      }
      lessonGroups.get(groupKey)!.push(lesson);
    });

    // Process each group
    lessonGroups.forEach((groupLessons) => {
      if (groupLessons.length === 0) return;
      
      groupLessons.sort((a, b) => {
        const aStart = a.slotStartTime || '09:00';
        const bStart = b.slotStartTime || '09:00';
        return aStart.localeCompare(bStart);
      });
      
      const firstLesson = groupLessons[0];
      const lastLesson = groupLessons[groupLessons.length - 1];
      
      const startTimeStr = firstLesson.slotStartTime || '09:00';
      const endTimeStr = lastLesson.slotEndTime || '10:00';
      
      const dateOnly = typeof firstLesson.date === 'string' && firstLesson.date.includes('T') 
        ? firstLesson.date.split('T')[0] 
        : firstLesson.date;
      
      const [startHour, startMin] = startTimeStr.split(':').map(Number);
      const [endHour, endMin] = endTimeStr.split(':').map(Number);
      
      const startTime = new Date(dateOnly + 'T00:00:00');
      startTime.setHours(startHour, startMin, 0, 0);
      
      const endTime = new Date(dateOnly + 'T00:00:00');
      endTime.setHours(endHour, endMin, 0, 0);
      
      calendarEvents.push({
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
        planCompleted: Boolean(firstLesson.planCompleted),
      });
    });

    // Add timetable activities for today (before processing unplanned lessons)
    if (timetableSlots && timetableActivities && weekNumber !== null) {
      timetableActivities.forEach(activity => {
        const activityDayOfWeek = (activity.dayOfWeek || '').toLowerCase().trim();
        const currentDayOfWeekLower = dayOfWeek?.toLowerCase().trim();
        
        const activityWeekNumber = activity.weekNumber != null 
          ? (typeof activity.weekNumber === 'string' ? parseInt(activity.weekNumber) : activity.weekNumber)
          : 1;
        
        const weekMatches = weekNumber === activityWeekNumber;
        
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
            
            calendarEvents.push({
              id: `activity-${activity.id}`,
              title: activity.title || 'Untitled Activity',
              type: 'activity',
              startTime,
              endTime,
              color: (activity.color && activity.color.trim()) || '#8B5CF6',
              location: activity.location || undefined,
              description: activity.description || activity.notes || undefined,
              allDay: false,
            });
          }
        }
      });
    }

    // Generate unplanned lessons from timetable entries (slots without lessons)
    if (timetableEntries && timetableSlots && weekNumber !== null) {
      // If skipHolidayWeeks is enabled, check if the week is fully covered by holidays
      if (!(activeAcademicYear?.skipHolidayWeeks === 1 && academicHolidays && isWeekFullyCoveredByHolidays(currentDate, academicHolidays))) {
        // Find timetable entries for this day and week
        const entriesForDay = timetableEntries.filter(entry => {
          const entryDayOfWeek = (entry.dayOfWeek || '').toLowerCase().trim();
          const currentDayOfWeekLower = dayOfWeek?.toLowerCase().trim();
          const entryWeekNumber = entry.weekNumber != null 
            ? (typeof entry.weekNumber === 'string' ? parseInt(entry.weekNumber) : entry.weekNumber)
            : null;
          const matches = entryDayOfWeek === currentDayOfWeekLower && entryWeekNumber === weekNumber;
          return matches;
        });

        // Track which slots already have lessons (check by date AND slot)
        const lessonsBySlotAndDate = new Set<string>();
        lessons.forEach(lesson => {
          if (lesson.timetableSlotId && lesson.date) {
            const lessonDateStr = typeof lesson.date === 'string' && lesson.date.includes('T')
              ? lesson.date.split('T')[0]
              : lesson.date;
            if (lessonDateStr === dateStr) {
              lessonsBySlotAndDate.add(`${lessonDateStr}-${lesson.timetableSlotId}`);
            }
          }
        });
        
        entriesForDay.forEach(entry => {
          const key = `${dateStr}-${entry.timetableSlotId}`;
          // Check if there's already a lesson for this slot on this date
          if (!lessonsBySlotAndDate.has(key)) {
            // Skip if this slot has an activity (activities are already added above)
            if (slotsWithActivities.has(entry.timetableSlotId)) {
              return;
            }
            
            const slot = timetableSlots.find(s => s.id === entry.timetableSlotId);
            if (!slot) return;
            
            // If there's a class or subject assigned, create an unplanned lesson
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
              
              calendarEvents.push({
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
                isUnfinished: true, // Flag to indicate this is an unplanned lesson
                timetableSlotId: entry.timetableSlotId,
              });
            }
          }
        });
      }
    }

    // Add holiday events for today
    const dayHolidays = holidayEvents.filter(holiday => {
      const holidayStart = new Date(holiday.startTime);
      const holidayEnd = new Date(holiday.endTime);
      return currentDate >= holidayStart && currentDate <= holidayEnd;
    });

    dayHolidays.forEach(holiday => {
      calendarEvents.push({
        id: holiday.id,
        title: holiday.title,
        startTime: new Date(holiday.startTime),
        endTime: new Date(holiday.endTime),
        color: holiday.color || '#10b981',
        type: 'holiday',
        allDay: true,
      });
    });

    // Sort by start time
    return calendarEvents.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }, [events, lessons, classes, subjects, timetableSlots, timetableActivities, timetableEntries, user, dateStr, dayOfWeek, weekNumber, activeAcademicYear, academicHolidays, holidayEvents, currentDate]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const styleConfig = getCardStyle('solid');

  const handleEventClick = (event: CalendarEvent) => {
    if (event.type === 'event') {
      const eventId = event.id.replace('event-', '');
      const originalEvent = events?.find(e => e.id.toString() === eventId);
      if (originalEvent) {
        setEditingEvent(event);
        setShowEventModal(true);
      }
    } else if (event.type === 'lesson') {
      setEditingLesson(event);
      setShowLessonModal(true);
    } else if (event.type === 'activity') {
      // Activities can be clicked but we don't have a modal for them yet
      // Could open timetable activity modal if needed
    }
  };

  return (
    <>
      <Card className="p-3 h-full flex flex-col min-h-0">
        <CardHeader className="px-3 pb-2 pt-0 flex-shrink-0">
          <CardTitle className="flex items-center gap-2 text-base">
            <Calendar className="h-4 w-4 text-purple-600" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="px-3 pt-0 flex-1 min-h-0 flex flex-col">
          {todayEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium text-sm">No events scheduled</p>
              <p className="text-xs text-gray-400 mt-1">Your day is free!</p>
            </div>
          ) : (
            <div className="space-y-1.5 flex-1 overflow-y-auto min-h-0">
              {todayEvents.map((event: CalendarEvent) => {
                const isUnfinished = event.isUnfinished || false;
                const planCompleted = event.planCompleted || false;
                
                const bgColor = event.isUnfinished
                  ? lightenColor(event.color || '#FCD34D', 0.7) // Much lighter background for unplanned
                  : (planCompleted
                      ? lightenColor(event.color, styleConfig.backgroundOpacity - 0.1)
                      : lightenColor(event.color, styleConfig.backgroundOpacity + 0.35));
                
                const borderColor = event.isUnfinished
                  ? darkenColor(event.color || '#FCD34D', 0.2) // Darker border for unplanned (more visible)
                  : (event.color || '#6B7280');
                // For unplanned lessons with very light backgrounds, always use dark text for readability
                const textColor = event.isUnfinished 
                  ? '#1F2937' // Dark gray for better readability on light backgrounds
                  : getContrastTextColor(bgColor, event.color);
                const borderStyle = event.isUnfinished ? 'dashed' : 'solid';
                const opacity = event.isUnfinished ? 0.6 : 1; // More faded for unplanned

                return (
                  <div
                    key={event.id}
                    onClick={() => handleEventClick(event)}
                    className="flex items-start gap-2 p-2 border rounded-lg hover:shadow-md transition-all cursor-pointer"
                    style={{
                      backgroundColor: bgColor,
                      borderColor: borderColor,
                      borderStyle: borderStyle,
                      color: textColor,
                      opacity: opacity,
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        {event.type === 'lesson' && (
                          <span className="text-xs opacity-75">
                            {event.class && event.subject ? `${event.class} • ${event.subject}` : event.class || event.subject}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center text-xs opacity-75 gap-2">
                        <Clock className="h-3 w-3" />
                        {formatTime(event.startTime)}
                        {!event.allDay && (
                          <>
                            <span>–</span>
                            {formatTime(event.endTime)}
                          </>
                        )}
                      </div>
                      {event.location && (
                        <div className="flex items-center text-xs opacity-75 mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          <span className="truncate">{event.location}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {editingEvent && (
        <EventModal
          isOpen={showEventModal}
          onClose={() => {
            setShowEventModal(false);
            setEditingEvent(null);
          }}
          onEventAdded={() => {
            mutate('/api/events');
            setShowEventModal(false);
            setEditingEvent(null);
          }}
          mode="edit"
          event={events?.find(e => e.id.toString() === editingEvent.id.replace('event-', '')) || undefined}
        />
      )}

      {editingLesson && (
        <LessonModal
          isOpen={showLessonModal}
          onClose={() => {
            setShowLessonModal(false);
            setEditingLesson(null);
          }}
          onSave={async () => {
            mutate('/api/lessons');
            setShowLessonModal(false);
            setEditingLesson(null);
          }}
          mode={editingLesson.isUnfinished ? "add" : "edit"}
          isUnfinished={editingLesson.isUnfinished}
          initialData={editingLesson.isUnfinished ? {
            title: editingLesson.title,
            classId: classes?.find(c => c.name === editingLesson.class)?.id.toString() || '',
            subjectId: subjects?.find(s => s.name === editingLesson.subject)?.id.toString() || '',
            date: dateStr,
            timetableSlotId: editingLesson.timetableSlotId?.toString() || '',
            lessonPlan: '',
            color: editingLesson.color,
          } : {
            id: editingLesson.id.replace('lesson-group-', ''),
            title: editingLesson.title,
            classId: classes?.find(c => c.name === editingLesson.class)?.id.toString() || '',
            subjectId: subjects?.find(s => s.name === editingLesson.subject)?.id.toString() || '',
            date: dateStr,
            lessonPlan: editingLesson.description || '',
            color: editingLesson.color,
          }}
        />
      )}
    </>
  );
}

export default function DashboardPage() {
  return (
    <section className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 flex flex-col p-4 lg:p-6 min-h-0">
        <div className="mb-4 flex-shrink-0">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
            Dashboard
          </h1>
          <p className="text-gray-600 text-sm">
            Quick access to your daily schedule and tasks
          </p>
        </div>

        <div className="mb-4 flex-shrink-0">
          <Suspense fallback={<div className="h-[100px] bg-gray-100 rounded-xl animate-pulse"></div>}>
            <QuickAddButtons />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
          <div className="flex flex-col min-h-0">
            <Suspense fallback={<DayCalendarSkeleton />}>
              <DayCalendarView />
            </Suspense>
          </div>

          <div className="flex flex-col min-h-0">
            <Suspense fallback={<UpcomingEventsSkeleton />}>
              <UpcomingEvents />
            </Suspense>
          </div>

          <div className="flex flex-col min-h-0">
            <Suspense fallback={<ToDoListSkeleton />}>
              <ToDoList />
            </Suspense>
          </div>
        </div>
      </div>
    </section>
  );
}
