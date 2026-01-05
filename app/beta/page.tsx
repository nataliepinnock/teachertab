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
  Sparkles
} from 'lucide-react';
import { useState } from 'react';

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

export default function BetaPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    school: '',
    location: '',
    stage: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location || !formData.stage) {
      alert('Please fill in all required fields');
      return;
    }
    // TODO: Add API endpoint to save beta signups
    console.log('Beta signup:', formData);
    setSubmitted(true);
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
    <main className="min-h-screen bg-gradient-to-br from-[#001b3d] via-[#001b3d] to-[#002855]">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32 px-6">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}></div>
        </div>
        
        <div className="mx-auto max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#fbae36]/20 border border-[#fbae36]/30 rounded-full text-[#fbae36] text-sm font-medium mb-8">
            <Sparkles className="h-4 w-4" />
            <span>Join the Beta Program</span>
          </div>
          
          <div className="flex items-center justify-center mb-8">
            <TeacherTabLogo size="lg" variant="inverse" />
          </div>
          
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6">
            Help Shape the Future of
            <br />
            <span className="text-[#fbae36]">Teacher Planning</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            We're looking for passionate teachers to join our beta program. 
            Get early access, provide feedback, and help us build the perfect tool for educators.
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-16">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 text-center"
              >
                <CheckCircle className="h-6 w-6 text-[#fbae36] mx-auto mb-2" />
                <p className="text-sm text-white font-medium">{benefit}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <section className="py-16 px-6 bg-white/5 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold text-white text-center mb-12">
            What You'll Get Access To
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-center"
              >
                <div className="w-12 h-12 bg-[#fbae36]/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-6 w-6 text-[#fbae36]" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.name}
                </h3>
                <p className="text-sm text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Signup Form */}
      <section className="py-20 px-6">
        <div className="mx-auto max-w-2xl">
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Apply to Become a Beta Tester
              </h2>
              <p className="text-gray-600">
                Sign up to join our beta program and get free access.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
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
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
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
                />
              </div>

              <div>
                <label htmlFor="school" className="block text-sm font-medium text-gray-700 mb-2">
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
                />
              </div>

              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <Select
                  value={formData.location}
                  onValueChange={(value) => setFormData({ ...formData, location: value })}
                >
                  <SelectTrigger id="location" className="w-full">
                    <SelectValue placeholder="Select your location" />
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
                <label htmlFor="stage" className="block text-sm font-medium text-gray-700 mb-2">
                  Teaching Stage *
                </label>
                <Select
                  value={formData.stage}
                  onValueChange={(value) => setFormData({ ...formData, stage: value })}
                >
                  <SelectTrigger id="stage" className="w-full">
                    <SelectValue placeholder="Select teaching stage" />
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

              <Button
                type="submit"
                size="lg"
                variant="accent"
                className="w-full text-lg rounded-full py-6"
              >
                Apply for Beta Access
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>

              <p className="text-sm text-gray-500 text-center">
                By applying, you agree to provide feedback and help us improve TeacherTab.
                We'll review applications and get back to you soon.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/10">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <TeacherTabLogo size="sm" variant="inverse" />
              <span className="ml-2 text-lg font-semibold text-white">
                TeacherTab
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} TeacherTab. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

