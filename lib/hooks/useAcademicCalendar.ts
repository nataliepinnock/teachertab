import { useCallback } from 'react';
import useSWR from 'swr';
import { AcademicYear, Holiday } from '@/lib/db/schema';
import { getWeekNumber, isSchoolDay, getAcademicYearForDate, getWeekNumberForDate as getWeekNumberForDateUtil } from '@/lib/utils/academic-calendar';
import { useMemo } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useAcademicCalendar() {
  const { data: academicYears, error: academicYearsError } = useSWR<AcademicYear[]>('/api/academic-years', fetcher);
  const { data: holidays, error: holidaysError } = useSWR<Holiday[]>('/api/holidays', fetcher);

  // Get the active academic year
  const activeAcademicYearFromAPI = academicYears?.find(year => year.isActive) || null;
  
  // Debug logging (only in development and when data changes)
  if (process.env.NODE_ENV === 'development' && academicYears !== undefined) {
    console.log('Academic years:', academicYears);
    console.log('Active academic year from API:', activeAcademicYearFromAPI);
  }
  
  // Memoized test academic year if none exists
  const testAcademicYear = useMemo(() => ({
    id: 1,
    userId: 1,
    name: 'Test Academic Year 2025-26',
    startDate: '2025-09-01',
    endDate: '2026-07-31',
    weekCycleStartDate: '2025-09-01',
    skipHolidayWeeks: 1,
    isActive: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  }), []);
  
  const activeAcademicYear = activeAcademicYearFromAPI || testAcademicYear;
  

  // Helper function to get week number for a specific date (works for ANY day of the week)
  const getWeekNumberForDate = useCallback((date: Date): number | null => {
    if (!activeAcademicYear) return null;
    // Use the new function that works for any day of the week
    return getWeekNumberForDateUtil(date, activeAcademicYear);
  }, [activeAcademicYear]);

  // Helper function to check if a date is a school day
  const isSchoolDayForDate = (date: Date): boolean => {
    if (!activeAcademicYear || !holidays) return false;
    return isSchoolDay(date, activeAcademicYear, holidays);
  };

  // Helper function to get holidays for a specific date range
  const getHolidaysInRange = (startDate: Date, endDate: Date): Holiday[] => {
    if (!holidays) return [];
    
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    return holidays.filter(holiday => 
      holiday.startDate <= endStr && holiday.endDate >= startStr
    );
  };

  // Helper function to get current week info
  const getCurrentWeekInfo = () => {
    const today = new Date();
    const weekNumber = getWeekNumberForDate(today);
    const isSchoolToday = isSchoolDayForDate(today);
    
    return {
      weekNumber,
      isSchoolDay: isSchoolToday,
      academicYear: activeAcademicYear
    };
  };

  // Helper function to convert holidays to calendar events format
  const getHolidayEvents = useCallback(() => {
    if (!holidays || !activeAcademicYear) return [];
    
    return holidays.map(holiday => {
      const startDate = new Date(holiday.startDate + 'T00:00:00');
      const endDate = new Date(holiday.endDate + 'T23:59:59');
      
      return {
        id: `holiday-${holiday.id}`,
        title: holiday.name,
        description: `${holiday.type.replace('_', ' ')} holiday`,
        startTime: startDate,
        endTime: endDate,
        location: undefined as string | undefined,
        color: holiday.color || '#10b981',
        allDay: true,
        type: 'holiday' as const,
        holiday: holiday,
        // Add helper properties for multi-day detection
        isMultiDay: holiday.startDate !== holiday.endDate,
        startDateStr: holiday.startDate,
        endDateStr: holiday.endDate
      };
    });
  }, [holidays, activeAcademicYear]);

  return {
    academicYears,
    holidays,
    activeAcademicYear,
    getWeekNumberForDate,
    isSchoolDayForDate,
    getHolidaysInRange,
    getCurrentWeekInfo,
    getHolidayEvents,
    isLoading: !academicYears || !holidays,
    error: academicYearsError || holidaysError
  };
}
