'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TeacherTabLogo } from '@/components/ui/logo';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowRight, 
  CheckCircle, 
  Calendar, 
  BookOpen, 
  Clock,
  ClipboardList,
  Sparkles,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Users
} from 'lucide-react';
import { useState, useEffect } from 'react';

const benefits = [
  'Free access during beta',
  'Heavily discounted access after launch',
  'Early access to all features',
  'Shape the product with your feedback',
  'Priority support',
];

const features = [
  {
    name: 'Calendar Views',
    description: 'View your schedule in daily, weekly, or monthly formats.',
    icon: Calendar,
  },
  {
    name: 'Lesson Planning',
    description: 'Create and organise detailed lesson plans for each class.',
    icon: BookOpen,
  },
  {
    name: 'Timetable Management',
    description: 'Set up recurring schedules and two-week cycles.',
    icon: Clock,
  },
  {
    name: 'Task Management',
    description: 'Create to-do lists and manage tasks with due dates.',
    icon: ClipboardList,
  },
];

function BetaHeader() {
  return (
    <header className="bg-[#001b3d] border-b border-[#001b3d]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/beta" className="flex items-center">
          <TeacherTabLogo size="sm" variant="inverse" />
          <span className="ml-2 text-xl font-semibold text-[#fbae36]">TeacherTab</span>
        </Link>
      </div>
    </header>
  );
}

function LessonPlanningPreview() {
  return (
    <div className="w-full h-[500px] overflow-hidden select-none pointer-events-none bg-white p-6">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Lesson Plans</h2>
          <div className="flex gap-2">
            <div className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700">All Classes</div>
            <div className="px-3 py-1 bg-[#001b3d] rounded-lg text-sm text-white">Math</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4">
          {[
            { title: 'Introduction to Algebra', class: 'Year 9A', subject: 'Mathematics', date: 'Today, 9:00 AM', color: '#001b3d' },
            { title: 'Shakespeare Analysis', class: 'Year 11B', subject: 'English', date: 'Tomorrow, 10:30 AM', color: '#fbae36' },
            { title: 'Physics Lab: Forces', class: 'Year 10C', subject: 'Physics', date: 'Wed, 2:00 PM', color: '#6B7280' },
          ].map((lesson, idx) => (
            <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lesson.color }} />
                    <h3 className="font-semibold text-gray-900">{lesson.title}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>{lesson.class}</span>
                    <span>•</span>
                    <span>{lesson.subject}</span>
                    <span>•</span>
                    <span>{lesson.date}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    Lesson objectives, activities, and assessment criteria...
                  </p>
                </div>
                <BookOpen className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SetupOrganisationPreview() {
  return (
    <div className="w-full h-[500px] overflow-hidden select-none pointer-events-none bg-white p-6">
      <div className="grid grid-cols-2 gap-6 h-full">
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Classes</h2>
          <div className="flex-1 space-y-3 overflow-y-auto">
            {[
              { name: 'Year 9A', students: 28, color: '#001b3d' },
              { name: 'Year 11B', students: 24, color: '#fbae36' },
              { name: 'Year 10C', students: 26, color: '#6B7280' },
              { name: 'Year 8A', students: 30, color: '#059669' },
            ].map((cls, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: cls.color }} />
                    <h3 className="font-semibold text-gray-900">{cls.name}</h3>
                  </div>
                  <Users className="h-4 w-4 text-gray-400" />
                </div>
                <p className="text-sm text-gray-600">{cls.students} students</p>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Subjects</h2>
          <div className="flex-1 space-y-3 overflow-y-auto">
            {[
              { name: 'Mathematics', color: '#001b3d' },
              { name: 'English', color: '#fbae36' },
              { name: 'Physics', color: '#6B7280' },
              { name: 'Chemistry', color: '#059669' },
              { name: 'History', color: '#DC2626' },
            ].map((subject, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${subject.color}15` }}>
                    <BookOpen className="h-5 w-5" style={{ color: subject.color }} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{subject.name}</h3>
                    <p className="text-xs text-gray-500">5 lessons this week</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function TaskManagementPreview() {
  return (
    <div className="w-full h-[500px] overflow-hidden select-none pointer-events-none bg-white p-6">
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Tasks</h2>
          <div className="flex gap-2">
            <div className="px-3 py-1 bg-gray-100 rounded-lg text-sm text-gray-700">All</div>
            <div className="px-3 py-1 bg-blue-100 rounded-lg text-sm text-blue-700">Pending</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-3">
          {[
            { title: 'Mark Year 9A assignments', due: 'Today', priority: 'high', completed: false },
            { title: 'Prepare lesson plan for next week', due: 'Tomorrow', priority: 'medium', completed: false },
            { title: 'Review exam papers', due: 'Friday', priority: 'high', completed: false },
            { title: 'Update class records', due: 'Yesterday', priority: 'low', completed: true },
          ].map((task, idx) => (
            <div key={idx} className={`border rounded-lg p-4 ${task.completed ? 'opacity-60 bg-gray-50' : ''} ${task.priority === 'high' && !task.completed ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
              <div className="flex items-start gap-3">
                <div className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                  {task.completed && <CheckCircle className="h-3 w-3 text-white" />}
                </div>
                <div className="flex-1">
                  <h3 className={`font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded ${task.priority === 'high' ? 'bg-red-100 text-red-700' : task.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {task.priority}
                    </span>
                    <span className="text-xs text-gray-500">{task.due}</span>
                  </div>
                </div>
                <ClipboardList className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CalendarPreview() {
  // Helper function to lighten color (matching the main app exactly)
  function lightenColor(color: string, amount: number = 0.7): string {
    if (!color || !color.startsWith('#')) return color;
    
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    
    // Lighten by blending with white
    const lightenedR = Math.round(r + (255 - r) * amount);
    const lightenedG = Math.round(g + (255 - g) * amount);
    const lightenedB = Math.round(b + (255 - b) * amount);
    
    return `#${lightenedR.toString(16).padStart(2, '0')}${lightenedG.toString(16).padStart(2, '0')}${lightenedB.toString(16).padStart(2, '0')}`;
  }

  const lessons = [
    { color: '#001b3d', subject: 'Mathematics', class: 'Year 9A', location: 'Room 101', top: 1, height: 2 },
    { color: '#fbae36', subject: 'English', class: 'Year 11B', location: 'Room 205', top: 2.5, height: 1.5 },
    { color: '#059669', subject: 'Science', class: 'Year 10C', location: 'Lab 3', top: 0.5, height: 2 },
    { color: '#DC2626', subject: 'History', class: 'Year 8A', location: 'Room 112', top: 3, height: 1.5 },
    { color: '#7C3AED', subject: 'Physics', class: 'Year 12B', location: 'Lab 1', top: 1.5, height: 2 },
    { color: '#6B7280', subject: 'Art', class: 'Year 9B', location: 'Studio A', top: 4, height: 1.5 },
  ];

  return (
    <div className="w-full flex flex-col h-[500px] overflow-hidden select-none pointer-events-none bg-white rounded-lg border border-gray-200">
      {/* Week Header */}
      <div className="flex-none bg-white border-b border-gray-200">
        <div className="hidden sm:flex">
          <div className="w-14 flex-none" />
          <div className="flex-auto grid grid-cols-7 divide-x divide-gray-100 border-r border-gray-100 text-sm/6 text-gray-500">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(
              (day, index) => {
                const today = new Date();
                const date = new Date(today);
                date.setDate(today.getDate() - today.getDay() + index + 1);
                const isToday = date.toDateString() === today.toDateString();
                return (
                  <div
                    key={index}
                    className="flex items-center justify-center py-3"
                  >
                    <span className="flex items-baseline">
                      {day}{' '}
                      <span
                        className={`ml-1.5 flex h-8 w-8 items-center justify-center font-semibold ${
                          isToday
                            ? 'rounded-full bg-indigo-600 text-white'
                            : 'text-gray-900'
                        }`}
                      >
                        {date.getDate()}
                      </span>
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </div>
      {/* Calendar Grid */}
      <div className="flex relative h-full flex-auto" style={{ height: 'calc(500px - 60px)' }}>
        <div className="sticky left-0 z-10 w-14 flex-none bg-white border-r-2 border-gray-200" />
        <div className="grid flex-auto grid-cols-1 grid-rows-1">
          {/* Horizontal lines */}
          <div
            className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
            style={{ gridTemplateRows: 'repeat(16, 2.4rem)' }}
          >
            <div className="row-end-1 h-7"></div>
            {Array.from({ length: 16 }, (_, i) => i + 8).map((hour, i) => (
              <div key={hour} style={{ gridRow: `${i + 1} / span 1` }}>
                <div className="sticky left-0 z-20 -mt-2.5 -ml-14 w-14 pr-2 text-right text-xs/5 text-gray-400">
                  {hour === 12 ? '12PM' : hour < 12 ? `${hour}AM` : `${hour - 12}PM`}
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

          {/* Events */}
          <ol
            className="col-start-1 col-end-2 row-start-1 grid grid-cols-1 sm:grid-cols-7"
            style={{ gridTemplateRows: '1.75rem repeat(16, 2.4rem) auto' }}
          >
            {lessons.map((lesson, index) => {
              const dayColumn = index % 7 + 1;
              const startRow = Math.floor(lesson.top) + 2;
              const duration = Math.ceil(lesson.height);
              
              return (
                <li
                  key={index}
                  className="relative mt-px flex"
                  style={{
                    gridRow: `${startRow} / span ${duration}`,
                    gridColumn: `${dayColumn} / span 1`,
                    paddingRight: '2px',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    className="group flex flex-col text-xs transition-colors border-2 rounded-md z-10 overflow-hidden px-1.5 py-1 h-full w-full shadow-sm"
                    style={{
                      backgroundColor: lesson.color ? lightenColor(lesson.color, 0.85) : '#F9FAFB',
                      borderColor: lesson.color ? `${lesson.color}CC` : '#374151',
                      transform: 'translateZ(0)'
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                          <div className="flex-1 min-w-0">
                            <div
                              className="text-xs font-semibold truncate"
                              style={{ color: lesson.color !== '#6B7280' ? `${lesson.color}E6` : '#111827' }}
                            >
                              {lesson.subject}
                            </div>
                            <div
                              className="text-xs truncate"
                              style={{ color: `${lesson.color}CC` }}
                            >
                              {lesson.class}
                            </div>
                            {lesson.location && (
                              <div className="flex items-center text-xs mt-0.5">
                                <MapPin className="h-3 w-3 mr-1 flex-shrink-0" style={{ color: `${lesson.color}CC` }} />
                                <span className="truncate" style={{ color: `${lesson.color}CC` }}>{lesson.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}

function ScreenshotCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-rotate slides every 3 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 4);
    }, 3000);
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % 4);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + 4) % 4);
  const goToSlide = (index: number) => setCurrentSlide(index);

  return (
    <div className="relative">
      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
        aria-label="Previous slide"
      >
        <ChevronLeft className="h-5 w-5 text-gray-700" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all"
        aria-label="Next slide"
      >
        <ChevronRight className="h-5 w-5 text-gray-700" />
      </button>

      {/* Slides Container */}
      <div className="relative overflow-hidden">
        <div
          className="flex transition-transform duration-700 ease-out will-change-transform"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {/* Slide 0: Calendar View */}
          <div className="w-full flex-shrink-0">
            <CalendarPreview />
          </div>

          {/* Slide 1: Lesson Planning */}
          <div className="w-full flex-shrink-0">
            <LessonPlanningPreview />
          </div>

          {/* Slide 2: Setup & Organisation */}
          <div className="w-full flex-shrink-0">
            <SetupOrganisationPreview />
          </div>

          {/* Slide 3: Task Management */}
          <div className="w-full flex-shrink-0">
            <TaskManagementPreview />
          </div>
        </div>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center gap-2 mt-6">
        {[0, 1, 2, 3].map((index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`h-2 rounded-full transition-all ${
              currentSlide === index
                ? 'w-8 bg-[#001b3d]'
                : 'w-2 bg-gray-300 hover:bg-gray-400'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default function BetaPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    school: '',
    location: '',
    stage: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!formData.location || !formData.stage) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/beta-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || `Failed to submit signup (${response.status}). Please try again.`;
        console.error('Beta signup API error:', {
          status: response.status,
          error: data.error,
          details: data.details,
        });
        throw new Error(errorMessage);
      }

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting beta signup:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit signup. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#001b3d] via-[#001b3d] to-[#002855] flex items-center justify-center px-6">
        <div className="max-w-2xl w-full text-center">
          <div className="bg-white rounded-2xl shadow-2xl p-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Thank You!
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              We've received your beta tester application. We'll be in touch soon with more details about accessing TeacherTab.
            </p>
            <p className="text-sm text-gray-500">
              Keep an eye on your inbox at <strong>{formData.email}</strong>
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white flex flex-col">
      <BetaHeader />
      
      {/* Main Content - 3 Row Layout */}
      <section className="flex-1 px-6 py-12 lg:py-16">
        <div className="mx-auto max-w-7xl space-y-12 lg:space-y-16">
          {/* Row 1: Call to Action and Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Left - Call to Action */}
            <div className="flex flex-col">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#fbae36]/10 border border-[#fbae36]/30 rounded-full text-[#fbae36] text-sm font-medium mb-6 w-fit">
                <Sparkles className="h-4 w-4" />
                <span>Join the Beta Program</span>
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-4xl font-bold text-gray-900 mb-4">
                Help Shape the Future of
                <br />
                <span className="text-[#001b3d]">Teacher Planning</span>
              </h1>
              
              <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                We're looking for passionate teachers to join our beta program. 
                Get early access, provide feedback, and help us build the perfect tool for educators.
              </p>

              {/* Benefits List */}
              <div>
                <ul className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-[#fbae36] flex-shrink-0" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right - Form */}
            <div>
              <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm h-full">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  Apply to Become a Beta Tester
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                      {error}
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full"
                      placeholder="John Smith"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full"
                      placeholder="john@example.com"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-1">
                      School/Institution *
                    </label>
                    <Input
                      id="school"
                      name="school"
                      type="text"
                      required
                      value={formData.school}
                      onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                      className="w-full"
                      placeholder="Example High School"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                        Location *
                      </label>
                      <Select
                        value={formData.location}
                        onValueChange={(value) => setFormData({ ...formData, location: value })}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger id="location" className="w-full">
                          <SelectValue placeholder="Select location" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="england">England</SelectItem>
                          <SelectItem value="scotland">Scotland</SelectItem>
                          <SelectItem value="wales">Wales</SelectItem>
                          <SelectItem value="northern-ireland">Northern Ireland</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-1">
                        Teaching Stage *
                      </label>
                      <Select
                        value={formData.stage}
                        onValueChange={(value) => setFormData({ ...formData, stage: value })}
                        disabled={isSubmitting}
                      >
                        <SelectTrigger id="stage" className="w-full">
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="primary">Primary</SelectItem>
                          <SelectItem value="secondary">Secondary</SelectItem>
                          <SelectItem value="sixth-form">Sixth Form / College</SelectItem>
                          <SelectItem value="special">Special Educational Needs</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    variant="accent"
                    className="w-full text-lg rounded-full py-6"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Apply for Beta Access'}
                    {!isSubmitting && <ArrowRight className="ml-2 h-5 w-5" />}
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    By applying, you agree to provide feedback and help us improve TeacherTab.
                  </p>
                </form>
              </div>
            </div>
          </div>

          {/* Row 2: Features Section */}
          <div>
            <div className="bg-[#001b3d] rounded-xl p-8 lg:p-12">
              <h2 className="text-3xl lg:text-4xl font-bold text-white mb-8 text-center">
                What You'll Get Access To
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-white border border-gray-200 rounded-lg p-6 text-center"
                  >
                    <div className="w-12 h-12 bg-[#fbae36]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <feature.icon className="h-6 w-6 text-[#fbae36]" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {feature.name}
                    </h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Row 3: Screenshot Carousel */}
          <div>
            <div className="-m-2 rounded-xl bg-gray-50 p-2 ring-1 ring-gray-200 ring-inset lg:-m-4 lg:rounded-2xl lg:p-4 overflow-hidden">
              <div className="bg-white rounded-lg shadow-2xl ring-1 ring-gray-900/10 overflow-hidden">
                {/* Mock Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <TeacherTabLogo size="sm" className="text-primary" />
                    <span className="ml-2 text-lg font-semibold text-gray-900">
                      TeacherTab
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-[#001b3d]/20 rounded-full flex items-center justify-center">
                      <Calendar className="h-3 w-3 text-[#001b3d]" />
                    </div>
                    <div className="w-6 h-6 bg-[#fbae36]/20 rounded-full flex items-center justify-center">
                      <BookOpen className="h-3 w-3 text-[#fbae36]" />
                    </div>
                    <div className="w-8 h-8 bg-[#001b3d] rounded-full flex items-center justify-center">
                      <span className="text-xs font-semibold text-white">S</span>
                    </div>
                  </div>
                </div>
                <ScreenshotCarousel />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <TeacherTabLogo size="sm" variant="default" />
              <span className="ml-2 text-lg font-semibold text-gray-900">
                TeacherTab
              </span>
            </div>
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} TeacherTab. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

