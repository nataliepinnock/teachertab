'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Eye, ArrowLeft, Calendar, GraduationCap, CalendarDays, MapPin } from 'lucide-react';
import { AcademicYear, Holiday } from '@/lib/db/schema';
import useSWR from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ColorPicker } from '@/components/ui/color-picker';
import { formatHolidayType, getDefaultHolidayColor } from '@/lib/utils/academic-calendar';
import React from 'react';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Academic Year Modal
function AcademicYearModal({ open, onClose, onSave, mode, initialData }: {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; startDate: string; endDate: string; weekCycleStartDate: string; isActive: boolean; skipHolidayWeeks: boolean }) => Promise<void>;
  mode: 'add' | 'view' | 'edit';
  initialData?: { name: string; startDate: string; endDate: string; weekCycleStartDate: string; isActive: boolean; skipHolidayWeeks?: boolean };
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [startDate, setStartDate] = useState(initialData?.startDate || '');
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [weekCycleStartDate, setWeekCycleStartDate] = useState(initialData?.weekCycleStartDate || '');
  const [isActive, setIsActive] = useState(initialData?.isActive || false);
  const [skipHolidayWeeks, setSkipHolidayWeeks] = useState(initialData?.skipHolidayWeeks ?? true);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setName(initialData?.name || '');
    setStartDate(initialData?.startDate || '');
    setEndDate(initialData?.endDate || '');
    setWeekCycleStartDate(initialData?.weekCycleStartDate || '');
    setIsActive(initialData?.isActive || false);
    setSkipHolidayWeeks(initialData?.skipHolidayWeeks ?? true);
  }, [open, initialData]);

  const handleSave = async () => {
    setLoading(true);
    await onSave({ name, startDate, endDate, weekCycleStartDate, isActive, skipHolidayWeeks });
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            {mode === 'add' ? 'Add Academic Year' : mode === 'edit' ? 'Edit Academic Year' : 'Academic Year Details'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Academic Year Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              disabled={mode === 'view'}
              placeholder="e.g., 2024-2025 Academic Year"
              className="h-10"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date" className="text-sm font-medium">Start Date</Label>
              <Input 
                id="start-date" 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                disabled={mode === 'view'}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-date" className="text-sm font-medium">End Date</Label>
              <Input 
                id="end-date" 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                disabled={mode === 'view'}
                className="h-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="week-cycle-start" className="text-sm font-medium">Week 1 Start Date</Label>
            <Input 
              id="week-cycle-start" 
              type="date" 
              value={weekCycleStartDate} 
              onChange={e => setWeekCycleStartDate(e.target.value)} 
              disabled={mode === 'view'}
              className="h-10"
            />
            <p className="text-xs text-gray-500">
              This date determines when Week 1 begins. The system will alternate between Week 1 and Week 2 from this date.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-active"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
                disabled={mode === 'view'}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <Label htmlFor="is-active" className="text-sm font-medium">Set as active academic year</Label>
            </div>
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="skip-holiday-weeks"
                checked={skipHolidayWeeks}
                onChange={e => setSkipHolidayWeeks(e.target.checked)}
                disabled={mode === 'view'}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500 mt-0.5"
              />
              <div className="flex-1">
                <Label htmlFor="skip-holiday-weeks" className="text-sm font-medium">Skip holiday weeks in timetable cycle</Label>
                <p className="text-xs text-gray-500 mt-1">
                  When enabled, Week 1/Week 2 alternation pauses during holidays and resumes with the same week pattern after holidays end. 
                  When disabled, the week cycle continues during holidays (useful if you run activities during breaks).
                </p>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} type="button" className="flex-1 sm:flex-none">
            Cancel
          </Button>
          {(mode === 'add' || mode === 'edit') && (
            <Button onClick={handleSave} disabled={loading || !name || !startDate || !endDate || !weekCycleStartDate} type="button" className="flex-1 sm:flex-none">
              {loading ? 'Saving...' : mode === 'add' ? 'Create Academic Year' : 'Save Changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Holiday Modal
function HolidayModal({ open, onClose, onSave, mode, initialData, academicYearId }: {
  open: boolean;
  onClose: () => void;
  onSave: (data: { name: string; startDate: string; endDate: string; type: string; color?: string }) => Promise<void>;
  mode: 'add' | 'view' | 'edit';
  initialData?: { name: string; startDate: string; endDate: string; type: string; color?: string };
  academicYearId: number | null;
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [startDate, setStartDate] = useState(initialData?.startDate || '');
  const [endDate, setEndDate] = useState(initialData?.endDate || '');
  const [type, setType] = useState(initialData?.type || 'holiday');
  const [color, setColor] = useState(initialData?.color || '');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    setName(initialData?.name || '');
    setStartDate(initialData?.startDate || '');
    setEndDate(initialData?.endDate || '');
    const holidayType = initialData?.type || 'holiday';
    setType(holidayType);
    setColor(initialData?.color || getDefaultHolidayColor(holidayType));
  }, [open, initialData]);

  React.useEffect(() => {
    if (!initialData) {
      setColor(getDefaultHolidayColor(type));
    }
  }, [type, initialData]);

  const handleSave = async () => {
    setLoading(true);
    await onSave({ name, startDate, endDate, type, color });
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            {mode === 'add' ? 'Add Holiday or Training Day' : mode === 'edit' ? 'Edit Holiday or Training Day' : 'Holiday / Training Day Details'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="holiday-name" className="text-sm font-medium">Name</Label>
            <Input 
              id="holiday-name" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              disabled={mode === 'view'}
              placeholder="e.g., Christmas Break, Half Term"
              className="h-10"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="holiday-start" className="text-sm font-medium">Start Date</Label>
              <Input 
                id="holiday-start" 
                type="date" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                disabled={mode === 'view'}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="holiday-end" className="text-sm font-medium">End Date</Label>
              <Input 
                id="holiday-end" 
                type="date" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                disabled={mode === 'view'}
                className="h-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="holiday-type" className="text-sm font-medium">Type</Label>
            <Select value={type} onValueChange={setType} disabled={mode === 'view'}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select holiday type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="holiday">Holiday</SelectItem>
                <SelectItem value="half_term">Half Term</SelectItem>
                <SelectItem value="training_day">Training Day</SelectItem>
                <SelectItem value="planning_day">Planning Day</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500">
              Choose Holiday or Half Term for multi-day breaks. Use Training Day for staff development and Planning Day for preparation days — these are treated as non-teaching days.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="holiday-color" className="text-sm font-medium">Color</Label>
            <ColorPicker
              value={color}
              onChange={setColor}
              disabled={mode === 'view'}
              placeholder="Choose a color for this holiday"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} type="button" className="flex-1 sm:flex-none">
            Cancel
          </Button>
          {(mode === 'add' || mode === 'edit') && (
            <Button onClick={handleSave} disabled={loading || !name || !startDate || !endDate || !academicYearId} type="button" className="flex-1 sm:flex-none">
              {loading ? 'Saving...' : mode === 'add' ? 'Add Holiday' : 'Save Changes'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AcademicYearSetupPage() {
  const { data: academicYears, error: academicYearsError, mutate: mutateAcademicYears } = useSWR<AcademicYear[]>('/api/academic-years', fetcher);
  const { data: holidays, error: holidaysError, mutate: mutateHolidays } = useSWR<Holiday[]>('/api/holidays', fetcher);

  // Academic Year Modal state
  const [academicYearModalOpen, setAcademicYearModalOpen] = useState(false);
  const [academicYearModalMode, setAcademicYearModalMode] = useState<'add' | 'view' | 'edit'>('add');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<AcademicYear | null>(null);

  // Holiday Modal state
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [holidayModalMode, setHolidayModalMode] = useState<'add' | 'view' | 'edit'>('add');
  const [selectedHoliday, setSelectedHoliday] = useState<Holiday | null>(null);
  const [holidayAcademicYearId, setHolidayAcademicYearId] = useState<number | null>(null);

  // Academic Year handlers
  const handleAddAcademicYear = () => {
    setAcademicYearModalMode('add');
    setSelectedAcademicYear(null);
    setAcademicYearModalOpen(true);
  };

  const handleViewAcademicYear = (academicYear: AcademicYear) => {
    setAcademicYearModalMode('view');
    setSelectedAcademicYear(academicYear);
    setAcademicYearModalOpen(true);
  };

  const handleEditAcademicYear = (academicYear: AcademicYear) => {
    setAcademicYearModalMode('edit');
    setSelectedAcademicYear(academicYear);
    setAcademicYearModalOpen(true);
  };

  const handleSaveAcademicYear = async (data: { name: string; startDate: string; endDate: string; weekCycleStartDate: string; isActive: boolean; skipHolidayWeeks: boolean }) => {
    try {
      let response;
      if (academicYearModalMode === 'edit' && selectedAcademicYear) {
        response = await fetch('/api/academic-years', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedAcademicYear.id,
            ...data,
          }),
        });
      } else {
        response = await fetch('/api/academic-years', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save academic year');
      }

      setAcademicYearModalOpen(false);
      mutateAcademicYears();
    } catch (error) {
      console.error('Error saving academic year:', error);
      alert(`Failed to save academic year: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteAcademicYear = async (id: number) => {
    if (confirm('Are you sure you want to delete this academic year? This will also delete all associated holidays. This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/academic-years?id=${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete academic year');
        }
        
        mutateAcademicYears();
        mutateHolidays();
      } catch (error) {
        console.error('Error deleting academic year:', error);
        alert(`Failed to delete academic year: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  // Holiday handlers
  const handleAddHoliday = (academicYearId: number) => {
    setHolidayModalMode('add');
    setSelectedHoliday(null);
    setHolidayAcademicYearId(academicYearId);
    setHolidayModalOpen(true);
  };

  const handleViewHoliday = (holiday: Holiday) => {
    setHolidayModalMode('view');
    setSelectedHoliday(holiday);
    setHolidayAcademicYearId(holiday.academicYearId);
    setHolidayModalOpen(true);
  };

  const handleEditHoliday = (holiday: Holiday) => {
    setHolidayModalMode('edit');
    setSelectedHoliday(holiday);
    setHolidayAcademicYearId(holiday.academicYearId);
    setHolidayModalOpen(true);
  };

  const handleSaveHoliday = async (data: { name: string; startDate: string; endDate: string; type: string; color?: string }) => {
    try {
      let response;
      if (holidayModalMode === 'edit' && selectedHoliday) {
        response = await fetch('/api/holidays', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: selectedHoliday.id,
            ...data,
          }),
        });
      } else {
        response = await fetch('/api/holidays', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            academicYearId: holidayAcademicYearId,
            ...data,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save holiday');
      }

      setHolidayModalOpen(false);
      mutateHolidays();
    } catch (error) {
      console.error('Error saving holiday:', error);
      alert(`Failed to save holiday: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDeleteHoliday = async (id: number) => {
    if (confirm('Are you sure you want to delete this holiday? This action cannot be undone.')) {
      try {
        const response = await fetch(`/api/holidays?id=${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete holiday');
        }
        
        mutateHolidays();
      } catch (error) {
        console.error('Error deleting holiday:', error);
        alert(`Failed to delete holiday: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const getHolidaysForYear = (academicYearId: number) => {
    return holidays?.filter(holiday => holiday.academicYearId === academicYearId) || [];
  };

  if (academicYearsError || holidaysError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <GraduationCap className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Academic Year Data</h3>
          <p className="text-gray-600 mb-4">There was a problem loading your academic year information. Please try again.</p>
          <Button onClick={() => { mutateAcademicYears(); mutateHolidays(); }}>Retry</Button>
        </div>
      </div>
    );
  }

  const activeYear = academicYears?.find(year => year.isActive);

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
                  <GraduationCap className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Academic Year: Holidays and Training Days</h1>
                  <p className="text-gray-600">Set up your academic year, holidays, and week cycles. Add INSET/training or planning days to exclude them from teaching days.</p>
                </div>
              </div>
            </div>
            <Button onClick={handleAddAcademicYear} className="h-10 px-4">
              <Plus className="h-4 w-4 mr-2" />
              Add Academic Year
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Active Academic Year Summary */}
        {activeYear && (
          <div className="mb-8">
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-800">
                  <Calendar className="h-5 w-5" />
                  Active Academic Year
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-orange-700">Year</p>
                    <p className="text-lg font-semibold text-orange-900">{activeYear.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-700">Duration</p>
                    <p className="text-lg font-semibold text-orange-900">
                      {new Date(activeYear.startDate).toLocaleDateString()} - {new Date(activeYear.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-orange-700">Week Cycle Starts</p>
                    <p className="text-lg font-semibold text-orange-900">
                      {new Date(activeYear.weekCycleStartDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Academic Years List */}
        {academicYears && academicYears.length > 0 ? (
          <div className="space-y-6">
            {academicYears.map((academicYear) => {
              const yearHolidays = getHolidaysForYear(academicYear.id);
              
              return (
                <Card key={academicYear.id} className={`${academicYear.isActive ? 'ring-2 ring-orange-200' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg font-semibold">
                            {academicYear.name}
                          </CardTitle>
                          {academicYear.isActive && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs font-medium rounded-full">
                              Active
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleViewAcademicYear(academicYear)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEditAcademicYear(academicYear)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteAcademicYear(academicYear.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>
                        {new Date(academicYear.startDate).toLocaleDateString()} - {new Date(academicYear.endDate).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>Week 1 starts: {new Date(academicYear.weekCycleStartDate).toLocaleDateString()}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">
                        Holidays and Training Days ({yearHolidays.length})
                      </h4>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleAddHoliday(academicYear.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Holiday/Training Day
                      </Button>
                    </div>
                    
                    {yearHolidays.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {yearHolidays.map((holiday) => (
                          <div 
                            key={holiday.id} 
                            className="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: holiday.color || getDefaultHolidayColor(holiday.type) }}
                                />
                                <h5 className="font-medium text-sm">{holiday.name}</h5>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={() => handleViewHoliday(holiday)} className="h-6 w-6 p-0">
                                  <Eye className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleEditHoliday(holiday)} className="h-6 w-6 p-0">
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteHoliday(holiday.id)} 
                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-1">
                              {new Date(holiday.startDate).toLocaleDateString()} - {new Date(holiday.endDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatHolidayType(holiday.type)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                        <CalendarDays className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-500 text-sm">No holidays or training days added yet</p>
                        <p className="text-gray-400 text-xs">Click "Add Holiday/Training Day" to get started</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <GraduationCap className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No academic year set up</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create your first academic year to define your school calendar, holidays, and week cycles. This helps the system understand your teaching schedule.
            </p>
            <Button onClick={handleAddAcademicYear} size="lg" className="h-11 px-6">
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Academic Year
            </Button>
          </div>
        )}
      </div>

      {/* Academic Year Modal */}
      <AcademicYearModal
        open={academicYearModalOpen}
        onClose={() => setAcademicYearModalOpen(false)}
        onSave={handleSaveAcademicYear}
        mode={academicYearModalMode}
        initialData={selectedAcademicYear ? {
          name: selectedAcademicYear.name,
          startDate: selectedAcademicYear.startDate,
          endDate: selectedAcademicYear.endDate,
          weekCycleStartDate: selectedAcademicYear.weekCycleStartDate,
          isActive: !!selectedAcademicYear.isActive,
          skipHolidayWeeks: !!selectedAcademicYear.skipHolidayWeeks
        } : undefined}
      />

      {/* Holiday Modal */}
      <HolidayModal
        open={holidayModalOpen}
        onClose={() => setHolidayModalOpen(false)}
        onSave={handleSaveHoliday}
        mode={holidayModalMode}
        academicYearId={holidayAcademicYearId}
        initialData={selectedHoliday ? {
          name: selectedHoliday.name,
          startDate: selectedHoliday.startDate,
          endDate: selectedHoliday.endDate,
          type: selectedHoliday.type,
          color: selectedHoliday.color || ''
        } : undefined}
      />
    </div>
  );
}
