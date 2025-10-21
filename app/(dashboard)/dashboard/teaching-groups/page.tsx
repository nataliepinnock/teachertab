'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users, Edit, Trash2, Eye, BookOpen } from 'lucide-react';
import { Class, Subject } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import React from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface TeachingGroup {
  id: string;
  className: string;
  subjectName: string;
  numberOfStudents: number;
  notes: string;
  color: string;
  isArchived: boolean;
}

function TeachingGroupsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="h-[200px]">
          <CardContent className="animate-pulse">
            <div className="mt-4 space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-3 w-24 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function DeleteConfirmationModal({ open, onClose, onConfirm, teachingGroupName }: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  teachingGroupName: string;
}) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Teaching Group</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{teachingGroupName}</strong>? This action cannot be undone.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} type="button" disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading} type="button">
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TeachingGroupModal({ open, onClose, onSave, mode, initialData, classes, subjects }: {
  open: boolean;
  onClose: () => void;
  onSave: (data: { classId: number; subjectId: number; numberOfStudents: number; notes: string; className?: string; subjectName?: string }) => Promise<void>;
  mode: 'add' | 'view' | 'edit';
  initialData?: { classId: number; subjectId: number; numberOfStudents: number; notes: string };
  classes: Class[];
  subjects: Subject[];
}) {
  const [classId, setClassId] = useState(initialData?.classId || 0);
  const [subjectId, setSubjectId] = useState(initialData?.subjectId || 0);
  const [className, setClassName] = useState('');
  const [subjectName, setSubjectName] = useState('');
  const [numberOfStudents, setNumberOfStudents] = useState(initialData?.numberOfStudents || 0);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [loading, setLoading] = useState(false);

  // Reset fields when modal opens/closes
  React.useEffect(() => {
    setClassId(initialData?.classId || 0);
    setSubjectId(initialData?.subjectId || 0);
    setClassName('');
    setSubjectName('');
    setNumberOfStudents(initialData?.numberOfStudents || 0);
    setNotes(initialData?.notes || '');
  }, [open, initialData]);

  const handleSave = async () => {
    setLoading(true);
    await onSave({ classId, subjectId, numberOfStudents, notes, className, subjectName });
    setLoading(false);
  };

  const selectedClass = classes.find(c => c.id === classId);
  const selectedSubject = subjects.find(s => s.id === subjectId);

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add Teaching Group' : mode === 'edit' ? 'Edit Teaching Group' : 'Teaching Group Details'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {mode === 'add' ? (
            <>
              <div>
                <Label htmlFor="class-name">Class Name</Label>
                <Input 
                  id="class-name" 
                  value={className} 
                  onChange={e => setClassName(e.target.value)} 
                  placeholder="e.g., Year 7A, Reception, etc."
                />
              </div>
              <div>
                <Label htmlFor="subject-name">Subject Name</Label>
                <Input 
                  id="subject-name" 
                  value={subjectName} 
                  onChange={e => setSubjectName(e.target.value)} 
                  placeholder="e.g., Math, English, Phonics, etc."
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <Label htmlFor="class-select">Class</Label>
                <Select value={classId.toString()} onValueChange={(value) => setClassId(parseInt(value))} disabled={mode === 'view'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="subject-select">Subject</Label>
                <Select value={subjectId.toString()} onValueChange={(value) => setSubjectId(parseInt(value))} disabled={mode === 'view'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
          <div>
            <Label htmlFor="number-of-students">Number of Students</Label>
            <Input 
              id="number-of-students" 
              type="number" 
              value={numberOfStudents} 
              onChange={e => setNumberOfStudents(parseInt(e.target.value) || 0)} 
              disabled={mode === 'view'} 
            />
          </div>
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" value={notes} onChange={e => setNotes(e.target.value)} disabled={mode === 'view'} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} type="button">Close</Button>
          {(mode === 'add' || mode === 'edit') && (
            <Button onClick={handleSave} disabled={loading || (mode === 'add' ? (!className || !subjectName) : (!classId || !subjectId))} type="button">
              {loading ? 'Saving...' : 'Save'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TeachingGroupsList() {
  const { data: user } = useSWR('/api/user', fetcher);
  const { data: teachingGroups, error, mutate } = useSWR<TeachingGroup[]>(
    user ? `/api/teaching-groups?userId=${user.id}` : null, 
    fetcher
  );
  const { data: classes, error: classesError, mutate: mutateClasses } = useSWR<Class[]>('/api/classes', fetcher);
  const { data: subjects, error: subjectsError, mutate: mutateSubjects } = useSWR<Subject[]>('/api/subjects', fetcher);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'view' | 'edit'>('add');
  const [selectedTeachingGroup, setSelectedTeachingGroup] = useState<TeachingGroup | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [teachingGroupToDelete, setTeachingGroupToDelete] = useState<TeachingGroup | null>(null);

  // Use teaching groups from API if available, otherwise create from classes and subjects
  const displayTeachingGroups = useMemo(() => {
    if (teachingGroups) return teachingGroups;
    
    if (!classes || !subjects) return [];
    
    const groups: TeachingGroup[] = [];
    classes.forEach(cls => {
      subjects.forEach(subject => {
        groups.push({
          id: `${cls.id}-${subject.id}`,
          className: cls.name,
          subjectName: subject.name,
          numberOfStudents: cls.numberOfStudents || 0,
          notes: cls.notes || '',
          color: subject.color || '#000000',
          isArchived: cls.isArchived === 1
        });
      });
    });
    
    return groups;
  }, [teachingGroups, classes, subjects]);

  // Memoize the initial data to prevent unnecessary re-renders
  const initialData = useMemo(() => {
    if (!selectedTeachingGroup) return undefined;
    const classId = classes?.find(c => c.name === selectedTeachingGroup.className)?.id || 0;
    const subjectId = subjects?.find(s => s.name === selectedTeachingGroup.subjectName)?.id || 0;
    
    return {
      classId,
      subjectId,
      numberOfStudents: selectedTeachingGroup.numberOfStudents,
      notes: selectedTeachingGroup.notes
    };
  }, [selectedTeachingGroup, classes, subjects]);

  if (!classes || !subjects || !displayTeachingGroups) {
    return <TeachingGroupsSkeleton />;
  }

  if (error || classesError || subjectsError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Error loading data. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeTeachingGroups = displayTeachingGroups.filter(g => !g.isArchived);
  const archivedTeachingGroups = displayTeachingGroups.filter(g => g.isArchived);

  const handleAddTeachingGroup = () => {
    setModalMode('add');
    setSelectedTeachingGroup(null);
    setModalOpen(true);
  };

  const handleViewTeachingGroup = (group: TeachingGroup) => {
    setModalMode('view');
    setSelectedTeachingGroup(group);
    setModalOpen(true);
  };

  const handleEditTeachingGroup = (group: TeachingGroup) => {
    setModalMode('edit');
    setSelectedTeachingGroup(group);
    setModalOpen(true);
  };

  const handleDeleteTeachingGroup = (group: TeachingGroup) => {
    setTeachingGroupToDelete(group);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!teachingGroupToDelete) return;

    try {
      // Extract class and subject IDs from the teaching group ID
      const [classId, subjectId] = teachingGroupToDelete.id.split('-').map(Number);
      
      await fetch(`/api/teaching-groups?classId=${classId}&subjectId=${subjectId}`, {
        method: 'DELETE',
      });

      setDeleteModalOpen(false);
      setTeachingGroupToDelete(null);
      mutate();
      mutateClasses();
      mutateSubjects();
    } catch (error) {
      console.error('Error deleting teaching group:', error);
    }
  };

  const handleSaveTeachingGroup = async (data: { classId: number; subjectId: number; numberOfStudents: number; notes: string }) => {
    try {
      if (modalMode === 'edit' && selectedTeachingGroup) {
        // Update existing teaching group
        await fetch('/api/teaching-groups', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            classId: data.classId,
            subjectId: data.subjectId,
            numberOfStudents: data.numberOfStudents,
            notes: data.notes,
          }),
        });
      } else {
        // Create new teaching group
        if (data.className && data.subjectName) {
          await fetch('/api/teaching-groups', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              className: data.className,
              subjectName: data.subjectName,
              numberOfStudents: data.numberOfStudents,
              notes: data.notes,
              color: '#000000', // Default color
              userId: user?.id || 1,
            }),
          });
        }
      }
      setModalOpen(false);
      mutate();
      mutateClasses();
      mutateSubjects();
    } catch (error) {
      console.error('Error saving teaching group:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900">Teaching Groups</h2>
        <Button onClick={handleAddTeachingGroup}>
          <Plus className="h-4 w-4 mr-2" />
          Add Teaching Group
        </Button>
      </div>

      {activeTeachingGroups.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No teaching groups yet. Create your first one to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeTeachingGroups.map((group) => (
            <Card key={group.id} className="p-3">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full border border-gray-300" 
                    style={{ backgroundColor: group.color }}
                  />
                  <CardTitle className="text-base">{group.className}</CardTitle>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleViewTeachingGroup(group)} className="h-6 w-6 p-0">
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEditTeachingGroup(group)} className="h-6 w-6 p-0">
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteTeachingGroup(group)}
                    className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3 w-3 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">{group.subjectName}</span>
                </div>
                {group.notes && (
                  <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded border-l-2 border-orange-200">{group.notes}</p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">{group.numberOfStudents} students</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {archivedTeachingGroups.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-medium mb-4">Archive</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {archivedTeachingGroups.map((group) => (
              <Card key={group.id} className="opacity-60">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full border border-gray-300" 
                      style={{ backgroundColor: group.color }}
                    />
                    <CardTitle className="text-lg">{group.className}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">{group.subjectName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">{group.numberOfStudents} students • Archived</span>
                    <Button variant="outline" size="sm">
                      Restore
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <TeachingGroupModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSaveTeachingGroup}
        mode={modalMode}
        initialData={initialData}
        classes={classes}
        subjects={subjects}
      />
      
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setTeachingGroupToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        teachingGroupName={`${teachingGroupToDelete?.className} ${teachingGroupToDelete?.subjectName}`}
      />
    </div>
  );
}

export default function TeachingGroupsPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <Suspense fallback={<TeachingGroupsSkeleton />}>
        <TeachingGroupsList />
      </Suspense>
    </section>
  );
} 