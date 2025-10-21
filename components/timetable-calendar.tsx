'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Clock, Edit, Trash2 } from 'lucide-react';
import { TimetableSlot } from '@/lib/db/schema';

interface TimetableCalendarProps {
  slots: TimetableSlot[];
  onEditSlot: (slot: TimetableSlot) => void;
  onDeleteSlot: (id: number) => void;
  currentWeek: number;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function timeToMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function getSlotGridPosition(slot: TimetableSlot) {
  const startHour = parseInt(slot.startTime.split(':')[0]);
  const startMinute = parseInt(slot.startTime.split(':')[1]);
  const endHour = parseInt(slot.endTime.split(':')[0]);
  const endMinute = parseInt(slot.endTime.split(':')[1]);
  
  // The grid is divided into 5-minute intervals like the calendar. 1.75rem is for header.
  // Total rows = 24 hours * 12 (5-min intervals) = 288
  const startRow = (startHour * 12 + startMinute / 5) + 2; // +2 to account for header row
  const endRow = (endHour * 12 + endMinute / 5) + 2;
  const duration = Math.max(1, endRow - startRow); // Ensure minimum duration of 1
  
  // Convert day of week to column (Monday = 1, Sunday = 7)
  const dayMap: { [key: string]: number } = {
    'Monday': 1,
    'Tuesday': 2,
    'Wednesday': 3,
    'Thursday': 4,
    'Friday': 5,
    'Saturday': 6,
    'Sunday': 7
  };
  
  const dayColumn = dayMap[slot.dayOfWeek] || 1;
  
  return { startRow, duration, dayColumn };
}

export function TimetableCalendar({ slots, onEditSlot, onDeleteSlot, currentWeek }: TimetableCalendarProps) {
  // Filter slots for current week
  const weekSlots = slots.filter(slot => slot.weekNumber === currentWeek);
  
  // Auto-scroll to 8am
  const scrollToTime = () => {
    const scrollContainer = document.querySelector('.flex-1.overflow-auto.bg-white');
    if (scrollContainer) {
      // Looking at the time labels: 48 rows total = 24 hours
      // So each row represents 30 minutes (24 * 60 / 48 = 30)
      // 8am = 8 hours = 8 * 2 rows per hour = 16 rows
      // Add 1 for the header row
      const targetRow = 16;
      const rowHeight = 5; // rem, matches our updated gridTemplateRows
      const scrollTop = targetRow * rowHeight * 16; // Convert rem to px
      
      scrollContainer.scrollTop = scrollTop;
    }
  };

  // Debug logging
  console.log('Week slots:', weekSlots);
  console.log('Current week:', currentWeek);

  // Auto-scroll to 7:30 AM when component mounts
  useEffect(() => {
    // Small delay to ensure the grid is rendered
    const timer = setTimeout(() => {
      scrollToTime();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full flex flex-col">
      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto bg-white border border-gray-200 rounded-md">
        <div className="flex w-full flex-none flex-col">
          {/* Header */}
          <div className="sticky top-0 z-30 flex-none bg-white shadow-sm ring-1 ring-black/5">
            <div className="hidden sm:flex">
              <div className="w-16 flex-none" />
              <div className="flex-auto grid grid-cols-7 divide-x divide-gray-100 border-r border-gray-100 text-sm/6 text-gray-500">
                {DAYS_OF_WEEK.map((day, index) => (
                  <div key={day} className="flex items-center justify-center py-3">
                    <span className="flex items-baseline">
                      {day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Calendar Body */}
          <div className="flex flex-auto">
            <div className="sticky left-0 z-10 w-16 flex-none bg-white border-r-2 border-gray-200" />
            <div className="grid flex-auto grid-cols-1 grid-rows-1">
              {/* Horizontal lines */}
                              <div
                  className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
                  style={{ gridTemplateRows: 'repeat(48, minmax(5rem, 1fr))' }}
                >
                <div className="row-end-1 h-7"></div>
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} style={{ gridRow: `${i + 1} / span 1` }}>
                    <div className="sticky left-0 z-20 -mt-2.5 -ml-16 w-16 pr-2 text-right text-xs/5 text-gray-400">
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

              {/* Timetable Slots */}
              <ol
                className="col-start-1 col-end-2 row-start-1 grid grid-cols-1 sm:grid-cols-7"
                style={{ gridTemplateRows: '1.75rem repeat(288, minmax(0, 1fr)) auto' }}
              >
                {weekSlots.map((slot) => {
                  const position = getSlotGridPosition(slot);
                  return (
                    <li 
                      key={slot.id} 
                      className="relative mt-px flex" 
                      style={{ 
                        gridRow: `${position.startRow} / span ${position.duration}`,
                        gridColumn: `${position.dayColumn} / span 1`
                      }}
                    >
                                             <div className="group absolute inset-0 flex flex-col text-xs transition-colors bg-white border border-gray-200 shadow-sm hover:shadow-md rounded-md z-10 overflow-hidden px-2">
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-medium truncate flex-1">{slot.label}</div>
                            <div className="flex space-x-2 ml-2 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
                                onClick={e => {
                                  e.stopPropagation();
                                  onEditSlot(slot);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0 text-red-600 hover:text-red-700 bg-white/80 hover:bg-white"
                                onClick={e => {
                                  e.stopPropagation();
                                  onDeleteSlot(slot.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
      </div>
    </div>
  );
}