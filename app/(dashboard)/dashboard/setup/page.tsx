'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, Clock, ArrowRight, Settings, CheckCircle, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { User } from '@/lib/db/schema';
import useSWR from 'swr';
import { getLocalizedTerm } from '@/lib/utils/localization';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SetupPage() {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const { data: academicYears, error: academicYearsError } = useSWR('/api/academic-years', fetcher);
  const { data: classes, error: classesError } = useSWR('/api/classes', fetcher);
  const { data: subjects, error: subjectsError } = useSWR('/api/subjects', fetcher);
  const { data: timetableSlots, error: timetableSlotsError } = useSWR('/api/timetable-slots', fetcher);

  // Check completion status
  const academicYearsArray = Array.isArray(academicYears) ? academicYears : [];
  const classesArray = Array.isArray(classes) ? classes : [];
  const subjectsArray = Array.isArray(subjects) ? subjects : [];
  const timetableSlotsArray = Array.isArray(timetableSlots) ? timetableSlots : [];

  const activeAcademicYear = academicYearsArray.find((year: any) => year.isActive);
  const isAcademicYearComplete = academicYearsArray.length > 0 && !!activeAcademicYear;
  const isClassesComplete = classesArray.length > 0;
  const isSubjectsComplete = subjectsArray.length > 0;
  const isTimetableComplete = timetableSlotsArray.length > 0;
  
  const timetableLabel = getLocalizedTerm(user?.location, 'timetable');
  const setUpTimetableLabel = getLocalizedTerm(user?.location, 'setUpTimetable');
  
  const setupOptions = [
    {
      title: 'Academic Year',
      description: 'Set up your school year, holidays, and week cycles',
      icon: GraduationCap,
      href: '/dashboard/setup/academic-year',
      isComplete: isAcademicYearComplete,
      features: ['School calendar', 'Holiday management', 'Week 1/2 cycles']
    },
    {
      title: 'Classes',
      description: 'Manage your class groups, student counts, and class notes',
      icon: Users,
      href: '/dashboard/setup/classes',
      isComplete: isClassesComplete,
      features: user?.colorPreference === 'class'
        ? ['Student counts', 'Class notes', 'Color coding', 'Group management']
        : ['Student counts', 'Class notes', 'Group management']
    },
    {
      title: 'Subjects',
      description: 'Configure subjects with colors and organize your curriculum',
      icon: BookOpen,
      href: '/dashboard/setup/subjects',
      isComplete: isSubjectsComplete,
      features: user?.colorPreference === 'subject'
        ? ['Color coding', 'Curriculum organization', 'Subject management']
        : ['Curriculum organization', 'Subject management', 'Learning objectives']
    },
    {
      title: timetableLabel,
      description: `${setUpTimetableLabel} structure and time slots`,
      icon: Clock,
      href: '/dashboard/setup/timetable',
      isComplete: isTimetableComplete,
      features: ['Weekly schedules', 'Time slots', 'Day organization']
    }
  ];

  const completedCount = setupOptions.filter(opt => opt.isComplete).length;
  const totalCount = setupOptions.length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header Section with Tips */}
      <div className="bg-white border-b border-gray-200 shadow-sm px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-[#001b3d] to-[#002855] rounded-full flex items-center justify-center mb-4 shadow-md">
            <Settings className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">Setup Your Teaching Environment</h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-3xl mx-auto mb-4 leading-relaxed">
            Configure the essential components of your teaching setup. Start with any section below to get organized.
          </p>
          
          {/* Progress Bar */}
          <div className="max-w-md mx-auto mb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
              <span>Setup Progress</span>
              <span className="font-semibold text-gray-700">{completedCount} of {totalCount} complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </div>
          
          {/* Getting Started Tips */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 p-4 max-w-2xl mx-auto shadow-sm">
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center text-xs sm:text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#fbae36] rounded-full shadow-sm"></div>
                <span className="font-medium">1. Academic Year</span>
              </div>
              <div className="hidden sm:block text-gray-300 text-lg">→</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#fbae36] rounded-full shadow-sm"></div>
                <span className="font-medium">2. Classes & Subjects</span>
              </div>
              <div className="hidden sm:block text-gray-300 text-lg">→</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-[#fbae36] rounded-full shadow-sm"></div>
                <span className="font-medium">3. {getLocalizedTerm(user?.location, 'buildTimetable')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Setup Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-12">
          {setupOptions.map((option, index) => {
            const isComplete = option.isComplete;
            const cardColor = isComplete
              ? 'bg-white border-2 border-green-200/60 hover:border-green-300 hover:shadow-xl transition-all duration-300'
              : 'bg-white border-2 border-gray-200 hover:border-[#001b3d]/40 hover:shadow-xl transition-all duration-300';
            const iconColor = isComplete ? 'text-green-600' : 'text-[#001b3d]';
            const bgColor = isComplete 
              ? 'bg-gradient-to-br from-green-50 to-green-100/50' 
              : 'bg-gradient-to-br from-[#001b3d]/5 to-[#001b3d]/10';
            
            return (
              <Link key={option.title} href={option.href}>
                <Card className={`${cardColor} cursor-pointer group h-full flex flex-col relative overflow-hidden transition-all duration-300 hover:scale-[1.02]`}>
                  {/* Completion Badge */}
                  {isComplete && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="bg-green-500 rounded-full p-1.5">
                        <CheckCircle className="h-4 w-4 text-white" strokeWidth={2} />
                      </div>
                    </div>
                  )}
                  
                  {/* Subtle gradient overlay for completed cards */}
                  {isComplete && (
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 to-transparent pointer-events-none" />
                  )}
                  
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="mb-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3.5 rounded-xl ${bgColor} group-hover:scale-110 transition-transform duration-300 shadow-sm relative z-0`}>
                          <option.icon className={`h-7 w-7 ${iconColor} transition-colors duration-300`} strokeWidth={2} />
                        </div>
                        <div className="space-y-2 flex-1 min-w-0">
                          <CardTitle className="text-lg font-bold text-gray-900 leading-tight flex items-center gap-2 flex-wrap">
                            <span>{option.title}</span>
                            {isComplete && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200">
                                Complete
                              </span>
                            )}
                          </CardTitle>
                          <p className="text-sm text-gray-600 leading-relaxed">{option.description}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4 flex-grow flex flex-col justify-between">
                      {/* Features List */}
                      <div className="space-y-2.5 flex-grow">
                        {option.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className="flex items-center gap-2.5 text-sm">
                            <div className={`flex-shrink-0 transition-colors duration-300 ${
                              isComplete ? 'text-green-500' : 'text-gray-300'
                            }`}>
                              <CheckCircle className="h-4 w-4" strokeWidth={2.5} />
                            </div>
                            <span className={`transition-colors duration-300 ${
                              isComplete ? 'text-gray-700 font-medium' : 'text-gray-600'
                            }`}>
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      {/* Action Button */}
                      <Button
                        variant="outline"
                        className={`w-full h-11 text-sm font-semibold justify-between flex-shrink-0 transition-all duration-300 group/btn ${
                          isComplete
                            ? 'border-green-300/60 bg-green-50/50 text-green-700 hover:bg-green-100 hover:border-green-400 hover:shadow-md'
                            : 'border-[#fbae36]/60 bg-[#fbae36]/5 text-[#fbae36] hover:bg-[#fbae36]/10 hover:border-[#fbae36] hover:shadow-md'
                        }`}
                      >
                        <span className="truncate">
                          {isComplete ? 'View/Edit ' : 'Configure '}{option.title}
                        </span>
                        <ArrowRight className={`h-4 w-4 ml-2 flex-shrink-0 transition-transform duration-300 ${
                          isComplete ? 'text-green-600' : 'text-[#fbae36]'
                        } group-hover/btn:translate-x-1`} strokeWidth={2.5} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
} 