'use client';

import {
  BookOpen,
  Calendar,
  Users,
  CheckCircle,
  ClipboardList,
  MapPin,
} from 'lucide-react';

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

function CalendarPreview() {
  const lessons = [
    { color: '#001b3d', subject: 'Mathematics', class: 'Year 9A', location: 'Room 101', top: 1, height: 2 },
    { color: '#fbae36', subject: 'English', class: 'Year 11B', location: 'Room 205', top: 2.5, height: 1.5 },
    { color: '#059669', subject: 'Science', class: 'Year 10C', location: 'Lab 3', top: 0.5, height: 2 },
    { color: '#DC2626', subject: 'History', class: 'Year 8A', location: 'Room 112', top: 3, height: 1.5 },
    { color: '#7C3AED', subject: 'Physics', class: 'Year 12B', location: 'Lab 1', top: 1.5, height: 2 },
    { color: '#6B7280', subject: 'Art', class: 'Year 9B', location: 'Studio A', top: 4, height: 1.5 },
  ];

  return (
    <div className="w-full flex flex-col h-[500px] overflow-hidden select-none pointer-events-none bg-white">
      {/* Week Header - matching main app */}
      <div className="flex-none bg-white">
        <div className="flex">
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
      {/* Calendar Grid - matching main app */}
      <div className="flex relative h-full flex-auto" style={{ height: 'calc(500px - 60px)' }}>
        <div className="sticky left-0 z-10 w-14 flex-none bg-white border-r-2 border-gray-200" />
        <div className="grid flex-auto grid-cols-1 grid-rows-1">
          {/* Horizontal lines - matching main app */}
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

          {/* Vertical lines - matching main app */}
          <div className="col-start-1 col-end-2 row-start-1 grid grid-cols-7 grid-rows-1 divide-x divide-gray-200">
            <div className="col-start-1 row-span-full border-r border-gray-200" />
            <div className="col-start-2 row-span-full border-r border-gray-200" />
            <div className="col-start-3 row-span-full border-r border-gray-200" />
            <div className="col-start-4 row-span-full border-r border-gray-200" />
            <div className="col-start-5 row-span-full border-r border-gray-200" />
            <div className="col-start-6 row-span-full border-r border-gray-200" />
            <div className="col-start-7 row-span-full" />
          </div>

          {/* Events - matching main app styling */}
          <ol
            className="col-start-1 col-end-2 row-start-1 grid grid-cols-7"
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

export default function PreviewImagesPage() {
  return (
    <main className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">App Preview Images</h1>
          <p className="text-gray-600">Screenshot each preview below for social media use</p>
        </div>

        {/* Calendar View */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">1. Calendar View</h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <CalendarPreview />
          </div>
        </div>

        {/* Lesson Planning */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">2. Lesson Planning</h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <LessonPlanningPreview />
          </div>
        </div>

        {/* Setup & Organisation */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">3. Setup & Organisation</h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <SetupOrganisationPreview />
          </div>
        </div>

        {/* Task Management */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">4. Task Management</h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <TaskManagementPreview />
          </div>
        </div>
      </div>
    </main>
  );
}

