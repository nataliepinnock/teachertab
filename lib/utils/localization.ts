/**
 * Localization utility for location-specific terminology
 * UK: term, INSET Day
 * US: semester, Training Day / Development Day
 * Other: term, Training Day / Development Day (default to UK-like terms)
 */

export type Location = 'UK' | 'US' | 'Other';

export type TeachingPhase = 'primary' | 'secondary' | 'further' | 'elementary' | 'middle' | 'high';
export type ColorPreference = 'class' | 'subject';

export interface TeachingPhaseOption {
  value: TeachingPhase;
  label: string;
}

export interface LocalizedTerms {
  term: string; // UK: "Term", US: "Semester", Other: "Term"
  insetDay: string; // UK: "INSET Day", US: "Training Day", Other: "Training Day"
  halfTerm: string; // UK: "Half Term", US: "Mid-Semester Break", Other: "Mid-Term Break"
  termBreak: string; // UK: "Term Break", US: "Semester Break", Other: "Term Break"
  academicYear: string; // UK: "Academic Year", US: "School Year", Other: "Academic Year"
  timetable: string; // UK: "Timetable", US: "Schedule", Other: "Timetable"
  timetableCycle: string; // UK: "Timetable Cycle", US: "Schedule Cycle", Other: "Timetable Cycle"
  timetableSlot: string; // UK: "Timetable Slot", US: "Period", Other: "Timetable Slot"
  buildTimetable: string; // UK: "Build your timetable", US: "Build your schedule", Other: "Build your timetable"
  setUpTimetable: string; // UK: "Set up your timetable", US: "Set up your schedule", Other: "Set up your timetable"
  weeklyTimetable: string; // UK: "Weekly timetable", US: "Weekly schedule", Other: "Weekly timetable"
  yearGroup: string; // UK: "Year Group", US: "Grade", Other: "Year Group"
  year: string; // UK: "Year", US: "Grade", Other: "Year" (when referring to class year groups)
  holidaysAndTrainingDays: string; // UK: "Holidays and Training Days", US: "Vacations, holidays and training days", Other: "Holidays and Training Days"
  trainingDay: string; // UK: "Training Day", US: "Professional Development Day", Other: "Training Day"
  planningDay: string; // UK: "Planning Day", US: "Planning Day", Other: "Planning Day"
  holiday: string; // UK: "Holiday", US: "Vacation", Other: "Holiday"
}

const UK_TERMS: LocalizedTerms = {
  term: 'Term',
  insetDay: 'INSET Day',
  halfTerm: 'Half Term',
  termBreak: 'Term Break',
  academicYear: 'Academic Year',
  timetable: 'Timetable',
  timetableCycle: 'Timetable Cycle',
  timetableSlot: 'Timetable Slot',
  buildTimetable: 'Build your timetable',
  setUpTimetable: 'Set up your timetable',
  weeklyTimetable: 'Weekly timetable',
  yearGroup: 'Year Group',
  year: 'Year',
  holidaysAndTrainingDays: 'Holidays and Training Days',
  trainingDay: 'Training Day',
  planningDay: 'Planning Day',
  holiday: 'Holiday',
};

const US_TERMS: LocalizedTerms = {
  term: 'Semester',
  insetDay: 'Training Day',
  halfTerm: 'Mid-Semester Break',
  termBreak: 'Semester Break',
  academicYear: 'School Year',
  timetable: 'Schedule',
  timetableCycle: 'Schedule Cycle',
  timetableSlot: 'Period',
  buildTimetable: 'Build your schedule',
  setUpTimetable: 'Set up your schedule',
  weeklyTimetable: 'Weekly schedule',
  yearGroup: 'Grade',
  year: 'Grade',
  holidaysAndTrainingDays: 'Vacations, holidays and training days',
  trainingDay: 'Professional Development Day',
  planningDay: 'Planning Day',
  holiday: 'Vacation',
};

const OTHER_TERMS: LocalizedTerms = {
  term: 'Term',
  insetDay: 'Training Day',
  halfTerm: 'Mid-Term Break',
  termBreak: 'Term Break',
  academicYear: 'Academic Year',
  timetable: 'Timetable',
  timetableCycle: 'Timetable Cycle',
  timetableSlot: 'Timetable Slot',
  buildTimetable: 'Build your timetable',
  setUpTimetable: 'Set up your timetable',
  weeklyTimetable: 'Weekly timetable',
  yearGroup: 'Year Group',
  year: 'Year',
  holidaysAndTrainingDays: 'Holidays and Training Days',
  trainingDay: 'Training Day',
  planningDay: 'Planning Day',
  holiday: 'Holiday',
};

const TERMS_MAP: Record<Location, LocalizedTerms> = {
  UK: UK_TERMS,
  US: US_TERMS,
  Other: OTHER_TERMS,
};

/**
 * Get localized terms based on user location
 * @param location - User's location (UK, US, or Other)
 * @returns Localized terms object
 */
export function getLocalizedTerms(location: Location | string | null | undefined): LocalizedTerms {
  if (!location || !(location in TERMS_MAP)) {
    return UK_TERMS; // Default to UK terms
  }
  return TERMS_MAP[location as Location];
}

/**
 * Get a specific localized term
 * @param location - User's location
 * @param key - The term key to get
 * @returns The localized term string
 */
export function getLocalizedTerm(
  location: Location | string | null | undefined,
  key: keyof LocalizedTerms
): string {
  const terms = getLocalizedTerms(location);
  return terms[key];
}

/**
 * Get the localized label for holiday types
 * @param location - User's location
 * @param holidayType - The holiday type from the database
 * @returns The localized label
 */
export function getLocalizedHolidayType(
  location: Location | string | null | undefined,
  holidayType: string
): string {
  const terms = getLocalizedTerms(location);
  
  switch (holidayType) {
    case 'holiday':
      return terms.holiday;
    case 'half_term':
      return terms.halfTerm;
    case 'term_break':
      return terms.termBreak;
    case 'inset_day':
      return terms.insetDay;
    case 'training_day':
      return terms.trainingDay;
    case 'planning_day':
      return terms.planningDay;
    default:
      return holidayType;
  }
}

/**
 * Get teaching phase options based on location
 * @param location - User's location
 * @returns Array of teaching phase options
 */
export function getTeachingPhaseOptions(location: Location | string | null | undefined): TeachingPhaseOption[] {
  if (!location || location === 'UK') {
    return [
      { value: 'primary', label: 'Primary' },
      { value: 'secondary', label: 'Secondary' },
      { value: 'further', label: 'Further Education' },
    ];
  } else if (location === 'US') {
    return [
      { value: 'elementary', label: 'Elementary School' },
      { value: 'middle', label: 'Middle School' },
      { value: 'high', label: 'High School' },
    ];
  } else {
    // Other - use generic terms
    return [
      { value: 'primary', label: 'Primary' },
      { value: 'secondary', label: 'Secondary' },
    ];
  }
}

