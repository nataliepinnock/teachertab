import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Calendar, Users, Clock, CheckCircle, Plus, Edit3, Trash2, MoreHorizontal } from 'lucide-react';
import { TeacherTabLogo } from '@/components/ui/logo';

export default function HomePage() {
  return (
    <main>
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-5xl font-bold text-gray-900 tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
                TeacherTab
                <span className="block text-[#28559e]">Your Teaching Companion</span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Streamline your teaching workflow with intelligent lesson planning, 
                timetable management, and student organization tools designed specifically for educators.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <Button
                  size="lg"
                  className="text-lg rounded-full bg-[#28559e] hover:bg-[#1e3d72]"
                >
                  Start Teaching Better
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              {/* Detailed App Mockup */}
              <div className="relative w-full">
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden transform rotate-1 hover:rotate-0 transition-transform duration-300">
                  {/* Mock Header */}
                  <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <TeacherTabLogo size="sm" className="text-primary" />
                      <span className="ml-2 text-lg font-semibold text-gray-900">TeacherTab</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-6 h-6 bg-[#28559e]/20 rounded-full flex items-center justify-center">
                        <Calendar className="h-3 w-3 text-[#28559e]" />
                      </div>
                      <div className="w-6 h-6 bg-[#e85b46]/20 rounded-full flex items-center justify-center">
                        <BookOpen className="h-3 w-3 text-[#e85b46]" />
                      </div>
                      <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>

                  {/* Mock Dashboard Content */}
                  <div className="p-4">
                    <div className="grid grid-cols-1 gap-4">
                      {/* Week Overview */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-gray-900">This Week</h3>
                          <span className="text-xs text-gray-500">March 18-22</span>
                        </div>
                        
                        {/* Detailed Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                            <div key={day} className="text-center">
                              <div className="text-xs text-gray-500 mb-1">{day}</div>
                              <div className={`h-8 rounded-lg flex flex-col items-center justify-center text-xs ${
                                index < 5 ? 'bg-[#28559e]/10 border border-[#28559e]/20' : 'bg-gray-100'
                              }`}>
                                {index < 5 ? (
                                  <>
                                    <div className="w-1 h-1 bg-[#28559e] rounded-full mb-0.5"></div>
                                    <span className="text-[#28559e] font-medium">3</span>
                                  </>
                                ) : (
                                  <span className="text-gray-400">{18 + index}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Today's Schedule */}
                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-semibold text-gray-900">Today's Schedule</h3>
                          <Button size="sm" className="bg-[#28559e] hover:bg-[#1e3d72] text-xs px-2 py-1">
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center justify-between p-2 bg-[#28559e]/5 rounded-lg border-l-2 border-[#28559e]">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-[#28559e] rounded-full mr-2"></div>
                              <div>
                                <div className="text-xs font-medium text-gray-900">Algebra Basics</div>
                                <div className="text-xs text-gray-500">Year 9A • Room 12</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">9:00 AM</div>
                          </div>
                          
                          <div className="flex items-center justify-between p-2 bg-[#e85b46]/5 rounded-lg border-l-2 border-[#e85b46]">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-[#e85b46] rounded-full mr-2"></div>
                              <div>
                                <div className="text-xs font-medium text-gray-900">Shakespeare</div>
                                <div className="text-xs text-gray-500">Year 11B • Library</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">11:30 AM</div>
                          </div>
                          
                          <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                              <div>
                                <div className="text-xs font-medium text-gray-900">Physics Lab</div>
                                <div className="text-xs text-gray-500">Year 10C • Lab 3</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">2:00 PM</div>
                          </div>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-white border border-gray-200 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-[#28559e]">12</div>
                          <div className="text-xs text-gray-500">Lessons</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-[#e85b46]">4</div>
                          <div className="text-xs text-gray-500">Classes</div>
                        </div>
                        <div className="bg-white border border-gray-200 rounded-lg p-2 text-center">
                          <div className="text-lg font-bold text-[#28559e]">6</div>
                          <div className="text-xs text-gray-500">Subjects</div>
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="bg-white border border-gray-200 rounded-lg p-3">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Recent Activity</h3>
                        <div className="space-y-2">
                          <div className="flex items-center text-xs">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-gray-600">Completed lesson plan for Algebra</span>
                          </div>
                          <div className="flex items-center text-xs">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div>
                            <span className="text-gray-600">Added new student to Year 9A</span>
                          </div>
                          <div className="flex items-center text-xs">
                            <div className="w-1.5 h-1.5 bg-[#e85b46] rounded-full mr-2"></div>
                            <span className="text-gray-600">Updated timetable for next week</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-[#28559e] rounded-full animate-pulse"></div>
                <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-[#e85b46] rounded-full animate-bounce"></div>
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