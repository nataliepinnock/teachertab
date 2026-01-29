'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Users, Archive, ArrowLeft, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Filter, X, BookOpen, Palette } from 'lucide-react';
import useSWR from 'swr';
import { Suspense, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ColorPicker } from '@/components/ui/color-picker';
import { Class } from '@/lib/db/schema';

const fetcher = async (url: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      // Don't throw errors for auth-related status codes (401, 403)
      if (res.status === 401 || res.status === 403) {
        return [];
      }
      throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`);
    }
    return res.json();
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return [];
  }
};

function ClassesSkeleton() {
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

function ClassesList() {
  const { data: classes, error: classesError, mutate } = useSWR<Class[]>('/api/classes', fetcher);
  const { data: lessons } = useSWR<any[]>('/api/lessons', fetcher);
  const [showArchived, setShowArchived] = useState(false);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<'name' | 'students' | 'lessons'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Filtering state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Ensure classes is always an array
  const classesArray = Array.isArray(classes) ? classes : [];
  const isLoading = !classes && !classesError;

  if (classesError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Error loading classes. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <ClassesSkeleton />;
  }

  // Get lesson count for each class
  const getLessonCount = (classId: number) => {
    if (!lessons || !Array.isArray(lessons)) return 0;
    return lessons.filter(lesson => lesson.classId === classId).length;
  };

  // Filter and sort classes
  const filterAndSortClasses = () => {
    if (!classesArray || classesArray.length === 0) return [];
    
    let filtered = classesArray;
    
    // Apply archive filter - isArchived is stored as 0 or 1 in the database
    if (showArchived) {
      filtered = filtered.filter(cls => cls.isArchived === 1);
    } else {
      filtered = filtered.filter(cls => cls.isArchived === 0 || cls.isArchived === null || cls.isArchived === undefined);
    }
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(cls => 
        cls.name?.toLowerCase().includes(query) ||
        cls.notes?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'students':
          comparison = (a.numberOfStudents || 0) - (b.numberOfStudents || 0);
          break;
        case 'lessons':
          comparison = getLessonCount(a.id) - getLessonCount(b.id);
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
    setSearchQuery('');
  };
  
  const hasActiveFilters = searchQuery.trim() !== '';

  const sortedClasses = filterAndSortClasses();
  const archivedClassesCount = classesArray.filter(cls => cls.isArchived === 1).length;
  const currentClassesCount = classesArray.filter(cls => cls.isArchived === 0 || cls.isArchived === null || cls.isArchived === undefined).length;

  const handleSaveClass = async (data: { name: string; numberOfStudents: number; notes: string; color?: string }) => {
    try {
      if (editingClass) {
        await fetch('/api/classes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingClass.id,
            ...data,
          }),
        });
      } else {
        await fetch('/api/classes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      setIsClassModalOpen(false);
      setEditingClass(null);
      await mutate();
    } catch (error) {
      console.error('Error saving class:', error);
      throw error;
    }
  };

  const handleDeleteClass = async (classId: number, className: string) => {
    if (!confirm(`Are you sure you want to delete "${className}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/classes?id=${classId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete class');
      }

      await mutate();
    } catch (error) {
      console.error('Error deleting class:', error);
      alert('Failed to delete class. Please try again.');
    }
  };

  const handleArchiveClass = async (classId: number, currentIsArchived: number) => {
    try {
      const classToUpdate = classesArray.find(c => c.id === classId);
      if (!classToUpdate) return;

      // Toggle archive status: 0 -> 1, 1 -> 0
      const newArchiveStatus = currentIsArchived === 1 ? 0 : 1;

      const response = await fetch('/api/classes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: classId,
          name: classToUpdate.name,
          numberOfStudents: classToUpdate.numberOfStudents,
          notes: classToUpdate.notes,
          color: classToUpdate.color,
          isArchived: newArchiveStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update class');
      }

      await mutate();
    } catch (error) {
      console.error('Error archiving class:', error);
      alert('Failed to update class. Please try again.');
    }
  };

  const openAddModal = () => {
    setEditingClass(null);
    setIsClassModalOpen(true);
  };

  const openEditModal = (cls: Class) => {
    setEditingClass(cls);
    setIsClassModalOpen(true);
  };

  const closeModal = () => {
    setIsClassModalOpen(false);
    setEditingClass(null);
  };

  const getClassStyle = (classColor: string | null) => {
    if (classColor) {
      return { color: classColor };
    }
    return {};
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {showArchived ? 'Archived Classes' : 'Classes'}
          </h1>
          <p className="text-gray-600 mt-1">
            {sortedClasses.length} {sortedClasses.length === 1 ? 'class' : 'classes'}
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
                <span>View Archive ({archivedClassesCount})</span>
              </Button>
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4 mr-2" />
                Add Class
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
              placeholder="Search classes by name or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>
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
      </div>

      {!sortedClasses || sortedClasses.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {showArchived ? 'No archived classes' : 'No classes yet'}
              </h3>
              <p className="text-gray-500 mb-6">
                {showArchived 
                  ? 'No archived classes found.'
                  : 'Create your first class to get started.'
                }
              </p>
              {!showArchived && (
                <Button onClick={openAddModal}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Class
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
                      onClick={() => handleSort('name')}
                      className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                    >
                      Class Name
                      {sortColumn === 'name' && (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      )}
                      {sortColumn !== 'name' && <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('students')}
                      className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                    >
                      Students
                      {sortColumn === 'students' && (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      )}
                      {sortColumn !== 'students' && <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    <button
                      onClick={() => handleSort('lessons')}
                      className="flex items-center gap-1 hover:text-gray-900 transition-colors"
                    >
                      Lessons
                      {sortColumn === 'lessons' && (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      )}
                      {sortColumn !== 'lessons' && <ArrowUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Notes
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {sortedClasses.map((cls) => {
                  const lessonCount = getLessonCount(cls.id);
                  
                  return (
                    <tr 
                      key={cls.id} 
                      className="hover:bg-gray-50/80 transition-colors duration-150"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {cls.color && (
                            <div
                              className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: cls.color }}
                            />
                          )}
                          <div>
                            <h3 
                              className="text-sm font-semibold text-gray-900"
                              style={getClassStyle(cls.color || null)}
                            >
                              {cls.name}
                            </h3>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-gray-100 rounded-lg">
                            <Users className="h-3.5 w-3.5 text-gray-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {cls.numberOfStudents || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-100 rounded-lg">
                            <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {lessonCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        {cls.notes ? (
                          <p className="text-xs text-gray-600 max-w-xs truncate leading-relaxed">
                            {cls.notes}
                          </p>
                        ) : (
                          <span className="text-xs text-gray-400 italic">No notes</span>
                        )}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => openEditModal(cls)}
                            className="h-9 w-9 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="Edit Class"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!showArchived ? (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleArchiveClass(cls.id, cls.isArchived)}
                              className="h-9 w-9 p-0 rounded-lg hover:bg-gray-50 hover:text-gray-600 transition-colors"
                              title="Archive Class"
                            >
                              <Archive className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleArchiveClass(cls.id, cls.isArchived)}
                              className="h-9 w-9 p-0 rounded-lg hover:bg-green-50 hover:text-green-600 transition-colors"
                              title="Unarchive Class"
                            >
                              <ArrowLeft className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteClass(cls.id, cls.name)}
                            className="h-9 w-9 p-0 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete Class"
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

      {/* Class Modal */}
      <Dialog open={isClassModalOpen} onOpenChange={closeModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingClass ? 'Edit Class' : 'Add New Class'}
            </DialogTitle>
          </DialogHeader>
          <ClassModalForm
            initialData={editingClass}
            onSave={handleSaveClass}
            onClose={closeModal}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClassModalForm({ 
  initialData, 
  onSave, 
  onClose 
}: { 
  initialData: Class | null;
  onSave: (data: { name: string; numberOfStudents: number; notes: string; color?: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [numberOfStudents, setNumberOfStudents] = useState(initialData?.numberOfStudents || 0);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [color, setColor] = useState(initialData?.color || '#3B82F6');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a class name');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        numberOfStudents: numberOfStudents || 0,
        notes: notes.trim(),
        color: color || undefined,
      });
    } catch (error) {
      console.error('Error saving class:', error);
      alert('Failed to save class. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Class Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Year 7A, Class 3B"
          required
        />
      </div>

      <div>
        <Label htmlFor="students">Number of Students</Label>
        <Input
          id="students"
          type="number"
          min="0"
          value={numberOfStudents}
          onChange={(e) => setNumberOfStudents(parseInt(e.target.value) || 0)}
          placeholder="0"
        />
      </div>

      <div>
        <Label htmlFor="color">Color</Label>
        <ColorPicker
          value={color}
          onChange={setColor}
          placeholder="Choose a color for this class"
        />
      </div>

      <div>
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes about this class..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : initialData ? 'Save Changes' : 'Create Class'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function ClassesPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <Suspense fallback={<ClassesSkeleton />}>
        <ClassesList />
      </Suspense>
    </section>
  );
}

