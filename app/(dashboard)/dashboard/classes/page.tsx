'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { Class } from '@/lib/db/schema';
import useSWR from 'swr';
import { Suspense } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function ClassesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="h-[200px]">
          <CardContent className="animate-pulse">
            <div className="mt-4 space-y-2">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-3 w-24 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ClassesList() {
  const { data: classes, error } = useSWR<Class[]>('/api/classes', fetcher);

  if (!classes) {
    return <ClassesSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Error loading classes. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const activeClasses = classes.filter(c => !c.isArchived);
  const archivedClasses = classes.filter(c => c.isArchived);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">Active Classes</h2>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Class
        </Button>
      </div>

      {activeClasses.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No classes yet. Create your first class to get started.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeClasses.map((cls) => (
            <Card key={cls.id}>
              <CardHeader>
                <CardTitle className="text-lg">{cls.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {cls.description && (
                  <p className="text-sm text-gray-600 mb-4">{cls.description}</p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Active</span>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {archivedClasses.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-medium mb-4">Archived Classes</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {archivedClasses.map((cls) => (
              <Card key={cls.id} className="opacity-60">
                <CardHeader>
                  <CardTitle className="text-lg">{cls.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  {cls.description && (
                    <p className="text-sm text-gray-600 mb-4">{cls.description}</p>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">Archived</span>
                    <Button variant="outline" size="sm">
                      Restore
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ClassesPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium text-gray-900 mb-6">
        Classes
      </h1>
      
      <Suspense fallback={<ClassesSkeleton />}>
        <ClassesList />
      </Suspense>
    </section>
  );
} 