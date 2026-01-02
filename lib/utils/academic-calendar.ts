import { AcademicYear, Holiday } from '@/lib/db/schema';

/**
 * Calculate which week (1 or 2) a given date falls on based on the academic year's week cycle
 * This version only returns week numbers for Mondays (for calendar display)
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

  // Find the first Monday of the academic year
  const yearStartDate = new Date(academicYear.startDate + 'T12:00:00');
  const firstMonday = new Date(yearStartDate);
  
  // Find the first Monday on or after the start date
  while (firstMonday.getDay() !== 1) {
    firstMonday.setDate(firstMonday.getDate() + 1);
  }

  // Calculate how many weeks from the first Monday this date is
  const currentMonday = new Date(properDate);
  
  const weeksDiff = Math.floor((currentMonday.getTime() - firstMonday.getTime()) / (1000 * 60 * 60 * 24 * 7));
  
  // Return alternating week numbers: Week 1, Week 2, Week 1, Week 2, etc.
  return (weeksDiff % 2 === 0) ? 1 : 2;
}

/**
 * Calculate which week (1 or 2) a given date falls on for ANY day of the week
 * This is used for filtering timetable slots and lessons
 */
export function getWeekNumberForDate(date: Date, academicYear: AcademicYear): number | null {
  // Check if the date is within the academic year
  const dateStr = date.toISOString().split('T')[0];
  if (dateStr < academicYear.startDate || dateStr > academicYear.endDate) {
    return null;
  }

  // Use proper date handling to avoid timezone issues
  const properDate = new Date(dateStr + 'T12:00:00');
  
  // Find the first Monday of the academic year
  const yearStartDate = new Date(academicYear.startDate + 'T12:00:00');
  const firstMonday = new Date(yearStartDate);
  
  // Find the first Monday on or after the start date
  while (firstMonday.getDay() !== 1) {
    firstMonday.setDate(firstMonday.getDate() + 1);
  }

  // Find the Monday of the week containing the current date
  const currentMonday = new Date(properDate);
  const dayOfWeek = currentMonday.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday (0) to 6
  currentMonday.setDate(currentMonday.getDate() - daysToMonday);
  
  // Calculate how many weeks from the first Monday this date is
  const weeksDiff = Math.floor((currentMonday.getTime() - firstMonday.getTime()) / (1000 * 60 * 60 * 24 * 7));
  
  // Return alternating week numbers: Week 1, Week 2, Week 1, Week 2, etc.
  return (weeksDiff % 2 === 0) ? 1 : 2;
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