'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Users,
  CheckCircle,
  Plus,
  MapPin,
  Clock,
  Star,
  ChevronDown,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { TeacherTabLogo } from '@/components/ui/logo';
import { TypewriterHeadline } from '@/components/landing/typewriter-headline';
import { useState, useEffect } from 'react';
import { PricingSection } from './components/pricing-section';

const features = [
  {
    name: 'Calendar Views',
    description:
      'View your schedule in daily, weekly, or monthly formats. Switch between views to see your lessons and events at the level of detail you need. Never miss a deadline again.',
    icon: Calendar,
    color: 'bg-[#001b3d]',
  },
  {
    name: 'Lesson Planning',
    description:
      'Create and organise detailed lesson plans for each class. Track your curriculum, add notes, and keep everything in one place.',
    icon: BookOpen,
    color: 'bg-[#fbae36]',
  },
  {
    name: 'Setup & Organisation',
    description:
      'Set up your timetable with recurring schedules and two-week cycles, then organise your classes and subjects with colour coding. Everything you need to get started in one place.',
    icon: Clock,
    color: 'bg-[#001b3d]',
  },
  {
    name: 'Task Management',
    description:
      'Create to-do lists and manage tasks with due dates, priorities, and tags. Keep track of everything you need to do outside of lesson planning.',
    icon: ClipboardList,
    color: 'bg-[#fbae36]',
  },
];

const benefits = [
  'Save 5+ hours per week on admin tasks',
  'Never miss a lesson or deadline',
  'organise everything in one place',
  'Access from any device, anywhere',
  'Free to start, no credit card required',
];

const testimonials = [
  {
    name: 'Sarah Johnson',
    role: 'High School Mathematics Teacher',
    content:
      'TeacherTab has completely transformed how I organise my teaching. I used to spend hours on admin tasks, but now I can focus on what I love—teaching. The lesson planning tools are intuitive, and the timetable management saves me so much time each week.',
    rating: 5,
  },
  {
    name: 'Michael Chen',
    role: 'Primary School Teacher',
    content:
      'As a primary teacher with multiple classes, keeping track of everything was overwhelming. TeacherTab makes it so simple. I can see all my classes, lessons, and schedules in one place. It\'s been a game-changer for my organization.',
    rating: 5,
  },
  {
    name: 'Emma Williams',
    role: 'Science Teacher',
    content:
      'The calendar view is exactly what I needed. I can plan my lessons weeks in advance and see everything at a glance. The color coding for different subjects makes it so easy to navigate. Highly recommend!',
    rating: 5,
  },
];

const faqs = [
  {
    question: 'How does TeacherTab help me save time?',
    answer:
      'TeacherTab consolidates all your teaching admin into one place. Instead of juggling multiple spreadsheets, paper planners, and notebooks, you can view your weekly schedule, plan lessons, manage your timetable, and organise classes and subjects all in one digital platform. This reduces time spent switching between different tools and searching for information.',
  },
  {
    question: 'Is my data secure?',
    answer:
      'Yes. We take data security seriously and implement industry-standard security measures to protect your information. Your data is stored securely, and we follow best practices for handling student information. For specific security details, please refer to our privacy policy.',
  },
  {
    question: 'Can I use TeacherTab on my phone?',
    answer:
      'Yes! TeacherTab is fully responsive and works on any device with a web browser—desktop, tablet, or mobile. You can access your schedule, lessons, and teaching information from anywhere, at any time.',
  },
  {
    question: 'How much does it cost?',
    answer:
      'TeacherTab offers flexible subscription plans to suit different needs. We have monthly and annual options available. Visit our pricing page to see current pricing and choose the plan that works best for you. You can cancel your subscription at any time.',
  },
  {
    question: 'Do I need technical skills to use TeacherTab?',
    answer:
      'Not at all! TeacherTab is designed to be intuitive and straightforward. If you can use a web browser on a smartphone or computer, you can use TeacherTab. The interface is clean and easy to navigate, so you can get started quickly.',
  },
];

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200">
      <button
        className="flex w-full items-center justify-between py-6 text-left"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="text-lg font-semibold text-gray-900">{question}</span>
        <ChevronDown
          className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      {isOpen && (
        <div className="pb-6 text-gray-600 leading-relaxed">{answer}</div>
      )}
    </div>
  );
}

function CalendarPreview() {
  return (
    <div className="w-full flex flex-col h-[500px] overflow-hidden select-none pointer-events-none">
      {/* Week Header */}
      <div className="flex-none bg-white border-b border-gray-200">
        <div className="flex">
          <div className="w-14 flex-none border-r border-gray-200" />
          <div className="flex-auto grid grid-cols-7 divide-x divide-gray-200 text-sm text-gray-600">
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
                    <span className="flex items-baseline gap-1.5">
                      {day}
                      <span
                        className={`flex h-7 w-7 items-center justify-center text-sm font-semibold ${
                          isToday
                            ? 'rounded-full bg-[#001b3d] text-white'
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
      <div className="flex relative h-full" style={{ height: 'calc(500px - 60px)' }}>
        <div className="w-14 flex-none bg-white border-r-2 border-gray-200 overflow-hidden">
          <div className="grid divide-y divide-gray-100 h-full" style={{ gridTemplateRows: 'repeat(16, 2.4rem)' }}>
            {Array.from({ length: 16 }, (_, i) => i + 8).map((hour) => (
              <div key={hour} className="flex items-start justify-end pr-2 pt-1" style={{ height: '2.4rem' }}>
                <span className="text-xs text-gray-400">
                  {hour === 12 ? '12PM' : hour < 12 ? `${hour}AM` : `${hour - 12}PM`}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex-auto relative overflow-hidden">
          <div className="grid grid-cols-7 divide-x divide-gray-200 h-full" style={{ gridTemplateRows: 'repeat(16, 2.4rem)' }}>
            {Array.from({ length: 7 }).map((_, colIndex) => (
              <div key={colIndex} className="relative overflow-hidden">
                {Array.from({ length: 16 }).map((_, rowIndex) => (
                  <div key={rowIndex} className="border-b border-gray-100" style={{ height: '2.4rem' }} />
                ))}
              </div>
            ))}
          </div>
          <div className="absolute inset-0 pointer-events-none">
            {/* Sample lessons */}
            <div className="absolute rounded-lg border-2 px-2.5 py-1.5 text-xs shadow-sm" style={{ backgroundColor: '#001b3d15', borderColor: '#001b3dCC', left: 'calc(0% + 0.25rem)', width: 'calc(14.285% - 0.5rem)', top: 'calc(1 * 2.4rem)', height: 'calc(2 * 2.4rem - 0.25rem)' }}>
              <div className="font-semibold truncate" style={{ color: '#001b3dE6' }}>Algebra Basics</div>
              <div className="truncate text-xs mt-0.5" style={{ color: '#001b3dCC' }}>Year 9A</div>
            </div>
            <div className="absolute rounded-lg border-2 px-2.5 py-1.5 text-xs shadow-sm" style={{ backgroundColor: '#fbae3615', borderColor: '#fbae36CC', left: 'calc(14.285% + 0.25rem)', width: 'calc(14.285% - 0.5rem)', top: 'calc(2.5 * 2.4rem)', height: 'calc(1.5 * 2.4rem - 0.25rem)' }}>
              <div className="font-semibold truncate" style={{ color: '#fbae36E6' }}>English Literature</div>
              <div className="truncate text-xs mt-0.5" style={{ color: '#fbae36CC' }}>Year 11B</div>
            </div>
          </div>
        </div>
      </div>
    </div>
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

function FeatureCarousel() {
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

export default function HomePage() {
  return (
    <main className="isolate bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-14 pb-20 sm:pb-32">
        {/* Background decoration */}
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
        >
          <div
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-blue-100 to-orange-50 opacity-50 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          />
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Tagline */}
            <div className="mb-12">
               <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl md:text-7xl">Your teacher planner, upgraded.</h1>
            </div>
            <p className="mt-6 text-lg leading-8 text-gray-600 sm:text-xl">
            The all-in-one digital planner for teachers.
            Organise your schedule, manage your timetable, and stay focused on what matters most — teaching.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Button
                size="lg"
                variant="accent"
                className="text-lg rounded-full px-8 py-6"
                asChild
              >
                <Link href="/sign-up">
                  Get started now
                </Link>
              </Button>
              <Link
                href="#features"
                className="text-base font-semibold leading-6 text-gray-900 hover:text-[#001b3d]"
              >
                Learn more <span aria-hidden="true">→</span>
              </Link>
            </div >
          </div>

          {/* App Preview */}
          <div className="mt-8 flow-root sm:mt-24">
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
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                  </div>
                </div>

                {/* Feature Carousel */}
                <FeatureCarousel />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-[#001b3d]">
              Features
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              All the tools you need
            </p>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              All the tools you need to organise your teaching life, all in one
              place.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              {features.map((feature) => (
                <div key={feature.name} className="relative pl-16">
                  <dt className="text-base font-semibold leading-7 text-gray-900">
                    <div
                      className={`absolute top-0 left-0 flex h-10 w-10 items-center justify-center rounded-lg ${feature.color}`}
                    >
                      <feature.icon
                        aria-hidden="true"
                        className="h-6 w-6 text-white"
                      />
                    </div>
                    {feature.name}
                  </dt>
                  <dd className="mt-2 text-base leading-7 text-gray-600">
                    {feature.description}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />
    </main>
  );
}

