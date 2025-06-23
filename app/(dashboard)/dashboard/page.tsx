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
import { User, Class, Subject, Event } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';
import { BookOpen, Users, Calendar, GraduationCap, CalendarDays, Clock, MapPin } from 'lucide-react';

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
  const { data: userData } = useSWR<User>('/api/user', fetcher);

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="mb-4 sm:mb-0">
              <p className="font-medium">
                Current Plan: {userData?.planName || 'Free'}
              </p>
              <p className="text-sm text-muted-foreground">
                {userData?.subscriptionStatus === 'active'
                  ? 'Billed monthly'
                  : userData?.subscriptionStatus === 'trialing'
                  ? 'Trial period'
                  : 'No active subscription'}
              </p>
            </div>
            <form action={customerPortalAction}>
              <Button type="submit" variant="outline">
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
  const { data: userData } = useSWR<User>('/api/user', fetcher);

  if (!userData) {
    return <TeacherProfileSkeleton />;
  }

  const getUserDisplayName = (user: Pick<User, 'id' | 'name' | 'email'>) => {
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
        <CardTitle>Teacher Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <Avatar>
              <AvatarFallback>
                {getUserDisplayName(userData)
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {getUserDisplayName(userData)}
              </p>
              <p className="text-sm text-muted-foreground">
                {userData.email}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm font-medium text-gray-700">Teacher Type</p>
              <p className="text-sm text-gray-600">
                {getTeacherTypeDisplay(userData.teacherType)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Timetable Cycle</p>
              <p className="text-sm text-gray-600">
                {getTimetableCycleDisplay(userData.timetableCycle)}
              </p>
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
        <Card key={i} className="h-[120px]">
          <CardContent className="animate-pulse">
            <div className="mt-4 space-y-2">
              <div className="h-4 w-20 bg-gray-200 rounded"></div>
              <div className="h-8 w-12 bg-gray-200 rounded"></div>
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
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Active Classes</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Subjects</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Archived Classes</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm font-medium text-gray-600">Events</p>
                <p className="text-2xl font-bold text-gray-900">-</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeClasses = classes.filter(c => !c.isArchived).length;
  const archivedClasses = classes.filter(c => c.isArchived).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Active Classes</p>
              <p className="text-2xl font-bold text-gray-900">{activeClasses}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Subjects</p>
              <p className="text-2xl font-bold text-gray-900">{subjects.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Archived Classes</p>
              <p className="text-2xl font-bold text-gray-900">{archivedClasses}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5 text-purple-600" />
            <div>
              <p className="text-sm font-medium text-gray-600">Events</p>
              <p className="text-2xl font-bold text-gray-900">{events.length}</p>
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

function UpcomingEvents() {
  const { data: events, error } = useSWR<Event[]>('/api/events', fetcher);

  if (!events) {
    return <UpcomingEventsSkeleton />;
  }

  if (error) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
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
    .slice(0, 3);

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
        <CardTitle>Upcoming Events</CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingEvents.length === 0 ? (
          <p className="text-gray-500">No upcoming events</p>
        ) : (
          <div className="space-y-4">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <CalendarDays className="h-5 w-5 text-purple-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm">{event.title}</h4>
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
        <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
          Teacher Dashboard
        </h1>
        
        <Suspense fallback={<TeacherStatsSkeleton />}>
          <TeacherStats />
        </Suspense>

        <Suspense fallback={<UpcomingEventsSkeleton />}>
          <UpcomingEvents />
        </Suspense>

        <Suspense fallback={<TeacherProfileSkeleton />}>
          <TeacherProfile />
        </Suspense>

        <Suspense fallback={<SubscriptionSkeleton />}>
          <ManageSubscription />
        </Suspense>
      </div>
    </section>
  );
}
