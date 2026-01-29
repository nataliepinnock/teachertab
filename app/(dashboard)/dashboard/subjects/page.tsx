'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, BookOpen, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import useSWR from 'swr';
import { Suspense, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ColorPicker } from '@/components/ui/color-picker';
import { Subject, User } from '@/lib/db/schema';

const fetcher = async (url: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) {
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

function SubjectsSkeleton() {
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

function SubjectsList() {
  const { data: subjects, error: subjectsError, mutate } = useSWR<Subject[]>('/api/subjects', fetcher);
  const { data: lessons } = useSWR<any[]>('/api/lessons', fetcher);
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  
  // Sorting state
  const [sortColumn, setSortColumn] = useState<'name' | 'lessons'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Filtering state
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Ensure subjects is always an array
  const subjectsArray = Array.isArray(subjects) ? subjects : [];
  const isLoading = !subjects && !subjectsError;

  if (subjectsError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Error loading subjects. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <SubjectsSkeleton />;
  }

  // Get lesson count for each subject
  const getLessonCount = (subjectId: number) => {
    if (!lessons || !Array.isArray(lessons)) return 0;
    return lessons.filter(lesson => lesson.subjectId === subjectId).length;
  };

  // Filter and sort subjects
  const filterAndSortSubjects = () => {
    if (!subjectsArray || subjectsArray.length === 0) return [];
    
    let filtered = subjectsArray;
    
    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(subj => 
        subj.name?.toLowerCase().includes(query)
      );
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortColumn) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
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

  const sortedSubjects = filterAndSortSubjects();

  const handleSaveSubject = async (data: { name: string; color?: string }) => {
    try {
      if (editingSubject) {
        await fetch('/api/subjects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingSubject.id,
            ...data,
          }),
        });
      } else {
        await fetch('/api/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }
      setIsSubjectModalOpen(false);
      setEditingSubject(null);
      await mutate();
    } catch (error) {
      console.error('Error saving subject:', error);
      throw error;
    }
  };

  const handleDeleteSubject = async (subjectId: number, subjectName: string) => {
    if (!confirm(`Are you sure you want to delete "${subjectName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/subjects?id=${subjectId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete subject');
      }

      await mutate();
    } catch (error) {
      console.error('Error deleting subject:', error);
      alert('Failed to delete subject. Please try again.');
    }
  };


  const openAddModal = () => {
    setEditingSubject(null);
    setIsSubjectModalOpen(true);
  };

  const openEditModal = (subj: Subject) => {
    setEditingSubject(subj);
    setIsSubjectModalOpen(true);
  };

  const closeModal = () => {
    setIsSubjectModalOpen(false);
    setEditingSubject(null);
  };

  const getSubjectStyle = (subjectColor: string | null) => {
    if (subjectColor) {
      return {
        backgroundColor: `${subjectColor}10`,
        color: subjectColor,
        borderColor: `${subjectColor}20`,
      };
    }
    return {};
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Subjects
          </h1>
          <p className="text-gray-600 mt-1">
            {sortedSubjects.length} {sortedSubjects.length === 1 ? 'subject' : 'subjects'}
            {hasActiveFilters && ` (filtered)`}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button onClick={openAddModal}>
            <Plus className="h-4 w-4 mr-2" />
            Add Subject
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <Input
              placeholder="Search subjects by name..."
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

      {!sortedSubjects || sortedSubjects.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No subjects yet
              </h3>
              <p className="text-gray-500 mb-6">
                Create your first subject to get started.
              </p>
              <Button onClick={openAddModal}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Subject
              </Button>
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
                      Subject Name
                      {sortColumn === 'name' && (
                        sortDirection === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
                      )}
                      {sortColumn !== 'name' && <ArrowUpDown className="h-3 w-3 opacity-40" />}
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
                {sortedSubjects.map((subj) => {
                  const lessonCount = getLessonCount(subj.id);
                  
                  return (
                    <tr 
                      key={subj.id} 
                      className="hover:bg-gray-50/80 transition-colors duration-150"
                    >
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          {subj.color && (
                            <div
                              className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0"
                              style={{ backgroundColor: subj.color }}
                            />
                          )}
                          <div 
                            className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-semibold border-2 shadow-sm ${subj.color ? 'custom-text-color' : 'bg-gray-100 text-gray-800 border-gray-200'}`}
                            style={getSubjectStyle(subj.color || null)}
                          >
                            {subj.name}
                          </div>
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
                        {subj.notes ? (
                          <p className="text-xs text-gray-600 max-w-xs truncate leading-relaxed">
                            {subj.notes}
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
                            onClick={() => openEditModal(subj)}
                            className="h-9 w-9 p-0 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            title="Edit Subject"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteSubject(subj.id, subj.name)}
                            className="h-9 w-9 p-0 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete Subject"
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

      {/* Subject Modal */}
      <Dialog open={isSubjectModalOpen} onOpenChange={closeModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingSubject ? 'Edit Subject' : 'Add New Subject'}
            </DialogTitle>
          </DialogHeader>
          <SubjectModalForm
            initialData={editingSubject}
            onSave={handleSaveSubject}
            onClose={closeModal}
            showColorField={user?.colorPreference === 'subject'}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SubjectModalForm({ 
  initialData, 
  onSave, 
  onClose,
  showColorField
}: { 
  initialData: Subject | null;
  onSave: (data: { name: string; color?: string; notes?: string }) => Promise<void>;
  onClose: () => void;
  showColorField: boolean;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [color, setColor] = useState(initialData?.color || '#3B82F6');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter a subject name');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        color: showColorField ? (color || undefined) : undefined,
        notes: notes.trim() || undefined,
      });
    } catch (error) {
      console.error('Error saving subject:', error);
      alert('Failed to save subject. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Subject Name *</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Mathematics, English, Science"
          required
        />
      </div>

      {showColorField && (
        <div>
          <Label htmlFor="color">Color</Label>
          <ColorPicker
            value={color}
            onChange={setColor}
            placeholder="Choose a color for this subject"
          />
        </div>
      )}

      <div>
        <Label htmlFor="notes">Notes</Label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Additional notes about this subject..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? 'Saving...' : initialData ? 'Save Changes' : 'Create Subject'}
        </Button>
      </DialogFooter>
    </form>
  );
}

export default function SubjectsPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <Suspense fallback={<SubjectsSkeleton />}>
        <SubjectsList />
      </Suspense>
    </section>
  );
}

