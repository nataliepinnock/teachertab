'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, ArrowLeft, Clock, ChevronLeft, ChevronRight, Calendar, CalendarDays, Users, BookOpen, MapPin, Briefcase } from 'lucide-react';
import { TimetableSlot } from '@/lib/db/schema';
import useSWR from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlotDeletionModal } from '@/components/slot-deletion-modal';
import { TimetableActivityModal } from '@/components/timetable-activity-modal';
import React from 'react';
import Link from 'next/link';
import { TimetableSlotModal as MultiDayTimetableSlotModal } from '@/components/timetable-slot-modal';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    // If it's a 401, throw an error so SWR can catch it
    if (res.status === 401) {
      const error = new Error('Unauthorized - Please sign in again');
      (error as any).status = 401;
      throw error;
    }
    // For other errors, return empty array for array endpoints
    return [];
  }
  const data = await res.json();
  // Ensure we always return an array for array endpoints
  return Array.isArray(data) ? data : [];
};

// Class Assignment Modal
function ClassAssignmentModal({ open, onClose, onSave, slot, initialData }: {
  open: boolean;
  onClose: () => void;
  onSave: (data: { classId?: number; subjectId?: number; room?: string; notes?: string }) => Promise<void>;
  slot: TimetableSlot | null;
  initialData?: { classId?: number; subjectId?: number; room?: string; notes?: string };
}) {
  const [classId, setClassId] = useState<string>(initialData?.classId?.toString() || '');
  const [subjectId, setSubjectId] = useState<string>(initialData?.subjectId?.toString() || '');
  const [room, setRoom] = useState(initialData?.room || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [loading, setLoading] = useState(false);

  // Fetch classes and subjects
  const { data: classes } = useSWR<any[]>('/api/classes', fetcher);
  const { data: subjects } = useSWR<any[]>('/api/subjects', fetcher);

  React.useEffect(() => {
    if (open) {
      if (initialData) {
        // Editing existing assignment - use existing data
        setClassId(initialData.classId?.toString() || '');
        setSubjectId(initialData.subjectId?.toString() || '');
        setRoom(initialData.room || '');
        setNotes(initialData.notes || '');
      } else {
        // New assignment - auto-select if only one option available
        const autoSelectedClassId = (classes && classes.length === 1) ? classes[0].id.toString() : '';
        const autoSelectedSubjectId = (subjects && subjects.length === 1) ? subjects[0].id.toString() : '';
        
        setClassId(autoSelectedClassId);
        setSubjectId(autoSelectedSubjectId);
        setRoom('');
        setNotes('');
      }
    }
  }, [open, initialData, classes, subjects]);

  const handleSave = async () => {
    setLoading(true);
    await onSave({ 
      classId: classId ? parseInt(classId) : undefined,
      subjectId: subjectId ? parseInt(subjectId) : undefined,
      room: room || undefined,
      notes: notes || undefined,
    });
    setLoading(false);
  };

  const handleUnassign = async () => {
    setLoading(true);
    await onSave({ 
      classId: undefined,
      subjectId: undefined,
      room: undefined,
      notes: undefined,
    });
    setLoading(false);
  };

  if (!slot) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Assign Class to Timetable Slot
          </DialogTitle>
          <p className="text-sm text-gray-600">
            {slot.label} - {slot.dayOfWeek} Week {slot.weekNumber} ({slot.startTime}-{slot.endTime})
          </p>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="class" className="text-sm font-medium">Class</Label>
              <Select value={classId} onValueChange={(v) => setClassId(v === 'none' ? '' : v)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {classes?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!classes || classes.length === 0) && (
                <p className="text-sm text-orange-600">No classes available. Create a class first.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-medium">Subject</Label>
              <Select value={subjectId} onValueChange={(v) => setSubjectId(v === 'none' ? '' : v)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {subjects?.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!subjects || subjects.length === 0) && (
                <p className="text-sm text-orange-600">No subjects available. Create a subject first.</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="room" className="text-sm font-medium">Room</Label>
            <Input 
              id="room" 
              value={room} 
              onChange={e => setRoom(e.target.value)} 
              placeholder="Enter room number or location"
              className="h-10"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium">Notes</Label>
            <Input 
              id="notes" 
              value={notes} 
              onChange={e => setNotes(e.target.value)} 
              placeholder="Optional notes for this assignment"
              className="h-10"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} type="button" className="flex-1 sm:flex-none">
            Cancel
          </Button>
          {initialData && (
            <Button variant="outline" onClick={handleUnassign} disabled={loading} type="button" className="flex-1 sm:flex-none text-red-600 border-red-200">
              {loading ? 'Unassigning...' : 'Unassign Class/Subject'}
            </Button>
          )}
          <Button onClick={handleSave} disabled={loading} type="button" className="flex-1 sm:flex-none">
            {loading ? 'Saving...' : 'Assign Class'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Timetable Grid Component
function TimetableGrid({ slots, onEditSlot, onDeleteSlot, onAssignClass, onAssignActivity, onEditActivity, timetableActivities, mutateActivities }: {
  slots: TimetableSlot[];
  onEditSlot: (slot: TimetableSlot) => void;
  onDeleteSlot: (id: number) => void;
  onAssignClass: (slot: TimetableSlot) => void;
  onAssignActivity: (slot: TimetableSlot) => void;
  onEditActivity?: (activity: any) => void;
  timetableActivities?: any[];
  mutateActivities?: () => void;
}) {
  const [currentWeek, setCurrentWeek] = useState(1);
  
  // Safety check to ensure slots is always an array
  const safeSlots = Array.isArray(slots) ? slots : [];
  
  const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Fetch timetable entries (class assignments)
  const { data: timetableEntries } = useSWR<any[]>('/api/timetable', fetcher);
  
  // Debug logging
  console.log('TimetableGrid - timetableActivities:', timetableActivities);
  console.log('TimetableGrid - timetableActivities length:', timetableActivities?.length);
  
  
  // Get timetable entry for a specific slot
  const getTimetableEntry = (slotId: number) => {
    return Array.isArray(timetableEntries) ? timetableEntries.find(entry => entry.timetableSlotId === slotId) : null;
  };
  
  // Get timetable activity for a specific slot
  const getTimetableActivity = (slotId: number) => {
    const activity = Array.isArray(timetableActivities) ? timetableActivities.find(activity => activity.timetableSlotId === slotId) : null;
    console.log(`Looking for activity for slot ${slotId}:`, activity);
    return activity;
  };
  
  
  function getSlotGridPosition(slot: TimetableSlot) {
    const startHour = parseInt(slot.startTime.split(':')[0]);
    const startMinute = parseInt(slot.startTime.split(':')[1]);
    const endHour = parseInt(slot.endTime.split(':')[0]);
    const endMinute = parseInt(slot.endTime.split(':')[1]);
    
    // The grid is divided into 5-minute intervals like the calendar. 1.75rem is for header.
    // Total rows = 24 hours * 12 (5-min intervals) = 288
    const startRow = (startHour * 12 + startMinute / 5) + 2; // +2 to account for header row
    const endRow = (endHour * 12 + endMinute / 5) + 2;
    const duration = Math.max(1, endRow - startRow); // Ensure minimum duration of 1
    
    // Convert day of week to column (Monday = 1, Sunday = 7)
    const dayMap: { [key: string]: number } = {
      'Monday': 1,
      'Tuesday': 2,
      'Wednesday': 3,
      'Thursday': 4,
      'Friday': 5,
      'Saturday': 6,
      'Sunday': 7
    };
    
    const dayColumn = dayMap[slot.dayOfWeek] || 1;
    
    return { startRow, duration, dayColumn };
  }
  
  // Filter slots for current week
  const weekSlots = safeSlots.filter(slot => slot.weekNumber === currentWeek);
  
  // Auto-scroll to 8am
  const scrollToTime = () => {
    const scrollContainer = document.querySelector('.flex-1.overflow-auto.bg-white');
    if (scrollContainer) {
      // Looking at the time labels: 48 rows total = 24 hours
      // So each row represents 30 minutes (24 * 60 / 48 = 30)
      // 8am = 8 hours = 8 * 2 rows per hour = 16 rows
      // Add 1 for the header row
      const targetRow = 16;
      const rowHeight = 5; // rem, matches our updated gridTemplateRows
      const scrollTop = targetRow * rowHeight * 16; // Convert rem to px
      
      scrollContainer.scrollTop = scrollTop;
    }
  };

  // Debug logging
  console.log('Week slots:', weekSlots);
  console.log('Current week:', currentWeek);

  // Auto-scroll to 8 AM when component mounts
  useEffect(() => {
    // Small delay to ensure the grid is rendered
    const timer = setTimeout(() => {
      scrollToTime();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <div className="h-full flex flex-col">
      {/* Week Toggle */}
      <div className="flex justify-center items-center space-x-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentWeek(currentWeek === 1 ? 2 : 1)}
          className="h-9 px-3"
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          Previous Week
        </Button>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-900">Week {currentWeek}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentWeek(currentWeek === 1 ? 2 : 1)}
          className="h-9 px-3"
        >
          Next Week
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
      
      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex w-full flex-none flex-col">
          {/* Header */}
          <div className="sticky top-0 z-30 flex-none bg-white shadow-sm ring-1 ring-black/5 rounded-t-lg">
            <div className="hidden sm:flex">
              <div className="w-16 flex-none" />
              <div className="flex-auto grid grid-cols-7 divide-x divide-gray-100 border-r border-gray-100 text-sm/6 text-gray-500">
                                 {DAYS_OF_WEEK.map((day, index) => (
                   <div key={day} className="flex items-center justify-center py-3">
                     <span className="flex items-baseline">
                       {day}
                     </span>
                   </div>
                 ))}
              </div>
            </div>
          </div>

          {/* Calendar Body */}
          <div className="flex flex-auto">
            <div className="sticky left-0 z-10 w-16 flex-none bg-white border-r-2 border-gray-200" />
            <div className="grid flex-auto grid-cols-1 grid-rows-1">
              {/* Horizontal lines */}
              <div
                className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
                style={{ gridTemplateRows: 'repeat(48, minmax(5rem, 1fr))' }}
              >
                <div className="row-end-1 h-7"></div>
                {Array.from({ length: 48 }).map((_, i) => (
                  <div key={i} style={{ gridRow: `${i + 1} / span 1` }}>
                    <div className="sticky left-0 z-20 -mt-2.5 -ml-16 w-16 pr-2 text-right text-xs/5 text-gray-400">
                      {i % 2 === 0
                        ? i === 0
                          ? '12AM'
                          : i === 24
                          ? '12PM'
                          : i < 24
                          ? `${i / 2}AM`
                          : `${(i - 24) / 2}PM`
                        : ''}
                    </div>
                  </div>
                ))}
              </div>

              {/* Vertical lines */}
              <div className="col-start-1 col-end-2 row-start-1 hidden grid-cols-7 grid-rows-1 divide-x divide-gray-200 sm:grid sm:grid-cols-7">
                <div className="col-start-1 row-span-full border-r border-gray-200" />
                <div className="col-start-2 row-span-full border-r border-gray-200" />
                <div className="col-start-3 row-span-full border-r border-gray-200" />
                <div className="col-start-4 row-span-full border-r border-gray-200" />
                <div className="col-start-5 row-span-full border-r border-gray-200" />
                <div className="col-start-6 row-span-full border-r border-gray-200" />
                <div className="col-start-7 row-span-full" />
              </div>

              {/* Timetable Slots */}
              <ol
                className="col-start-1 col-end-2 row-start-1 grid grid-cols-1 sm:grid-cols-7"
                style={{ gridTemplateRows: '1.75rem repeat(288, minmax(0, 1fr)) auto' }}
              >
                {weekSlots.map((slot) => {
                  const position = getSlotGridPosition(slot);
                  const timetableEntry = getTimetableEntry(slot.id);
                  
                  return (
                    <li 
                      key={slot.id} 
                      className="relative mt-px flex" 
                      style={{ 
                        gridRow: `${position.startRow} / span ${position.duration}`,
                        gridColumn: `${position.dayColumn} / span 1`
                      }}
                    >
                      <div className="group absolute inset-0 flex flex-col text-xs transition-colors bg-white border border-gray-200 shadow-sm hover:shadow-md rounded-md z-10 overflow-hidden px-2">
                        {/* Content */}
                        <div className="flex-1 min-w-0 py-1">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-xs font-medium truncate flex-1">{slot.label}</div>
                            <div className="flex space-x-1 ml-2 flex-shrink-0">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 bg-white/80 hover:bg-white"
                                onClick={e => {
                                  e.stopPropagation();
                                  onAssignClass(slot);
                                }}
                                title="Assign Class"
                              >
                                <Users className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 bg-white/80 hover:bg-white"
                                onClick={e => {
                                  e.stopPropagation();
                                  onAssignActivity(slot);
                                }}
                                title="Assign Activity"
                              >
                                <Briefcase className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 bg-white/80 hover:bg-white"
                                onClick={e => {
                                  e.stopPropagation();
                                  onEditSlot(slot);
                                }}
                                title="Edit Slot"
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-5 w-5 p-0 text-red-600 hover:text-red-700 bg-white/80 hover:bg-white"
                                onClick={e => {
                                  e.stopPropagation();
                                  onDeleteSlot(slot.id);
                                }}
                                title="Delete Slot"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <div className="text-xs text-gray-600 flex items-center mb-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {slot.startTime} - {slot.endTime}
                          </div>
                          
                          {/* Show assigned class/subject if exists */}
                          {timetableEntry && (
                            <div className="space-y-1">
                              {timetableEntry.className && (
                                <div className="flex items-center text-xs">
                                  <Users className="h-3 w-3 mr-1 text-blue-500" />
                                  <span 
                                    className="font-medium"
                                    style={{ color: timetableEntry.classColor || '#3b82f6' }}
                                  >
                                    {timetableEntry.className}
                                  </span>
                                </div>
                              )}
                              {timetableEntry.subjectName && (
                                <div className="flex items-center text-xs">
                                  <BookOpen className="h-3 w-3 mr-1 text-green-500" />
                                  <span 
                                    className="font-medium"
                                    style={{ color: timetableEntry.subjectColor || '#10b981' }}
                                  >
                                    {timetableEntry.subjectName}
                                  </span>
                                </div>
                              )}
                              {timetableEntry.room && (
                                <div className="flex items-center text-xs text-gray-500">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  <span>{timetableEntry.room}</span>
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Show assigned activity if exists */}
                          {(() => {
                            const activity = getTimetableActivity(slot.id);
                            return activity ? (
                              <div 
                                className="space-y-1 cursor-pointer hover:bg-gray-50 rounded p-1 -m-1 transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onEditActivity) {
                                    onEditActivity(activity);
                                  }
                                }}
                                title="Click to edit or delete"
                              >
                                <div className="flex items-center text-xs">
                                  <Briefcase className="h-3 w-3 mr-1 text-purple-500" />
                                  <span 
                                    className="font-medium"
                                    style={{ color: activity.color || '#8b5cf6' }}
                                  >
                                    {activity.title}
                                  </span>
                                </div>
                                {activity.activityType && (
                                  <div className="text-xs text-gray-500 capitalize">
                                    {activity.activityType.replace('_', ' ')}
                                  </div>
                                )}
                                {activity.location && (
                                  <div className="flex items-center text-xs text-gray-500">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    <span>{activity.location}</span>
                                  </div>
                                )}
                                {activity.description && (
                                  <div className="text-xs text-gray-600 truncate">
                                    {activity.description}
                                  </div>
                                )}
                              </div>
                            ) : null;
                          })()}
                          
                          {/* Show "No assignment" if no class or activity assigned */}
                          {!timetableEntry && !getTimetableActivity(slot.id) && (
                            <div className="text-xs text-gray-400 italic">
                              Click Users icon to assign a class or Briefcase icon for activities
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TimetableSetupPage() {
  const { data: timetableSlots, error, mutate, isLoading } = useSWR<TimetableSlot[]>('/api/timetable-slots', fetcher);
  const { data: timetableEntries, mutate: mutateTimetableEntries } = useSWR<any[]>('/api/timetable', fetcher);
  const { data: timetableActivities, error: activitiesError, mutate: mutateTimetableActivities } = useSWR<any[]>('/api/timetable-activities', fetcher);
  
  // Debug logging
  console.log('TimetableSetupPage - timetableActivities:', timetableActivities);
  console.log('TimetableSetupPage - timetableActivities type:', typeof timetableActivities);
  console.log('TimetableSetupPage - timetableActivities isArray:', Array.isArray(timetableActivities));
  console.log('TimetableSetupPage - timetableActivities length:', timetableActivities?.length);
  console.log('TimetableSetupPage - activitiesError:', activitiesError);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'view' | 'edit'>('add');
  const [selectedSlot, setSelectedSlot] = useState<TimetableSlot | null>(null);
  
  // Class assignment modal state
  const [classAssignmentModalOpen, setClassAssignmentModalOpen] = useState(false);
  const [assignmentSlot, setAssignmentSlot] = useState<TimetableSlot | null>(null);

  // Slot deletion modal state
  const [slotDeletionModalOpen, setSlotDeletionModalOpen] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState<TimetableSlot | null>(null);
  const [slotDependencies, setSlotDependencies] = useState<any>(null);
  const [isDeletingSlot, setIsDeletingSlot] = useState(false);

  // Activity assignment modal state
  const [activityModalOpen, setActivityModalOpen] = useState(false);
  const [activityModalMode, setActivityModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [selectedSlotForActivity, setSelectedSlotForActivity] = useState<TimetableSlot | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<any>(null);

  // Handlers
  const handleAddSlot = () => {
    setModalMode('add');
    setSelectedSlot(null);
    setModalOpen(true);
  };

  const handleViewSlot = (slot: TimetableSlot) => {
    setModalMode('view');
    setSelectedSlot(slot);
    setModalOpen(true);
  };

  const handleEditSlot = (slot: TimetableSlot) => {
    setModalMode('edit');
    setSelectedSlot(slot);
    setModalOpen(true);
  };

  const handleSaveSlot = async (data: { dayOfWeek: string; weekNumber: number; startTime: string; endTime: string; label: string }) => {
    if (modalMode === 'edit' && selectedSlot) {
      const response = await fetch('/api/timetable-slots', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSlot.id,
          ...data,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update timetable slot');
      }
      
      mutate();
    } else {
      const response = await fetch('/api/timetable-slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        // Conflicts are now handled in the modal with warnings
        throw new Error(errorData.error || 'Failed to create timetable slot');
      }
      
      mutate();
    }
  };

  const handleDeleteSlot = async (id: number) => {
    const slot = timetableSlots?.find(s => s.id === id);
    if (!slot) return;

    setSlotToDelete(slot);
    setSlotDependencies(null);
    setIsDeletingSlot(false);

    // First, check for dependencies
    try {
      const response = await fetch(`/api/timetable-slots?id=${id}`, {
        method: 'DELETE',
      });

      if (response.status === 409) {
        // Has dependencies, show detailed confirmation
        const data = await response.json();
        setSlotDependencies(data.dependencies);
        setSlotDeletionModalOpen(true);
      } else if (response.ok) {
        // No dependencies, proceed with deletion
        mutate();
        mutateTimetableEntries();
      } else {
        console.error('Error checking slot dependencies:', await response.text());
      }
    } catch (error) {
      console.error('Error checking slot dependencies:', error);
    }
  };

  const handleConfirmSlotDeletion = async () => {
    if (!slotToDelete) return;

    setIsDeletingSlot(true);
    try {
      await fetch(`/api/timetable-slots?id=${slotToDelete.id}&force=true`, {
        method: 'DELETE',
      });
      mutate();
      mutateTimetableEntries();
      setSlotDeletionModalOpen(false);
      setSlotToDelete(null);
      setSlotDependencies(null);
    } catch (error) {
      console.error('Error deleting slot:', error);
    } finally {
      setIsDeletingSlot(false);
    }
  };

  const handleAssignClass = (slot: TimetableSlot) => {
    setAssignmentSlot(slot);
    setClassAssignmentModalOpen(true);
  };

  const handleAssignActivity = (slot: TimetableSlot) => {
    setSelectedSlotForActivity(slot);
    setActivityModalMode('add');
    setSelectedActivity(null);
    setActivityModalOpen(true);
  };

  const handleEditActivity = (activity: any) => {
    // Find the slot for this activity
    const slot = timetableSlots?.find(s => s.id === activity.timetableSlotId);
    setSelectedSlotForActivity(slot || null);
    setActivityModalMode('edit');
    setSelectedActivity(activity);
    setActivityModalOpen(true);
  };

  const handleSaveActivity = async (data: any) => {
    try {
      if (!selectedSlotForActivity && !selectedActivity) return;

      const isEditing = activityModalMode === 'edit' && selectedActivity?.id;
      const url = isEditing ? '/api/timetable-activities' : '/api/timetable-activities';
      const method = isEditing ? 'PUT' : 'POST';

      // Prepare the request body
      const requestBody: any = {
        ...data,
      };

      if (isEditing) {
        // For editing, include the ID
        requestBody.id = selectedActivity.id;
        // Don't override timetableSlotId if it's already in data (from modal)
        if (!requestBody.timetableSlotId) {
          requestBody.timetableSlotId = selectedActivity.timetableSlotId;
        }
        // Don't send userId for updates - API gets it from session
      } else {
        // For creating, include timetableSlotId
        requestBody.timetableSlotId = selectedSlotForActivity?.id || selectedActivity?.timetableSlotId;
        // Don't send userId for creates - API gets it from session
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to ${isEditing ? 'update' : 'create'} activity`;
        throw new Error(errorMessage);
      }

      // Refresh data
      mutateTimetableActivities();
      setActivityModalOpen(false);
      setSelectedActivity(null);
      setSelectedSlotForActivity(null);
    } catch (error) {
      console.error('Error saving activity:', error);
      alert(`Error ${activityModalMode === 'edit' ? 'updating' : 'creating'} activity. Please try again.`);
    }
  };

  const handleDeleteActivity = async (id: number) => {
    try {
      const response = await fetch(`/api/timetable-activities?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete activity');
      }

      // Refresh data
      mutateTimetableActivities();
      setActivityModalOpen(false);
      setSelectedActivity(null);
      setSelectedSlotForActivity(null);
    } catch (error) {
      console.error('Error deleting activity:', error);
      throw error; // Re-throw so modal can handle it
    }
  };

  const handleSaveClassAssignment = async (data: { classId?: number; subjectId?: number; room?: string; notes?: string }) => {
    try {
      if (!assignmentSlot) return;

      // Check if there's already an entry for this slot
      const existingEntry = timetableEntries?.find(entry => entry.timetableSlotId === assignmentSlot.id);

      // If both class and subject are being cleared, delete the entry entirely
      const isUnassigning = data.classId === undefined && data.subjectId === undefined && !data.room && !data.notes;

      if (existingEntry) {
        if (isUnassigning) {
          await fetch(`/api/timetable?id=${existingEntry.id}`, {
            method: 'DELETE',
          });
        } else {
          // Update existing entry
          await fetch('/api/timetable', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: existingEntry.id,
              ...data,
            }),
          });
        }
      } else {
        // Create new entry
        await fetch('/api/timetable', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            timetableSlotId: assignmentSlot.id,
            ...data,
          }),
        });
      }

      setClassAssignmentModalOpen(false);
      mutateTimetableEntries();
    } catch (error) {
      console.error('Error saving class assignment:', error);
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Timetable</h3>
          <p className="text-gray-600 mb-4">There was a problem loading your timetable slots. Please try again.</p>
          <Button onClick={() => mutate()}>Retry</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Timetable...</h3>
          <p className="text-gray-600">Please wait while we load your timetable data.</p>
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
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
                  <p className="text-gray-600">Set up your weekly timetable structure and time slots</p>
                </div>
              </div>
            </div>
            <Button onClick={handleAddSlot} className="h-10 px-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Slot
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        

        {/* Timetable Grid */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="h-[600px]">
            {error ? (
              <div className="flex items-center justify-center h-full border-2 border-dashed border-red-300 rounded-lg bg-red-50">
                <div className="text-center">
                  <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <Calendar className="h-10 w-10 text-red-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-red-900 mb-3">
                    {(error as any)?.status === 401 ? 'Session Expired' : 'Error Loading Timetable Slots'}
                  </h3>
                  <p className="text-red-600 mb-6 max-w-md mx-auto">
                    {(error as any)?.status === 401 
                      ? 'Your session has expired. Please sign in again to continue.'
                      : error.message || 'There was an error loading your timetable slots. Please refresh the page or try again later.'}
                  </p>
                  {(error as any)?.status === 401 ? (
                    <Button 
                      onClick={() => window.location.href = '/sign-in'} 
                      size="lg" 
                      className="h-11 px-6"
                    >
                      Sign In
                    </Button>
                  ) : (
                    <Button onClick={() => mutate()} size="lg" className="h-11 px-6">
                      Retry
                    </Button>
                  )}
                </div>
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                    <Calendar className="h-10 w-10 text-gray-400" />
                  </div>
                  <p className="text-gray-600">Loading timetable slots...</p>
                </div>
              </div>
            ) : timetableSlots && Array.isArray(timetableSlots) && timetableSlots.length > 0 ? (
              <TimetableGrid
                slots={timetableSlots}
                onEditSlot={handleEditSlot}
                onDeleteSlot={handleDeleteSlot}
                onAssignClass={handleAssignClass}
                onAssignActivity={handleAssignActivity}
                onEditActivity={handleEditActivity}
                timetableActivities={timetableActivities}
                mutateActivities={mutateTimetableActivities}
              />
            ) : (
              <div className="flex items-center justify-center h-full border-2 border-dashed border-gray-300 rounded-lg">
                <div className="text-center">
                  <div className="mx-auto w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <Calendar className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">No timetable slots yet</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Get started by creating your first timetable slot. You can set specific times, days, and weeks to build your schedule.
                  </p>
                  <Button onClick={handleAddSlot} size="lg" className="h-11 px-6">
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Slot
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timetable Slot Modal (multi-day/week capable) */}
      <MultiDayTimetableSlotModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        slot={modalMode === 'edit' || modalMode === 'view' ? selectedSlot : null}
        onSave={handleSaveSlot}
        onDelete={async (id: number) => handleDeleteSlot(id)}
      />

      {/* Class Assignment Modal */}
      <ClassAssignmentModal
        open={classAssignmentModalOpen}
        onClose={() => setClassAssignmentModalOpen(false)}
        onSave={handleSaveClassAssignment}
        slot={assignmentSlot}
        initialData={assignmentSlot ? timetableEntries?.find(entry => entry.timetableSlotId === assignmentSlot.id) : undefined}
      />

      {/* Slot Deletion Modal */}
      <SlotDeletionModal
        isOpen={slotDeletionModalOpen}
        onClose={() => {
          setSlotDeletionModalOpen(false);
          setSlotToDelete(null);
          setSlotDependencies(null);
        }}
        onConfirm={handleConfirmSlotDeletion}
        slot={slotToDelete}
        dependencies={slotDependencies}
        isLoading={isDeletingSlot}
      />

      {/* Activity Assignment Modal */}
      <TimetableActivityModal
        open={activityModalOpen}
        onClose={() => {
          setActivityModalOpen(false);
          setSelectedActivity(null);
          setSelectedSlotForActivity(null);
        }}
        onSave={handleSaveActivity}
        onDelete={handleDeleteActivity}
        mode={activityModalMode}
        initialData={selectedActivity}
        slotData={selectedSlotForActivity ? {
          dayOfWeek: selectedSlotForActivity.dayOfWeek,
          weekNumber: selectedSlotForActivity.weekNumber,
          startTime: selectedSlotForActivity.startTime,
          endTime: selectedSlotForActivity.endTime,
          label: selectedSlotForActivity.label,
        } : undefined}
      />
    </div>
  );
} 