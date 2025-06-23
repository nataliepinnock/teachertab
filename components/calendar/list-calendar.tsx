'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, List, Calendar } from 'lucide-react';

interface ListCalendarProps {
  onAddEvent?: () => void;
  className?: string;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
}

export function ListCalendar({ onAddEvent, className = '', currentDate: externalCurrentDate, onDateChange }: ListCalendarProps) {
  const [currentDate, setCurrentDate] = useState(externalCurrentDate || new Date());

  // Update internal state when external date changes
  useEffect(() => {
    if (externalCurrentDate) {
      setCurrentDate(externalCurrentDate);
    }
  }, [externalCurrentDate]);

  // Notify parent when internal date changes
  const updateDate = (newDate: Date) => {
    setCurrentDate(newDate);
    if (onDateChange) {
      onDateChange(newDate);
    }
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

  return (
    <div className={`flex h-full flex-col ${className}`}>
      <div className="flex-1 overflow-auto bg-white">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">List View</h3>
            <p className="text-gray-500">List view implementation coming soon...</p>
            <p className="text-sm text-gray-400 mt-2">
              This will show events in a chronological list format
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 