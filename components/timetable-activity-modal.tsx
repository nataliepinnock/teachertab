'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from '@/components/ui/color-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, FileText, Users, Briefcase, Coffee, MoreHorizontal, Trash2, AlertTriangle } from 'lucide-react';
import useSWR from 'swr';

interface TimetableActivityModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
  onDelete?: (id: number) => Promise<void>;
  mode: 'add' | 'edit' | 'view';
  initialData?: any;
  slotData?: {
    dayOfWeek: string;
    weekNumber: number;
    startTime: string;
    endTime: string;
    label: string;
  };
}

const ACTIVITY_TYPES = [
  { value: 'meeting', label: 'Meeting', icon: Users, color: '#3B82F6' },
  { value: 'duty', label: 'Duty', icon: Briefcase, color: '#EF4444' },
  { value: 'planning', label: 'Planning Time', icon: FileText, color: '#10B981' },
  { value: 'break', label: 'Break', icon: Coffee, color: '#F59E0B' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, color: '#6B7280' },
];

export function TimetableActivityModal({ 
  open, 
  onClose, 
  onSave, 
  onDelete,
  mode, 
  initialData, 
  slotData 
}: TimetableActivityModalProps) {
  const [formData, setFormData] = useState({
    activityType: '',
    title: '',
    description: '',
    location: '',
    color: '#3B82F6',
    notes: '',
    startDate: '',
    endDate: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch existing activities to check for conflicts
  const { data: existingActivities } = useSWR(
    mode === 'add' ? '/api/timetable-activities' : null,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) return [];
      return res.json();
    }
  );

  // Get the timetable slot ID from initialData (when adding from calendar) or from slotData context
  const timetableSlotId = initialData?.timetableSlotId;

  // Check if there's already an activity for this slot (when adding)
  const hasExistingActivity = mode === 'add' && timetableSlotId && existingActivities?.some(
    (activity: any) => activity.timetableSlotId === timetableSlotId
  );

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        activityType: initialData.activityType || '',
        title: initialData.title || '',
        description: initialData.description || initialData.notes || '',
        location: initialData.location || '',
        color: initialData.color || '#3B82F6',
        notes: initialData.notes || initialData.description || '',
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
      });
    } else if (mode === 'add') {
      // Reset form for new activity
      setFormData({
        activityType: '',
        title: '',
        description: '',
        location: '',
        color: '#3B82F6',
        notes: '',
        startDate: '',
        endDate: '',
      });
    }
  }, [mode, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.activityType || !formData.title) {
      setError('Please fill in all required fields');
      return;
    }

    // Check for existing activity when adding
    if (mode === 'add' && hasExistingActivity) {
      setError('This timetable slot already has an activity assigned. Please edit or delete the existing activity first.');
      return;
    }

    setIsLoading(true);
    try {
      // Capitalize the title - ensure first letter of each word is capitalized
      const capitalizeTitle = (str: string) => {
        return str
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      };
      
      // Prepare data, filtering out empty strings for optional fields
      const processedData: any = {
        activityType: formData.activityType,
        title: capitalizeTitle(formData.title.trim()),
        // Only include optional fields if they have values
        // Use description field for notes (the textarea is labeled "Notes" but uses description)
        ...(formData.description && { description: formData.description, notes: formData.description }),
        ...(formData.location && { location: formData.location }),
        ...(formData.color && { color: formData.color }),
        ...(formData.startDate && { startDate: formData.startDate }),
        ...(formData.endDate && { endDate: formData.endDate }),
      };

      // Include timetable slot info (required for API validation)
      if (initialData?.timetableSlotId) {
        processedData.timetableSlotId = initialData.timetableSlotId;
      }
      
      // Include dayOfWeek and weekNumber (required fields)
      if (slotData?.dayOfWeek || initialData?.dayOfWeek) {
        processedData.dayOfWeek = slotData?.dayOfWeek || initialData?.dayOfWeek;
      }
      if (slotData?.weekNumber !== undefined || initialData?.weekNumber !== undefined) {
        processedData.weekNumber = slotData?.weekNumber || initialData?.weekNumber || 1;
      }
      
      await onSave(processedData);
      onClose();
    } catch (error: any) {
      console.error('Error saving activity:', error);
      // Extract error message from error object
      const errorMessage = error?.message || error?.error || 'Error saving activity. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedActivityType = ACTIVITY_TYPES.find(type => type.value === formData.activityType);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedActivityType && <selectedActivityType.icon className="h-5 w-5" style={{ color: selectedActivityType.color }} />}
            {mode === 'add' ? 'Add Timetable Activity' : mode === 'edit' ? 'Edit Activity' : 'Activity Details'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Warning for existing activity */}
          {hasExistingActivity && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-800">Activity Already Exists</p>
                <p className="text-xs text-amber-700 mt-1">
                  This timetable slot already has an activity assigned. You can edit or delete the existing activity, but cannot add another one to the same slot.
                </p>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">Error</p>
                <p className="text-xs text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="activityType" className="text-sm font-medium">
              Activity Type *
            </Label>
            <Select 
              value={formData.activityType} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, activityType: value }))}
              disabled={mode === 'view'}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select activity type" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" style={{ color: type.color }} />
                        <span>{type.label}</span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Staff Meeting, Yard Duty, Planning Period"
              disabled={mode === 'view'}
              className="h-10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Notes
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Notes about this activity (optional)"
              disabled={mode === 'view'}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium">
                Location
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  placeholder="e.g., Staff Room, Playground"
                  disabled={mode === 'view'}
                  className="h-10 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="color" className="text-sm font-medium">
                Color
              </Label>
              <ColorPicker
                value={formData.color}
                onChange={(color) => setFormData(prev => ({ ...prev, color }))}
                disabled={mode === 'view'}
              />
            </div>
          </div>

          {slotData && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Calendar className="h-4 w-4" />
                <span className="font-medium">Time Slot</span>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{slotData.startTime} - {slotData.endTime}</span>
                </div>
                <div className="text-gray-500">
                  {slotData.dayOfWeek} (Week {slotData.weekNumber})
                </div>
              </div>
            </div>
          )}

          

          <DialogFooter className="gap-2">
            <div className="flex gap-2">
              {mode === 'edit' && onDelete && initialData?.id && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete this activity?')) {
                      setIsLoading(true);
                      try {
                        await onDelete(initialData.id);
                        onClose();
                      } catch (error) {
                        console.error('Error deleting activity:', error);
                        alert('Error deleting activity. Please try again.');
                      } finally {
                        setIsLoading(false);
                      }
                    }
                  }}
                  disabled={isLoading}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                {mode === 'view' ? 'Close' : 'Cancel'}
              </Button>
              {mode !== 'view' && (
                <Button type="submit" disabled={isLoading || hasExistingActivity}>
                  {isLoading ? 'Saving...' : mode === 'add' ? 'Add Activity' : 'Save Changes'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
