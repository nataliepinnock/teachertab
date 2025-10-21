'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Users, BookOpen, Calendar, Trash2, CheckCircle, XCircle } from 'lucide-react';

interface SlotDependencies {
  lessonsCount: number;
  entriesCount: number;
  lessons: Array<{
    id: number;
    title: string;
    className: string;
    subjectName: string;
    date: string;
  }>;
  entries: Array<{
    id: number;
    className: string;
    subjectName: string;
    room?: string;
  }>;
}

interface SlotDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  slot: {
    id: number;
    label: string;
    dayOfWeek: string;
    weekNumber: number;
    startTime: string;
    endTime: string;
  } | null;
  dependencies: SlotDependencies | null;
  isLoading?: boolean;
}

export function SlotDeletionModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  slot, 
  dependencies,
  isLoading = false 
}: SlotDeletionModalProps) {
  const [deletionStep, setDeletionStep] = useState<'confirm' | 'deleting' | 'completed'>('confirm');
  const [deletedItems, setDeletedItems] = useState<{
    lessons: boolean;
    entries: boolean;
    slot: boolean;
  }>({
    lessons: false,
    entries: false,
    slot: false
  });

  useEffect(() => {
    if (isOpen) {
      setDeletionStep('confirm');
      setDeletedItems({ lessons: false, entries: false, slot: false });
    }
  }, [isOpen]);

  const hasDependencies = dependencies && (dependencies.lessonsCount > 0 || dependencies.entriesCount > 0);

  const handleConfirm = async () => {
    if (!hasDependencies) {
      // No dependencies, proceed directly to slot deletion
      setDeletionStep('deleting');
      setDeletedItems(prev => ({ ...prev, slot: true }));
      await onConfirm();
      setDeletionStep('completed');
      return;
    }

    // Has dependencies, show step-by-step process
    setDeletionStep('deleting');
    
    try {
      // Step 1: Delete lessons
      if (dependencies.lessonsCount > 0) {
        setDeletedItems(prev => ({ ...prev, lessons: true }));
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate deletion
      }

      // Step 2: Delete timetable entries (class assignments)
      if (dependencies.entriesCount > 0) {
        setDeletedItems(prev => ({ ...prev, entries: true }));
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate deletion
      }

      // Step 3: Delete the slot
      setDeletedItems(prev => ({ ...prev, slot: true }));
      await onConfirm();
      
      setDeletionStep('completed');
    } catch (error) {
      console.error('Error during deletion:', error);
      setDeletionStep('confirm');
    }
  };

  const handleClose = () => {
    if (deletionStep === 'completed') {
      onClose();
    }
  };

  if (!slot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Delete Timetable Slot
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Slot Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="font-medium text-gray-900">{slot.label}</span>
            </div>
            <div className="text-sm text-gray-600">
              {slot.dayOfWeek} Week {slot.weekNumber} • {slot.startTime} - {slot.endTime}
            </div>
          </div>

          {/* Dependencies Check */}
          {deletionStep === 'confirm' && (
            <div className="space-y-4">
              {hasDependencies ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-orange-600">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="font-medium">This timetable slot is currently being used and has content that will be affected:</span>
                  </div>

                  {/* Lessons */}
                  {dependencies.lessonsCount > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-900">
                          {dependencies.lessonsCount} lesson plan{dependencies.lessonsCount !== 1 ? 's' : ''} will be permanently removed
                        </span>
                      </div>
                      <div className="text-sm text-red-700 space-y-1">
                        {dependencies.lessons.slice(0, 3).map((lesson) => (
                          <div key={lesson.id} className="flex items-center gap-2">
                            <span>• {lesson.title}</span>
                            <span className="text-red-500">({lesson.className} - {lesson.subjectName})</span>
                          </div>
                        ))}
                        {dependencies.lessonsCount > 3 && (
                          <div className="text-red-500">
                            ... and {dependencies.lessonsCount - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Timetable Entries */}
                  {dependencies.entriesCount > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">
                          {dependencies.entriesCount} class schedule{dependencies.entriesCount !== 1 ? 's' : ''} will be cleared
                        </span>
                      </div>
                      <div className="text-sm text-blue-700 space-y-1">
                        {dependencies.entries.slice(0, 3).map((entry) => (
                          <div key={entry.id} className="flex items-center gap-2">
                            <span>• {entry.className}</span>
                            {entry.subjectName && <span className="text-blue-500">- {entry.subjectName}</span>}
                            {entry.room && <span className="text-blue-500">({entry.room})</span>}
                          </div>
                        ))}
                        {dependencies.entriesCount > 3 && (
                          <div className="text-blue-500">
                            ... and {dependencies.entriesCount - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      <strong>Important:</strong> This action cannot be undone. All lesson plans and class schedules associated with this time slot will be permanently removed from your timetable.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">This time slot is not currently being used and can be safely removed.</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Deletion Progress */}
          {deletionStep === 'deleting' && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-gray-600 mb-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span>Removing time slot and associated content...</span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Lessons deletion */}
                {dependencies && dependencies.lessonsCount > 0 && (
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${
                    deletedItems.lessons ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                  }`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      deletedItems.lessons ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {deletedItems.lessons ? (
                        <CheckCircle className="h-3 w-3 text-white" />
                      ) : (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        Removing {dependencies.lessonsCount} lesson plan{dependencies.lessonsCount !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-gray-500">Clearing all lesson plans from this time slot</div>
                    </div>
                  </div>
                )}

                {/* Entries deletion */}
                {dependencies && dependencies.entriesCount > 0 && (
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${
                    deletedItems.entries ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                  }`}>
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      deletedItems.entries ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {deletedItems.entries ? (
                        <CheckCircle className="h-3 w-3 text-white" />
                      ) : (
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">
                        Clearing {dependencies.entriesCount} class schedule{dependencies.entriesCount !== 1 ? 's' : ''}
                      </div>
                      <div className="text-xs text-gray-500">Removing all class schedules from this time slot</div>
                    </div>
                  </div>
                )}

                {/* Slot deletion */}
                <div className={`flex items-center gap-3 p-3 rounded-lg ${
                  deletedItems.slot ? 'bg-green-50 border border-green-200' : 'bg-gray-50'
                }`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                    deletedItems.slot ? 'bg-green-500' : 'bg-gray-300'
                  }`}>
                    {deletedItems.slot ? (
                      <CheckCircle className="h-3 w-3 text-white" />
                    ) : (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-sm">Removing time slot</div>
                    <div className="text-xs text-gray-500">Deleting this time slot from your timetable</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Completion */}
          {deletionStep === 'completed' && (
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Time Slot Removed Successfully</h3>
                <p className="text-gray-600">
                  The time slot and all associated lesson plans and class schedules have been removed from your timetable.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {deletionStep === 'confirm' && (
            <>
              <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
                Cancel
              </Button>
              <Button 
                onClick={handleConfirm} 
                disabled={isLoading}
                className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {hasDependencies ? 'Remove Time Slot & Content' : 'Remove Time Slot'}
              </Button>
            </>
          )}
          {deletionStep === 'completed' && (
            <Button onClick={onClose} className="flex-1 sm:flex-none">
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
