import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Calendar, Users, Clock, CheckCircle, Plus, Edit3, Trash2, MoreHorizontal } from 'lucide-react';
import { TeacherTabLogo } from '@/components/ui/logo';

export default function HomePage() {
  return (
    <main>
      {/* Hero Section with App Mockup */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-6">
              <TeacherTabLogo size="lg" className="text-primary" />
              <span className="ml-3 text-3xl font-bold text-gray-900">TeacherTab</span>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 tracking-tight sm:text-6xl md:text-7xl">
              Your Teaching
              <span className="block text-[#28559e]">Companion</span>
            </h1>
            <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
              Streamline your teaching workflow with intelligent lesson planning, 
              timetable management, and student organization tools.
            </p>
            <div className="mt-8">
              <Button
                size="lg"
                className="text-lg rounded-full bg-[#28559e] hover:bg-[#1e3d72] px-8 py-4"
              >
                Start Teaching Better
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* App Mockup */}
          <div className="relative max-w-6xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Mock Header */}
              <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <TeacherTabLogo size="md" className="text-primary" />
                  <span className="ml-2 text-lg font-semibold text-gray-900">TeacherTab</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                </div>
              </div>

              {/* Mock Dashboard Content */}
              <div className="p-6">
                <div className="grid lg:grid-cols-3 gap-6">
                  {/* Calendar Section */}
                  <div className="lg:col-span-2">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">This Week's Schedule</h3>
                        <Button size="sm" className="bg-[#28559e] hover:bg-[#1e3d72]">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Lesson
                        </Button>
                      </div>
                      
                      {/* Mock Calendar Grid */}
                      <div className="grid grid-cols-7 gap-2 mb-4">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                          <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                            {day}
                          </div>
                        ))}
                        {Array.from({ length: 35 }, (_, i) => (
                          <div key={i} className={`h-12 border border-gray-100 rounded-lg flex items-center justify-center text-sm ${
                            i >= 15 && i <= 19 ? 'bg-[#28559e]/10 border-[#28559e]/20' : 'bg-gray-50'
                          }`}>
                            {i >= 15 && i <= 19 ? (
                              <div className="text-center">
                                <div className="w-2 h-2 bg-[#28559e] rounded-full mx-auto mb-1"></div>
                                <div className="text-xs text-[#28559e] font-medium">Math</div>
                              </div>
                            ) : i > 19 ? (
                              <span className="text-gray-300">{i - 19}</span>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Sidebar */}
                  <div className="space-y-4">
                    {/* Quick Stats */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Quick Stats</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">This Week</span>
                          <span className="text-sm font-medium text-[#28559e]">12 Lessons</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Classes</span>
                          <span className="text-sm font-medium text-[#28559e]">4 Active</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Subjects</span>
                          <span className="text-sm font-medium text-[#28559e]">6</span>
                        </div>
                      </div>
                    </div>

                    {/* Recent Lessons */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Lessons</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div>
                            <div className="text-sm font-medium text-gray-900">Algebra Basics</div>
                            <div className="text-xs text-gray-500">Year 9 - Math</div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button className="p-1 hover:bg-gray-200 rounded">
                              <Edit3 className="h-3 w-3 text-gray-500" />
                            </button>
                            <button className="p-1 hover:bg-gray-200 rounded">
                              <MoreHorizontal className="h-3 w-3 text-gray-500" />
                            </button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                          <div>
                            <div className="text-sm font-medium text-gray-900">Shakespeare</div>
                            <div className="text-xs text-gray-500">Year 11 - English</div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button className="p-1 hover:bg-gray-200 rounded">
                              <Edit3 className="h-3 w-3 text-gray-500" />
                            </button>
                            <button className="p-1 hover:bg-gray-200 rounded">
                              <MoreHorizontal className="h-3 w-3 text-gray-500" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Teach Effectively
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful tools designed by teachers, for teachers
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 bg-[#28559e] rounded-lg mb-4">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Lesson Planning</h3>
              <p className="text-gray-600">
                Create, organize, and track your lessons with our intuitive planning tools. 
                Never lose track of your curriculum again.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 bg-[#e85b46] rounded-lg mb-4">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Timetable Management</h3>
              <p className="text-gray-600">
                Build flexible timetables that adapt to your teaching schedule. 
                Manage classes, subjects, and activities with ease.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-center w-12 h-12 bg-[#28559e] rounded-lg mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Student Organization</h3>
              <p className="text-gray-600">
                Keep track of your classes, student counts, and teaching groups. 
                Stay organized and focused on what matters most.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#28559e] to-[#1e3d72]">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Teaching?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of teachers who have streamlined their workflow with TeacherTab. 
            Spend less time on admin, more time inspiring students.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="text-lg rounded-full bg-white text-[#28559e] hover:bg-gray-100 px-8 py-4"
            >
              Get Started Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <div className="flex items-center space-x-6 text-blue-100">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span>No setup required</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}