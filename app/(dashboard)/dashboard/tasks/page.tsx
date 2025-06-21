'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, Clock, CheckCircle, Circle, Tag, Filter, ArrowUpDown } from 'lucide-react';
import useSWR from 'swr';
import { Suspense, useState } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function TasksSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="h-[120px]">
          <CardContent className="animate-pulse">
            <div className="mt-4 space-y-3">
              <div className="h-5 w-48 bg-gray-200 rounded"></div>
              <div className="h-4 w-64 bg-gray-200 rounded"></div>
              <div className="flex space-x-2">
                <div className="h-6 w-16 bg-gray-200 rounded-full"></div>
                <div className="h-6 w-20 bg-gray-200 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TasksList() {
  const { data: tasks, error: tasksError } = useSWR<any[]>('/api/tasks', fetcher);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'title'>('dueDate');

  if (tasksError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Error loading tasks. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      'high': 'bg-red-100 text-red-800 border border-red-200',
      'medium': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
      'low': 'bg-green-100 text-green-800 border border-green-200',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const isOverdue = (dueDate: string) => {
    const today = new Date();
    const taskDate = new Date(dueDate);
    return taskDate < today;
  };

  const isToday = (dueDate: string) => {
    const today = new Date();
    const taskDate = new Date(dueDate);
    return today.toDateString() === taskDate.toDateString();
  };

  const parseTags = (tagsString: string) => {
    try {
      return JSON.parse(tagsString) || [];
    } catch {
      return [];
    }
  };

  // Filter and sort tasks
  const filterAndSortTasks = () => {
    if (!tasks) return [];
    
    let filteredTasks = tasks;
    
    // Apply filter
    if (filter === 'completed') {
      filteredTasks = tasks.filter(task => task.completed === 1);
    } else if (filter === 'pending') {
      filteredTasks = tasks.filter(task => task.completed === 0);
    }
    
    // Apply sorting
    return filteredTasks.sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          const dateA = new Date(a.dueDate);
          const dateB = new Date(b.dueDate);
          return dateA.getTime() - dateB.getTime();
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0;
          const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0;
          return priorityB - priorityA; // High priority first
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
  };

  const sortedTasks = filterAndSortTasks();
  const completedCount = tasks ? tasks.filter(task => task.completed === 1).length : 0;
  const pendingCount = tasks ? tasks.filter(task => task.completed === 0).length : 0;
  const totalCount = tasks ? tasks.length : 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">
            {totalCount} total • {completedCount} completed • {pendingCount} pending
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </div>

      {/* Filters and Sorting */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter:</span>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All ({totalCount})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pending ({pendingCount})
          </Button>
          <Button
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Completed ({completedCount})
          </Button>
        </div>

        <div className="flex items-center space-x-2 ml-auto">
          <ArrowUpDown className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'dueDate' | 'priority' | 'title')}
            className="text-sm border border-gray-300 rounded-md px-2 py-1"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>

      {!sortedTasks || sortedTasks.length === 0 ? (
        <Card>
          <CardContent className="pt-12 pb-12">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {filter === 'all' ? 'No tasks yet' : `No ${filter} tasks`}
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === 'all' 
                  ? 'Create your first task to get started with task management.'
                  : `No ${filter} tasks found.`
                }
              </p>
              {filter === 'all' && (
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Task
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedTasks.map((task) => {
            const taskDate = new Date(task.dueDate);
            const isTaskOverdue = isOverdue(task.dueDate);
            const isTaskToday = isToday(task.dueDate);
            const tags = parseTags(task.tags);
            
            return (
              <Card 
                key={task.id} 
                className={`hover:shadow-md transition-shadow cursor-pointer ${
                  task.completed ? 'opacity-75' : ''
                } ${isTaskOverdue && !task.completed ? 'ring-2 ring-red-500' : ''}`}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className={`text-lg font-semibold ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                          {task.title}
                        </h3>
                        {task.completed ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                        {isTaskToday && !task.completed && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            Today
                          </span>
                        )}
                        {isTaskOverdue && !task.completed && (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded-full">
                            Overdue
                          </span>
                        )}
                      </div>
                      
                      {task.description && (
                        <p className={`text-sm mb-3 ${task.completed ? 'text-gray-500' : 'text-gray-600'}`}>
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center space-x-4 mb-3">
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                          {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{formatDate(task.dueDate)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span className="text-sm text-gray-600">{formatTime(task.dueDate)}</span>
                        </div>
                      </div>

                      {tags.length > 0 && (
                        <div className="flex items-center space-x-2">
                          <Tag className="h-4 w-4 text-gray-500" />
                          <div className="flex flex-wrap gap-1">
                            {tags.map((tag: string, index: number) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button variant="outline" size="sm">
                        {task.completed ? 'Mark Incomplete' : 'Mark Complete'}
                      </Button>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <Suspense fallback={<TasksSkeleton />}>
        <TasksList />
      </Suspense>
    </section>
  );
} 