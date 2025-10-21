'use client';

import { useState, useEffect } from 'react';
import { WeekCalendar, MonthCalendar, DayCalendar } from '@/components/calendar';
import { Button } from '@/components/ui/button';
import { EventModal } from '@/components/event-modal';
import { LessonModal } from '@/components/lesson-modal';
import { mutate } from 'swr';
import { useAcademicCalendar } from '@/lib/hooks/useAcademicCalendar';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Calendar, Grid, ChevronLeft, ChevronRight, ChevronDown, View, Plus, BookOpen } from 'lucide-react';

type CalendarView = 'day' | 'week' | 'month';

export default function CalendarPage() {
  const [currentView, setCurrentView] = useState<CalendarView>('week');
  const [isClient, setIsClient] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showEventModal, setShowEventModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showEventsOnly, setShowEventsOnly] = useState(false);
  
  // Debug logging
  console.log('Calendar page showEventsOnly state:', showEventsOnly, '(true = Events Only, false = Lessons & Events)');
  
  // Use academic calendar hook for week numbers
  const { getWeekNumberForDate, activeAcademicYear } = useAcademicCalendar();

  // Handle client-side initialization and localStorage loading
  useEffect(() => {
    setIsClient(true);
    
    // Load saved view from localStorage on client-side
    const savedView = localStorage.getItem('calendar-view') as CalendarView;
    if (savedView && ['day', 'week', 'month'].includes(savedView)) {
      setCurrentView(savedView);
    }
  }, []);

  // Persist view state to localStorage whenever it changes
  useEffect(() => {
    if (isClient) {
      localStorage.setItem('calendar-view', currentView);
    }
  }, [currentView, isClient]);

  // Wrapper function to ensure view changes are always persisted
  const handleViewChange = (view: CalendarView) => {
    setCurrentView(view);
    if (isClient) {
      localStorage.setItem('calendar-view', view);
    }
  };

  const handleAddEvent = () => {
    setShowEventModal(true);
  };

  const handleAddLesson = () => {
    setShowLessonModal(true);
  };

  const handleEventAdded = () => {
    setShowEventModal(false);
    // Refresh events data
    mutate('/api/events');
    // Also refresh holidays in case it was a holiday event
    mutate('/api/holidays');
  };

  const handleLessonSaved = async (lessonData: any) => {
    setShowLessonModal(false);
    
    try {
      // Create a lesson for each selected timetable slot
      const { timetableSlotIds, ...baseLessonData } = lessonData;
      
      if (timetableSlotIds && timetableSlotIds.length > 0) {
        const lessonPromises = timetableSlotIds.map(async (slotId: string) => {
          const response = await fetch('/api/lessons', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...baseLessonData,
              timetableSlotId: slotId,
            }),
          });
          
          if (!response.ok) {
            throw new Error(`Failed to create lesson for slot ${slotId}`);
          }
          
          return response.json();
        });
        
        await Promise.all(lessonPromises);
        console.log('All lessons created successfully');
      }
      
      // Refresh lessons data
      mutate('/api/lessons');
    } catch (error) {
      console.error('Error creating lessons:', error);
      alert('Error creating lessons. Please try again.');
    }
  };

  const goToPrevious = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (currentView === 'day') {
        newDate.setDate(prev.getDate() - 1);
      } else if (currentView === 'week') {
        newDate.setDate(prev.getDate() - 7);
      } else if (currentView === 'month') {
        newDate.setMonth(prev.getMonth() - 1);
      }
      return newDate;
    });
  };

  const goToNext = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (currentView === 'day') {
        newDate.setDate(prev.getDate() + 1);
      } else if (currentView === 'week') {
        newDate.setDate(prev.getDate() + 7);
      } else if (currentView === 'month') {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDisplayDate = () => {
    if (currentView === 'month') {
      return currentDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
    }
    
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
      return `${startOfWeek.toLocaleDateString('en-GB', { day: 'numeric' })} - ${endOfWeek.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    }
    
    return `${startOfWeek.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  const getViewName = () => {
    switch(currentView) {
      case 'day': return 'Day view';
      case 'week': return 'Week view';
      case 'month': return 'Month view';
    }
  }

  const renderCalendarView = () => {
    switch (currentView) {
      case 'day':
        return (
          <div className="h-full overflow-hidden p-6">
            <div className="h-full flex flex-col rounded-lg border border-gray-200 bg-white shadow-sm">
              <DayCalendar 
                className="h-full"
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                onAddEvent={handleAddEvent}
              />
            </div>
          </div>
        );
      case 'week':
        return (
          <div className="h-full overflow-hidden p-6">
            <div className="h-full rounded-lg border border-gray-200 bg-white shadow-sm">
              <WeekCalendar 
                onAddEvent={handleAddEvent}
                className="h-full"
                currentDate={currentDate}
                onDateChange={setCurrentDate}
              />
            </div>
          </div>
        );
      case 'month':
        return (
          <div className="h-full overflow-hidden p-6">
            <div className="h-full rounded-lg border border-gray-200 bg-white shadow-sm">
              <MonthCalendar 
                onAddEvent={handleAddEvent}
                className="h-full"
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                onViewChange={handleViewChange}
                showEventsOnly={showEventsOnly}
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Calendar Header */}
      <div className="flex-none border-b-2 border-gray-200 bg-white px-6 py-6 shadow-sm">
        <div className="flex items-center justify-between">
          {/* Left side: Current Date and Week Number */}
          <div className="flex items-center gap-4">
            {currentView === 'day' ? (
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </h1>
                <p className="mt-1 text-sm text-gray-600 font-medium">
                  {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
                </p>
              </div>
            ) : (
              <h1 className="text-xl font-bold text-gray-900">{getDisplayDate()}</h1>
            )}
            
            {/* Week Number Display - only show for day and week views */}
            {currentView !== 'month' && activeAcademicYear && (() => {
              const weekNumber = getWeekNumberForDate(currentDate);
              return weekNumber ? (
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  weekNumber === 1 
                    ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                    : 'bg-green-50 text-green-600 border border-green-200'
                }`}>
                  Week {weekNumber}
                </div>
              ) : null;
            })()}
          </div>

          {/* Right side: Controls */}
          <div className="flex items-center space-x-4">
            {/* Navigation Controls */}
            <div className="relative flex items-center rounded-md bg-white shadow-sm ring-1 ring-inset ring-gray-300">
              <button
                type="button"
                onClick={goToPrevious}
                className="flex h-9 w-9 items-center justify-center rounded-l-md pr-1 text-gray-400 hover:text-gray-500 focus:relative hover:bg-gray-50"
              >
                <span className="sr-only">Previous</span>
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={goToToday}
                className="border-x border-gray-300 px-3.5 text-sm font-semibold text-gray-900 hover:bg-gray-50 focus:relative"
              >
                Today
              </button>
              <button
                type="button"
                onClick={goToNext}
                className="flex h-9 w-9 items-center justify-center rounded-r-md pl-1 text-gray-400 hover:text-gray-500 focus:relative hover:bg-gray-50"
              >
                <span className="sr-only">Next</span>
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
            
            {/* View Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {getViewName()}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => handleViewChange('day')}>
                  <View className="mr-2 h-4 w-4" />
                  <span>Day view</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleViewChange('week')}>
                  <Grid className="mr-2 h-4 w-4" />
                  <span>Week view</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleViewChange('month')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Month view</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Lessons Only Toggle - only show in month view */}
            {currentView === 'month' && (
              <>
                {/* Separator */}
                <div className="h-6 w-px bg-gray-300" />
                
                {/* Toggle */}
                <div className="flex items-center rounded-md bg-white shadow-sm ring-1 ring-inset ring-gray-300">
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Setting showEventsOnly to false');
                      setShowEventsOnly(false);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-l-md transition-colors ${
                      !showEventsOnly
                        ? 'bg-black text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Lessons & Events
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      console.log('Setting showEventsOnly to true');
                      setShowEventsOnly(true);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium rounded-r-md transition-colors ${
                      showEventsOnly
                        ? 'bg-black text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Events Only
                  </button>
                </div>
              </>
            )}

            {/* Separator */}
            <div className="h-6 w-px bg-gray-300" />

            {/* Add Event/Lesson Button */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="px-3">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={handleAddEvent}>
                  <Calendar className="mr-2 h-4 w-4" />
                  Add Event
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleAddLesson}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Add Lesson
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-hidden">
        {renderCalendarView()}
      </div>

      {/* Modals */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => setShowEventModal(false)}
        onEventAdded={handleEventAdded}
        mode="add"
      />
      
      <LessonModal
        isOpen={showLessonModal}
        onClose={() => setShowLessonModal(false)}
        onSave={handleLessonSaved}
        mode="add"
        initialData={{
          date: currentDate.toISOString().split('T')[0]
        }}
      />
    </div>
  );
} 