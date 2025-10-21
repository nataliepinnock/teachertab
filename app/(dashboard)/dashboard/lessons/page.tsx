'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Clock, BookOpen, Users, CheckCircle, Circle, FileText, ChevronRight, Archive, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import useSWR from 'swr';
import { Suspense, useState } from 'react';
import { LessonModal } from '@/components/lesson-modal';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function LessonsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LessonsList() {
  const { data: lessons, error: lessonsError, mutate } = useSWR<any[]>('/api/lessons', fetcher);
  const [showArchived, setShowArchived] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);

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
    if (!lessons || !Array.isArray(lessons)) return [];
    
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
  const pastLessonsCount = lessons && Array.isArray(lessons) ? lessons.filter(lesson => isPast(lesson.date)).length : 0;
  const currentLessonsCount = lessons && Array.isArray(lessons) ? lessons.filter(lesson => !isPast(lesson.date)).length : 0;

  const handleSaveLesson = async (lessonData: any) => {
    try {
      const isEditing = editingLesson && editingLesson.lessonIds;
      
      if (isEditing) {
        // For editing, we need to delete the old lessons and create new ones
        if (editingLesson.lessonIds && editingLesson.lessonIds.length > 0) {
          // Delete existing lessons
          const deletePromises = editingLesson.lessonIds.map(async (lessonId) => {
            const response = await fetch(`/api/lessons?id=${lessonId}`, {
              method: 'DELETE',
            });
            if (!response.ok) {
              throw new Error(`Failed to delete lesson ${lessonId}`);
            }
          });
          await Promise.all(deletePromises);
        }

        // Create new lessons with the updated data
        const { timetableSlotIds, ...baseLessonData } = lessonData;
        console.log('🔍 Lesson Page - Creating new lessons with data:', {
          timetableSlotIds,
          baseLessonData,
          lessonData
        });
        
        if (timetableSlotIds && timetableSlotIds.length > 0) {
          const lessonPromises = timetableSlotIds.map(async (slotId: string) => {
            const lessonData = {
              ...baseLessonData,
              timetableSlotId: slotId,
            };
            
            console.log('🔍 Lesson Page - Creating lesson for slot:', slotId, 'with data:', lessonData);
            
            const response = await fetch('/api/lessons', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(lessonData),
            });
            
            if (!response.ok) {
              const errorText = await response.text();
              console.error('🔍 Lesson Page - Error creating lesson for slot:', slotId, 'Response:', response.status, errorText);
              throw new Error(`Failed to create lesson for slot ${slotId}: ${errorText}`);
            }
            return response.json();
          });
          await Promise.all(lessonPromises);
        }
      } else {
        // For adding new lessons
        const { timetableSlotIds, ...baseLessonData } = lessonData;
        if (timetableSlotIds && timetableSlotIds.length > 0) {
          const lessonPromises = timetableSlotIds.map(async (slotId: string) => {
            const response = await fetch('/api/lessons', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                ...baseLessonData,
                timetableSlotId: slotId,
              }),
            });
            if (!response.ok) {
              throw new Error(`Failed to create lesson for slot ${slotId}`);
            }
            return response.json();
          });
          await Promise.all(lessonPromises);
        }
      }

      // Refresh the lessons list
      await mutate();
      setIsLessonModalOpen(false);
      setEditingLesson(null);
    } catch (error) {
      console.error('Error saving lesson:', error);
      throw error;
    }
  };

  const handleToggleComplete = async (lessonId: number, currentCompleted: number) => {
    try {
      const response = await fetch('/api/lessons', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: lessonId,
          planCompleted: !currentCompleted,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update lesson completion');
      }

      // Refresh the lessons list
      await mutate();
    } catch (error) {
      console.error('Error updating lesson completion:', error);
    }
  };

  const handleDeleteLesson = async (lessonId: number, lessonTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${lessonTitle}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/lessons?id=${lessonId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete lesson');
      }

      // Refresh the lessons list
      await mutate();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Failed to delete lesson. Please try again.');
    }
  };

  const openAddModal = () => {
    setEditingLesson(null);
    setIsLessonModalOpen(true);
  };

  const openEditModal = (lesson: any) => {
    // Create a grouped lesson object similar to calendar views
    const groupedLesson = {
      id: `lesson-group-${lesson.id}`,
      title: lesson.title,
      startTime: new Date(`${lesson.date}T${lesson.slotStartTime || '09:00'}`),
      endTime: new Date(`${lesson.date}T${lesson.slotEndTime || '10:00'}`),
      color: lesson.color || '#6B7280',
      type: 'lesson',
      class: lesson.className || undefined,
      subject: lesson.subjectName || undefined,
      location: lesson.room || 'Classroom',
      description: lesson.lessonPlan || undefined,
      lessonIds: [lesson.id],
    };
    setEditingLesson(groupedLesson);
    setIsLessonModalOpen(true);
  };

  const closeModal = () => {
    setIsLessonModalOpen(false);
    setEditingLesson(null);
  };

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
              <Button onClick={openAddModal}>
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
                <Button onClick={openAddModal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Lesson
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lesson
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Class
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedLessons.map((lesson) => {
                  const lessonDate = new Date(lesson.date);
                  const isLessonToday = isToday(lesson.date);
                  const isLessonPast = isPast(lesson.date);
                  
                  return (
                    <tr 
                      key={lesson.id} 
                      className={`hover:bg-gray-50 ${
                        isLessonToday ? 'ring-1 ring-blue-500' : ''
                      } ${isLessonPast ? 'opacity-75' : ''}`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-sm font-medium text-gray-900">{lesson.title}</h3>
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
                          {lesson.lessonPlan && (
                            <p className="text-xs text-gray-500 max-w-xs truncate">
                              {lesson.lessonPlan}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div 
                          className={`px-2 py-1 rounded-full text-xs font-medium border ${getSubjectColor(lesson.subjectColor, lesson.subjectName)}`}
                          style={getSubjectStyle(lesson.subjectColor, lesson.subjectName)}
                        >
                          {lesson.subjectName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-1">
                          <Users className="h-3 w-3 text-blue-500" />
                          <span 
                            className={`text-xs ${getClassColor(lesson.classColor, lesson.className)}`}
                            style={getClassStyle(lesson.classColor)}
                          >
                            {lesson.className}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span>{formatDate(lesson.date)}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-xs text-gray-500">
                            {lesson.slotStartTime} - {lesson.slotEndTime}
                          </span>
                        </div>
                        {lesson.slotLabel && (
                          <div className="mt-1">
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                              {lesson.slotLabel}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWeekColor(lesson.slotWeekNumber)}`}>
                              {getWeekLabel(lesson.slotWeekNumber)}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {lesson.color ? (
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded-full border-2 border-gray-300"
                              style={{ backgroundColor: lesson.color }}
                            />
                            <span className="text-xs text-gray-600 font-medium">Color assigned</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">No color</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col items-start space-y-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleToggleComplete(lesson.id, lesson.planCompleted)}
                            className="h-6 w-6 p-0"
                            title={lesson.planCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                          >
                            {lesson.planCompleted ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <Circle className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            lesson.planCompleted 
                              ? 'bg-green-100 text-green-800' 
                              : isLessonPast 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {lesson.planCompleted ? 'Completed' : isLessonPast ? 'Overdue' : 'Pending'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openEditModal(lesson)}
                            className="h-8 w-8 p-0"
                            title="Edit Lesson"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Delete Lesson"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <LessonModal
        isOpen={isLessonModalOpen}
        onClose={closeModal}
        onSave={handleSaveLesson}
        mode={editingLesson ? 'edit' : 'add'}
        initialData={editingLesson ? (() => {
          const lessonIds = editingLesson.lessonIds;
          
          if (!lessons || lessons.length === 0) {
            console.log('🔍 Lesson Page - No lessons data available yet');
            return {
              title: editingLesson.title,
              timetableSlotIds: [],
              classId: undefined,
              subjectId: undefined,
              date: editingLesson.startTime.toISOString().split('T')[0],
              lessonPlan: editingLesson.description || '',
              color: editingLesson.color || '#6B7280',
            };
          }
          
          const matchingLessons = lessons.filter(lesson => lessonIds?.includes(lesson.id));
          const firstLesson = matchingLessons[0];
          
          // Try to get timetable slot IDs from lessons data
          let timetableSlotIds: string[] = [];
          if (lessonIds && matchingLessons.length > 0) {
            timetableSlotIds = matchingLessons
              .map(lesson => lesson.timetableSlotId?.toString() || '')
              .filter(id => id);
          }

          const initialData = {
            title: editingLesson.title,
            timetableSlotIds: timetableSlotIds,
            classId: firstLesson?.classId?.toString(),
            subjectId: firstLesson?.subjectId?.toString(),
            date: editingLesson.startTime.toISOString().split('T')[0],
            lessonPlan: editingLesson.description || '',
            color: editingLesson.color || '#6B7280',
          };
          
          console.log('🔍 Lesson Page Lesson Edit Debug:', {
            editingLesson: editingLesson,
            lessonIds: lessonIds,
            matchingLessons: matchingLessons,
            firstLesson: firstLesson,
            initialData: initialData
          });
          
          return initialData;
        })() : undefined}
      />
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