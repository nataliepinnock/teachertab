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

const fetcher = (url: string) => fetch(url).then((res) => res.json());


interface LessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (lesson: any) => Promise<void>;
  onDelete?: (lesson: any) => Promise<void>;
  mode: 'add' | 'edit';
  initialData?: any;
}

export function LessonModal({ isOpen, onClose, onSave, onDelete, mode, initialData }: LessonModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    classId: '',
    subjectId: '',
    timetableSlotIds: [] as string[],
    date: '',
    lessonPlan: '',
    color: '#000000', // Added color field
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch data for dropdowns and user info
  const { data: classes } = useSWR<any[]>('/api/classes', fetcher);
  const { data: subjects } = useSWR<any[]>('/api/subjects', fetcher);
  const { data: timetableSlots } = useSWR<any[]>('/api/timetable-slots', fetcher);
  const { data: timetableEntries } = useSWR<any[]>('/api/timetable', fetcher);
  const { data: userData } = useSWR<any>('/api/user', fetcher);
  
  // Academic calendar hook for week number calculation
  const { getWeekNumberForDate } = useAcademicCalendar();

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData && mode === 'edit') {
        const newFormData = {
          title: initialData.title || '',
          classId: initialData.classId?.toString() || '',
          subjectId: initialData.subjectId?.toString() || '',
          timetableSlotIds: initialData.timetableSlotIds || [],
          date: initialData.date || '',
          lessonPlan: initialData.lessonPlan || '',
          color: initialData.color || '#000000',
        };
        setFormData(newFormData);
      } else {
        // For add mode, auto-select if only one option available
        const autoSelectedClassId = (classes && classes.length === 1) ? classes[0].id.toString() : '';
        const autoSelectedSubjectId = (subjects && subjects.length === 1) ? subjects[0].id.toString() : '';
        
        setFormData({
          title: '',
          classId: autoSelectedClassId,
          subjectId: autoSelectedSubjectId,
          timetableSlotIds: [],
          date: '',
          lessonPlan: '',
          color: '#000000', // Default color for new lessons
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData, mode, classes, subjects]);

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
      
      if (userData.teacherType === 'primary') {
        // Primary teachers: use subject color
        const selectedSubject = subjects.find(s => s.id === parseInt(formData.subjectId));
        if (selectedSubject?.color) {
          autoColor = selectedSubject.color;
        }
      } else if (userData.teacherType === 'secondary') {
        // Secondary teachers: use class color
        const selectedClass = classes.find(c => c.id === parseInt(formData.classId));
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
    if (!formData.timetableSlotIds || formData.timetableSlotIds.length === 0) {
      newErrors.timetableSlotIds = 'At least one timetable slot is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    console.log('Submitting lesson form with data:', formData);
    console.log('Available classes:', classes);
    console.log('Available subjects:', subjects);
    console.log('Available timetable slots:', timetableSlots);

    // Check if we have the required data
    if (!classes || classes.length === 0) {
      alert('No classes available. Please create a class first.');
      return;
    }
    if (!subjects || subjects.length === 0) {
      alert('No subjects available. Please create a subject first.');
      return;
    }
    if (!timetableSlots || timetableSlots.length === 0) {
      alert('No timetable slots available. Please create a timetable slot first.');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error saving lesson:', error);
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
    console.log('Delete button clicked:', { onDelete: !!onDelete, initialData: !!initialData, mode });
    if (!onDelete) return;
    
    if (confirm('Are you sure you want to delete this lesson? This action cannot be undone.')) {
      setIsLoading(true);
      try {
        await onDelete(initialData);
        onClose();
      } catch (error) {
        console.error('Error deleting lesson:', error);
        alert('Error deleting lesson. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Get available timetable slots based on selected date
  const getAvailableTimetableSlots = () => {
    if (!timetableSlots || !formData.date) return [];
    
    const selectedDate = new Date(formData.date);
    const dayOfWeek = selectedDate.toLocaleDateString('en-GB', { weekday: 'long' });
    const weekNumber = getWeekNumberForDate(selectedDate);
    
    console.log('🔍 Lesson Modal - Filtering timetable slots:', {
      selectedDate: formData.date,
      dayOfWeek,
      weekNumber,
      totalSlots: timetableSlots.length,
      allSlots: timetableSlots.map(s => ({
        id: s.id,
        dayOfWeek: s.dayOfWeek,
        weekNumber: s.weekNumber,
        label: s.label
      }))
    });
    
    // Filter slots that match the selected day of the week and week number
    // This applies to both add and edit modes to show only relevant slots for the selected date
    const availableSlots = timetableSlots.filter(slot => 
      slot.dayOfWeek === dayOfWeek && 
      slot.weekNumber === weekNumber
    );
    
    console.log('✅ Available slots after filtering:', availableSlots.length, availableSlots);
    
    return availableSlots;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {mode === 'add' ? 'Add New Lesson' : 'Edit Lesson'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto px-1">
          <form id="lesson-form" onSubmit={handleSubmit} className="space-y-4">
          {(!classes || classes.length === 0 || !subjects || subjects.length === 0 || !timetableSlots || timetableSlots.length === 0) && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800">
                <strong>Setup Required:</strong> You need to create classes, subjects, and timetable slots before you can create lessons.
              </p>
            </div>
          )}
          
          {/* Step 1: Date Selection */}
          <div>
            <Label htmlFor="date">Date *</Label>
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
          </div>

          {/* Step 2: Timetable Slot Selection */}
          <div>
            <Label>Time Slots *</Label>
            <div className="space-y-2 max-h-24 overflow-y-auto border rounded-md p-3">
              {!formData.date ? (
                <p className="text-sm text-gray-500">Select a date first</p>
              ) : getAvailableTimetableSlots().length === 0 ? (
                <p className="text-sm text-orange-600">
                  No timetable slots configured for this day of the week and week number. 
                  {getWeekNumberForDate(new Date(formData.date)) && ` (Week ${getWeekNumberForDate(new Date(formData.date))})`}
                </p>
              ) : (
                getAvailableTimetableSlots().map((slot) => {
                  const isChecked = formData.timetableSlotIds.includes(slot.id.toString());
                  
                  // Find the timetable entry for this slot on the selected day
                  const slotEntry = timetableEntries?.find(entry => 
                    entry.timetableSlotId === slot.id &&
                    entry.dayOfWeek === new Date(formData.date).toLocaleDateString('en-GB', { weekday: 'long' })
                  );
                  
                  // Get class name if available
                  const className = slotEntry && classes 
                    ? classes.find(c => c.id === slotEntry.classId)?.name 
                    : null;
                  
                  return (
                  <label key={slot.id} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            timetableSlotIds: [...prev.timetableSlotIds, slot.id.toString()]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            timetableSlotIds: prev.timetableSlotIds.filter(id => id !== slot.id.toString())
                          }));
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">
                      <span className="font-medium">W{slot.weekNumber}</span> - {slot.label} ({slot.startTime} - {slot.endTime})
                      {className && <span className="ml-2 text-gray-600 font-medium">- {className}</span>}
                    </span>
                  </label>
                  );
                })
              )}
            </div>
            {errors.timetableSlotIds && <p className="text-sm text-red-500 mt-1">{errors.timetableSlotIds}</p>}
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

          {/* Step 3: Class and Subject (auto-populated from timetable) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="class">Class *</Label>
              <Select
                value={formData.classId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, classId: value }))}
              >
                <SelectTrigger className={errors.classId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {classes?.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.classId && <p className="text-sm text-red-500 mt-1">{errors.classId}</p>}
              {(!classes || classes.length === 0) && (
                <p className="text-sm text-orange-600 mt-1">No classes available. Create a class first.</p>
              )}
            </div>

            <div>
              <Label htmlFor="subject">Subject *</Label>
              <Select
                value={formData.subjectId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, subjectId: value }))}
              >
                <SelectTrigger className={errors.subjectId ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects?.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id.toString()}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.subjectId && <p className="text-sm text-red-500 mt-1">{errors.subjectId}</p>}
              {(!subjects || subjects.length === 0) && (
                <p className="text-sm text-orange-600 mt-1">No subjects available. Create a subject first.</p>
              )}
            </div>
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
                {isLoading ? 'Saving...' : mode === 'add' ? 'Create Lesson' : 'Update Lesson'}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 