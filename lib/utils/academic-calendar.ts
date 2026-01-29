import { AcademicYear, Holiday } from '@/lib/db/schema';

/**
 * Calculate which week (1 or 2) a given date falls on based on the academic year's week cycle
 * This version only returns week numbers for Mondays (for calendar display)
 * Uses weekCycleStartDate as the reference point for Week 1
 * Uses getWeekNumberForDate internally for consistency with skipHolidayWeeks logic
 */
export function getWeekNumber(date: Date, academicYear: AcademicYear, holidays: Holiday[] = []): number | null {
  // Check if the date is within the academic year
  const dateStr = date.toISOString().split('T')[0];
  if (dateStr < academicYear.startDate || dateStr > academicYear.endDate) {
    return null;
  }

  // Only show week numbers on Mondays - use proper date handling
  const properDate = new Date(dateStr + 'T12:00:00');
  if (properDate.getDay() !== 1) {
    return null;
  }

  // Delegate to getWeekNumberForDate for consistency, which handles skipHolidayWeeks properly
  return getWeekNumberForDate(properDate, academicYear, holidays);
}

/**
 * Calculate which week (1 or 2) a given date falls on for ANY day of the week
 * This is used for filtering timetable slots and lessons
 * Uses weekCycleStartDate as the reference point for Week 1
 * When skipHolidayWeeks is enabled, holiday weeks are not counted in the cycle
 */
export function getWeekNumberForDate(date: Date, academicYear: AcademicYear, holidays: Holiday[] = []): number | null {
  // Check if the date is within the academic year
  const dateStr = date.toISOString().split('T')[0];
  if (dateStr < academicYear.startDate || dateStr > academicYear.endDate) {
    return null;
  }

  // Use proper date handling to avoid timezone issues
  const properDate = new Date(dateStr + 'T12:00:00');
  
  // Helper function to get Monday of the week containing a date
  const getMondayOfWeek = (date: Date): Date => {
    const monday = new Date(date);
    const dayOfWeek = monday.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday (0) to 6
    monday.setDate(monday.getDate() - daysToMonday);
    monday.setHours(0, 0, 0, 0); // Normalize to midnight for consistent comparison
    return monday;
  };
  
  // Use weekCycleStartDate as the reference point for Week 1
  // The cycle start date determines when the cycle begins
  const cycleStartDate = new Date(academicYear.weekCycleStartDate + 'T12:00:00');
  const cycleStartDateStr = cycleStartDate.toISOString().split('T')[0];
  
  // Find the Monday of the week containing weekCycleStartDate - this is our reference Monday
  // The week containing the cycle start date is always Week 1, regardless of which day the cycle starts
  const cycleStartMonday = getMondayOfWeek(cycleStartDate);
  const cycleStartMondayStr = cycleStartMonday.toISOString().split('T')[0];

  // Find the Monday of the week containing the current date
  const currentMonday = getMondayOfWeek(properDate);
  const currentMondayStr = currentMonday.toISOString().split('T')[0];
  
  // If we're in a week before the cycle start week (different Monday), return null
  if (currentMondayStr < cycleStartMondayStr) {
    return null;
  }
  
  // If we're in the same week as cycle start (same Monday) but before the cycle start date, return null
  // This allows the cycle to start mid-week if needed
  if (currentMondayStr === cycleStartMondayStr && dateStr < cycleStartDateStr) {
    return null;
  }
  
  // Calculate calendar weeks difference from cycle start Monday
  // Both are already normalized to midnight Monday, so this should be exact
  const calendarWeeksDiff = Math.floor((currentMonday.getTime() - cycleStartMonday.getTime()) / (1000 * 60 * 60 * 24 * 7));
  
  // If current week is the cycle start week (same Monday), it's always Week 1
  // This means any date in the week containing the cycle start date is Week 1
  if (calendarWeeksDiff === 0) {
    return 1;
  }
  
  // If skipHolidayWeeks is enabled, count only teaching weeks (skip fully covered holiday weeks)
  // The cycle start week (weekCycleStartDate) is always Week 1
  if (academicYear.skipHolidayWeeks === 1) {
    // Count teaching weeks from cycle start to current week
    // The cycle start week always counts as teaching week 1 (Week 1), even if it's a holiday week
    let teachingWeekCount = 1; // Cycle start week is always Week 1
    
    // Iterate through each week from 1 week after cycle start to current week (inclusive)
    for (let i = 1; i <= calendarWeeksDiff; i++) {
      // Calculate the Monday that is exactly 'i' weeks after the cycle start Monday
      // Add exactly i weeks worth of milliseconds
      const weekMondayMs = cycleStartMonday.getTime() + (i * 7 * 24 * 60 * 60 * 1000);
      const weekMonday = new Date(weekMondayMs);
      // Normalize to midnight Monday for consistent comparison
      weekMonday.setHours(0, 0, 0, 0);
      
      // Check if this week is fully covered by holidays (only if holidays exist)
      const isHolidayWeek = holidays && holidays.length > 0 
        ? isWeekFullyCoveredByHolidays(weekMonday, holidays)
        : false;
      
      // Only count if not fully covered by holidays
      // When a week is skipped (holiday), we don't increment the count, so the cycle position stays the same
      if (!isHolidayWeek) {
        teachingWeekCount++;
      }
    }
    
    // Return alternating week numbers based on teaching week count
    // Cycle start week = Week 1 (count=1), next teaching week = Week 2 (count=2), next = Week 1 (count=3)...
    // So: odd counts are Week 1, even counts are Week 2
    const weekNumber = (teachingWeekCount % 2 === 1) ? 1 : 2;
    
    return weekNumber;
  } else {
    // When skipHolidayWeeks is disabled, count all calendar weeks including holidays
    // Week 1 is the cycle start week (calendarWeeksDiff === 0), so even differences are Week 1
    // Odd differences are Week 2
    return (calendarWeeksDiff % 2 === 0) ? 1 : 2;
  }
}

/**
 * Check if a given date is a school day (not weekend or holiday)
 */
export function isSchoolDay(date: Date, academicYear: AcademicYear, holidays: Holiday[] = []): boolean {
  const dateStr = date.toISOString().split('T')[0];
  
  // Check if within academic year
  if (dateStr < academicYear.startDate || dateStr > academicYear.endDate) {
    return false;
  }
  
  // Check if weekend
  if (date.getDay() === 0 || date.getDay() === 6) {
    return false;
  }
  
  // Check if holiday
  const isHoliday = holidays.some(holiday => 
    dateStr >= holiday.startDate && dateStr <= holiday.endDate
  );
  
  return !isHoliday;
}

/**
 * Get all school days between two dates
 */
export function getSchoolDaysBetween(startDate: Date, endDate: Date, academicYear: AcademicYear, holidays: Holiday[] = []): Date[] {
  const schoolDays: Date[] = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (isSchoolDay(currentDate, academicYear, holidays)) {
      schoolDays.push(new Date(currentDate));
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return schoolDays;
}

/**
 * Get the academic year for a given date
 */
export function getAcademicYearForDate(date: Date, academicYears: AcademicYear[]): AcademicYear | null {
  const dateStr = date.toISOString().split('T')[0];
  
  return academicYears.find(year => 
    year.isActive && dateStr >= year.startDate && dateStr <= year.endDate
  ) || null;
}

/**
 * Format holiday type for display
 */
export function formatHolidayType(type: string): string {
  switch (type) {
    case 'half_term':
      return 'Half Term';
    case 'training_day':
      return 'Training Day';
    case 'planning_day':
      return 'Planning Day';
    case 'term_break':
      return 'Term Break';
    case 'inset_day':
      return 'INSET Day';
    case 'holiday':
    default:
      return 'Holiday';
  }
}

/**
 * Get default color for holiday type
 */
export function getDefaultHolidayColor(type: string): string {
  switch (type) {
    case 'half_term':
      return '#10b981'; // emerald
    case 'training_day':
      return '#8b5cf6'; // violet
    case 'planning_day':
      return '#f97316'; // orange
    case 'term_break':
      return '#f59e0b'; // amber
    case 'inset_day':
      return '#3b82f6'; // blue
    case 'holiday':
    default:
      return '#ef4444'; // red
  }
}

/**
 * Check if a week (Monday-Friday) is fully covered by holidays
 * Returns true if all school days (Mon-Fri) in the week are covered by holidays
 */
export function isWeekFullyCoveredByHolidays(date: Date, holidays: Holiday[] = []): boolean {
  if (!holidays || holidays.length === 0) return false;
  
  // Find the Monday of the week containing the date
  const properDate = new Date(date.toISOString().split('T')[0] + 'T12:00:00');
  const dayOfWeek = properDate.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday (0) to 6
  const monday = new Date(properDate);
  monday.setDate(monday.getDate() - daysToMonday);
  
  // Check each school day (Monday-Friday) of the week
  for (let i = 0; i < 5; i++) {
    const schoolDay = new Date(monday);
    schoolDay.setDate(schoolDay.getDate() + i);
    const schoolDayStr = schoolDay.toISOString().split('T')[0];
    
    // Check if this school day is covered by a holiday
    const isCovered = holidays.some(holiday => 
      schoolDayStr >= holiday.startDate && schoolDayStr <= holiday.endDate
    );
    
    // If any school day is not covered, the week is not fully covered
    if (!isCovered) {
      return false;
    }
  }
  
  // All school days are covered by holidays
  return true;
}