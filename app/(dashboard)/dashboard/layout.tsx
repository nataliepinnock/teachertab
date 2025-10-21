'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { User, Settings, Shield, Menu, Clock, CheckCircle, CalendarDays, Grid3X3 } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  teacherType: string;
}

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

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

  const navItems = [
    { href: '/dashboard', icon: User, label: 'Dashboard' },
    { href: '/dashboard/setup', icon: Settings, label: 'Setup' },
    { href: '/dashboard/lessons', icon: Clock, label: 'Lessons' },
    { href: '/dashboard/tasks', icon: CheckCircle, label: 'Tasks' },
    { href: '/dashboard/events', icon: CalendarDays, label: 'Events' },
    { href: '/dashboard/calendar', icon: Grid3X3, label: 'Calendar' },
    { href: '/dashboard/general', icon: Settings, label: 'General' },
    { href: '/dashboard/security', icon: Shield, label: 'Security' }
  ];

  const isCalendarPage = pathname === '/dashboard/calendar';

  return (
    <div className="flex flex-col h-[calc(100dvh-69px)] w-full">
      {/* Mobile header */}
      <div className="lg:hidden flex items-center justify-between bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center">
          <span className="font-medium">Teacher Dashboard</span>
        </div>
        <Button
          className="-mr-3"
          variant="ghost"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      <div className="flex flex-1 overflow-hidden h-full">
        {/* Sidebar */}
        <aside
          className={`w-64 bg-white lg:bg-gray-50 border-r border-gray-200 lg:block ${
            isSidebarOpen ? 'block' : 'hidden'
          } lg:relative absolute inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="h-full overflow-y-auto p-4">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} passHref>
                <Button
                  variant={pathname === item.href ? 'secondary' : 'ghost'}
                  className={`shadow-none my-1 w-full justify-start ${
                    pathname === item.href ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main
          className={`flex-1 ${
            isCalendarPage ? 'overflow-hidden' : 'overflow-y-auto'
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
