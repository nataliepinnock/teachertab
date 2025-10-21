'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, BookOpen, Clock, ArrowRight, Settings, CheckCircle, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { User } from '@/lib/db/schema';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function SetupPage() {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  
  const setupOptions = [
    {
      title: 'Academic Year',
      description: 'Set up your school year, holidays, and week cycles',
      icon: GraduationCap,
      href: '/dashboard/setup/academic-year',
      color: 'bg-white border-2 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-lg transition-all',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
      features: ['School calendar', 'Holiday management', 'Week 1/2 cycles']
    },
    {
      title: 'Classes',
      description: 'Manage your class groups, student counts, and class notes',
      icon: Users,
      href: '/dashboard/setup/classes',
      color: 'bg-white border-2 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-lg transition-all',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
      features: user?.teacherType === 'secondary' 
        ? ['Student counts', 'Class notes', 'Color coding']
        : ['Student counts', 'Class notes', 'Group management']
    },
    {
      title: 'Subjects',
      description: 'Configure subjects with colors and organize your curriculum',
      icon: BookOpen,
      href: '/dashboard/setup/subjects',
      color: 'bg-white border-2 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-lg transition-all',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
      features: user?.teacherType === 'primary'
        ? ['Color coding', 'Curriculum organization', 'Subject management']
        : ['Curriculum organization', 'Subject management', 'Learning objectives']
    },
    {
      title: 'Timetable',
      description: 'Set up your weekly timetable structure and time slots',
      icon: Clock,
      href: '/dashboard/setup/timetable',
      color: 'bg-white border-2 border-gray-200 hover:bg-blue-50 hover:border-blue-300 hover:shadow-lg transition-all',
      iconColor: 'text-blue-600',
      bgColor: 'bg-blue-100',
      features: ['Weekly schedules', 'Time slots', 'Day organization']
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section with Tips */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mx-auto w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mb-3">
            <Settings className="h-5 w-5 text-gray-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Setup Your Teaching Environment</h1>
          <p className="text-sm text-gray-600 max-w-3xl mx-auto mb-3">
            Configure the essential components of your teaching setup. Start with any section below to get organized.
            <br/> We recommend starting with Academic Year, then Classes and Subjects, and finally Timetable setup. 
            This order ensures you have the foundation elements in place before scheduling.
          </p>
          
          {/* Getting Started Tips */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-3 max-w-2xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-2 justify-center items-center text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                <span>1. Academic Year</span>
              </div>
              <div className="hidden sm:block text-gray-300">→</div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                <span>2. Classes & Subjects</span>
              </div>
              <div className="hidden sm:block text-gray-300">→</div>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                <span>3. Build Timetable</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Setup Options Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
          {setupOptions.map((option, index) => (
            <Link key={option.title} href={option.href}>
              <Card className={`${option.color} border-2 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl group h-full flex flex-col p-4`}>
                <div className="text-center mb-4">
                  <div className={`mx-auto mb-3 p-3 rounded-xl ${option.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                    <option.icon className={`h-8 w-8 ${option.iconColor}`} />
                  </div>
                  <CardTitle className="text-lg font-bold text-gray-900 mb-2 leading-tight">{option.title}</CardTitle>
                  <p className="text-gray-600 leading-relaxed text-sm">{option.description}</p>
                </div>
                <div className="text-center space-y-3 flex-grow flex flex-col justify-between">
                  {/* Features List */}
                  <div className="space-y-2 flex-grow">
                    {option.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-center justify-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                        <span className="text-center">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Action Button */}
                  <Button variant="outline" className="w-full h-10 text-sm font-medium group-hover:bg-white group-hover:shadow-md transition-all duration-200 flex-shrink-0">
                    <span className="truncate">Configure {option.title}</span>
                    <ArrowRight className="h-3 w-3 ml-2 flex-shrink-0 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                </div>
              </Card>
            </Link>
          ))}
        </div>


      </div>
    </div>
  );
} 