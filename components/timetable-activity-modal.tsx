'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from '@/components/ui/color-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Calendar, Clock, MapPin, FileText, Users, Briefcase, Coffee, MoreHorizontal } from 'lucide-react';

interface TimetableActivityModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
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

  // Populate form when editing
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        activityType: initialData.activityType || '',
        title: initialData.title || '',
        description: initialData.description || '',
        location: initialData.location || '',
        color: initialData.color || '#3B82F6',
        notes: initialData.notes || '',
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
    
    if (!formData.activityType || !formData.title) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      // Filter out empty date values
      const { startDate, endDate, ...otherData } = formData;
      const processedData = {
        ...otherData,
        dayOfWeek: slotData?.dayOfWeek || initialData?.dayOfWeek,
        weekNumber: slotData?.weekNumber || initialData?.weekNumber || 1,
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      };
      
      await onSave(processedData);
      onClose();
    } catch (error) {
      console.error('Error saving activity:', error);
      alert('Error saving activity. Please try again.');
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

          

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {mode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            {mode !== 'view' && (
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Saving...' : mode === 'add' ? 'Add Activity' : 'Save Changes'}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
