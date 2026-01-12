'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, ArrowRight, CalendarDays, Clock, Users, BookOpen, FileText, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  checkComplete: () => boolean;
}

export function SetupProgress() {
  const { data: academicYears, error: academicYearsError } = useSWR('/api/academic-years', fetcher);
  const { data: holidays, error: holidaysError } = useSWR('/api/holidays', fetcher);
  const { data: timetableSlots, error: timetableSlotsError } = useSWR('/api/timetable-slots', fetcher);
  const { data: subjects, error: subjectsError } = useSWR('/api/subjects', fetcher);
  const { data: classes, error: classesError } = useSWR('/api/classes', fetcher);
  const { data: lessons, error: lessonsError } = useSWR('/api/lessons', fetcher);

  // Wait for all data to load
  const allLoaded = 
    (academicYears !== undefined || academicYearsError) &&
    (holidays !== undefined || holidaysError) &&
    (timetableSlots !== undefined || timetableSlotsError) &&
    (subjects !== undefined || subjectsError) &&
    (classes !== undefined || classesError) &&
    (lessons !== undefined || lessonsError);

  if (!allLoaded) {
    return null;
  }

  const academicYearsArray = Array.isArray(academicYears) ? academicYears : [];
  const holidaysArray = Array.isArray(holidays) ? holidays : [];
  const timetableSlotsArray = Array.isArray(timetableSlots) ? timetableSlots : [];
  const subjectsArray = Array.isArray(subjects) ? subjects : [];
  const classesArray = Array.isArray(classes) ? classes : [];
  const lessonsArray = Array.isArray(lessons) ? lessons : [];

  // Find active academic year
  const activeAcademicYear = academicYearsArray.find(year => year.isActive);

  const setupSteps: SetupStep[] = [
    {
      id: 'academic-year',
      title: 'Set up your academic year',
      description: 'Define your school year dates and week cycles to get started.',
      icon: GraduationCap,
      href: '/dashboard/setup/academic-year',
      checkComplete: () => academicYearsArray.length > 0 && !!activeAcademicYear
    },
    {
      id: 'holidays',
      title: 'Add holiday dates',
      description: 'Add your school holidays, training days, and term breaks to your calendar.',
      icon: CalendarDays,
      href: '/dashboard/setup/academic-year',
      checkComplete: () => {
        // Only check holidays if we have an active academic year
        if (!activeAcademicYear) return false;
        // Check if there are any holidays for the active academic year
        return holidaysArray.length > 0 && holidaysArray.some((holiday: any) => holiday.academicYearId === activeAcademicYear.id);
      }
    },
    {
      id: 'timetable',
      title: 'Build your timetable',
      description: 'Set up your weekly timetable with time slots for each day.',
      icon: Clock,
      href: '/dashboard/setup/timetable',
      checkComplete: () => timetableSlotsArray.length > 0
    },
    {
      id: 'subjects-classes',
      title: 'Add subjects and classes',
      description: 'Create your subjects and class groups to start planning lessons.',
      icon: Users,
      href: '/dashboard/setup',
      checkComplete: () => subjectsArray.length > 0 && classesArray.length > 0
    },
    {
      id: 'first-lesson',
      title: 'Plan your first lesson',
      description: 'Create your first lesson plan to see everything come together.',
      icon: FileText,
      href: '/dashboard/lessons',
      checkComplete: () => lessonsArray.length > 0
    }
  ];

  // Find the first incomplete step
  const nextStep = setupSteps.find(step => !step.checkComplete());

  // If all steps are complete, don't show the banner
  if (!nextStep) {
    return null;
  }

  const IconComponent = nextStep.icon;

  return (
    <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-900">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="font-semibold">Next step: {nextStep.title}</p>
            <p className="text-sm text-blue-800 mt-1">{nextStep.description}</p>
            {/* Show progress */}
            <div className="mt-3 flex items-center gap-2 text-xs text-blue-700">
              <span className="font-medium">Setup progress:</span>
              <div className="flex items-center gap-1">
                {setupSteps.map((step, index) => {
                  const isComplete = step.checkComplete();
                  const isCurrent = step.id === nextStep.id;
                  return (
                    <div key={step.id} className="flex items-center gap-1">
                      {isComplete ? (
                        <CheckCircle className="h-3 w-3 text-green-600" />
                      ) : isCurrent ? (
                        <div className="h-3 w-3 rounded-full bg-blue-600 border-2 border-blue-700" />
                      ) : (
                        <div className="h-3 w-3 rounded-full bg-blue-200 border-2 border-blue-300" />
                      )}
                      {index < setupSteps.length - 1 && (
                        <div className={`h-0.5 w-2 ${isComplete ? 'bg-green-600' : 'bg-blue-200'}`} />
                      )}
                    </div>
                  );
                })}
              </div>
              <span className="text-blue-600">
                {setupSteps.filter(s => s.checkComplete()).length} of {setupSteps.length} complete
              </span>
            </div>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Button asChild size="sm" className="bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
            <Link href={nextStep.href}>
              <IconComponent className="h-4 w-4" />
              {nextStep.title}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

