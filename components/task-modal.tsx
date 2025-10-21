'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from '@/components/ui/color-picker';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: any) => Promise<void>;
  mode: 'add' | 'edit';
  initialData?: any;
}

export function TaskModal({ isOpen, onClose, onSave, mode, initialData }: TaskModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    tags: '',
    color: '#000000', // Added color field
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData && mode === 'edit') {
        setFormData({
          title: initialData.title || '',
          description: initialData.description || '',
          dueDate: initialData.dueDate ? new Date(initialData.dueDate).toISOString().slice(0, 16) : '',
          priority: initialData.priority || 'medium',
          tags: initialData.tags ? JSON.parse(initialData.tags).join(', ') : '',
          color: initialData.color || '#000000', // Initialize color
        });
      } else {
        setFormData({
          title: '',
          description: '',
          dueDate: '',
          priority: 'medium',
          tags: '',
          color: '#000000', // Initialize color
        });
      }
      setErrors({});
    }
  }, [isOpen, initialData, mode]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (formData.dueDate && new Date(formData.dueDate) < new Date()) {
      newErrors.dueDate = 'Due date cannot be in the past';
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
      // Parse tags from comma-separated string to JSON string
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      const taskData = {
        ...formData,
        tags: JSON.stringify(tagsArray),
        dueDate: formData.dueDate || null,
      };

      await onSave(taskData);
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Add New Task' : 'Edit Task'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Enter task title"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Enter task description (optional)"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date & Time</Label>
            <Input
              id="dueDate"
              type="datetime-local"
              value={formData.dueDate}
              onChange={(e) => handleInputChange('dueDate', e.target.value)}
              className={errors.dueDate ? 'border-red-500' : ''}
            />
            {errors.dueDate && (
              <p className="text-sm text-red-500">{errors.dueDate}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value) => handleInputChange('priority', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => handleInputChange('tags', e.target.value)}
              placeholder="Enter tags separated by commas (e.g., work, urgent, project)"
            />
            <p className="text-xs text-gray-500">
              Separate multiple tags with commas
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <ColorPicker
              value={formData.color}
              onChange={(color) => handleInputChange('color', color)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : mode === 'add' ? 'Create Task' : 'Update Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 