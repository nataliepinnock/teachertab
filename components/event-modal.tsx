'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ColorPicker } from '@/components/ui/color-picker';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Repeat, Calendar } from 'lucide-react';
import { Event } from '@/lib/db/schema';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventAdded: () => void;
  event?: Event | null;
  mode: 'add' | 'edit';
}

export function EventModal({ isOpen, onClose, onEventAdded, event, mode }: EventModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
    allDay: false,
    color: '',
    isRecurring: false,
    recurrenceType: '',
    recurrenceEndDate: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (event && mode === 'edit') {
      const startDate = new Date(event.startTime);
      const endDate = new Date(event.endTime);
      
      setFormData({
        title: event.title,
        description: event.description || '',
        location: event.location || '',
        startTime: event.allDay 
          ? startDate.toISOString().split('T')[0]
          : startDate.toISOString().slice(0, 16),
        endTime: event.allDay 
          ? '' // Clear end time for all-day events since we don't show the field
          : endDate.toISOString().slice(0, 16),
        allDay: event.allDay === 1,
        color: event.color || '',
        isRecurring: event.isRecurring === 1,
        recurrenceType: event.recurrenceType || '',
        recurrenceEndDate: event.recurrenceEndDate 
          ? new Date(event.recurrenceEndDate).toISOString().split('T')[0]
          : '',
      });
    } else {
      setFormData({
        title: '',
        description: '',
        location: '',
        startTime: '',
        endTime: '',
        allDay: false,
        color: '',
        isRecurring: false,
        recurrenceType: '',
        recurrenceEndDate: '',
      });
    }
  }, [event, mode, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Basic validation
    if (formData.isRecurring && !formData.recurrenceType) {
      alert('Please select a recurrence pattern for recurring events.');
      setIsSubmitting(false);
      return;
    }

    try {
      const url = mode === 'edit' ? `/api/events/${event?.id}` : '/api/events';
      const method = mode === 'edit' ? 'PUT' : 'POST';
      
      // Prepare the data to send
      const eventData = {
        ...formData,
        startTime: formData.allDay 
          ? new Date(formData.startTime).toISOString()
          : new Date(formData.startTime).toISOString(),
        endTime: formData.allDay 
          ? new Date(formData.startTime).toISOString()
          : new Date(formData.endTime).toISOString(),
        recurrenceEndDate: formData.recurrenceEndDate 
          ? new Date(formData.recurrenceEndDate).toISOString()
          : null,
        // Ensure boolean values are properly converted
        isRecurring: Boolean(formData.isRecurring),
        recurrenceType: formData.isRecurring ? formData.recurrenceType : null,
      };

      console.log('Event Modal - Sending data:', eventData);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        onEventAdded();
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error(`Failed to ${mode} event:`, errorData);
        alert(`Failed to ${mode} event: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error(`Error ${mode}ing event:`, error);
      alert(`Error ${mode}ing event: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Event' : 'Edit Event'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="color">Color</Label>
            <ColorPicker
              value={formData.color}
              onChange={(color) => setFormData({ ...formData, color })}
              placeholder="Choose a color for this event"
            />
          </div>

          {/* Recurrence Section */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => {
                  const newIsRecurring = e.target.checked;
                  setFormData({ 
                    ...formData, 
                    isRecurring: newIsRecurring,
                    // Clear recurrence fields when disabling
                    recurrenceType: newIsRecurring ? formData.recurrenceType : '',
                    recurrenceEndDate: newIsRecurring ? formData.recurrenceEndDate : '',
                  });
                }}
                className="rounded"
              />
              <Label htmlFor="isRecurring" className="flex items-center gap-2">
                <Repeat className="h-4 w-4" />
                Recurring event
              </Label>
            </div>

            {formData.isRecurring && (
              <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                <div>
                  <Label htmlFor="recurrenceType">Repeat</Label>
                  <Select 
                    value={formData.recurrenceType} 
                    onValueChange={(value) => setFormData({ ...formData, recurrenceType: value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select recurrence pattern" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="week1">Week 1 only (2-week cycle)</SelectItem>
                      <SelectItem value="week2">Week 2 only (2-week cycle)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="recurrenceEndDate">End date (optional)</Label>
                  <Input
                    id="recurrenceEndDate"
                    type="date"
                    value={formData.recurrenceEndDate}
                    onChange={(e) => setFormData({ ...formData, recurrenceEndDate: e.target.value })}
                    min={formData.startTime ? new Date(formData.startTime).toISOString().split('T')[0] : undefined}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for no end date
                  </p>
                </div>

                {/* Recurrence Preview */}
                {formData.recurrenceType && formData.startTime && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-blue-800 mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm font-medium">Recurrence Preview</span>
                    </div>
                    <div className="text-sm text-blue-700">
                      {formData.recurrenceType === 'daily' && 'This event will repeat every day'}
                      {formData.recurrenceType === 'weekly' && 'This event will repeat every week on the same day'}
                      {formData.recurrenceType === 'monthly' && 'This event will repeat every month on the same date'}
                      {formData.recurrenceType === 'week1' && 'This event will repeat every Week 1 of your 2-week cycle'}
                      {formData.recurrenceType === 'week2' && 'This event will repeat every Week 2 of your 2-week cycle'}
                      {formData.recurrenceEndDate && ` until ${new Date(formData.recurrenceEndDate).toLocaleDateString()}`}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="allDay"
              checked={formData.allDay}
              onChange={(e) => {
                const newAllDay = e.target.checked;
                setFormData({ 
                  ...formData, 
                  allDay: newAllDay,
                  // Clear end time when switching to all-day to avoid confusion
                  endTime: newAllDay ? '' : formData.endTime
                });
              }}
              className="rounded"
            />
            <Label htmlFor="allDay">All day event</Label>
          </div>

          {!formData.allDay && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Start Time *</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time *</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>
          )}

          {formData.allDay && (
            <div>
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
              />
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (mode === 'add' ? 'Adding...' : 'Updating...') : (mode === 'add' ? 'Add Event' : 'Update Event')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 