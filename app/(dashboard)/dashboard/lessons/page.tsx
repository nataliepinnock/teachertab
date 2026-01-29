'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Calendar, Clock, BookOpen, Users, CheckCircle, Circle, FileText, ChevronRight, Archive, ArrowLeft, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Filter, X } from 'lucide-react';
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
  const { data: classes } = useSWR<any[]>('/api/classes', fetcher);
  const { data: subjects } = useSWR<any[]>('/api/subjects', fetcher);
  const [showArchived, setShowArchived] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<'date' | 'title' | 'subject' | 'class' | 'status'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Filtering state
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterClass, setFilterClass] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

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
    
    let filtered = lessons;
    
    // Apply archive filter
    if (showArchived) {
      filtered = filtered.filter(lesson => new Date(lesson.date) < today);
    } else {
      filtered = filtered.filter(lesson => new Date(lesson.date) >= today);
    }
    
    // Apply subject filter
    if (filterSubject !== 'all') {
      filtered = filtered.filter(lesson => lesson.subjectId?.toString() === filterSubject);
    }
    
    // Apply class filter
    if (filterClass !== 'all') {
      filtered = filtered.filter(lesson => lesson.classId?.toString() === filterClass);
    }
    
    // Apply status filter
    if (filterStatus !== 'all') {
      if (filterStatus === 'completed') {
        filtered = filtered.filter(lesson => lesson.planCompleted);
      } else if (filterStatus === 'pending') {
        filtered = filtered.filter(lesson => !lesson.planCompleted && !isPast(lesson.date));
      } else if (filterStatus === 'overdue') {
        filtered = filtered.filter(lesson => !lesson.planCompleted && isPast(lesson.date));
      }
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lesson => 
        lesson.title?.toLowerCase().includes(query) ||
        lesson.lessonPlan?.toLowerCase().includes(query) ||
        lesson.subjectName?.toLowerCase().includes(query) ||
        lesson.className?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case 'date':
          // Normalize dates to midnight for consistent comparison
          const dateA = a.date ? new Date(a.date) : new Date(0);
          const dateB = b.date ? new Date(b.date) : new Date(0);
          dateA.setHours(0, 0, 0, 0);
          dateB.setHours(0, 0, 0, 0);
          comparison = dateA.getTime() - dateB.getTime();
          // If dates are equal, sort by time
          if (comparison === 0 && a.slotStartTime && b.slotStartTime) {
            const timeA = a.slotStartTime.split(':').map(Number);
            const timeB = b.slotStartTime.split(':').map(Number);
            const timeAValue = timeA[0] * 60 + timeA[1];
            const timeBValue = timeB[0] * 60 + timeB[1];
            comparison = timeAValue - timeBValue;
          }
          break;
        case 'title':
          comparison = (a.title || '').localeCompare(b.title || '');
          break;
        case 'subject':
          comparison = (a.subjectName || '').localeCompare(b.subjectName || '');
          break;
        case 'class':
          comparison = (a.className || '').localeCompare(b.className || '');
          break;
        case 'status':
          // Completed first, then pending, then overdue
          const aStatus = a.planCompleted ? 0 : (isPast(a.date) ? 2 : 1);
          const bStatus = b.planCompleted ? 0 : (isPast(b.date) ? 2 : 1);
          comparison = aStatus - bStatus;
          break;
        default:
          comparison = 0;
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  };
  
  const handleSort = (column: typeof sortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  const clearFilters = () => {
    setFilterSubject('all');
    setFilterClass('all');
    setFilterStatus('all');
    setSearchQuery('');
  };
  
  const hasActiveFilters = filterSubject !== 'all' || filterClass !== 'all' || filterStatus !== 'all' || searchQuery.trim() !== '';

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
          const deletePromises = editingLesson.lessonIds.map(async (lessonId: number) => {
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
            {sortedLessons.length} {sortedLessons.length === 1 ? 'lesson' : 'lessons'}
            {hasActiveFilters && ` (filtered)`}
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

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search lessons by title, subject, class, or plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                {[filterSubject !== 'all', filterClass !== 'all', filterStatus !== 'all'].filter(Boolean).length}
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Clear
            </Button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="filter-subject" className="text-sm font-medium mb-2 block">
                  Subject
                </Label>
                <Select value={filterSubject} onValueChange={setFilterSubject}>
                  <SelectTrigger id="filter-subject">
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All subjects</SelectItem>
                    {subjects?.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filter-class" className="text-sm font-medium mb-2 block">
                  Class
                </Label>
                <Select value={filterClass} onValueChange={setFilterClass}>
                  <SelectTrigger id="filter-class">
                    <SelectValue placeholder="All classes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All classes</SelectItem>
                    {classes?.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="filter-status" className="text-sm font-medium mb-2 block">
                  Status
                </Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger id="filter-status">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        )}
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
        <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('title')}
                      className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                    >
                      Lesson
                      {sortColumn === 'title' && (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      )}
                      {sortColumn !== 'title' && <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('subject')}
                      className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                    >
                      Subject
                      {sortColumn === 'subject' && (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      )}
                      {sortColumn !== 'subject' && <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('class')}
                      className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                    >
                      Class
                      {sortColumn === 'class' && (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      )}
                      {sortColumn !== 'class' && <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('date')}
                      className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                    >
                      Date & Time
                      {sortColumn === 'date' && (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      )}
                      {sortColumn !== 'date' && <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('status')}
                      className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                    >
                      Status
                      {sortColumn === 'status' && (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      )}
                      {sortColumn !== 'status' && <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {sortedLessons.map((lesson) => {
                  const lessonDate = new Date(lesson.date);
                  const isLessonToday = isToday(lesson.date);
                  const isLessonPast = isPast(lesson.date);
                  
                  return (
                    <tr 
                      key={lesson.id} 
                      className={`transition-colors duration-150 ${
                        isLessonToday 
                          ? 'bg-blue-50/50 hover:bg-blue-50 border-l-4 border-blue-500' 
                          : 'hover:bg-gray-50/80'
                      } ${isLessonPast ? 'opacity-90' : ''}`}
                    >
                      <td className="px-6 py-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <h3 className="text-sm font-semibold text-gray-900">{lesson.title}</h3>
                            {isLessonToday && !showArchived && (
                              <span className="px-2.5 py-0.5 bg-blue-500 text-white text-xs font-semibold rounded-full shadow-sm">
                                Today
                              </span>
                            )}
                            {isLessonPast && !lesson.planCompleted && !showArchived && (
                              <span className="px-2.5 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full shadow-sm">
                                Overdue
                              </span>
                            )}
                            {showArchived && (
                              <span className="px-2.5 py-0.5 bg-gray-400 text-white text-xs font-semibold rounded-full shadow-sm">
                                Past
                              </span>
                            )}
                          </div>
                          {lesson.lessonPlan && (
                            <p className="text-xs text-gray-600 max-w-xs truncate leading-relaxed">
                              {lesson.lessonPlan}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div 
                          className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold border-2 shadow-sm ${getSubjectColor(lesson.subjectColor, lesson.subjectName)}`}
                          style={getSubjectStyle(lesson.subjectColor, lesson.subjectName)}
                        >
                          {lesson.subjectName}
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-100 rounded-lg">
                            <Users className="h-3.5 w-3.5 text-gray-600" />
                          </div>
                          <span 
                            className={`text-sm font-medium ${getClassColor(lesson.classColor, lesson.className)}`}
                            style={getClassStyle(lesson.classColor)}
                          >
                            {lesson.className}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-sm font-medium text-gray-900">{formatDate(lesson.date)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                            <span className="text-xs font-medium text-gray-600">
                              {lesson.slotStartTime} - {lesson.slotEndTime}
                            </span>
                          </div>
                          {lesson.slotLabel && (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-md">
                                {lesson.slotLabel}
                              </span>
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold ${getWeekColor(lesson.slotWeekNumber)}`}>
                                {getWeekLabel(lesson.slotWeekNumber)}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleToggleComplete(lesson.id, lesson.planCompleted)}
                            className="h-7 w-7 p-0 rounded-lg hover:bg-gray-100 transition-colors"
                            title={lesson.planCompleted ? 'Mark Incomplete' : 'Mark Complete'}
                          >
                            {lesson.planCompleted ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : (
                              <Circle className="h-5 w-5 text-gray-400" />
                            )}
                          </Button>
                          <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm ${
                            lesson.planCompleted 
                              ? 'bg-green-100 text-green-800 border border-green-200' 
                              : isLessonPast 
                              ? 'bg-red-100 text-red-800 border border-red-200' 
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}>
                            {lesson.planCompleted ? 'Completed' : isLessonPast ? 'Overdue' : 'Pending'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openEditModal(lesson)}
                            className="h-9 w-9 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="Edit Lesson"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                            className="h-9 w-9 p-0 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
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