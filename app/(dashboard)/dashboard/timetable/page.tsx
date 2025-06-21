'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Clock, MapPin, BookOpen, Users, CheckCircle, Circle, FileText } from 'lucide-react';
import { TimetableEntry, TimetableSlot } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function TimetableSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="h-[100px]">
            <CardContent className="animate-pulse">
              <div className="mt-4 space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="h-3 w-24 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={`entry-${i}`} className="h-[100px]">
            <CardContent className="animate-pulse">
              <div className="mt-4 space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
                <div className="h-3 w-24 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={`lesson-${i}`} className="h-[150px]">
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
    </div>
  );
}

function TimetableSlotsSection() {
  const { data: timetableSlots, error: slotsError } = useSWR<TimetableSlot[]>('/api/timetable-slots', fetcher);

  if (slotsError) {
    return (
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Error loading timetable slots. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getWeekLabel = (weekNumber: number) => {
    return weekNumber === 1 ? 'Week 1' : 'Week 2';
  };

  const getWeekColor = (weekNumber: number) => {
    return weekNumber === 1 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Timetable Slots</h2>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Slot
        </Button>
      </div>

      {!timetableSlots || timetableSlots.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No timetable slots yet. Create your first slot to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {timetableSlots.map((slot) => (
            <Card key={slot.id}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getWeekColor(slot.weekNumber)}`}>
                      {getWeekLabel(slot.weekNumber)}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">Period {slot.period}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                </div>
                <div className="mt-2">
                  <p className="text-sm font-medium">
                    {slot.label || `Period ${slot.period}`}
                  </p>
                  <p className="text-sm text-gray-600">
                    {slot.startTime} - {slot.endTime}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TimetableEntriesSection() {
  const { data: timetableEntries, error: entriesError } = useSWR<TimetableEntry[]>('/api/timetable', fetcher);
  const { data: timetableSlots } = useSWR<TimetableSlot[]>('/api/timetable-slots', fetcher);

  if (entriesError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Error loading timetable entries. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getDayColor = (day: string) => {
    const colors = {
      'Monday': 'bg-blue-100 text-blue-800',
      'Tuesday': 'bg-green-100 text-green-800',
      'Wednesday': 'bg-yellow-100 text-yellow-800',
      'Thursday': 'bg-purple-100 text-purple-800',
      'Friday': 'bg-red-100 text-red-800',
    };
    return colors[day as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getWeekLabel = (weekNumber: number) => {
    return weekNumber === 1 ? 'Week 1' : 'Week 2';
  };

  const getWeekColor = (weekNumber: number) => {
    return weekNumber === 1 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  const getTimetableSlotInfo = (slotId: number | null) => {
    if (!slotId || !timetableSlots) return null;
    return timetableSlots.find(slot => slot.id === slotId);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Timetable Entries</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </div>

      {!timetableEntries || timetableEntries.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No timetable entries yet. Create your first entry to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {timetableEntries.map((entry) => {
            const slotInfo = getTimetableSlotInfo(entry.timetableSlotId);
            
            return (
              <Card key={entry.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getDayColor(entry.dayOfWeek)}`}>
                        {entry.dayOfWeek}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${getWeekColor(entry.weekNumber)}`}>
                        {getWeekLabel(entry.weekNumber)}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium">
                          {slotInfo ? `${slotInfo.startTime} - ${slotInfo.endTime}` : `Period ${entry.period}`}
                        </span>
                      </div>
                      {entry.room && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{entry.room}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        {entry.classId && (
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3 text-blue-500" />
                            <span className="text-xs text-blue-600">Class {entry.classId}</span>
                          </div>
                        )}
                        {entry.subjectId && (
                          <div className="flex items-center space-x-1">
                            <BookOpen className="h-3 w-3 text-green-500" />
                            <span className="text-xs text-green-600">Subject {entry.subjectId}</span>
                          </div>
                        )}
                      </div>
                      {slotInfo?.label && (
                        <p className="text-sm font-medium text-gray-700">{slotInfo.label}</p>
                      )}
                      {entry.notes && (
                        <p className="text-xs text-gray-500 mt-1">{entry.notes}</p>
                      )}
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

function LessonsSection() {
  const { data: lessons, error: lessonsError } = useSWR<any[]>('/api/lessons', fetcher);

  if (lessonsError) {
    return (
      <Card className="mb-8">
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
    });
  };

  const getWeekLabel = (weekNumber: number) => {
    return weekNumber === 1 ? 'Week 1' : 'Week 2';
  };

  const getWeekColor = (weekNumber: number) => {
    return weekNumber === 1 ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800';
  };

  const getSubjectColor = (subjectName: string) => {
    const colors = {
      'Maths': 'bg-blue-100 text-blue-800',
      'Science': 'bg-green-100 text-green-800',
      'English': 'bg-yellow-100 text-yellow-800',
      'History': 'bg-purple-100 text-purple-800',
      'Geography': 'bg-red-100 text-red-800',
    };
    return colors[subjectName as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Lessons</h2>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Lesson
        </Button>
      </div>

      {!lessons || lessons.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No lessons yet. Create your first lesson to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson) => (
            <Card key={lesson.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{lesson.title}</h3>
                      {lesson.planCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 mb-3">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSubjectColor(lesson.subjectName)}`}>
                        {lesson.subjectName}
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3 text-blue-500" />
                        <span className="text-sm text-gray-600">{lesson.className}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {lesson.slotStartTime} - {lesson.slotEndTime}
                        </span>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getWeekColor(lesson.slotWeekNumber)}`}>
                        {getWeekLabel(lesson.slotWeekNumber)}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 mb-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{formatDate(lesson.date)}</span>
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
                        <p className="text-sm text-gray-600 whitespace-pre-line">{lesson.lessonPlan}</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      {lesson.planCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function TimetableContent() {
  return (
    <div className="space-y-6">
      <TimetableSlotsSection />
      <TimetableEntriesSection />
      <LessonsSection />
    </div>
  );
}

export default function TimetablePage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Timetable
      </h1>
      
      <Suspense fallback={<TimetableSkeleton />}>
        <TimetableContent />
      </Suspense>
    </section>
  );
} 