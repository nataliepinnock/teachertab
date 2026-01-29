'use client';

import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TimetableSlot, User } from '@/lib/db/schema';
import { Trash2, AlertTriangle } from 'lucide-react';
import useSWR from 'swr';
import { getLocalizedTerm } from '@/lib/utils/localization';

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    return [];
  }
  const data = await res.json();
  // Ensure we always return an array
  return Array.isArray(data) ? data : [];
};

interface TimetableSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot?: TimetableSlot | null;
  onSave: (slot: Omit<TimetableSlot, 'id' | 'userId'>) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
}

const DAYS_OF_WEEK = [
  { value: 'Monday', label: 'Mon', fullLabel: 'Monday' },
  { value: 'Tuesday', label: 'Tue', fullLabel: 'Tuesday' },
  { value: 'Wednesday', label: 'Wed', fullLabel: 'Wednesday' },
  { value: 'Thursday', label: 'Thu', fullLabel: 'Thursday' },
  { value: 'Friday', label: 'Fri', fullLabel: 'Friday' },
  { value: 'Saturday', label: 'Sat', fullLabel: 'Saturday' },
  { value: 'Sunday', label: 'Sun', fullLabel: 'Sunday' },
];

export function TimetableSlotModal({ 
  isOpen, 
  onClose, 
  slot, 
  onSave, 
  onDelete 
}: TimetableSlotModalProps) {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const timetableSlotLabel = getLocalizedTerm(user?.location, 'timetableSlot');
  const [formData, setFormData] = useState({
    dayOfWeek: 'Monday',
    weekNumber: 1,
    startTime: '09:00',
    endTime: '10:00',
    label: '',
  });
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>(['1']);
  const [selectedDays, setSelectedDays] = useState<string[]>(['Monday']);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!slot;

  // Fetch existing timetable slots to check for conflicts
  const { data: existingSlots } = useSWR<TimetableSlot[]>('/api/timetable-slots', fetcher);

  // Check for conflicts
  const conflicts = useMemo(() => {
    // Ensure existingSlots is an array before proceeding
    if (!existingSlots || !Array.isArray(existingSlots) || isEditing || !formData.startTime || !formData.endTime) {
      return [];
    }

    const conflictList: Array<{ day: string; week: number }> = [];
    
    for (const day of selectedDays) {
      for (const week of selectedWeeks) {
        const weekNumber = parseInt(week);
        // Check if a slot with the same day, week, startTime, and endTime already exists
        const hasConflict = existingSlots.some(existingSlot => 
          existingSlot.dayOfWeek === day &&
          existingSlot.weekNumber === weekNumber &&
          existingSlot.startTime === formData.startTime &&
          existingSlot.endTime === formData.endTime &&
          (slot ? existingSlot.id !== slot.id : true) // Exclude current slot when editing
        );

        if (hasConflict) {
          conflictList.push({ day, week: weekNumber });
        }
      }
    }

    return conflictList;
  }, [existingSlots, selectedDays, selectedWeeks, formData.startTime, formData.endTime, isEditing, slot]);

  useEffect(() => {
    if (slot) {
      setFormData({
        dayOfWeek: slot.dayOfWeek,
        weekNumber: slot.weekNumber,
        startTime: slot.startTime,
        endTime: slot.endTime,
        label: slot.label || '',
      });
      setSelectedWeeks([slot.weekNumber.toString()]);
      setSelectedDays([slot.dayOfWeek]);
    } else {
      setFormData({
        dayOfWeek: 'Monday',
        weekNumber: 1,
        startTime: '09:00',
        endTime: '10:00',
        label: '',
      });
      setSelectedWeeks(['1']);
      setSelectedDays(['Monday']);
    }
    setErrors({});
  }, [slot, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (selectedDays.length === 0) {
      newErrors.dayOfWeek = 'Please select at least one day';
    }

    if (selectedWeeks.length === 0) {
      newErrors.weekNumber = 'Please select at least one week';
    }

    if (!formData.startTime.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      newErrors.startTime = 'Start time must be in HH:MM format';
    }

    if (!formData.endTime.match(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)) {
      newErrors.endTime = 'End time must be in HH:MM format';
    }

    if (formData.startTime >= formData.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    if (!formData.label.trim()) {
      newErrors.label = 'Label is required';
    } else if (formData.label.length > 100) {
      newErrors.label = 'Label must be 100 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing) {
        // When editing, only update the current slot
        await onSave(formData);
        onClose();
      } else {
        // When creating, create slots for all selected days and weeks
        // Skip conflicting slots (they're already shown in the warning)
        let hasSuccess = false;
        for (const day of selectedDays) {
          for (const week of selectedWeeks) {
            const weekNumber = parseInt(week);
            
            // Skip if this slot conflicts
            const isConflict = conflicts.some(c => c.day === day && c.week === weekNumber);
            if (isConflict) {
              continue;
            }

            const slotData = {
              ...formData,
              dayOfWeek: day,
              weekNumber: weekNumber,
            };
            try {
              await onSave(slotData);
              hasSuccess = true;
            } catch (error) {
              // Handle any unexpected errors
              console.error(`Error creating slot for ${day} Week ${week}:`, error);
            }
          }
        }
        // Close modal if at least one slot was created successfully
        if (hasSuccess) {
          onClose();
        } else if (conflicts.length === getTotalSlotsToCreate()) {
          // All slots conflict - show error
          setErrors({ submit: 'All selected slots conflict with existing slots. Please modify your selection.' });
        }
      }
    } catch (error) {
      console.error('Error saving slot:', error);
      setErrors({ submit: 'Failed to save slot. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!slot || !onDelete) return;

    if (!confirm('Are you sure you want to delete this slot?')) {
      return;
    }

    setIsLoading(true);
    try {
      await onDelete(slot.id);
      onClose();
    } catch (error) {
      console.error('Error deleting slot:', error);
      setErrors({ submit: 'Failed to delete slot. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'both') {
      setSelectedWeeks(['1', '2']);
    } else {
      setSelectedWeeks([value]);
    }
  };

  const handleDayChange = (day: string, checked: boolean) => {
    if (checked) {
      setSelectedDays(prev => [...prev, day]);
    } else {
      setSelectedDays(prev => prev.filter(d => d !== day));
    }
  };

  const getTotalSlotsToCreate = () => {
    if (isEditing) return 1;
    return selectedDays.length * selectedWeeks.length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">
            {isEditing ? `Edit ${timetableSlotLabel}` : `Add New ${timetableSlotLabel}`}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="label" className="mb-2.5 block text-sm font-medium text-gray-700">Label</Label>
            <Input
              id="label"
              placeholder="e.g., Morning Session, Break, Maths, etc."
              value={formData.label}
              onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
              className={`h-10 ${errors.label ? 'border-red-500 focus:ring-red-500' : ''}`}
              required
            />
            {errors.label && <p className="text-sm text-red-500 mt-1.5">{errors.label}</p>}
          </div>

          <div>
            <Label className="mb-3 block text-sm font-medium text-gray-700">Days of the Week</Label>
            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((day) => {
                const isChecked = selectedDays.includes(day.value);
                return (
                  <label
                    key={day.value}
                    className={`
                      flex flex-col items-center justify-center gap-1.5 px-2 py-2.5 cursor-pointer transition-all duration-200
                      ${isChecked
                        ? 'text-[#001b3d]'
                        : 'text-gray-600 hover:text-gray-900'
                      }
                      ${isEditing ? 'opacity-60 cursor-not-allowed' : ''}
                    `}
                    title={day.fullLabel}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleDayChange(day.value, e.target.checked)}
                      disabled={isEditing}
                      className="h-4 w-4 rounded border-gray-300 text-[#001b3d] focus:ring-2 focus:ring-[#001b3d] focus:ring-offset-0 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                    />
                    <span className="text-xs font-medium text-center">{day.label}</span>
                  </label>
                );
              })}
            </div>
            {errors.dayOfWeek && <p className="text-sm text-red-500 mt-2">{errors.dayOfWeek}</p>}
          </div>

          <div>
            <Label htmlFor="weekSelect" className="mb-2.5 block text-sm font-medium text-gray-700">Week</Label>
            <select
              id="weekSelect"
              value={selectedWeeks.length === 2 ? 'both' : selectedWeeks[0]}
              onChange={handleWeekChange}
              disabled={isEditing}
              className="w-full h-10 px-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#001b3d] focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500"
            >
              <option value="1">Week 1</option>
              <option value="2">Week 2</option>
              <option value="both">Both Weeks</option>
            </select>
            {errors.weekNumber && <p className="text-sm text-red-500 mt-1.5">{errors.weekNumber}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startTime" className="mb-2.5 block text-sm font-medium text-gray-700">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                className={`h-10 ${errors.startTime ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.startTime && <p className="text-sm text-red-500 mt-1.5">{errors.startTime}</p>}
            </div>
            
            <div>
              <Label htmlFor="endTime" className="mb-2.5 block text-sm font-medium text-gray-700">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                className={`h-10 ${errors.endTime ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.endTime && <p className="text-sm text-red-500 mt-1.5">{errors.endTime}</p>}
            </div>
          </div>

          {!isEditing && getTotalSlotsToCreate() > 1 && (
            <div className="p-3.5 bg-[#001b3d]/5 border border-[#001b3d]/20 rounded-lg">
              <p className="text-sm text-gray-700">
                This will create <strong className="font-semibold text-[#001b3d]">{getTotalSlotsToCreate()}</strong> separate slots:
                <br className="hidden sm:block" />
                <span className="block sm:inline mt-1 sm:mt-0">
                  {selectedDays.length} day{selectedDays.length !== 1 ? 's' : ''} × {selectedWeeks.length} week{selectedWeeks.length !== 1 ? 's' : ''} = {getTotalSlotsToCreate()} slot{getTotalSlotsToCreate() > 1 ? 's' : ''}
                </span>
              </p>
            </div>
          )}

          {conflicts.length > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900 mb-1">
                    Warning: {conflicts.length} slot{conflicts.length > 1 ? 's' : ''} conflict{conflicts.length > 1 ? '' : 's'} with existing slots
                  </p>
                  <ul className="text-sm text-amber-800 list-disc list-inside space-y-0.5">
                    {conflicts.map((conflict, index) => (
                      <li key={index}>
                        {conflict.day} Week {conflict.week} at {formData.startTime}-{formData.endTime}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm text-amber-700 mt-2">
                    Conflicting slots will not be created.
                  </p>
                </div>
              </div>
            </div>
          )}

          {errors.submit && (
            <p className="text-sm text-red-500">{errors.submit}</p>
          )}

          <DialogFooter className="flex justify-between gap-2 sm:justify-between pt-4">
            <div className="flex gap-2">
              {isEditing && onDelete && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isLoading}
                  className="flex items-center gap-2 h-10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="h-10">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="h-10 bg-[#001b3d] hover:bg-[#001b3d]/90 text-white">
                {isLoading ? 'Saving...' : (isEditing ? 'Update' : `Create ${getTotalSlotsToCreate()} Slot${getTotalSlotsToCreate() > 1 ? 's' : ''}`)}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 