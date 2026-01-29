'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { signOut } from '@/app/(login)/actions';
import { mutate } from 'swr';
import { User, Users, Settings, Menu, Clock, CheckCircle, CalendarDays, Grid3X3, Home, BookOpen, FileText, BarChart3, LogOut, ListTodo, GraduationCap } from 'lucide-react';

interface UserData {
  id: number;
  name: string;
  email: string;
  teachingPhase: string;
  colorPreference: string;
}

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/user');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, []);

  // Organized navigation items in logical groups
  const mainNavItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/calendar', icon: CalendarDays, label: 'Calendar' },
    { href: '/dashboard/lessons', icon: BookOpen, label: 'Lessons' },
    { href: '/dashboard/classes', icon: Users, label: 'Classes' },
    { href: '/dashboard/subjects', icon: GraduationCap, label: 'Subjects' },
    { href: '/dashboard/tasks', icon: ListTodo, label: 'Tasks' }
  ];

  const settingsNavItems = [
    { href: '/dashboard/setup', icon: Settings, label: 'Teaching Setup' },
    { href: '/dashboard/account', icon: User, label: 'Account' }
  ];

  const isCalendarPage = pathname === '/dashboard/calendar';
  const isDashboardPage = pathname === '/dashboard';
  const isFixedHeightPage = isCalendarPage || isDashboardPage;

  // Generate initials from name or email
  const getInitials = () => {
    if (!user) return 'U';
    if (user.name) {
      const nameParts = user.name.trim().split(' ');
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
      }
      return user.name.substring(0, 2).toUpperCase();
    }
    const emailParts = user.email.split('@');
    return (emailParts[0][0] + (emailParts[1]?.[0] || emailParts[0][1] || '')).toUpperCase();
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between bg-[#001b3d] border-b border-[#001b3d] px-4 py-3">
        <div className="flex items-center">
          <span className="text-[#fbae36] font-semibold text-lg">TeacherTab</span>
        </div>
        <Button
          className="-mr-3 text-white hover:bg-[#002d5c]"
          variant="ghost"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-[#001b3d] flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } transform transition-transform duration-300 ease-in-out`}
      >
        {/* Logo/Brand */}
        <div className="flex items-center px-6 py-4 border-b border-[#002d5c]">
          <span className="text-[#fbae36] font-semibold text-xl">TeacherTab</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="space-y-6">
            {/* Main Navigation */}
            <div>
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Main
              </h3>
              <div className="space-y-1">
                {mainNavItems.map((item) => {
                  const isActive = pathname === item.href || (item.href === '/dashboard' && pathname === '/dashboard');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-[#002d5c] text-white'
                          : 'text-gray-200 hover:bg-[#002d5c] hover:text-white'
                      }`}
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Settings Navigation */}
            <div>
              <h3 className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Settings
              </h3>
              <div className="space-y-1">
                {settingsNavItems.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsSidebarOpen(false)}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-[#002d5c] text-white'
                          : 'text-gray-200 hover:bg-[#002d5c] hover:text-white'
                      }`}
                    >
                      <item.icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>

        {/* User Profile */}
        <div className="border-t border-[#002d5c] p-4">
          <div className="flex items-center mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage alt={user?.name || user?.email} />
              <AvatarFallback className="bg-[#fbae36] text-[#001b3d]">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-300 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <form
            action={async () => {
              await signOut();
              mutate('/api/user');
              router.push('/');
            }}
            className="w-full"
          >
            <button
              type="submit"
              className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-200 rounded-md hover:bg-[#002d5c] hover:text-white transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 flex-shrink-0" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Sidebar overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main
        className={`flex-1 flex flex-col min-h-0 ${
          isFixedHeightPage ? 'overflow-hidden' : 'overflow-y-auto'
        } lg:pt-0 pt-14`}
      >
        {children}
      </main>
    </div>
  );
}
