'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Eye, ArrowLeft, BookOpen, Palette } from 'lucide-react';
import { Subject, User } from '@/lib/db/schema';
import useSWR from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColorPicker } from '@/components/ui/color-picker';
import React from 'react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Subject Modal
function SubjectModal({ open, onClose, onSave, mode, initialData, showColorField }: {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; color: string }) => Promise<void>;
  mode: 'add' | 'view' | 'edit';
  initialData?: { name: string; color: string };
  showColorField: boolean;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [color, setColor] = useState(initialData?.color || '');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setName(initialData?.name || '');
    setColor(initialData?.color || '');
  }, [open, initialData]);

  const handleSave = async () => {
    setLoading(true);
    await onSave({ name, color });
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {mode === 'add' ? 'Add New Subject' : mode === 'edit' ? 'Edit Subject' : 'Subject Details'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="subject-name" className="text-sm font-medium">Subject Name</Label>
            <Input 
              id="subject-name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              disabled={mode === 'view'}
              placeholder="Enter subject name"
              className="h-10"
            />
          </div>
          {showColorField && (
            <div className="space-y-2">
              <Label htmlFor="subject-color" className="text-sm font-medium">Color</Label>
              <ColorPicker
                value={color}
                onChange={setColor}
                disabled={mode === 'view'}
                placeholder="Choose a color for this subject"
              />
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} type="button" className="flex-1 sm:flex-none">
            Cancel
          </Button>
          {(mode === 'add' || mode === 'edit') && (
            <Button onClick={handleSave} disabled={loading || !name} type="button" className="flex-1 sm:flex-none">
              {loading ? 'Saving...' : mode === 'add' ? 'Create Subject' : 'Save Changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SubjectsSetupPage() {
  const { data: subjects, error, mutate } = useSWR<Subject[]>('/api/subjects', fetcher);
  const { data: user } = useSWR<User>('/api/user', fetcher);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'view' | 'edit'>('add');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Handlers
  const handleAddSubject = () => {
    setModalMode('add');
    setSelectedSubject(null);
    setModalOpen(true);
  };

  const handleViewSubject = (subject: Subject) => {
    setModalMode('view');
    setSelectedSubject(subject);
    setModalOpen(true);
  };

  const handleEditSubject = (subject: Subject) => {
    setModalMode('edit');
    setSelectedSubject(subject);
    setModalOpen(true);
  };

  const handleSaveSubject = async (data: { name: string; color: string }) => {
    try {
      if (modalMode === 'edit' && selectedSubject) {
        await fetch('/api/subjects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedSubject.id,
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
      setModalOpen(false);
      mutate();
    } catch (error) {
      console.error('Error saving subject:', error);
    }
  };

  const handleDeleteSubject = async (id: number) => {
    if (confirm('Are you sure you want to delete this subject? This action cannot be undone.')) {
      try {
        await fetch(`/api/subjects?id=${id}`, {
          method: 'DELETE',
        });
        mutate();
      } catch (error) {
        console.error('Error deleting subject:', error);
      }
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <BookOpen className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Subjects</h3>
          <p className="text-gray-600 mb-4">There was a problem loading your subjects. Please try again.</p>
          <Button onClick={() => mutate()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard/setup">
                <Button variant="ghost" size="sm" className="h-9 px-3">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Setup
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Subjects</h1>
                  <p className="text-gray-600">Configure subjects with colors and organize your curriculum</p>
                </div>
              </div>
            </div>
            <Button onClick={handleAddSubject} className="h-10 px-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Subjects Grid */}
        {subjects && subjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {subjects.map((subject) => (
              <Card key={subject.id} className="group hover:shadow-lg transition-all duration-200 border-gray-200 p-3">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {subject.color && (
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" 
                        style={{ backgroundColor: subject.color }}
                      />
                    )}
                    <CardTitle className="text-base font-semibold text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                      {subject.name}
                    </CardTitle>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => handleViewSubject(subject)} className="h-7 w-7 p-0">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditSubject(subject)} className="h-7 w-7 p-0">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteSubject(subject.id)} 
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">Subject</span>
                  </div>
                  {subject.color && (
                    <div className="flex items-center gap-2">
                      <Palette className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">Color assigned</span>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <BookOpen className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No subjects yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Get started by creating your first subject. You can assign colors to help organize and identify different subjects in your timetable.
            </p>
            <Button onClick={handleAddSubject} size="lg" className="h-11 px-6">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Subject
            </Button>
          </div>
        )}
      </div>

      {/* Modal */}
      <SubjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveSubject}
        mode={modalMode}
        initialData={selectedSubject ? {
          name: selectedSubject.name,
          color: selectedSubject.color || ''
        } : undefined}
        showColorField={user?.teacherType === 'primary'}
      />
    </div>
  );
} 