'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Eye, ArrowLeft, Users, Palette } from 'lucide-react';
import { Class, User } from '@/lib/db/schema';
import useSWR from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColorPicker } from '@/components/ui/color-picker'; 
import React from 'react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Class Modal
function ClassModal({ open, onClose, onSave, mode, initialData, showColorField }: {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; numberOfStudents: number; notes: string; color?: string }) => Promise<void>;
  mode: 'add' | 'view' | 'edit';
  initialData?: { name: string; numberOfStudents: number; notes: string; color?: string };
  showColorField: boolean;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [numberOfStudents, setNumberOfStudents] = useState(initialData?.numberOfStudents || 0);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [color, setColor] = useState(initialData?.color || '');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setName(initialData?.name || '');
    setNumberOfStudents(initialData?.numberOfStudents || 0);
    setNotes(initialData?.notes || '');
    setColor(initialData?.color || '');
  }, [open, initialData]);

  const handleSave = async () => {
    setLoading(true);
    await onSave({ name, numberOfStudents, notes, color });
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {mode === 'add' ? 'Add New Class' : mode === 'edit' ? 'Edit Class' : 'Class Details'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="class-name" className="text-sm font-medium">Class Name</Label>
            <Input 
              id="class-name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              disabled={mode === 'view'}
              placeholder="Enter class name"
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-students" className="text-sm font-medium">Number of Students</Label>
            <Input 
              id="class-students" 
              type="number" 
              value={numberOfStudents} 
              onChange={e => setNumberOfStudents(parseInt(e.target.value) || 0)} 
              disabled={mode === 'view'}
              placeholder="0"
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-notes" className="text-sm font-medium">Notes</Label>
            <Input 
              id="class-notes" 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              disabled={mode === 'view'}
              placeholder="Optional notes about this class"
              className="h-10"
            />
          </div>
          {showColorField && (
            <div className="space-y-2">
              <Label htmlFor="class-color" className="text-sm font-medium">Color</Label>
              <ColorPicker
                value={color}
                onChange={setColor}
                disabled={mode === 'view'}
                placeholder="Choose a color for this class"
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
              {loading ? 'Saving...' : mode === 'add' ? 'Create Class' : 'Save Changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ClassesSetupPage() {
  const { data: classes, error, mutate } = useSWR<Class[]>('/api/classes', fetcher);
  const { data: user } = useSWR<User>('/api/user', fetcher);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'view' | 'edit'>('add');
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  // Handlers
  const handleAddClass = () => {
    setModalMode('add');
    setSelectedClass(null);
    setModalOpen(true);
  };

  const handleViewClass = (cls: Class) => {
    setModalMode('view');
    setSelectedClass(cls);
    setModalOpen(true);
  };

  const handleEditClass = (cls: Class) => {
    setModalMode('edit');
    setSelectedClass(cls);
    setModalOpen(true);
  };

  const handleSaveClass = async (data: { name: string; numberOfStudents: number; notes: string; color?: string }) => {
    try {
      if (modalMode === 'edit' && selectedClass) {
        await fetch('/api/classes', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedClass.id,
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
      setModalOpen(false);
      mutate();
    } catch (error) {
      console.error('Error saving class:', error);
    }
  };

  const handleDeleteClass = async (id: number) => {
    if (confirm('Are you sure you want to delete this class? This will also delete all associated lessons and remove this class from timetable entries. This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/classes?id=${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete class');
        }
        
        mutate();
      } catch (error) {
        console.error('Error deleting class:', error);
        alert(`Failed to delete class: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Classes</h3>
          <p className="text-gray-600 mb-4">There was a problem loading your classes. Please try again.</p>
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
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
                  <p className="text-gray-600">Manage your class groups and student information</p>
                </div>
              </div>
            </div>
            <Button onClick={handleAddClass} className="h-10 px-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Class
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Classes Grid */}
        {classes && classes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {classes.map((cls) => (
              <Card key={cls.id} className="group hover:shadow-lg transition-all duration-200 border-gray-200 p-3">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {cls.color && (
                      <div 
                        className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" 
                        style={{ backgroundColor: cls.color }}
                      />
                    )}
                    <CardTitle className="text-base font-semibold text-gray-900 group-hover:text-orange-600 transition-colors truncate">
                      {cls.name}
                    </CardTitle>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" onClick={() => handleViewClass(cls)} className="h-7 w-7 p-0">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditClass(cls)} className="h-7 w-7 p-0">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteClass(cls.id)} 
                      className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-3 w-3 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{cls.numberOfStudents} students</span>
                  </div>
                  {cls.notes && (
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border-l-2 border-orange-200">
                      {cls.notes}
                    </div>
                  )}
                  {cls.color && (
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
              <Users className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No classes yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Get started by creating your first class. You can add student counts and notes to keep track of important information.
            </p>
            <Button onClick={handleAddClass} size="lg" className="h-11 px-6">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Class
            </Button>
          </div>
        )}
      </div>

      {/* Modal */}
      <ClassModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveClass}
        mode={modalMode}
        initialData={selectedClass ? {
          name: selectedClass.name,
          numberOfStudents: selectedClass.numberOfStudents || 0,
          notes: selectedClass.notes || '',
          color: selectedClass.color || ''
        } : undefined}
        showColorField={user?.colorPreference === 'class'}
      />
    </div>
  );
} 