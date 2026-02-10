'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from '@/components/ui/color-picker';
import useSWR from 'swr';
import { useAcademicCalendar } from '@/lib/hooks/useAcademicCalendar';
import { getLocalizedTerm } from '@/lib/utils/localization';
import { User } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());


interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lesson: any) => Promise<void>;
  onDelete?: (lesson: any) => Promise<void>;
  mode: 'add' | 'edit';
  initialData?: any;
  isUnfinished?: boolean; // Indicates if this is an unfinished lesson from timetable
}

export function LessonModal({ isOpen, onClose, onSave, onDelete, mode, initialData, isUnfinished }: LessonModalProps) {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const timetableSlotLabel = getLocalizedTerm(user?.location, 'timetableSlot');
  
  const [formData, setFormData] = useState({
    title: '',
    classId: '',
    subjectId: '',
    timetableSlotIds: [] as string[],
    date: '',
    lessonPlan: '',
    color: '#000000', // Added color field
    planCompleted: false, // Track completion status
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch data for dropdowns and user info
  const { data: classes } = useSWR<any[]>('/api/classes', fetcher);
  const { data: subjects } = useSWR<any[]>('/api/subjects', fetcher);
  const { data: timetableSlots } = useSWR<any[]>('/api/timetable-slots', fetcher);
  const { data: timetableEntries } = useSWR<any[]>('/api/timetable', fetcher);
  const { data: userData } = useSWR<any>('/api/user', fetcher);
  const { data: lessons } = useSWR<any[]>('/api/lessons', fetcher);
  
  // Academic calendar hook for week number calculation
  const { getWeekNumberForDate } = useAcademicCalendar();

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      // If initialData exists (whether in edit or add mode), use it to populate the form
      const hasInitialData = initialData && (
        initialData.title || 
        initialData.classId || 
        initialData.subjectId || 
        initialData.date || 
        (initialData.timetableSlotIds && initialData.timetableSlotIds.length > 0) ||
        mode === 'edit' // Always use initialData in edit mode
      );
      
      if (hasInitialData) {
        // Ensure timetableSlotIds is an array of strings
        const slotIds = initialData.timetableSlotIds 
          ? (Array.isArray(initialData.timetableSlotIds) 
              ? initialData.timetableSlotIds.map((id: any) => id.toString()).filter((id: string) => id)
              : [initialData.timetableSlotIds.toString()].filter((id: string) => id))
          : [];
        
        const newFormData = {
          title: initialData.title || '',
          classId: initialData.classId?.toString() || '',
          subjectId: initialData.subjectId?.toString() || '',
          timetableSlotIds: slotIds,
          date: initialData.date || '',
          lessonPlan: initialData.lessonPlan || '',
          color: initialData.color || '#000000',
          planCompleted: initialData.planCompleted !== undefined ? initialData.planCompleted : false,
        };
        setFormData(newFormData);
        setErrors({}); // Clear errors when setting new form data
      } else {
        // For add mode with no initialData, auto-select if only one option available
        const autoSelectedClassId = (Array.isArray(classes) && classes.length === 1) ? classes[0].id.toString() : '';
        const autoSelectedSubjectId = (Array.isArray(subjects) && subjects.length === 1) ? subjects[0].id.toString() : '';
        
        setFormData({
          title: '',
          classId: autoSelectedClassId,
          subjectId: autoSelectedSubjectId,
          timetableSlotIds: [],
          date: '',
          lessonPlan: '',
          color: '#000000', // Default color for new lessons
          planCompleted: false,
        });
        setErrors({});
      }
    }
  }, [isOpen, initialData, mode, classes, subjects]);
  
  // Separate effect to ensure timetableSlotIds are set if they exist in initialData
  useEffect(() => {
    if (isOpen && initialData?.timetableSlotIds && initialData.timetableSlotIds.length > 0) {
      const slotIds = Array.isArray(initialData.timetableSlotIds) 
        ? initialData.timetableSlotIds.map((id: any) => id.toString())
        : [initialData.timetableSlotIds.toString()];
      
      // Only update if formData doesn't have the slot IDs
      if (formData.timetableSlotIds.length === 0 || 
          !formData.timetableSlotIds.every(id => slotIds.includes(id.toString()))) {
        setFormData(prev => ({
          ...prev,
          timetableSlotIds: slotIds
        }));
      }
    }
  }, [isOpen, initialData?.timetableSlotIds]);

  // Clear timetable slots when date changes (but not in edit mode)
  useEffect(() => {
    if (formData.date && mode === 'add') {
      setFormData(prev => ({ ...prev, timetableSlotIds: [] }));
    }
  }, [formData.date, mode]);

  // Auto-populate class/subject when timetable slots are selected
  useEffect(() => {
    if (formData.date && formData.timetableSlotIds.length > 0 && timetableEntries) {
      const selectedDate = new Date(formData.date);
      const dayOfWeek = selectedDate.toLocaleDateString('en-GB', { weekday: 'long' });
      
      // Find timetable entries for the selected slots and day
      const matchingEntries = timetableEntries.filter(entry => 
        formData.timetableSlotIds.includes(entry.timetableSlotId.toString()) &&
        entry.dayOfWeek === dayOfWeek
      );
      
      if (matchingEntries.length > 0) {
        // Use the first matching entry for auto-selection
        const firstEntry = matchingEntries[0];
        setFormData(prev => ({
          ...prev,
          classId: firstEntry.classId?.toString() || prev.classId,
          subjectId: firstEntry.subjectId?.toString() || prev.subjectId,
        }));
      }
    }
  }, [formData.date, formData.timetableSlotIds, timetableEntries]);

  // Auto-assign color based on teacher type and selected class/subject
  useEffect(() => {
    if (userData && formData.classId && formData.subjectId && classes && subjects) {
      let autoColor = '#000000'; // Default fallback
      
      if (userData.colorPreference === 'subject') {
        // Use subject color
        const selectedSubject = Array.isArray(subjects) ? subjects.find(s => s.id === parseInt(formData.subjectId)) : null;
        if (selectedSubject?.color) {
          autoColor = selectedSubject.color;
        }
      } else if (userData.colorPreference === 'class') {
        // Use class color
        const selectedClass = Array.isArray(classes) ? classes.find(c => c.id === parseInt(formData.classId)) : null;
        if (selectedClass?.color) {
          autoColor = selectedClass.color;
        }
      }
      
      setFormData(prev => ({
        ...prev,
        color: autoColor
      }));
    }
  }, [userData, formData.classId, formData.subjectId, classes, subjects]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.date) {
      newErrors.date = 'Date is required';
    }
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!formData.classId) {
      newErrors.classId = 'Class is required';
    }
    if (!formData.subjectId) {
      newErrors.subjectId = 'Subject is required';
    }
    // Only validate timetableSlotIds if they're not already provided in initialData (read-only mode)
    // If initialData has timetableSlotIds, they're pre-filled and read-only, so skip validation
    const hasPreFilledSlots = (initialData?.timetableSlotIds && initialData.timetableSlotIds.length > 0) ||
                               (formData.timetableSlotIds && formData.timetableSlotIds.length > 0);
    if (!hasPreFilledSlots) {
      newErrors.timetableSlotIds = `At least one ${timetableSlotLabel.toLowerCase()} is required`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (e && 'preventDefault' in e) {
      e.preventDefault();
    }
    
    const isValid = validateForm();
    
    if (!isValid) {
      return;
    }

    // Check if we have the required data
    if (!Array.isArray(classes) || classes.length === 0) {
      alert('No classes available. Please create a class first.');
      return;
    }
    if (!Array.isArray(subjects) || subjects.length === 0) {
      alert('No subjects available. Please create a subject first.');
      return;
    }
    if (!Array.isArray(timetableSlots) || timetableSlots.length === 0) {
      alert(`No ${timetableSlotLabel.toLowerCase()}s available. Please create a ${timetableSlotLabel.toLowerCase()} first.`);
      return;
    }

    setIsLoading(true);
    try {
      // Use planCompleted from formData (checkbox value)
      const finalPlanCompleted = formData.planCompleted || false;
      
      // Ensure timetableSlotIds are included - use initialData as fallback if formData doesn't have them
      const finalTimetableSlotIds = formData.timetableSlotIds && formData.timetableSlotIds.length > 0
        ? formData.timetableSlotIds
        : (initialData?.timetableSlotIds 
            ? (Array.isArray(initialData.timetableSlotIds) 
                ? initialData.timetableSlotIds.map((id: any) => id.toString()).filter((id: string) => id)
                : [initialData.timetableSlotIds.toString()].filter((id: string) => id))
            : []);
      
      const dataToSave = { 
        ...formData, 
        timetableSlotIds: finalTimetableSlotIds,
        planCompleted: finalPlanCompleted 
      };
      
      // Double-check that timetableSlotIds are present for unfinished lessons
      if (isUnfinished && (!dataToSave.timetableSlotIds || dataToSave.timetableSlotIds.length === 0)) {
        alert(`Error: ${timetableSlotLabel} information is missing. Please try again.`);
        setIsLoading(false);
        return;
      }
      
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      // Show error to user
      if (error instanceof Error) {
        alert(`Error creating lesson: ${error.message}`);
      } else {
        alert('Error creating lesson. Please check the console for details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    if (confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        await onDelete(initialData);
        onClose();
      } catch (error) {
        alert('Error deleting lesson. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Get available timetable slots based on selected date
  const getAvailableTimetableSlots = () => {
    if (!Array.isArray(timetableSlots) || !formData.date) return [];
    
    const selectedDate = new Date(formData.date);
    const dayOfWeek = selectedDate.toLocaleDateString('en-GB', { weekday: 'long' });
    const weekNumber = getWeekNumberForDate(selectedDate);
    
    // Filter slots that match the selected day of the week and week number
    // This applies to both add and edit modes to show only relevant slots for the selected date
    const availableSlots = timetableSlots.filter(slot => 
      slot.dayOfWeek === dayOfWeek && 
      slot.weekNumber === weekNumber
    );
    
    return availableSlots;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {isUnfinished ? 'Complete Lesson Plan' : (mode === 'add' ? 'Add New Lesson' : 'Edit Lesson')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-1">
          <form id="lesson-form" onSubmit={handleSubmit} className="space-y-4">
          {(!Array.isArray(classes) || classes.length === 0 || !Array.isArray(subjects) || subjects.length === 0 || !Array.isArray(timetableSlots) || timetableSlots.length === 0) && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Setup Required:</strong> You need to create classes, subjects, and {timetableSlotLabel.toLowerCase()}s before you can create lessons.
              </p>
            </div>
          )}
          
          {/* Date - show as text if read-only, otherwise as form field */}
          <div>
            <Label>{initialData?.date ? 'Date' : 'Date *'}</Label>
            {initialData?.date ? (
              <div className="py-2">
                <p className="text-sm text-gray-900">
                  {new Date(initialData.date).toLocaleDateString('en-GB', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            ) : (
              <>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className={errors.date ? 'border-red-500' : ''}
                  required
                />
                {errors.date && <p className="text-sm text-red-500 mt-1">{errors.date}</p>}
                <p className="text-xs text-gray-500 mt-1">Select the date for this lesson to see available time slots</p>
              </>
            )}
          </div>

          {/* Time Slots - show as text if read-only, otherwise as form field */}
          <div>
            <Label>{(initialData?.timetableSlotIds && initialData.timetableSlotIds.length > 0) ? 'Time Slots' : 'Time Slots *'}</Label>
            {(() => {
              // Check if read-only (has initialData with timetableSlotIds)
              const isReadOnly = initialData?.timetableSlotIds && initialData.timetableSlotIds.length > 0;
              const slotIdsToUse = isReadOnly
                ? initialData.timetableSlotIds.map((id: any) => id.toString())
                : formData.timetableSlotIds;
              
              // Get all timetable slots to find selected slots
              const allSlots = Array.isArray(timetableSlots) ? timetableSlots : [];
              
              // Find selected slots from all slots
              const selectedSlots = allSlots.filter(slot => {
                const slotIdStr = slot.id.toString();
                return slotIdsToUse.some((id: string) => id.toString() === slotIdStr);
              });
              
              // If read-only, show as plain text
              if (isReadOnly && selectedSlots.length > 0) {
                return (
                  <div className="py-2 space-y-1">
                    {selectedSlots.map((slot) => {
                      const slotEntry = timetableEntries?.find(entry => 
                        entry.timetableSlotId === slot.id &&
                        entry.dayOfWeek === new Date(initialData.date || formData.date).toLocaleDateString('en-GB', { weekday: 'long' })
                      );
                      const className = slotEntry && Array.isArray(classes)
                        ? classes.find(c => c.id === slotEntry.classId)?.name 
                        : null;
                      
                      return (
                        <p key={slot.id} className="text-sm text-gray-900">
                          <span className="font-medium">W{slot.weekNumber}</span> - {slot.label} ({slot.startTime} - {slot.endTime})
                          {className && <span className="ml-2 font-medium text-gray-600">- {className}</span>}
                        </p>
                      );
                    })}
                  </div>
                );
              }
              
              // Editable time slots section
              if (!formData.date) {
                return (
                  <div className="border rounded-md p-3 bg-gray-50">
                    <p className="text-sm text-gray-500">Select a date first</p>
                  </div>
                );
              }
              
              // If timetableSlots haven't loaded yet but we have slot IDs, show a loading state
              if (allSlots.length === 0 && slotIdsToUse.length > 0) {
                return (
                  <div className="border rounded-md p-3 bg-gray-50">
                    <p className="text-sm text-gray-500">Loading time slot information...</p>
                  </div>
                );
              }
              
              // Show selected slot(s) if they exist (editable)
              if (selectedSlots.length > 0) {
                const availableSlots = getAvailableTimetableSlots();
                const unselectedSlots = availableSlots.filter(slot => 
                  !formData.timetableSlotIds.includes(slot.id.toString())
                );
                
                return (
                  <div className="space-y-2">
                    <div className="border rounded-md p-3 bg-white">
                      <p className="text-xs text-gray-600 mb-2 font-medium">Selected slots:</p>
                      {selectedSlots.map((slot) => {
                        const slotEntry = timetableEntries?.find(entry => 
                          entry.timetableSlotId === slot.id &&
                          entry.dayOfWeek === new Date(formData.date).toLocaleDateString('en-GB', { weekday: 'long' })
                        );
                      const className = slotEntry && Array.isArray(classes)
                          ? classes.find(c => c.id === slotEntry.classId)?.name 
                          : null;
                        
                        return (
                          <div key={slot.id} className="flex items-center justify-between py-1">
                            <span className="text-sm text-gray-900">
                              <span className="font-medium">W{slot.weekNumber}</span> - {slot.label} ({slot.startTime} - {slot.endTime})
                              {className && <span className="ml-2 font-medium text-gray-600">- {className}</span>}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  timetableSlotIds: prev.timetableSlotIds.filter((id: string) => id !== slot.id.toString())
                                }));
                              }}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                    {unselectedSlots.length > 0 && (
                      <Select
                        value=""
                        onValueChange={(value) => {
                          if (value && !formData.timetableSlotIds.includes(value)) {
                            setFormData(prev => ({
                              ...prev,
                              timetableSlotIds: [...prev.timetableSlotIds, value]
                            }));
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Add another time slot" />
                        </SelectTrigger>
                        <SelectContent>
                          {unselectedSlots.map((slot) => {
                            const slotEntry = timetableEntries?.find(entry => 
                              entry.timetableSlotId === slot.id &&
                              entry.dayOfWeek === new Date(formData.date).toLocaleDateString('en-GB', { weekday: 'long' })
                            );
                      const className = slotEntry && Array.isArray(classes)
                              ? classes.find(c => c.id === slotEntry.classId)?.name 
                              : null;
                            const subjectName = slotEntry && Array.isArray(subjects)
                              ? subjects.find(s => s.id === slotEntry.subjectId)?.name
                              : null;
                            
                            return (
                              <SelectItem key={slot.id} value={slot.id.toString()}>
                                <span>
                                  <span className="font-medium">W{slot.weekNumber}</span> - {slot.label} ({slot.startTime} - {slot.endTime})
                                  {className && <span className="ml-2 text-gray-600">- {className}</span>}
                                  {subjectName && <span className="ml-2 text-gray-500">({subjectName})</span>}
                                </span>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                );
              }
              
              // If no slot selected, show slot picker
              const availableSlots = getAvailableTimetableSlots();
              
              if (availableSlots.length === 0) {
                return (
                  <div className="border rounded-md p-3 bg-gray-50">
                    <p className="text-sm text-gray-500">No {timetableSlotLabel.toLowerCase()}s available for this date. Please create {timetableSlotLabel.toLowerCase()}s first or select a different date.</p>
                  </div>
                );
              }
              
              return (
                <div className="space-y-2">
                  <Select
                    value=""
                    onValueChange={(value) => {
                      if (value && !formData.timetableSlotIds.includes(value)) {
                        setFormData(prev => ({
                          ...prev,
                          timetableSlotIds: [...prev.timetableSlotIds, value]
                        }));
                      }
                    }}
                  >
                    <SelectTrigger className={errors.timetableSlotIds ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select a time slot from your timetable" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSlots.map((slot) => {
                        const slotEntry = timetableEntries?.find(entry => 
                          entry.timetableSlotId === slot.id &&
                          entry.dayOfWeek === new Date(formData.date).toLocaleDateString('en-GB', { weekday: 'long' })
                        );
                      const className = slotEntry && Array.isArray(classes)
                          ? classes.find(c => c.id === slotEntry.classId)?.name 
                          : null;
                        const subjectName = slotEntry && subjects
                          ? subjects.find(s => s.id === slotEntry.subjectId)?.name
                          : null;
                        
                        const isSelected = formData.timetableSlotIds.includes(slot.id.toString());
                        
                        return (
                          <SelectItem 
                            key={slot.id} 
                            value={slot.id.toString()}
                            disabled={isSelected}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span>
                                <span className="font-medium">W{slot.weekNumber}</span> - {slot.label} ({slot.startTime} - {slot.endTime})
                                {className && <span className="ml-2 text-gray-600">- {className}</span>}
                                {subjectName && <span className="ml-2 text-gray-500">({subjectName})</span>}
                              </span>
                              {isSelected && <span className="ml-2 text-xs text-green-600">✓ Selected</span>}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {formData.timetableSlotIds.length > 0 && (
                    <div className="border rounded-md p-3 bg-white mt-2">
                      <p className="text-xs text-gray-600 mb-2 font-medium">Selected slots:</p>
                      {formData.timetableSlotIds.map((slotId) => {
                        const slot = availableSlots.find(s => s.id.toString() === slotId);
                        if (!slot) return null;
                        const slotEntry = timetableEntries?.find(entry => 
                          entry.timetableSlotId === slot.id &&
                          entry.dayOfWeek === new Date(formData.date).toLocaleDateString('en-GB', { weekday: 'long' })
                        );
                      const className = slotEntry && Array.isArray(classes)
                          ? classes.find(c => c.id === slotEntry.classId)?.name 
                          : null;
                        
                        return (
                          <div key={slotId} className="flex items-center justify-between py-1">
                            <span className="text-sm text-gray-900">
                              <span className="font-medium">W{slot.weekNumber}</span> - {slot.label} ({slot.startTime} - {slot.endTime})
                              {className && <span className="ml-2 font-medium text-gray-600">- {className}</span>}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({
                                  ...prev,
                                  timetableSlotIds: prev.timetableSlotIds.filter((id: string) => id !== slotId)
                                }));
                              }}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })()}
            {errors.timetableSlotIds && <p className="text-sm text-red-500 mt-1">{errors.timetableSlotIds}</p>}
          </div>

          {/* Class and Subject - show as text if read-only, otherwise as form fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>{initialData?.classId ? 'Class' : 'Class *'}</Label>
              {initialData?.classId ? (
                <div className="py-2">
                  <p className="text-sm text-gray-900">
                    {Array.isArray(classes) ? classes.find(c => c.id.toString() === initialData.classId?.toString())?.name || 'Unknown' : 'Unknown'}
                  </p>
                </div>
              ) : (
                <>
                  <Select
                    value={formData.classId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, classId: value }))}
                  >
                    <SelectTrigger className={errors.classId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(classes) && classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.classId && <p className="text-sm text-red-500 mt-1">{errors.classId}</p>}
                  {(!Array.isArray(classes) || classes.length === 0) && (
                    <p className="text-sm text-orange-600 mt-1">No classes available. Create a class first.</p>
                  )}
                </>
              )}
            </div>

            <div>
              <Label>{initialData?.subjectId ? 'Subject' : 'Subject *'}</Label>
              {initialData?.subjectId ? (
                <div className="py-2">
                  <p className="text-sm text-gray-900">
                    {Array.isArray(subjects) ? subjects.find(s => s.id.toString() === initialData.subjectId?.toString())?.name || 'Unknown' : 'Unknown'}
                  </p>
                </div>
              ) : (
                <>
                  <Select
                    value={formData.subjectId}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, subjectId: value }))}
                  >
                    <SelectTrigger className={errors.subjectId ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select a subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(subjects) && subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id.toString()}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.subjectId && <p className="text-sm text-red-500 mt-1">{errors.subjectId}</p>}
                  {(!Array.isArray(subjects) || subjects.length === 0) && (
                    <p className="text-sm text-orange-600 mt-1">No subjects available. Create a subject first.</p>
                  )}
                </>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="title">Lesson Title *</Label>
            <Input
              id="title"
              placeholder="Enter lesson title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className={errors.title ? 'border-red-500' : ''}
              required
            />
            {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title}</p>}
          </div>

          <div>
            <Label htmlFor="lessonPlan">Lesson Plan</Label>
            <Textarea
              id="lessonPlan"
              placeholder="Enter your lesson plan details..."
              value={formData.lessonPlan}
              onChange={(e) => setFormData(prev => ({ ...prev, lessonPlan: e.target.value }))}
              rows={4}
            />
          </div>

          {/* Mark plan as completed checkbox - always available */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="planCompleted"
              checked={formData.planCompleted || false}
              onChange={(e) => setFormData(prev => ({ ...prev, planCompleted: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="planCompleted" className="!mb-0 cursor-pointer">
              Mark plan as completed
            </Label>
          </div>

          <div>
            <Label htmlFor="color">Lesson Color</Label>
            <ColorPicker
              value={formData.color}
              onChange={(color) => setFormData(prev => ({ ...prev, color: color }))}
            />
          </div>

          </form>
        </div>
        
        <DialogFooter className="flex-shrink-0 mt-4">
          <div className="flex justify-between w-full">
            <div>
              {mode === 'edit' && onDelete && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDelete} 
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete Lesson'}
                </Button>
              )}
            </div>
            <div className="flex space-x-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} form="lesson-form">
                {isLoading ? 'Saving...' : (isUnfinished ? 'Save Plan' : (mode === 'add' ? 'Create Lesson' : 'Update Lesson'))}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 