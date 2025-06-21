'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Clock, BookOpen, Users, CheckCircle, Circle, FileText, ChevronRight, Archive, ArrowLeft } from 'lucide-react';
import useSWR from 'swr';
import { Suspense, useState } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function LessonsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="h-[150px]">
          <CardContent className="animate-pulse">
            <div className="mt-4 space-y-3">
              <div className="h-5 w-48 bg-gray-200 rounded"></div>
              <div className="flex space-x-2">
                <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
                <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
              </div>
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function LessonsList() {
  const { data: lessons, error: lessonsError } = useSWR<any[]>('/api/lessons', fetcher);
  const [showArchived, setShowArchived] = useState(false);

  if (lessonsError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Error loading lessons. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getWeekLabel = (weekNumber: number) => {
    return weekNumber === 1 ? 'Week 1' : 'Week 2';
  };

  const getWeekColor = (weekNumber: number) => {
    return weekNumber === 1 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  const getSubjectColor = (subjectColor: string | null, subjectName: string) => {
    if (subjectColor) {
      return 'bg-opacity-10 border border-opacity-20';
    }
    
    // Fallback colors if no color is specified
    const fallbackColors = {
      'Maths': 'bg-blue-100 text-blue-800 border border-blue-200',
      'Science': 'bg-green-100 text-green-800 border border-green-200',
      'English': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      'History': 'bg-purple-100 text-purple-800 border border-purple-200',
      'Geography': 'bg-red-100 text-red-800 border border-red-200',
    };
    return fallbackColors[subjectName as keyof typeof fallbackColors] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const getClassColor = (classColor: string | null, className: string) => {
    if (classColor) {
      return 'custom-text-color';
    }
    return 'text-blue-600'; // Default blue color
  };

  const getSubjectStyle = (subjectColor: string | null, subjectName: string) => {
    if (subjectColor) {
      return {
        backgroundColor: `${subjectColor}10`,
        color: subjectColor,
        borderColor: `${subjectColor}20`,
      };
    }
    return {};
  };

  const getClassStyle = (classColor: string | null) => {
    if (classColor) {
      return { color: classColor };
    }
    return {};
  };

  const isToday = (dateString: string) => {
    const today = new Date();
    const lessonDate = new Date(dateString);
    return today.toDateString() === lessonDate.toDateString();
  };

  const isPast = (dateString: string) => {
    const today = new Date();
    const lessonDate = new Date(dateString);
    return lessonDate < today;
  };

  // Filter and sort lessons based on current view
  const filterAndSortLessons = () => {
    if (!lessons) return [];
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (showArchived) {
      // Show past lessons, sorted by most recent first
      return lessons
        .filter(lesson => new Date(lesson.date) < today)
        .sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateB.getTime() - dateA.getTime(); // Most recent first
        });
    } else {
      // Show current and future lessons, sorted by soonest first
      return lessons
        .filter(lesson => new Date(lesson.date) >= today)
        .sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateA.getTime() - dateB.getTime(); // Soonest first
        });
    }
  };

  const sortedLessons = filterAndSortLessons();
  const pastLessonsCount = lessons ? lessons.filter(lesson => isPast(lesson.date)).length : 0;
  const currentLessonsCount = lessons ? lessons.filter(lesson => !isPast(lesson.date)).length : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {showArchived ? 'Archived Lessons' : 'Lessons'}
          </h1>
          <p className="text-gray-600 mt-1">
            {showArchived 
              ? `${pastLessonsCount} past lesson${pastLessonsCount !== 1 ? 's' : ''}`
              : `${currentLessonsCount} upcoming lesson${currentLessonsCount !== 1 ? 's' : ''}`
            }
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {showArchived ? (
            <Button 
              variant="outline" 
              onClick={() => setShowArchived(false)}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Current</span>
            </Button>
          ) : (
            <>
              <Button 
                variant="outline" 
                onClick={() => setShowArchived(true)}
                className="flex items-center space-x-2"
              >
                <Archive className="h-4 w-4" />
                <span>View Archive ({pastLessonsCount})</span>
              </Button>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Lesson
              </Button>
            </>
          )}
        </div>
      </div>

      {!sortedLessons || sortedLessons.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {showArchived ? 'No archived lessons' : 'No lessons yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {showArchived 
                  ? 'No past lessons found in the archive.'
                  : 'Create your first lesson to get started with lesson planning.'
                }
              </p>
              {!showArchived && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Lesson
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedLessons.map((lesson) => {
            const lessonDate = new Date(lesson.date);
            const isLessonToday = isToday(lesson.date);
            const isLessonPast = isPast(lesson.date);
            
            return (
              <Card 
                key={lesson.id} 
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  isLessonToday ? 'ring-2 ring-blue-500' : ''
                } ${isLessonPast ? 'opacity-75' : ''}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">{lesson.title}</h3>
                        {lesson.planCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                        {isLessonToday && !showArchived && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            Today
                          </span>
                        )}
                        {isLessonPast && !lesson.planCompleted && !showArchived && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                            Overdue
                          </span>
                        )}
                        {showArchived && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full">
                            Past
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-4 mb-3">
                        <div 
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getSubjectColor(lesson.subjectColor, lesson.subjectName)}`}
                          style={getSubjectStyle(lesson.subjectColor, lesson.subjectName)}
                        >
                          {lesson.subjectName}
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3 text-blue-500" />
                          <span 
                            className={`text-sm ${getClassColor(lesson.classColor, lesson.className)}`}
                            style={getClassStyle(lesson.classColor)}
                          >
                            {lesson.className}
                          </span>
                        </div>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getWeekColor(lesson.slotWeekNumber)}`}>
                          {getWeekLabel(lesson.slotWeekNumber)}
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium text-gray-700">{formatDate(lesson.date)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">
                            {lesson.slotStartTime} - {lesson.slotEndTime}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-600">Period {lesson.slotPeriod}</span>
                        {lesson.slotLabel && (
                          <>
                            <span className="text-sm text-gray-500">•</span>
                            <span className="text-sm text-gray-600">{lesson.slotLabel}</span>
                          </>
                        )}
                      </div>

                      {lesson.lessonPlan && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <FileText className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Lesson Plan</span>
                          </div>
                          <p className="text-sm text-gray-600 whitespace-pre-line line-clamp-2">
                            {lesson.lessonPlan}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LessonsPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <Suspense fallback={<LessonsSkeleton />}>
        <LessonsList />
      </Suspense>
    </section>
  );
} 