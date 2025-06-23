'use client';

import { useState } from 'react';
import { WeekCalendar, MonthCalendar, ListCalendar } from '@/components/calendar';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from '@/components/ui/dropdown-menu';
import { Calendar, Grid, List, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';

type CalendarView = 'week' | 'month' | 'list';

export default function CalendarPage() {
  const [currentView, setCurrentView] = useState<CalendarView>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const handleAddEvent = () => {
    // TODO: Implement add event functionality
    console.log('Add event clicked');
  };

  const goToPrevious = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (currentView === 'week' || currentView === 'list') {
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
      if (currentView === 'week' || currentView === 'list') {
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
      case 'week': return 'Week view';
      case 'month': return 'Month view';
      case 'list': return 'List view';
    }
  }

  const renderCalendarView = () => {
    switch (currentView) {
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
              />
            </div>
          </div>
        );
      case 'list':
        return (
          <div className="h-full overflow-hidden p-6">
            <div className="h-full rounded-lg border border-gray-200 bg-white shadow-sm">
              <ListCalendar 
                onAddEvent={handleAddEvent}
                className="h-full"
                currentDate={currentDate}
                onDateChange={setCurrentDate}
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
      <div className="flex-none border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Left side: Current Date */}
          <h1 className="text-lg font-semibold text-gray-900">{getDisplayDate()}</h1>

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
                <DropdownMenuItem onSelect={() => setCurrentView('week')}>
                  <Grid className="mr-2 h-4 w-4" />
                  <span>Week view</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setCurrentView('month')}>
                  <Calendar className="mr-2 h-4 w-4" />
                  <span>Month view</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setCurrentView('list')}>
                  <List className="mr-2 h-4 w-4" />
                  <span>List view</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Separator */}
            <div className="h-6 w-px bg-gray-300" />

            {/* Add Event Button */}
            <Button onClick={handleAddEvent}>
              Add event
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-hidden">
        {renderCalendarView()}
      </div>
    </div>
  );
} 