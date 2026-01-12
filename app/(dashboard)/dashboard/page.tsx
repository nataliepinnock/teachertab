'use client';

import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { customerPortalAction } from '@/lib/payments/actions';
import { useActionState } from 'react';
import { User as UserType, Class, Subject, Event } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Users, 
  Calendar, 
  GraduationCap, 
  CalendarDays, 
  Clock, 
  MapPin, 
  User,
  Settings, 
  FileText, 
  BarChart3, 
  Plus,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  School,
  ClipboardList,
  Target,
  Star
} from 'lucide-react';
import { SetupProgress } from '@/components/setup-progress';

type ActionState = {
  error?: string;
  success?: string;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function SubscriptionSkeleton() {
  return (
    <Card className="mb-8 h-[140px]">
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
      </CardHeader>
    </Card>
  );
}

function ManageSubscription() {
  const { data: userData } = useSWR<UserType>('/api/user', fetcher);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-green-600" />
          Subscription & Billing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-4 sm:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {userData?.subscriptionStatus === 'active' || userData?.subscriptionStatus === 'trialing'
                    ? (userData?.planName || 'Paid Plan')
                    : 'No active plan'}
                </span>
                <span className="text-sm text-gray-500">
                  {userData?.subscriptionStatus === 'active'
                    ? 'Billed monthly'
                    : userData?.subscriptionStatus === 'trialing'
                    ? 'Trial period'
                    : 'No active subscription'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Manage your subscription and billing preferences
              </p>
            </div>
            <form action={customerPortalAction}>
              <Button type="submit" variant="outline" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Manage Subscription
              </Button>
            </form>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeacherProfileSkeleton() {
  return (
    <Card className="mb-8 h-[140px]">
      <CardHeader>
        <CardTitle>Teacher Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-4 mt-1">
          <div className="flex items-center space-x-4">
            <div className="size-8 rounded-full bg-gray-200"></div>
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-3 w-14 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeacherProfile() {
  const { data: userData } = useSWR<UserType>('/api/user', fetcher);

  if (!userData) {
    return <TeacherProfileSkeleton />;
  }

  const getUserDisplayName = (user: Pick<UserType, 'id' | 'name' | 'email'>) => {
    return user.name || user.email || 'Unknown User';
  };

  const getTeacherTypeDisplay = (teacherType: string) => {
    return teacherType === 'primary' ? 'Primary Teacher' : 'Secondary Teacher';
  };

  const getTimetableCycleDisplay = (cycle: string) => {
    return cycle === 'weekly' ? 'Weekly Cycle' : '2-Week Cycle';
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          Teacher Profile
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg font-semibold bg-blue-100 text-blue-700">
                {getUserDisplayName(userData)
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {getUserDisplayName(userData)}
              </h3>
              <p className="text-gray-600">{userData.email}</p>
              <div className="flex items-center gap-4 mt-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {getTeacherTypeDisplay(userData.teacherType)}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {getTimetableCycleDisplay(userData.timetableCycle)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <GraduationCap className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Teacher Type</p>
              <p className="text-sm text-gray-600">{getTeacherTypeDisplay(userData.teacherType)}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Calendar className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Timetable Cycle</p>
              <p className="text-sm text-gray-600">{getTimetableCycleDisplay(userData.timetableCycle)}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Settings className="h-8 w-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">Account Status</p>
              <p className="text-sm text-gray-600">Active</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TeacherStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="h-[100px] transition-all duration-200 hover:shadow-lg !py-0">
          <CardContent className="animate-pulse p-3 !px-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
              <div className="space-y-2 flex-1">
                <div className="h-3 w-20 bg-gray-200 rounded"></div>
                <div className="h-6 w-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TeacherStats() {
  const { data: classes, error: classesError } = useSWR<Class[]>('/api/classes', fetcher);
  const { data: subjects, error: subjectsError } = useSWR<Subject[]>('/api/subjects', fetcher);
  const { data: events, error: eventsError } = useSWR<Event[]>('/api/events', fetcher);

  // Handle loading state
  if (!classes || !subjects || !events) {
    return <TeacherStatsSkeleton />;
  }

  // Handle error state
  if (classesError || subjectsError || eventsError) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02] !py-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <School className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">My Classes</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02] !py-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Subjects</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02] !py-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">This Week</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02] !py-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">Tasks</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeClasses = classes.filter(c => !c.isArchived).length;
  const totalStudents = classes.filter(c => !c.isArchived).reduce((sum, c) => sum + (c.numberOfStudents || 0), 0);
  const upcomingEvents = events.filter(e => new Date(e.startTime.toString()) > new Date()).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer !py-0">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <School className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">My Classes</p>
              <p className="text-2xl font-bold text-gray-900">{activeClasses}</p>
              <p className="text-xs text-gray-500">{totalStudents} students</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer !py-0">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Subjects</p>
              <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
              <p className="text-xs text-gray-500">Active subjects</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer !py-0">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingEvents}</p>
              <p className="text-xs text-gray-500">Upcoming events</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer !py-0">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
              <Target className="h-6 w-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">Tasks</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Pending tasks</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function UpcomingEventsSkeleton() {
  return (
    <Card className="mb-8 h-[200px]">
      <CardHeader>
        <CardTitle>Upcoming Events</CardTitle>
      </CardHeader>
    </Card>
  );
}

function QuickActions() {
  return (
    <Card className="mb-8">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-300">
            <Plus className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium">Add Class</span>
          </Button>
          <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-2 hover:bg-green-50 hover:border-green-300">
            <BookOpen className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">New Subject</span>
          </Button>
          <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-300">
            <Calendar className="h-5 w-5 text-purple-600" />
            <span className="text-sm font-medium">Add Event</span>
          </Button>
          <Button variant="outline" className="h-16 flex flex-col items-center justify-center gap-2 hover:bg-orange-50 hover:border-orange-300">
            <FileText className="h-5 w-5 text-orange-600" />
            <span className="text-sm font-medium">Plan Lesson</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingEvents() {
  const { data: events, error } = useSWR<Event[]>('/api/events', fetcher);

  if (!events) {
    return <UpcomingEventsSkeleton />;
  }

  if (error) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-purple-600" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">Failed to load events</p>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  const upcomingEvents = events
    .filter(event => new Date(event.startTime.toString()) > now)
    .sort((a, b) => new Date(a.startTime.toString()).getTime() - new Date(b.startTime.toString()).getTime())
    .slice(0, 5);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    });
  };
  
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-purple-600" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length === 0 ? (
          <div className="text-center py-8">
            <CalendarDays className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No upcoming events</p>
            <p className="text-sm text-gray-400 mt-1">Add events to see them here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900">{event.title}</h4>
                  <div className="flex items-center text-xs text-gray-500 mt-1">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(event.startTime.toString())}
                    {event.allDay !== 1 && (
                      <>
                        <span className="mx-1">•</span>
                        {formatTime(event.startTime.toString())}
                      </>
                    )}
                  </div>
                  {event.location && (
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      {event.location}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <section className="flex-1">
      <div className="p-4 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your teaching schedule today.
          </p>
        </div>
        <SetupProgress />
        
        <Suspense fallback={<TeacherStatsSkeleton />}>
          <TeacherStats />
        </Suspense>

        <Suspense fallback={<div className="mb-8 h-[200px] bg-gray-100 rounded-xl animate-pulse"></div>}>
          <QuickActions />
        </Suspense>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Suspense fallback={<UpcomingEventsSkeleton />}>
            <UpcomingEvents />
          </Suspense>

          <Suspense fallback={<TeacherProfileSkeleton />}>
            <TeacherProfile />
          </Suspense>
        </div>

        <Suspense fallback={<SubscriptionSkeleton />}>
          <ManageSubscription />
        </Suspense>
      </div>
    </section>
  );
}
